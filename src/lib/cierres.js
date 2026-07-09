// ── Cierre mensual congelado (fase 1.3) ────────────────────────────────────────
// Snapshot inmutable del resumen (global/eje/área) al cerrar un periodo, para
// poder regenerar reportes de meses pasados aunque después se corrijan avances.
import { supabase } from './supabaseClient.js'

export async function getCierresMensuales() {
  const { data, error } = await supabase
    .from('cierres_mensuales')
    .select('id, anio, mes, cerrado_at, cerrado_por:usuarios(nombre)')
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getCierreMensual(anio, mes) {
  const { data, error } = await supabase
    .from('cierres_mensuales')
    .select('*')
    .eq('anio', anio).eq('mes', mes)
    .maybeSingle()
  if (error) throw error
  return data
}

// Congela el resumen del periodo ACTIVO (las vistas siempre reflejan
// get_anio_actual()/get_mes_actual(), así que solo tiene sentido cerrar el
// mes que sigue siendo el periodo activo, antes de avanzarlo).
export async function cerrarMesActual(anio, mes, usuarioId) {
  const [gRes, ejesRes, areasRes] = await Promise.all([
    supabase.from('v_dashboard_global').select('*').single(),
    supabase.from('v_resumen_ejes').select('*').order('orden', { ascending: true }),
    supabase.from('v_resumen_areas').select('*'),
  ])
  if (gRes.error)    throw gRes.error
  if (ejesRes.error) throw ejesRes.error
  if (areasRes.error) throw areasRes.error

  const { data, error } = await supabase
    .from('cierres_mensuales')
    .insert({
      anio, mes, cerrado_por: usuarioId,
      resumen_global: gRes.data,
      resumen_ejes:   ejesRes.data,
      resumen_areas:  areasRes.data,
    })
    .select().single()
  if (error) {
    if (error.code === '23505') throw new Error('Este periodo ya fue cerrado.')
    throw error
  }

  await supabase.from('audit_log').insert({
    tabla: 'cierres_mensuales', accion: 'CIERRE_MES', registro_id: `${anio}-${mes}`,
    usuario_id: usuarioId, datos_antes: null,
    datos_nuevo: { anio, mes, total_indicadores: gRes.data.total_indicadores, pct_global: gRes.data.pct_global },
  })

  return data
}

// Catálogo indicador→eje SIN filtro de periodo (a diferencia de
// v_indicadores_acum), con los mismos campos que ya consumen
// reporteMensualPDF.js/reportesExcel.js vía indicadoresPorEje[eje.codigo].
export async function getIndicadoresPorEjeCatalogo() {
  const [pages, { data: areas, error: eAreas }, { data: ejes, error: eEjes }] = await Promise.all([
    Promise.all([
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').range(0,   59),
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').range(60,  119),
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').range(120, 179),
      supabase.from('indicadores').select('id,nombre,nivel_mir,area_id').range(180, 239),
    ]),
    supabase.from('areas').select('id,nombre,eje_id'),
    supabase.from('ejes').select('id,codigo').order('orden'),
  ])
  pages.forEach(p => { if (p.error) throw p.error })
  if (eAreas) throw eAreas
  if (eEjes) throw eEjes

  const areasMap = Object.fromEntries((areas || []).map(a => [a.id, a]))
  const ejesMap  = Object.fromEntries((ejes  || []).map(e => [e.id, e]))

  const porEje = {}
  pages.flatMap(p => p.data || []).forEach(ind => {
    const area   = areasMap[ind.area_id] || {}
    const eje    = ejesMap[area.eje_id]  || {}
    const codigo = eje.codigo || 'SIN_EJE'
    if (!porEje[codigo]) porEje[codigo] = []
    porEje[codigo].push({ id: ind.id, indicador: ind.nombre, nivel_mir: ind.nivel_mir, area: area.nombre || '' })
  })
  return porEje
}

// Pares (anio, mes) que tienen al menos un avance capturado — para ofrecer
// en el selector de reportes los meses pasados que nunca se cerraron.
export async function getPeriodosConDatos() {
  const { data, error } = await supabase.from('avances').select('anio, mes')
  if (error) throw error
  const set = new Set((data || []).map(r => `${r.anio}-${r.mes}`))
  return [...set]
    .map(k => { const [anio, mes] = k.split('-').map(Number); return { anio, mes } })
    .sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes))
}

// Resumen de un mes SIN cierre formal, recalculado en vivo con la misma
// fórmula que v_dashboard_global/v_resumen_ejes/v_resumen_areas (funciones
// SQL parametrizadas resumen_*_periodo, mismo cuerpo, sin depender del
// periodo activo en configuracion). Misma forma que un registro de
// cierres_mensuales para poder reusar el mismo código consumidor.
export async function getResumenPeriodo(anio, mes) {
  const [gRes, ejesRes, areasRes] = await Promise.all([
    supabase.rpc('resumen_global_periodo', { p_anio: anio, p_mes: mes }),
    supabase.rpc('resumen_ejes_periodo',   { p_anio: anio, p_mes: mes }),
    supabase.rpc('resumen_areas_periodo',  { p_anio: anio, p_mes: mes }),
  ])
  if (gRes.error)    throw gRes.error
  if (ejesRes.error) throw ejesRes.error
  if (areasRes.error) throw areasRes.error
  return {
    resumen_global: gRes.data?.[0] || null,
    resumen_ejes:   ejesRes.data || [],
    resumen_areas:  areasRes.data || [],
  }
}

// Correcciones registradas después del cierre de un periodo (ver
// corregirAvance en capturaValidacion.js, que marca CORRECCION_EXTEMPORANEA).
export async function getCorreccionesExtemporaneas(anio, mes) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, registro_id, datos_antes, datos_nuevo, created_at, usuario:usuarios(nombre)')
    .eq('tabla', 'avances').eq('accion', 'CORRECCION_EXTEMPORANEA')
    .filter('datos_nuevo->>anio', 'eq', String(anio))
    .filter('datos_nuevo->>mes', 'eq', String(mes))
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}
