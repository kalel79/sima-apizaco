import { useState, useEffect, useCallback } from 'react'
import {
  getDashboardGlobal, getResumenEjes, getResumenAreas,
  getAlertasLogros, getIndicadores, getIndicadoresLista, getComparativoPMD
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

export function useIndicadoresLista() {
  return useQuery(getIndicadoresLista)
}

export function useComparativoPMD() {
  return useQuery(getComparativoPMD)
}
