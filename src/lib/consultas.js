// ── Consultas de lectura (dashboards, listados y datos para reportes) ─────────
import { supabase } from './supabaseClient.js'

export async function getDashboardGlobal() {
  const { data, error } = await supabase.from('v_dashboard_global').select('*').single()
  if (error) throw error
  return data
}

export async function getResumenEjes() {
  const { data, error } = await supabase.from('v_resumen_ejes').select('*').order('orden', { ascending: true })
  if (error) throw error
  return data
}

export async function getResumenAreas() {
  const { data, error } = await supabase.from('v_resumen_areas').select('*').order('pct_promedio', { ascending: false })
  if (error) throw error
  return data
}

export async function getAlertasLogros() {
  const { data, error } = await supabase.from('v_alertas_logros').select('*')
  if (error) throw error
  return data
}

export async function getIndicadores({ ejeId, semaforo, busqueda } = {}) {
  let query = supabase
    .from('v_indicadores_acum')
    .select('*')
    .range(0, 499)
  if (semaforo) query = query.eq('semaforo', semaforo)

  const { data, error } = await query
  if (error) throw error
  if (!data?.length) return []

  let result = data || []
  if (ejeId)    result = result.filter(r => r.eje_codigo === ejeId)
  if (busqueda) result = result.filter(r =>
    r.indicador.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.area.toLowerCase().includes(busqueda.toLowerCase())
  )
  result.sort((a, b) => (a.pct_cumplimiento || 0) - (b.pct_cumplimiento || 0))
  return result
}

export async function getAvanceCapturaAreas() {
  const { data, error } = await supabase.from('v_avance_captura_areas').select('*')
  if (error) throw error
  return data
}

export async function getNombresEjes() {
  const { data, error } = await supabase.from('ejes').select('codigo, nombre').order('orden')
  if (error) throw error
  return data
}

export async function getComparativoPMD() {
  const { data, error } = await supabase.from('v_comparativo_pmd').select('*').order('numero', { ascending: true })
  if (error) throw error
  return data
}

// Mapa { indicador_id: clave } — v_indicadores_acum no expone "clave", así que
// se cruza en cliente contra la tabla indicadores (sin tocar la vista).
export async function getClavesIndicadores() {
  const { data, error } = await supabase.from('indicadores').select('id, clave')
  if (error) throw error
  return Object.fromEntries((data || []).map(i => [i.id, i.clave]))
}

// Acumula resultado/meta_programada por indicador (mes 1 → mes dado) y deriva
// pct/semaforo con la misma metodología y umbrales que v_comparativo_pmd.
// pct queda en escala de porcentaje (ej. 101.45), no como fracción.
function acumularAvancesPorIndicador(avances) {
  const acc = {}
  ;(avances || []).forEach(a => {
    if (!acc[a.indicador_id]) acc[a.indicador_id] = { resultado: 0, meta: 0 }
    acc[a.indicador_id].resultado += Number(a.resultado) || 0
    acc[a.indicador_id].meta      += Number(a.meta_programada) || 0
  })
  const out = {}
  Object.entries(acc).forEach(([id, { resultado, meta }]) => {
    let pct = null, semaforo = null
    if (meta > 0) {
      pct = Math.round((resultado / meta) * 10000) / 100
      semaforo = pct >= 110 ? 'ÓPTIMO' : pct >= 90 ? 'ADECUADO' : pct >= 70 ? 'RIESGO' : 'CRÍTICO'
    } else if (resultado > 0) {
      pct = 100
      semaforo = 'ÓPTIMO'
    }
    out[id] = { pct, semaforo, resultado, meta }
  })
  return out
}

// Indicadores de un programa PMD con su avance ACUMULADO (mes 1 → mes dado),
// para el panel de detalle de v_comparativo_pmd. Usa la misma metodología
// acumulada que la vista, en vez de una sola captura mensual — si el mes
// actual todavía no tiene captura (caso normal a inicio de periodo), esto
// evita mostrar "sin datos" cuando en realidad sí hay avance acumulado.
export async function getIndicadoresPorPrograma(programaId, mes, anio) {
  const [{ data: inds, error: eInd }, { data: areas, error: eAreas }] = await Promise.all([
    supabase.from('indicadores').select('id, clave, nombre, area_id').eq('programa_pmd_id', programaId).order('nombre'),
    supabase.from('areas').select('id, nombre'),
  ])
  if (eInd) throw eInd
  if (eAreas) throw eAreas

  const areasMap = Object.fromEntries((areas || []).map(a => [a.id, a.nombre]))
  const ids = (inds || []).map(i => i.id)
  if (!ids.length) return []

  const { data: avs, error: eAv } = await supabase
    .from('avances')
    .select('indicador_id, meta_programada, resultado')
    .in('indicador_id', ids).eq('anio', anio).gte('mes', 1).lte('mes', mes)
  if (eAv) throw eAv

  const acumulados = acumularAvancesPorIndicador(avs)
  return (inds || []).map(i => {
    const ac = acumulados[i.id] || {}
    return {
      clave:               i.clave || '-',
      nombre:              i.nombre,
      area_nombre:         areasMap[i.area_id] || '-',
      meta_acumulada:      ac.meta ?? null,
      resultado_acumulado: ac.resultado ?? null,
      pct_pmd:             ac.pct ?? null,
      semaforo:            ac.semaforo ?? null,
    }
  })
}

