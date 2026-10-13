// ── Informe de Gobierno: acciones relevantes capturadas por las áreas ─────────
// fase_informe_01. Sustituye las plantillas Excel por área: el enlace captura
// directo y Planeación revisa. Eje, Nivel MIR y Programa PMD no se guardan, los
// deriva v_informe_acciones. La RLS limita al enlace a su área y a la captura
// abierta; el trigger valida fecha dentro del periodo e indicador del área.
import { supabase } from './supabaseClient.js'
import { getIndicadoresAreaAnio } from './capturaValidacion.js'

// Las plantillas del 2º informe se armaron con el MIR 2026 (170 indicadores):
// el periodo sep 2025 – ago 2026 cae casi completo en ese ejercicio.
export function anioMIRInforme(informe) {
  return informe ? Number(String(informe.periodo_fin).slice(0, 4)) : null
}

export async function getInformeActual() {
  const { data, error } = await supabase
    .from('informe_gobierno').select('*')
    .order('numero', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function setCapturaAbierta(informeId, abierta) {
  const { error } = await supabase
    .from('informe_gobierno').update({ captura_abierta: abierta }).eq('id', informeId)
  if (error) throw error
}

export async function getAccionesInforme(informeId, { areaId, soloIncluidas } = {}) {
  let q = supabase.from('v_informe_acciones').select('*')
    .eq('informe_id', informeId)
    .order('eje_orden', { ascending: true })
    .order('area', { ascending: true })
    .order('fecha', { ascending: true })
  if (areaId) q = q.eq('area_id', areaId)
  if (soloIncluidas) q = q.eq('incluir_en_informe', true)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

// Indicadores MIR del área en el ejercicio del informe, con lo que la
// plantilla mostraba en automático (nivel y programa PMD).
export async function getIndicadoresInforme(areaId, anio) {
  const inds = await getIndicadoresAreaAnio(areaId, anio,
    'id, clave, nombre, nivel_mir, programas_pmd(numero, nombre)')
  return inds.sort((a, b) => (a.clave || '').localeCompare(b.clave || '', 'es'))
}

// areas tiene dos FKs a ejes (areas_eje_id_fkey y fk_areas_eje, mismo
// eje_id): el embed tiene que nombrar una o PostgREST se niega a elegir.
export async function getAreasInforme() {
  const { data, error } = await supabase
    .from('areas').select('id, nombre, ejes!fk_areas_eje(codigo, orden)').eq('activo', true).order('nombre')
  if (error) throw error
  return data || []
}

function filaDesdeForm(f) {
  const vinculada = !!f.indicador_id
  return {
    coordinacion:  f.coordinacion?.trim() || null,
    indicador_id:  vinculada ? Number(f.indicador_id) : null,
    justificacion: vinculada ? null : (f.justificacion?.trim() || null),
    accion:        f.accion.trim(),
    fecha:         f.fecha,
    monto:         f.monto === '' || f.monto == null ? null : Number(f.monto),
    beneficiarios: f.beneficiarios === '' || f.beneficiarios == null ? null : parseInt(f.beneficiarios, 10),
    descripcion:   f.descripcion.trim(),
    tiene_foto:    !!f.tiene_foto,
    tiene_video:   !!f.tiene_video,
  }
}

export async function guardarAccion({ id, informeId, areaId, form }) {
  const fila = filaDesdeForm(form)
  const q = id
    ? supabase.from('informe_acciones').update(fila).eq('id', id)
    : supabase.from('informe_acciones').insert({ ...fila, informe_id: informeId, area_id: areaId })
  const { data, error } = await q.select('id')
  if (error) throw error
  // Con la captura cerrada la RLS no da error: simplemente no toca filas.
  if (!data?.length) throw new Error('No se guardó: la captura del informe está cerrada o la acción no es de tu área.')
}

export async function eliminarAccion(id) {
  const { data, error } = await supabase.from('informe_acciones').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No se eliminó: la captura del informe está cerrada o la acción no es de tu área.')
}

export async function setRevisionAccion(id, { revisada, incluir_en_informe }) {
  const cambios = {}
  if (revisada !== undefined) cambios.revisada = revisada
  if (incluir_en_informe !== undefined) cambios.incluir_en_informe = incluir_en_informe
  const { error } = await supabase.from('informe_acciones').update(cambios).eq('id', id)
  if (error) throw error
}

// Mensajes del trigger/CHECK en lenguaje de pantalla.
export function mensajeErrorAccion(e) {
  const m = e?.message || String(e)
  if (m.includes('fuera del periodo')) return 'La fecha debe estar dentro del periodo del informe.'
  if (m.includes('no pertenece al área')) return 'El indicador elegido no es de esta área.'
  if (m.includes('informe_acciones_vinculo_chk')) return 'Si la acción no está vinculada a un indicador MIR, escribe la justificación.'
  return m
}
