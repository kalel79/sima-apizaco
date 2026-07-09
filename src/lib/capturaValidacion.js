// ── Captura de avances, validación mensual y correcciones (con audit_log) ─────
import { supabase } from './supabaseClient.js'
import { getMetasIndicadorAnio } from './metas.js'

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

// Enlace de Área asignado a una área (rol_id=3), para regenerar el acuse
// con el nombre correcto cuando quien lo genera es admin/planeación.
export async function getEnlaceDeArea(areaId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('area_id', areaId)
    .eq('rol_id', 3)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.nombre ?? null
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

/* ── Corrección/desvalidación de avances (admin/planeación) ─────────────── */

// Inserta una fila de trazabilidad en audit_log (esquema JSONB: datos_antes/datos_nuevo).
export async function registrarAuditLog({ tabla, accion, registro_id, usuario_id, datos_antes, datos_nuevo }) {
  const { error } = await supabase.from('audit_log').insert({
    tabla, accion, registro_id: String(registro_id), usuario_id, datos_antes, datos_nuevo,
  })
  if (error) throw error
}

// Todos los indicadores de un área con su avance del mes (incluye validado=false
// y los que aún no tienen avance capturado), para el panel "Ver indicadores".
export async function getAvancesDetalleArea(areaId, mes, anio) {
  const [{ data: inds, error: eInd }, { data: avs, error: eAv }] = await Promise.all([
    supabase.from('indicadores').select('id, clave, nombre, nivel_mir').eq('area_id', areaId).order('clave'),
    supabase.from('avances')
      .select('id, indicador_id, meta_programada, resultado, pct_cumplimiento, semaforo, validado, validado_at')
      .eq('mes', mes).eq('anio', anio),
  ])
  if (eInd) throw eInd
  if (eAv) throw eAv

  const avMap = Object.fromEntries((avs || []).map(a => [a.indicador_id, a]))
  return (inds || []).map(ind => {
    const av = avMap[ind.id] || {}
    return {
      avance_id:         av.id ?? null,
      indicador_id:      ind.id,
      clave:             ind.clave || '-',
      nombre:            ind.nombre || '',
      nivel_mir:         ind.nivel_mir || '-',
      meta_programada:   av.meta_programada ?? null,
      resultado:         av.resultado ?? null,
      pct_cumplimiento:  av.pct_cumplimiento ?? null,
      semaforo:          av.semaforo ?? null,
      validado:          av.validado ?? false,
      validado_at:       av.validado_at ?? null,
    }
  })
}

// Recalcula pct_cumplimiento/semaforo sustituyendo el mes corregido dentro del
// acumulado ENE→mes del indicador (misma metodología de guardarAvance), y
// corrige el avance validado dejando trazabilidad en audit_log.
export async function corregirAvance(avanceId, nuevoResultado, nuevaMeta, justificacion, usuarioId) {
  const { data: actual, error: eActual } = await supabase
    .from('avances')
    .select('indicador_id, anio, mes, meta_programada, resultado, pct_cumplimiento, semaforo, validado')
    .eq('id', avanceId).single()
  if (eActual) throw eActual

  const { data: acumRows, error: eAcum } = await supabase
    .from('avances')
    .select('id, meta_programada, resultado')
    .eq('indicador_id', actual.indicador_id).eq('anio', actual.anio)
    .gte('mes', 1).lte('mes', actual.mes)
  if (eAcum) throw eAcum

  const metaNueva = (nuevaMeta === null || nuevaMeta === undefined || nuevaMeta === '')
    ? actual.meta_programada : parseFloat(nuevaMeta)

  let metaAcum = 0, resultAcum = 0
  ;(acumRows || []).forEach(row => {
    if (row.id === avanceId) {
      metaAcum   += parseFloat(metaNueva ?? 0)
      resultAcum += parseFloat(nuevoResultado ?? 0)
    } else {
      metaAcum   += parseFloat(row.meta_programada ?? 0)
      resultAcum += parseFloat(row.resultado ?? 0)
    }
  })

  const pct = metaAcum > 0 ? resultAcum / metaAcum : (resultAcum > 0 ? resultAcum : null)
  const semaforo = pct === null ? null
    : pct >= 1.10 ? 'ÓPTIMO'
    : pct >= 0.90 ? 'ADECUADO'
    : pct >= 0.70 ? 'RIESGO'
    : 'CRÍTICO'

  const { error: eUpdate } = await supabase
    .from('avances')
    .update({
      resultado:        nuevoResultado,
      meta_programada:  metaNueva,
      pct_cumplimiento: pct,
      semaforo,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', avanceId)
  if (eUpdate) throw eUpdate

  await registrarAuditLog({
    tabla: 'avances',
    accion: 'CORRECCION_ADMIN',
    registro_id: avanceId,
    usuario_id: usuarioId,
    datos_antes: {
      resultado: actual.resultado, meta_programada: actual.meta_programada,
      pct_cumplimiento: actual.pct_cumplimiento, semaforo: actual.semaforo, validado: actual.validado,
    },
    datos_nuevo: {
      resultado: nuevoResultado, meta_programada: metaNueva,
      pct_cumplimiento: pct, semaforo, validado: actual.validado, justificacion,
    },
  })
}

// Devuelve el avance al enlace para que lo recapture (conserva el valor, solo
// desbloquea el registro), dejando el motivo en audit_log.
export async function desvalidarAvance(avanceId, motivo, usuarioId) {
  const { data: actual, error: eActual } = await supabase
    .from('avances')
    .select('resultado, meta_programada, pct_cumplimiento, semaforo, validado')
    .eq('id', avanceId).single()
  if (eActual) throw eActual

  const { error: eUpdate } = await supabase
    .from('avances')
    .update({ validado: false, validado_at: null, validado_por: null, updated_at: new Date().toISOString() })
    .eq('id', avanceId)
  if (eUpdate) throw eUpdate

  await registrarAuditLog({
    tabla: 'avances',
    accion: 'DESVALIDACION_ADMIN',
    registro_id: avanceId,
    usuario_id: usuarioId,
    datos_antes: {
      resultado: actual.resultado, meta_programada: actual.meta_programada,
      pct_cumplimiento: actual.pct_cumplimiento, semaforo: actual.semaforo, validado: true,
    },
    datos_nuevo: {
      resultado: actual.resultado, meta_programada: actual.meta_programada,
      pct_cumplimiento: actual.pct_cumplimiento, semaforo: actual.semaforo, validado: false, justificacion: motivo,
    },
  })
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
  // Leer metas del catálogo (año correspondiente) y avances previos (meses 1..mes-1) en paralelo
  const [
    metasIndicador,
    { data: prevAvances, error: avError  },
  ] = await Promise.all([
    getMetasIndicadorAnio(indicadorId, anio),
    supabase.from('avances').select('mes,resultado').eq('indicador_id', indicadorId).eq('anio', anio).lt('mes', mes),
  ])
  if (avError)  throw avError

  // meta del mes actual (del catálogo)
  const metaMes = parseFloat(metasIndicador[mes] ?? 0)

  // meta_evaluable: meta del mes; si meta_mes=0 pero hay resultado, usar 1 (regla meta=1)
  const metaEvaluable = (metaMes === 0 && resultado > 0) ? 1 : metaMes

  // Acumulado ene→M: suma de metas del catálogo
  let metaAcum = 0
  for (let m = 1; m <= mes; m++) metaAcum += parseFloat(metasIndicador[m] ?? 0)

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
