import { useState, useEffect, useCallback } from 'react'
import { getAccionesAbiertas, actualizarAvanceAccion } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { C } from '../theme.js'
import { Spinner, ErrMsg } from '../components/ui.jsx'

// Actualización de acciones de mejora abiertas: enlace ve/edita las de su
// propia área; admin/planeación ven/editan todas (mismo alcance que RLS).
export default function SeguimientoASM() {
  const { profile, isEnlace } = useAuth()
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [guardando, setGuardando] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true); setError(null)
    getAccionesAbiertas({ areaId: isEnlace ? profile?.area_id : undefined })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [isEnlace, profile?.area_id])

  useEffect(() => { cargar() }, [cargar])

  async function handleAvance(accionId, porcentajeAvance) {
    setGuardando(accionId); setError(null)
    try {
      await actualizarAvanceAccion(accionId, { porcentajeAvance })
      cargar()
    } catch (e) {
      setError(e.message)
      setGuardando(null)
    }
  }

  async function handleCerrar(accionId) {
    setGuardando(accionId); setError(null)
    try {
      await actualizarAvanceAccion(accionId, { porcentajeAvance: 100, fechaRealCierre: new Date().toISOString().slice(0, 10) })
      cargar()
    } catch (e) {
      setError(e.message)
      setGuardando(null)
    }
  }

  const filas = data || []

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
        📆 Seguimiento de acciones ASM {isEnlace ? '· mi área' : ''}
      </div>

      {loading && <Spinner />}
      {error && <ErrMsg msg={error} onRetry={cargar} />}

      {!loading && !error && (
        <>
          <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: '0.7rem' }}>
            {filas.length} acciones abiertas
          </div>

          {filas.map(f => {
            const vencida = f.dias_al_vencimiento < 0
            const guardandoEsta = guardando === f.accion_id
            return (
              <div key={f.accion_id} style={{ background: C.bgCard, border: `1px solid ${vencida ? C.criticoB : C.border}`, borderRadius: 10, padding: '0.9rem', marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '0.6rem', color: C.txtSub }}>{f.folio} · {f.area_nombre}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.txt, margin: '2px 0 6px' }}>{f.accion}</div>
                <div style={{ fontSize: '0.68rem', color: vencida ? C.criticoB : C.txtMuted, fontWeight: vencida ? 700 : 400, marginBottom: 8 }}>
                  {vencida ? `⚠️ Vencida hace ${Math.abs(f.dias_al_vencimiento)} día(s)` : `Vence en ${f.dias_al_vencimiento} día(s)`} · Compromiso: {f.fecha_compromiso}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <input type="number" min="0" max="100" defaultValue={f.porcentaje_avance}
                    onBlur={e => {
                      const v = Math.max(0, Math.min(100, +e.target.value))
                      if (v !== f.porcentaje_avance) handleAvance(f.accion_id, v)
                    }}
                    disabled={guardandoEsta}
                    style={{ width: 70, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.4rem', fontSize: '0.78rem', textAlign: 'center' }} />
                  <span style={{ fontSize: '0.72rem', color: C.txtMuted }}>% avance</span>
                  <button onClick={() => handleCerrar(f.accion_id)} disabled={guardandoEsta}
                    style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${C.optimoB}`, borderRadius: 6, color: C.optimoB, padding: '0.4rem 0.7rem', fontSize: '0.7rem', cursor: guardandoEsta ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {guardandoEsta ? '⏳' : '✅ Marcar cerrada'}
                  </button>
                </div>
              </div>
            )
          })}

          {!filas.length && (
            <div style={{ fontSize: '0.78rem', color: C.txtMuted, padding: '1rem', textAlign: 'center' }}>
              No hay acciones de mejora abiertas.
            </div>
          )}
        </>
      )}
    </div>
  )
}
