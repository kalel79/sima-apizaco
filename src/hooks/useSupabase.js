import { useState, useEffect, useCallback } from 'react'
import {
  getDashboardGlobal, getResumenEjes, getResumenAreas,
  getAlertasLogros, getIndicadores, getIndicadoresLista, getComparativoPMD,
  getAvanceCapturaAreas, getSparklinesAnio, getAsmConsolidado,
  getAvanceMMLAreas, getAvanceMMLProgramas, getAniosMML
} from '../lib/supabase'

function useQuery(fn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => { run() }, [run])
  return { data, loading, error, refetch: run }
}

export function useDashboardGlobal() {
  return useQuery(getDashboardGlobal)
}

export function useResumenEjes() {
  return useQuery(getResumenEjes)
}

export function useResumenAreas() {
  return useQuery(getResumenAreas)
}

export function useAlertasLogros() {
  return useQuery(getAlertasLogros)
}

export function useIndicadores(filtros = {}) {
  return useQuery(
    () => getIndicadores(filtros),
    [filtros.ejeId, filtros.areaNombre, filtros.semaforo, filtros.busqueda]
  )
}

// `anio` acota la lista al ejercicio (fase_mml_21). Sin él, catálogo completo:
// así CapturaASM y cualquier consumidor que no razone por año siguen igual.
export function useIndicadoresLista(anio = null) {
  return useQuery(() => getIndicadoresLista(anio), [anio])
}

export function useComparativoPMD() {
  return useQuery(getComparativoPMD)
}

export function useAvanceCapturaAreas() {
  return useQuery(getAvanceCapturaAreas)
}

// Avance de captura del Expediente MML de un ejercicio (fase_mml_22).
// Con `anio` en null no se consulta: el año lo resuelve useAniosMML() y hasta
// que llega no hay nada que pedir (un .eq('anio', null) traería basura).
export function useAvanceMMLAreas(anio) {
  return useQuery(() => (anio == null ? Promise.resolve([]) : getAvanceMMLAreas(anio)), [anio])
}

export function useAvanceMMLProgramas(anio) {
  return useQuery(() => (anio == null ? Promise.resolve([]) : getAvanceMMLProgramas(anio)), [anio])
}

export function useAniosMML() {
  return useQuery(getAniosMML)
}

export function useSparklines(anio) {
  return useQuery(() => getSparklinesAnio(anio), [anio])
}

export function useAsmConsolidado(filtros = {}) {
  return useQuery(
    () => getAsmConsolidado(filtros),
    [filtros.ejeCodigo, filtros.areaId, filtros.tipoHallazgo, filtros.estatus]
  )
}
