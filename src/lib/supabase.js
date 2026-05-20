import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orgziertjteuawapxvmz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_QDre9bt6fWw3BlBWfVeFfA_3B8ATV2B'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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
    .from('avances')
    .select('id, meta_evaluable, resultado, pct_cumplimiento, semaforo, tipo_alerta, tendencia, indicador_id')
    .eq('anio', 2026).eq('mes', 4).range(0, 499)
  if (semaforo) query = query.eq('semaforo', semaforo)
  const { data: avancesData, error: avancesError } = await query
  if (avancesError) throw avancesError
  if (!avancesData?.length) return []

  const { data: indsData,  error: e1 } = await supabase.from('indicadores').select('id, nombre, nivel_mir, area_id').range(0, 499)
  if (e1) throw e1
  const { data: indsData2, error: e1b } = await supabase.from('indicadores').select('id, nombre, nivel_mir, area_id').range(500, 999)
  if (e1b) throw e1b
  const todosInds = [...(indsData || []), ...(indsData2 || [])]

  const { data: areasData, error: e2 } = await supabase.from('areas').select('id, nombre, eje_id').range(0, 199)
  if (e2) throw e2
  const { data: ejesData,  error: e3 } = await supabase.from('ejes').select('id, codigo, nombre, color_hex, icono')
  if (e3) throw e3

  const indsMap  = Object.fromEntries(todosInds.map(i => [i.id, i]))
  const areasMap = Object.fromEntries((areasData || []).map(a => [a.id, a]))
  const ejesMap  = Object.fromEntries((ejesData  || []).map(e => [e.id, e]))

  let result = (avancesData || []).map(av => {
    const ind  = indsMap[av.indicador_id] || {}
    const area = areasMap[ind.area_id]    || {}
    const eje  = ejesMap[area.eje_id]     || {}
    return {
      ...av,
      indicador: ind.nombre    || '',
      nivel_mir: ind.nivel_mir || '',
      area:      area.nombre   || '',
      eje_codigo:eje.codigo    || '',
      eje_nombre:eje.nombre    || '',
      eje_color: eje.color_hex || '#8B0000',
      eje_icono: eje.icono     || '',
    }
  })

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
  const semaforo = pct > 1.10 ? 'OPTIMO' : pct >= 0.90 ? 'ADECUADO' : pct >= 0.70 ? 'RIESGO' : 'CRITICO'

  const { data, error } = await supabase
    .from('avances')
    .upsert({
      indicador_id: indicadorId, anio, mes,
      meta_programada: metaVal, meta_evaluable: metaVal,
      resultado, pct_cumplimiento: pct, semaforo,
      observaciones: observaciones || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'indicador_id,anio,mes' })
    .select().single()
  if (error) throw error
  return data
}
