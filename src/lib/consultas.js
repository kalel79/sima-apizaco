// ── Consultas de lectura (dashboards, listados y datos para reportes) ─────────
import { supabase } from './supabaseClient.js'
import { getMetasCatalogo } from './metas.js'

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

// Serie mensual del % acumulado por indicador (mes 1 → mesHasta): cada punto m
// es (SUM resultado / SUM meta) de los meses 1..m — misma metodología que
// acumularAvancesPorIndicador, así el último punto coincide con el % de la
// tabla. Meses sin ninguna captura previa quedan en null (hueco en la línea).
function serieAcumuladaPorIndicador(avances, mesHasta) {
  const porInd = {}
  ;(avances || []).forEach(a => {
    if (!porInd[a.indicador_id]) porInd[a.indicador_id] = {}
    porInd[a.indicador_id][a.mes] = {
      resultado: Number(a.resultado) || 0,
      meta:      Number(a.meta_programada) || 0,
    }
  })
  const out = {}
  Object.entries(porInd).forEach(([id, meses]) => {
    const serie = []
    let resultado = 0, meta = 0, hayCaptura = false
    for (let m = 1; m <= mesHasta; m++) {
      if (meses[m]) {
        hayCaptura = true
        resultado += meses[m].resultado
        meta      += meses[m].meta
      }
      if (!hayCaptura)      serie.push(null)
      else if (meta > 0)    serie.push(Math.round((resultado / meta) * 10000) / 100)
      else if (resultado > 0) serie.push(100)
      else                  serie.push(null)
    }
    out[id] = serie
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
    supabase.from('indicadores').select('id, clave, nombre, area_id, nivel_mir, definicion, formula, sentido, dimension, tipo_indicador, unidad_medida, frecuencia, medios_verificacion, interpretacion').eq('programa_pmd_id', programaId).order('nombre'),
    supabase.from('areas').select('id, nombre'),
  ])
  if (eInd) throw eInd
  if (eAreas) throw eAreas

  const areasMap = Object.fromEntries((areas || []).map(a => [a.id, a.nombre]))
  const ids = (inds || []).map(i => i.id)
  if (!ids.length) return []

  // El objetivo/supuestos MIR de cada indicador vive en el árbol de objetivos
  // MML (arbol_nodos), ligado directo por indicador_id — no en mir_niveles,
  // que solo tiene narrativa capturada para el programa piloto 003.
  const [{ data: avs, error: eAv }, { data: nodos, error: eNod }] = await Promise.all([
    supabase
      .from('avances')
      .select('indicador_id, mes, meta_programada, resultado')
      .in('indicador_id', ids).eq('anio', anio).gte('mes', 1).lte('mes', mes),
    supabase
      .from('arbol_nodos')
      .select('indicador_id, texto, supuestos')
      .eq('arbol', 'OBJETIVOS').eq('anio', anio).in('indicador_id', ids),
  ])
  if (eAv) throw eAv
  if (eNod) throw eNod

  const acumulados = acumularAvancesPorIndicador(avs)
  const series = serieAcumuladaPorIndicador(avs, mes)
  const nodoPorIndicador = Object.fromEntries((nodos || []).map(n => [n.indicador_id, n]))
  return (inds || []).map(i => {
    const ac = acumulados[i.id] || {}
    return {
      clave:               i.clave || '-',
      nombre:              i.nombre,
      area_nombre:         areasMap[i.area_id] || '-',
      nivel_mir:           i.nivel_mir,
      definicion:          i.definicion,
      formula:             i.formula,
      sentido:             i.sentido,
      dimension:           i.dimension,
      tipo_indicador:      i.tipo_indicador,
      unidad_medida:       i.unidad_medida,
      frecuencia:          i.frecuencia,
      medios_verificacion: i.medios_verificacion,
      interpretacion:      i.interpretacion,
      objetivo_mir:        nodoPorIndicador[i.id]?.texto ?? null,
      supuestos_mir:       nodoPorIndicador[i.id]?.supuestos ?? null,
      meta_acumulada:      ac.meta ?? null,
      resultado_acumulado: ac.resultado ?? null,
      pct_pmd:             ac.pct ?? null,
      semaforo:            ac.semaforo ?? null,
      serie_acumulada:     series[i.id] ?? [],
    }
  })
}

