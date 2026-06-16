import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDatosReporte() {
  const [global_, setGlobal]             = useState(null)
  const [ejes, setEjes]                  = useState([])
  const [indicadoresPorEje, setIndPorEje] = useState({})
  const [loading, setLoading]            = useState(false)
  const [error, setError]                = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [gRes, ejesRes, indRes] = await Promise.all([
        supabase.from('v_dashboard_global').select('*').single(),
        supabase.from('v_resumen_ejes').select('*').order('orden', { ascending: true }),
        supabase.from('v_indicadores_acum').select('*').range(0, 999),
      ])
      if (gRes.error)    throw gRes.error
      if (ejesRes.error) throw ejesRes.error
      if (indRes.error)  throw indRes.error

      const porEje = {}
      ;(indRes.data || []).forEach(ind => {
        if (!porEje[ind.eje_codigo]) porEje[ind.eje_codigo] = []
        porEje[ind.eje_codigo].push(ind)
      })

      setGlobal(gRes.data)
      setEjes(ejesRes.data || [])
      setIndPorEje(porEje)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { global: global_, ejes, indicadoresPorEje, loading, error, cargar }
}
