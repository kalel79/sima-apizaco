// ── Histórico de indicadores (fase 1.2: ficha histórica) ───────────────────────
import { supabase } from './supabaseClient.js'
import { getMetasIndicadorAnio } from './metas.js'
import { getSemaforo } from '../utils/semaforo.js'

const PAGE_SIZE = 500

// Años con datos para un indicador (avances o metas cargadas), ascendente.
export async function getAniosDisponiblesIndicador(indicadorId) {
  const [{ data: avAnios, error: eAv }, { data: metaAnios, error: eMeta }] = await Promise.all([
    supabase.from('avances').select('anio').eq('indicador_id', indicadorId),
    supabase.from('metas').select('anio').eq('indicador_id', indicadorId),
  ])
  if (eAv) throw eAv
  if (eMeta) throw eMeta
  const set = new Set([...(avAnios || []).map(r => r.anio), ...(metaAnios || []).map(r => r.anio)])
  return [...set].sort((a, b) => a - b)
}

// Ficha de un indicador/año: 12 meses (meta de catálogo + avance real; mes sin
// captura = hueco, resultado null) más el acumulado anual (mismo criterio que
// guardarAvance en capturaValidacion.js).
export async function getFichaIndicador(indicadorId, anio) {
  const [metas, { data: avances, error }] = await Promise.all([
    getMetasIndicadorAnio(indicadorId, anio),
    supabase.from('avances')
      .select(`
        mes, resultado, meta_programada, pct_cumplimiento, semaforo, validado, validado_at,
        capturado_por:usuarios!avances_capturado_por_fkey(nombre),
        validado_por:usuarios!avances_validado_por_fkey(nombre)
      `)
      .eq('indicador_id', indicadorId).eq('anio', anio),
  ])
  if (error) throw error

  const avMap = Object.fromEntries((avances || []).map(a => [a.mes, a]))
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const av = avMap[mes] || null
    return {
      mes,
      // meta congelada al capturar si ya hubo avance; si no, la del catálogo
      // (permite ver la meta de meses futuros/sin captura, ej. 2027).
      meta:             av ? Number(av.meta_programada ?? 0) : (metas[mes] ?? null),
      resultado:        av?.resultado ?? null,
      pct_cumplimiento: av?.pct_cumplimiento ?? null,
      semaforo:         av?.semaforo ?? null,
      validado:         av?.validado ?? false,
      validado_at:      av?.validado_at ?? null,
      capturado_por:    av?.capturado_por?.nombre ?? null,
      validado_por:     av?.validado_por?.nombre ?? null,
    }
  })

  let metaAcum = 0, resultAcum = 0
  meses.forEach(m => {
    if (m.resultado != null) {
      metaAcum   += Number(m.meta || 0)
      resultAcum += Number(m.resultado || 0)
    }
  })
  const pctAcumuladoAnual = metaAcum > 0 ? resultAcum / metaAcum : (resultAcum > 0 ? resultAcum : null)
  const semaforoAcumulado = pctAcumuladoAnual == null ? null : getSemaforo(pctAcumuladoAnual)

  return { meses, pctAcumuladoAnual, semaforoAcumulado }
}

// Mapa { indicador_id: [12 resultados|null] } de un año — para los sparklines
// de la lista de Indicadores (una sola consulta paginada, no una por fila).
export async function getSparklinesAnio(anio) {
  let all = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('avances').select('indicador_id,mes,resultado')
      .eq('anio', anio).range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    all = all.concat(data || [])
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  const map = new Map()
  all.forEach(r => {
    if (!map.has(r.indicador_id)) map.set(r.indicador_id, Array(12).fill(null))
    map.get(r.indicador_id)[r.mes - 1] = r.resultado != null ? Number(r.resultado) : null
  })
  return map
}
