import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orgziertjteuawapxvmz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_QDre9bt6fWw3BlBWfVeFfA_3B8ATV2B'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
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

export async function getComparativoPMD() {
  const { data, error } = await supabase.from('v_comparativo_pmd').select('*').order('numero', { ascending: true })
  if (error) throw error
  return data
}

// Indicadores de un programa PMD con su avance del mes/año dados, para el
// panel de detalle de v_comparativo_pmd.
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
    .select('indicador_id, meta_programada, resultado, pct_cumplimiento, semaforo')
    .in('indicador_id', ids).eq('mes', mes).eq('anio', anio)
  if (eAv) throw eAv

  const avMap = Object.fromEntries((avs || []).map(a => [a.indicador_id, a]))
  return (inds || []).map(i => {
    const av = avMap[i.id] || {}
    return {
      clave:             i.clave || '-',
      nombre:            i.nombre,
      area_nombre:       areasMap[i.area_id] || '-',
      meta_mes:          av.meta_programada ?? null,
      resultado:         av.resultado ?? null,
      pct_cumplimiento:  av.pct_cumplimiento ?? null,
      semaforo:          av.semaforo ?? null,
    }
  })
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

/* ── VALIDACIÓN DE CAPTURA (enlace) ─────────────────────────────── */
export async function getAvanceActual(indicadorId, mes, anio) {
  const { data, error } = await supabase
    .from('avances')
    .select('id, resultado, observaciones, validado, validado_at')
    .eq('indicador_id', indicadorId).eq('mes', mes).eq('anio', anio)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getResumenValidacionArea(areaId, mes, anio) {
  const { data: inds, error: eInd } = await supabase
    .from('indicadores').select('id').eq('area_id', areaId)
  if (eInd) throw eInd
  const ids = (inds || []).map(i => i.id)
  if (!ids.length) return { totalIndicadores: 0, capturados: 0, validados: 0, pendientes: 0 }

  const { data: avs, error: eAv } = await supabase
    .from('avances').select('validado')
    .in('indicador_id', ids).eq('mes', mes).eq('anio', anio)
  if (eAv) throw eAv

  const capturados = (avs || []).length
  const validados   = (avs || []).filter(a => a.validado === true).length
  return { totalIndicadores: ids.length, capturados, validados, pendientes: capturados - validados }
}

export async function validarInformacionMes({ areaId, mes, anio, usuarioId }) {
  const { data: inds, error: eInd } = await supabase
    .from('indicadores').select('id').eq('area_id', areaId)
  if (eInd) throw eInd
  const ids = (inds || []).map(i => i.id)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('avances')
    .update({ validado: true, validado_at: new Date().toISOString(), validado_por: usuarioId })
    .in('indicador_id', ids)
    .eq('mes', mes).eq('anio', anio)
    .or('validado.is.null,validado.eq.false')
    .select()
  if (error) throw error
  return data || []
}

export async function reautenticar(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Contraseña incorrecta.')
}

// Indicadores validados de un área/mes/año, con datos completos para el acuse de captura.
export async function getAvancesValidadosMes(areaId, mes, anio) {
  const { data: inds, error: eInd } = await supabase
    .from('indicadores').select('id, clave, nombre, nivel_mir').eq('area_id', areaId)
  if (eInd) throw eInd
  const ids = (inds || []).map(i => i.id)
  if (!ids.length) return []

  const { data: avs, error: eAv } = await supabase
    .from('avances')
    .select('indicador_id, meta_programada, resultado, pct_cumplimiento, semaforo')
    .in('indicador_id', ids).eq('mes', mes).eq('anio', anio).eq('validado', true)
  if (eAv) throw eAv

  const indMap = Object.fromEntries((inds || []).map(i => [i.id, i]))
  return (avs || [])
    .map(av => {
      const ind = indMap[av.indicador_id] || {}
      return {
        clave:             ind.clave || '-',
        nombre:            ind.nombre || '',
        nivel_mir:         ind.nivel_mir || '-',
        meta_programada:   av.meta_programada,
        resultado:         av.resultado,
        pct_cumplimiento:  av.pct_cumplimiento,
        semaforo:          av.semaforo,
      }
    })
    .sort((a, b) => (a.clave || '').localeCompare(b.clave || '', 'es'))
}

/* ── EVIDENCIAS ──────────────────────────────────────────────── */
export const EVIDENCIAS_BUCKET = 'evidencias'
export const EVIDENCIAS_MAX_BYTES = 10 * 1024 * 1024
const EVIDENCIAS_EXTENSIONES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

function validarArchivoEvidencia(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !EVIDENCIAS_EXTENSIONES.includes(ext)) {
    throw new Error(`Tipo de archivo no permitido (.${ext || '?'}). Usa PDF, JPG, PNG, Word o Excel.`)
  }
  if (file.size > EVIDENCIAS_MAX_BYTES) {
    throw new Error(`El archivo supera el límite de 10 MB (pesa ${(file.size / 1024 / 1024).toFixed(1)} MB).`)
  }
}