// Programas presupuestarios asociados a un programa PMD, derivados de sus
// indicadores (39 de 40 programas PMD mapean a exactamente uno; el #34 cruza
// con dos y se devuelven ambos), con el objetivo central del árbol de
// objetivos MML del año dado.
export async function getProgramasPresupuestariosDePmd(programaPmdId, anio) {
  const { data: inds, error: eInd } = await supabase
    .from('indicadores').select('programa_id').eq('programa_pmd_id', programaPmdId)
  if (eInd) throw eInd
  const ids = [...new Set((inds || []).map(i => i.programa_id).filter(id => id != null))]
  if (!ids.length) return []

  const [{ data: progs, error: eProg }, { data: nodos, error: eNod }] = await Promise.all([
    supabase.from('programas').select('id, clave, nombre').in('id', ids),
    supabase.from('arbol_nodos').select('programa_id, texto')
      .eq('arbol', 'OBJETIVOS').eq('anio', anio).eq('tipo', 'OBJETIVO').in('programa_id', ids),
  ])
  if (eProg) throw eProg
  if (eNod) throw eNod

  const objetivoPorPrograma = Object.fromEntries((nodos || []).map(n => [n.programa_id, n.texto]))
  return (progs || [])
    .sort((a, b) => (a.clave || '').localeCompare(b.clave || ''))
    .map(p => ({ clave: p.clave, nombre: p.nombre, objetivo_central: objetivoPorPrograma[p.id] ?? null }))
}

// Indicadores de TODOS los programas PMD con su avance acumulado (mes 1 →
// mes dado), agrupados por programa_pmd_id — usado por el reporte PDF
// cuando se activa "incluir detalle" (evita 43 consultas individuales).
export async function getDetalleIndicadoresPMD(mes, anio) {
  const [{ data: inds, error: eInd }, { data: areas, error: eAreas }, { data: avs, error: eAv }] = await Promise.all([
    supabase.from('indicadores').select('id, clave, nombre, area_id, programa_pmd_id, nivel_mir').order('nombre'),
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
      nivel_mir:   i.nivel_mir,
      pct_pmd:     ac.pct ?? null,
      semaforo:    ac.semaforo ?? null,
    })
  })
  return porPrograma
}

// Programa(s) presupuestario(s) + objetivo central por CADA programa PMD, en
// un solo pase (3 consultas totales) — para el reporte PDF, que necesita el
// dato de los 43 programas de golpe en vez de una consulta por programa como
// hace getProgramasPresupuestariosDePmd (pensada para un solo expandible).
export async function getProgramasPresupuestariosPorPmd(anio) {
  const [{ data: inds, error: eInd }, { data: progs, error: eProg }] = await Promise.all([
    supabase.from('indicadores').select('programa_pmd_id, programa_id'),
    supabase.from('programas').select('id, clave, nombre'),
  ])
  if (eInd) throw eInd
  if (eProg) throw eProg

  const progMap = Object.fromEntries((progs || []).map(p => [p.id, p]))
  const idsPorPmd = {}
  ;(inds || []).forEach(i => {
    if (i.programa_pmd_id == null || i.programa_id == null) return
    if (!idsPorPmd[i.programa_pmd_id]) idsPorPmd[i.programa_pmd_id] = new Set()
    idsPorPmd[i.programa_pmd_id].add(i.programa_id)
  })
  const idsUsados = [...new Set((inds || []).map(i => i.programa_id).filter(id => id != null))]
  if (!idsUsados.length) return {}

  const { data: nodos, error: eNod } = await supabase
    .from('arbol_nodos').select('programa_id, texto')
    .eq('arbol', 'OBJETIVOS').eq('anio', anio).eq('tipo', 'OBJETIVO').in('programa_id', idsUsados)
  if (eNod) throw eNod
  const objetivoPorPrograma = Object.fromEntries((nodos || []).map(n => [n.programa_id, n.texto]))

  const porPmd = {}
  Object.entries(idsPorPmd).forEach(([pmdId, set]) => {
    porPmd[pmdId] = [...set].map(id => progMap[id]).filter(Boolean)
      .sort((a, b) => (a.clave || '').localeCompare(b.clave || ''))
      .map(p => ({ clave: p.clave, nombre: p.nombre, objetivo_central: objetivoPorPrograma[p.id] ?? null }))
  })
  return porPmd
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

export async function getMetasResultados(anio = 2026) {
  const [pages, { data: areas, error: eAreas }, { data: ejes, error: eEjes }, { data: avances, error: eAv }, metasCatalogo] = await Promise.all([
    Promise.all([
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').order('id').range(0,   59),
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').order('id').range(60,  119),
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').order('id').range(120, 179),
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').order('id').range(180, 239),
    ]),
    supabase.from('areas').select('id,nombre,eje_id'),
    supabase.from('ejes').select('id,codigo,nombre,orden').order('orden'),
    supabase.from('avances').select('indicador_id,mes,resultado,pct_cumplimiento,semaforo').eq('anio', anio),
    getMetasCatalogo(anio),
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
    return {
      ...ind, area_nombre: area.nombre || '', eje_codigo: eje.codigo || '', eje_orden: eje.orden ?? 99,
      avances: avMap[ind.id] || {}, metas: metasCatalogo[ind.id] || {},
    }
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
