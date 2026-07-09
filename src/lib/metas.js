// ── Metas multi-año (tabla `metas`, fase 1.1) ──────────────────────────────────
// mes: 1-12 = meta mensual, 0 = meta anual.
import { supabase } from './supabaseClient.js'
import { sortByMIR } from '../utils/reportesBase.js'

const PAGE_SIZE = 500

// Pagina hasta agotar resultados (no asume un límite fijo de filas por request).
async function fetchAllMetas({ anio, indicadorIds, mesMin, mesMax } = {}) {
  let all = []
  let from = 0
  for (;;) {
    let q = supabase.from('metas').select('id,indicador_id,anio,mes,valor').range(from, from + PAGE_SIZE - 1)
    if (anio != null) q = q.eq('anio', anio)
    if (indicadorIds) q = q.in('indicador_id', indicadorIds)
    if (mesMin != null) q = q.gte('mes', mesMin)
    if (mesMax != null) q = q.lte('mes', mesMax)
    const { data, error } = await q
    if (error) throw error
    all = all.concat(data || [])
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}

// Mapa { indicador_id: { mes: valor } } para un año (todos los indicadores).
export async function getMetasCatalogo(anio) {
  const rows = await fetchAllMetas({ anio })
  const map = {}
  rows.forEach(r => {
    if (!map[r.indicador_id]) map[r.indicador_id] = {}
    map[r.indicador_id][r.mes] = r.valor
  })
  return map
}

// Metas mensuales (1-12) del catálogo para UN indicador/año — usado por guardarAvance.
export async function getMetasIndicadorAnio(indicadorId, anio) {
  const { data, error } = await supabase
    .from('metas').select('mes,valor')
    .eq('indicador_id', indicadorId).eq('anio', anio)
    .gte('mes', 1).lte('mes', 12)
  if (error) throw error
  const map = {}
  ;(data || []).forEach(r => { map[r.mes] = r.valor })
  return map
}

// Indicadores de un área con su malla de metas (mes 1-12 + anual=0) para un año,
// para la pantalla admin "Metas por año". Orden MIR: Fin, Propósito, Componente, Actividad.
export async function getMetasArea(areaId, anio) {
  const { data: inds, error: eInd } = await supabase
    .from('indicadores').select('id, clave, nombre, nivel_mir').eq('area_id', areaId)
  if (eInd) throw eInd
  const ids = (inds || []).map(i => i.id)
  if (!ids.length) return []

  const rows = await fetchAllMetas({ anio, indicadorIds: ids })
  const metasMap = {}
  rows.forEach(r => {
    if (!metasMap[r.indicador_id]) metasMap[r.indicador_id] = {}
    metasMap[r.indicador_id][r.mes] = r.valor
  })

  return sortByMIR(inds || []).map(ind => ({ ...ind, metas: metasMap[ind.id] || {} }))
}

// Catálogo completo de indicadores ordenado por eje (ascendente) y, dentro de
// cada eje, por nivel MIR (Fin, Propósito, Componente, Actividad) — para la
// plantilla de importación de metas.
export async function getIndicadoresOrdenados() {
  const [pages, { data: areas, error: eAreas }, { data: ejes, error: eEjes }] = await Promise.all([
    Promise.all([
      supabase.from('indicadores').select('id,clave,nombre,nivel_mir,area_id').range(0,   59),
      supabase.from('indicadores').select('id,clave,nombre,nivel_mir,area_id').range(60,  119),
      supabase.from('indicadores').select('id,clave,nombre,nivel_mir,area_id').range(120, 179),
      supabase.from('indicadores').select('id,clave,nombre,nivel_mir,area_id').range(180, 239),
    ]),
    supabase.from('areas').select('id,nombre,eje_id'),
    supabase.from('ejes').select('id,codigo,orden').order('orden'),
  ])
  pages.forEach(p => { if (p.error) throw p.error })
  if (eAreas) throw eAreas
  if (eEjes) throw eEjes

  const areasMap = Object.fromEntries((areas || []).map(a => [a.id, a]))
  const ejesMap  = Object.fromEntries((ejes  || []).map(e => [e.id, e]))

  const todos = pages.flatMap(p => p.data || []).map(ind => {
    const area = areasMap[ind.area_id] || {}
    const eje  = ejesMap[area.eje_id]  || {}
    return { ...ind, area_nombre: area.nombre || '', eje_codigo: eje.codigo || '', eje_orden: eje.orden ?? 99 }
  })

  const porEje = new Map()
  todos.forEach(ind => {
    if (!porEje.has(ind.eje_orden)) porEje.set(ind.eje_orden, [])
    porEje.get(ind.eje_orden).push(ind)
  })
  return [...porEje.keys()].sort((a, b) => a - b).flatMap(orden => sortByMIR(porEje.get(orden)))
}

export async function upsertMeta(indicadorId, anio, mes, valor) {
  const { data, error } = await supabase
    .from('metas')
    .upsert({ indicador_id: indicadorId, anio, mes, valor }, { onConflict: 'indicador_id,anio,mes' })
    .select().single()
  if (error) throw error
  return data
}

// filas: [{ indicador_id, anio, mes, valor }, ...]
export async function upsertMetasLote(filas) {
  if (!filas?.length) return []
  const { data, error } = await supabase
    .from('metas')
    .upsert(filas, { onConflict: 'indicador_id,anio,mes' })
    .select()
  if (error) throw error
  return data || []
}