export async function getIndicadorAreaId(indicadorId) {
  const { data, error } = await supabase
    .from('indicadores').select('area_id').eq('id', indicadorId).maybeSingle()
  if (error) throw error
  return data?.area_id ?? null
}

export async function getAvancePorIndicador(indicadorId, mes, anio) {
  const { data, error } = await supabase
    .from('avances').select('id')
    .eq('indicador_id', indicadorId).eq('mes', mes).eq('anio', anio)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function listarEvidencias(avanceId) {
  const { data, error } = await supabase
    .from('evidencias')
    .select('id, nombre_archivo, url_storage, tipo_mime, tamano_bytes, subido_por, created_at')
    .eq('avance_id', avanceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function subirEvidencia({ avanceId, indicadorId, areaId, anio, mes, file, userId }) {
  validarArchivoEvidencia(file)

  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${areaId}/${indicadorId}/${anio}-${mes}/${Date.now()}_${nombreSeguro}`

  const { error: eUpload } = await supabase.storage
    .from(EVIDENCIAS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (eUpload) throw eUpload

  const { data, error } = await supabase
    .from('evidencias')
    .insert({
      avance_id: avanceId,
      indicador_id: indicadorId,
      area_id: areaId,
      nombre_archivo: file.name,
      url_storage: path,
      tipo_mime: file.type || null,
      tamano_bytes: file.size,
      subido_por: userId,
    })
    .select().single()

  if (error) {
    await supabase.storage.from(EVIDENCIAS_BUCKET).remove([path])
    throw error
  }
  return data
}

export async function borrarEvidencia(evidencia) {
  const { error } = await supabase.from('evidencias').delete().eq('id', evidencia.id)
  if (error) throw error
  await supabase.storage.from(EVIDENCIAS_BUCKET).remove([evidencia.url_storage])
}

export async function getEvidenciaUrl(path) {
  const { data, error } = await supabase.storage
    .from(EVIDENCIAS_BUCKET)
    .createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
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

export async function guardarAvance({ indicadorId, mes, anio, resultado, observaciones, usuarioId }) {
  const MESES_COLS = ['meta_ene','meta_feb','meta_mar','meta_abr','meta_may','meta_jun',
                      'meta_jul','meta_ago','meta_sep','meta_oct','meta_nov','meta_dic']

  // Leer metas del catálogo y avances previos (meses 1..mes-1) en paralelo
  const [
    { data: ind,         error: indError },
    { data: prevAvances, error: avError  },
  ] = await Promise.all([
    supabase.from('indicadores').select(MESES_COLS.join(',')).eq('id', indicadorId).single(),
    supabase.from('avances').select('mes,resultado').eq('indicador_id', indicadorId).eq('anio', anio).lt('mes', mes),
  ])
  if (indError) throw indError
  if (avError)  throw avError

  // meta del mes actual (del catálogo)
  const metaMes = parseFloat(ind[MESES_COLS[mes - 1]] ?? 0)

  // meta_evaluable: meta del mes; si meta_mes=0 pero hay resultado, usar 1 (regla meta=1)
  const metaEvaluable = (metaMes === 0 && resultado > 0) ? 1 : metaMes

  // Acumulado ene→M: suma de metas del catálogo
  let metaAcum = 0
  for (let m = 1; m <= mes; m++) metaAcum += parseFloat(ind[MESES_COLS[m - 1]] ?? 0)

  // Acumulado ene→M: resultados previos + resultado actual
  const prevMap = Object.fromEntries((prevAvances || []).map(av => [av.mes, parseFloat(av.resultado ?? 0)]))
  let resultAcum = resultado
  for (let m = 1; m < mes; m++) resultAcum += prevMap[m] ?? 0

  // pct sobre acumulado; null si ambos acumulados son 0
  let pct
  if      (metaAcum  > 0) pct = resultAcum / metaAcum
  else if (resultAcum > 0) pct = resultAcum          // regla meta=1: denominador implícito = 1
  else                     pct = null

  const semaforo = pct === null ? null
    : pct >= 1.10 ? 'ÓPTIMO'
    : pct >= 0.90 ? 'ADECUADO'
    : pct >= 0.70 ? 'RIESGO'
    : 'CRÍTICO'

  const { data, error } = await supabase
    .from('avances')
    .upsert({
      indicador_id:    indicadorId, anio, mes,
      meta_programada: metaMes,
      meta_evaluable:  metaEvaluable,
      resultado,
      pct_cumplimiento: pct,
      semaforo,
      observaciones:   observaciones || null,
      capturado_por:   usuarioId ?? null,
      updated_at:      new Date().toISOString()
    }, { onConflict: 'indicador_id,anio,mes' })
    .select().single()
  if (error) throw error
  return data
}
