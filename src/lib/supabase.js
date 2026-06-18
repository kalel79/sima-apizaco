import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orgziertjteuawapxvmz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_QDre9bt6fWw3BlBWfVeFfA_3B8ATV2B'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
  }
})

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

export async function actualizarPeriodo(mes, anio) {
  const { error } = await supabase
    .from('configuracion')
    .upsert([
      { clave: 'mes_actual_evaluacion',  valor: String(mes)  },
      { clave: 'anio_actual_evaluacion', valor: String(anio) },
    ], { onConflict: 'clave' })
  if (error) throw error
}

export async function guardarAvance({ indicadorId, mes, anio, resultado, observaciones }) {
  const { data: ind, error: indError } = await supabase
    .from('indicadores')
    .select('meta_ene,meta_feb,meta_mar,meta_abr,meta_may,meta_jun,meta_jul,meta_ago,meta_sep,meta_oct,meta_nov,meta_dic')
    .eq('id', indicadorId).single()
  if (indError) throw indError

  const MESES = ['meta_ene','meta_feb','meta_mar','meta_abr','meta_may','meta_jun',
                 'meta_jul','meta_ago','meta_sep','meta_oct','meta_nov','meta_dic']
  const metaVal  = parseFloat(ind[MESES[mes - 1]] || 0)
  const pct      = metaVal > 0 ? resultado / metaVal : 1.0
  const semaforo = pct >= 1.10 ? 'ÓPTIMO' : pct >= 0.90 ? 'ADECUADO' : pct >= 0.70 ? 'RIESGO' : 'CRÍTICO'

  const { data, error } = await supabase
    .from('avances')
    .upsert({
      indicador_id: indicadorId, anio, mes,
      meta_programada: metaVal,
      meta_evaluable: metaVal,
      resultado, pct_cumplimiento: pct, semaforo,
      observaciones: observaciones || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'indicador_id,anio,mes' })
    .select().single()
  if (error) throw error
  return data
}
