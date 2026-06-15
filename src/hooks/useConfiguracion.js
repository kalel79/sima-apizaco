import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useConfiguracion() {
  const [mesActual,  setMesActual]  = useState(null)
  const [anioActual, setAnioActual] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('configuracion')
        .select('clave, valor')
      if (err) throw err
      const cfg = Object.fromEntries((data || []).map(r => [r.clave, r.valor]))
      setMesActual( cfg.mes_actual_evaluacion  ? parseInt(cfg.mes_actual_evaluacion,  10) : 5)
      setAnioActual(cfg.anio_actual_evaluacion ? parseInt(cfg.anio_actual_evaluacion, 10) : 2026)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { run() }, [run])

  return {
    mesActual:  mesActual  ?? 5,
    anioActual: anioActual ?? 2026,
    loading,
    error,
    refetch: run,
  }
}
