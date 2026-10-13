// ── Informe de Gobierno: acciones relevantes capturadas por las áreas ─────────
// fase_informe_01. Sustituye las plantillas Excel por área: el enlace captura
// directo y Planeación revisa. Eje, Nivel MIR y Programa PMD no se guardan, los
// deriva v_informe_acciones. La RLS limita al enlace a su área y a la captura
// abierta; el trigger valida fecha dentro del periodo e indicador del área.
import { supabase, paginarTodo } from './supabaseClient.js'
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
  // El ON DELETE CASCADE borra las filas de fotos, pero no los archivos del
  // bucket: se juntan antes y se quitan después.
  const fotos = await getFotosAcciones([id])
  const { data, error } = await supabase.from('informe_acciones').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No se eliminó: la captura del informe está cerrada o la acción no es de tu área.')
  if (fotos.length) await supabase.storage.from(FOTOS_BUCKET).remove(fotos.map(f => f.storage_path))
}

// ── Fotografías de las acciones (fase_informe_02) ─────────────────────────────
// Hasta 3 por acción; el PDF del Informe las acomoda en la página de acciones
// relevantes del eje. Ruta en el bucket: {area_id}/{accion_id}/{archivo}.
export const FOTOS_BUCKET = 'informe-fotos'
export const FOTOS_MAX = 3

// Antes de aplicar fase_informe_02 la tabla no existe: el PDF y la lista
// siguen funcionando, solo que sin fotos.
const sinTablaFotos = e => ['42P01', 'PGRST205'].includes(e?.code)

export async function getFotosAcciones(accionIds) {
  if (!accionIds.length) return []
  try {
    return await paginarTodo(() => supabase.from('informe_acciones_fotos')
      .select('id, accion_id, storage_path, orden, ancho, alto')
      .in('accion_id', accionIds).order('accion_id').order('orden'))
  } catch (e) {
    if (sinTablaFotos(e)) return []
    throw e
  }
}

// El celular entrega fotos de 4 a 8 MB; el PDF no necesita más de 1800 px por
// lado. Se reduce en el navegador y se sube como JPEG.
async function prepararFoto(file, maxLado = 1800) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('La foto debe ser JPG, PNG o WebP.')
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const s = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * s), h = Math.round(bmp.height * s)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  c.getContext('2d').drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85))
  if (!blob) throw new Error('No se pudo procesar la foto.')
  return { blob, w, h }
}

export async function subirFotoAccion(accion, file, fotosActuales) {
  const usados = new Set(fotosActuales.map(f => f.orden))
  const orden = [1, 2, 3].find(n => !usados.has(n))
  if (!orden) throw new Error(`Cada acción admite hasta ${FOTOS_MAX} fotografías.`)
  const { blob, w, h } = await prepararFoto(file)
  const path = `${accion.area_id}/${accion.id}/${Date.now()}_${orden}.jpg`
  const { error: eUp } = await supabase.storage.from(FOTOS_BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (eUp) throw eUp
  const { data, error } = await supabase.from('informe_acciones_fotos')
    .insert({ accion_id: accion.id, storage_path: path, orden, ancho: w, alto: h }).select().single()
  if (error) {
    await supabase.storage.from(FOTOS_BUCKET).remove([path])
    throw error
  }
  return data
}

export async function borrarFotoAccion(foto) {
  const { data, error } = await supabase.from('informe_acciones_fotos').delete().eq('id', foto.id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('No se borró: la captura del informe está cerrada o la foto no es de tu área.')
  await supabase.storage.from(FOTOS_BUCKET).remove([foto.storage_path])
}

export async function urlsFotos(paths, segundos = 600) {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from(FOTOS_BUCKET).createSignedUrls(paths, segundos)
  if (error) throw error
  return Object.fromEntries((data || []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]))
}

// Para el PDF: baja las fotos de las acciones como ImageBitmap, agrupadas por
// acción y en su orden. Una foto que no baja se omite, no tumba el Informe.
export async function descargarFotosAcciones(accionIds) {
  const fotos = await getFotosAcciones(accionIds)
  if (!fotos.length) return new Map()
  const urls = await urlsFotos(fotos.map(f => f.storage_path))
  const porAccion = new Map()
  await Promise.all(fotos.map(async f => {
    try {
      const resp = await fetch(urls[f.storage_path])
      if (!resp.ok) return
      const bmp = await createImageBitmap(await resp.blob())
      if (!porAccion.has(f.accion_id)) porAccion.set(f.accion_id, [])
      porAccion.get(f.accion_id).push({ orden: f.orden, bmp })
    } catch (_) { /* foto omitida */ }
  }))
  porAccion.forEach(l => l.sort((a, b) => a.orden - b.orden))
  return porAccion
}

// Descripción de cada eje (v_resumen_ejes no la trae) para las portadas.
export async function getEjesCatalogo() {
  const { data, error } = await supabase.from('ejes').select('codigo, nombre, descripcion, color_hex, orden').order('orden')
  if (error) throw error
  return data || []
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