// Indicadores de TODOS los programas PMD con su avance acumulado (mes 1 →
// mes dado), agrupados por programa_pmd_id — usado por el reporte PDF
// cuando se activa "incluir detalle" (evita 43 consultas individuales).
export async function getDetalleIndicadoresPMD(mes, anio) {
  const [{ data: inds, error: eInd }, { data: areas, error: eAreas }, { data: avs, error: eAv }] = await Promise.all([
    supabase.from('indicadores').select('id, clave, nombre, area_id, programa_pmd_id').order('nombre'),
    supabase.from('areas').select('id, nombre'),
    supabase.from('avances').select('indicador_id, meta_programada, resultado').eq('anio', anio).gte('mes', 1).lte('mes', mes),
  ])
  if (eInd) throw eInd
  if (eAreas) throw eAreas
  if (eAv) throw eAv

  const areasMap = Object.fromEntries((areas || []).map(a => [a.id, a.nombre]))
  const acumulados = acumularAvancesPorIndicador(avs)

  const porPrograma = {}
  ;(inds || []).forEach(i => {
    if (i.programa_pmd_id == null) return
    const ac = acumulados[i.id] || {}
    if (!porPrograma[i.programa_pmd_id]) porPrograma[i.programa_pmd_id] = []
    porPrograma[i.programa_pmd_id].push({
      clave:       i.clave || '-',
      nombre:      i.nombre,
      area_nombre: areasMap[i.area_id] || '-',
      pct_pmd:     ac.pct ?? null,
      semaforo:    ac.semaforo ?? null,
    })
  })
  return porPrograma
}

export async function getIndicadoresLista() {
  const [pages, { data: areas, error: eAreas }] = await Promise.all([
    Promise.all([
      supabase.from('indicadores').select('id, nombre, nivel_mir, area_id').order('nombre').range(0,   59),
      supabase.from('indicadores').select('id, nombre, nivel_mir, area_id').order('nombre').range(60,  119),
      supabase.from('indicadores').select('id, nombre, nivel_mir, area_id').order('nombre').range(120, 179),
      supabase.from('indicadores').select('id, nombre, nivel_mir, area_id').order('nombre').range(180, 239),
    ]),
    supabase.from('areas').select('id, nombre').range(0, 199),
  ])
  pages.forEach(p => { if (p.error) throw p.error })
  if (eAreas) throw eAreas

  const todos = pages.flatMap(p => p.data || [])
  const areasMap = Object.fromEntries((areas || []).map(a => [a.id, a.nombre]))

  return todos.map(i => ({
    ...i,
    area_nombre: areasMap[i.area_id] || 'Sin area'
  }))
}

export async function getMetasResultados() {
  const MESES_COLS = 'id,nombre,nivel_mir,area_id,meta_ene,meta_feb,meta_mar,meta_abr,meta_may,meta_jun,meta_jul,meta_ago,meta_sep,meta_oct,meta_nov,meta_dic'
  const [pages, { data: areas, error: eAreas }, { data: ejes, error: eEjes }, { data: avances, error: eAv }] = await Promise.all([
    Promise.all([
      supabase.from('indicadores').select(MESES_COLS).order('id').range(0,   59),
      supabase.from('indicadores').select(MESES_COLS).order('id').range(60,  119),
      supabase.from('indicadores').select(MESES_COLS).order('id').range(120, 179),
      supabase.from('indicadores').select(MESES_COLS).order('id').range(180, 239),
    ]),
    supabase.from('areas').select('id,nombre,eje_id'),
    supabase.from('ejes').select('id,codigo,nombre,orden').order('orden'),
    supabase.from('avances').select('indicador_id,mes,resultado,pct_cumplimiento,semaforo').eq('anio', 2026),
  ])
  pages.forEach(p => { if (p.error) throw p.error })
  if (eAreas || eEjes || eAv) throw eAreas || eEjes || eAv

  const areasMap  = Object.fromEntries((areas  || []).map(a => [a.id, a]))
  const ejesMap   = Object.fromEntries((ejes   || []).map(e => [e.id, e]))
  const avMap     = {}
  ;(avances || []).forEach(av => {
    if (!avMap[av.indicador_id]) avMap[av.indicador_id] = {}
    avMap[av.indicador_id][av.mes] = { resultado: av.resultado, pct: av.pct_cumplimiento, semaforo: av.semaforo }
  })

  const todos = pages.flatMap(p => p.data || [])
  return todos.map(ind => {
    const area = areasMap[ind.area_id] || {}
    const eje  = ejesMap[area.eje_id]  || {}
    return { ...ind, area_nombre: area.nombre || '', eje_codigo: eje.codigo || '', eje_orden: eje.orden ?? 99, avances: avMap[ind.id] || {} }
  }).sort((a, b) => {
    if (a.eje_orden !== b.eje_orden) return a.eje_orden - b.eje_orden
    if (a.area_nombre !== b.area_nombre) return a.area_nombre.localeCompare(b.area_nombre, 'es')
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

export async function getAvancesMensualesPDF(anio) {
  const { data, error } = await supabase
    .from('avances')
    .select('indicador_id, mes, meta_programada, resultado')
    .eq('anio', anio)
    .order('indicador_id').order('mes')
  if (error) throw error
  const map = {}
  ;(data || []).forEach(av => {
    if (!map[av.indicador_id]) map[av.indicador_id] = {}
    map[av.indicador_id][av.mes] = { meta: +(av.meta_programada || 0), res: +(av.resultado || 0) }
  })
  return map
}
