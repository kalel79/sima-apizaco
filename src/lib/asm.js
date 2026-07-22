// ── Módulo ASM (Aspectos Susceptibles de Mejora) ──────────────────────────────
import { supabase } from './supabaseClient.js'

export async function getAsmConsolidado({ ejeCodigo, areaId, tipoHallazgo, estatus } = {}) {
  let query = supabase.from('vw_asm_consolidado').select('*').order('fecha_compromiso', { ascending: true })
  if (ejeCodigo)    query = query.eq('eje_codigo', ejeCodigo)
  if (areaId)       query = query.eq('area_id', areaId)
  if (tipoHallazgo) query = query.eq('tipo_hallazgo', tipoHallazgo)
  if (estatus)      query = query.eq('estatus', estatus)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getAccionesAbiertas({ areaId } = {}) {
  let query = supabase
    .from('vw_asm_consolidado')
    .select('*')
    .neq('estatus', 'Cerrado')
    .order('fecha_compromiso', { ascending: true })
  if (areaId) query = query.eq('area_id', areaId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Vista previa del tipo_hallazgo/semáforo que calculará el trigger al registrar
// (mismo dato que ya usa el resto de SIMA para el semáforo del periodo vigente).
export async function getPctCumplimientoIndicador(indicadorId) {
  const { data, error } = await supabase
    .from('v_indicadores_acum')
    .select('pct_cumplimiento, semaforo')
    .eq('indicador_id', indicadorId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function crearHallazgo({ indicadorId, origenAsm, tipoAsmConeval, hallazgo, justificacion }) {
  const { data, error } = await supabase
    .from('asm_hallazgos')
    .insert({
      indicador_id: indicadorId,
      origen_asm: origenAsm || null,
      tipo_asm_coneval: tipoAsmConeval || null,
      hallazgo,
      justificacion: justificacion || null,
    })
    .select('id, folio, tipo_hallazgo, prioridad')
    .single()
  if (error) throw error
  return data
}

export async function crearAccionMejora({ hallazgoId, accion, responsableNombre, fechaInicio, fechaCompromiso }) {
  const { data, error } = await supabase
    .from('asm_acciones_mejora')
    .insert({
      hallazgo_id: hallazgoId,
      accion,
      responsable_nombre: responsableNombre || null,
      fecha_inicio: fechaInicio || null,
      fecha_compromiso: fechaCompromiso,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarAvanceAccion(accionId, { porcentajeAvance, fechaRealCierre } = {}) {
  const patch = {}
  if (porcentajeAvance != null) patch.porcentaje_avance = porcentajeAvance
  if (fechaRealCierre !== undefined) patch.fecha_real_cierre = fechaRealCierre || null

  const { data, error } = await supabase
    .from('asm_acciones_mejora')
    .update(patch)
    .eq('id', accionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function crearRecurso({ hallazgoId, presupuestoAsignado, presupuestoEjercido, fuenteFinanciamiento }) {
  const { data, error } = await supabase
    .from('asm_recursos')
    .insert({
      hallazgo_id: hallazgoId,
      presupuesto_asignado: presupuestoAsignado ?? null,
      presupuesto_ejercido: presupuestoEjercido ?? null,
      fuente_financiamiento: fuenteFinanciamiento || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
