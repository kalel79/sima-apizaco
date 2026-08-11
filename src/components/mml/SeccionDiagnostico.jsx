import { useState } from 'react'
import { XCircle, Loader2, Trash2, Plus } from 'lucide-react'
import { upsertDiagnostico, eliminarDiagnostico } from '../../lib/supabase'
import { C } from '../../theme.js'

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.45rem 0.7rem', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }
const lbl = { fontSize: '0.62rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }

export default function SeccionDiagnostico({ programaId, anio, diagnostico, puedeEditar, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  async function handleGuardar(fila, campo, valor) {
    setGuardando(fila.id || 'nuevo'); setError(null)
    try {
      await upsertDiagnostico({
        id: fila.id, programaId, anio, orden: fila.orden,
        situacionActual: campo === 'situacion_actual' ? valor : fila.situacion_actual,
        transformacionDeseada: campo === 'transformacion_deseada' ? valor : fila.transformacion_deseada,
      })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleAgregar() {
    setGuardando('nuevo'); setError(null)
    try {
      await upsertDiagnostico({
        programaId, anio, orden: (diagnostico.length || 0) + 1,
        situacionActual: 'Nuevo problema…', transformacionDeseada: '',
      })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Quitar esta fila del diagnóstico?')) return
    setGuardando(id); setError(null)
    try {
      await eliminarDiagnostico(id)
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Transformación Deseada (PP-FM-03)
      </div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {diagnostico.map(fila => (
        <div key={fila.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.75rem', marginBottom: '0.55rem' }}>
          <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={lbl}>Situación actual</label>
              <textarea rows={2} defaultValue={fila.situacion_actual} disabled={!puedeEditar}
                onBlur={e => { if (e.target.value !== fila.situacion_actual) handleGuardar(fila, 'situacion_actual', e.target.value) }}
                style={{ ...inp, opacity: guardando === fila.id ? 0.5 : 1 }} />
            </div>
            <div>
              <label style={lbl}>Transformación deseada</label>
              <textarea rows={2} defaultValue={fila.transformacion_deseada || ''} disabled={!puedeEditar}
                onBlur={e => { if (e.target.value !== fila.transformacion_deseada) handleGuardar(fila, 'transformacion_deseada', e.target.value) }}
                style={{ ...inp, opacity: guardando === fila.id ? 0.5 : 1 }} />
            </div>
          </div>
          {puedeEditar && (
            <button onClick={() => handleEliminar(fila.id)} disabled={guardando === fila.id}
              style={{ marginTop: 6, background: 'none', border: `1px solid ${C.criticoB}55`, borderRadius: 6, color: C.criticoB, padding: '0.3rem 0.6rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={11}/> Quitar
            </button>
          )}
        </div>
      ))}
      {!diagnostico.length && (
        <div style={{ fontSize: '0.76rem', color: C.txtMuted, padding: '0.75rem', textAlign: 'center' }}>
          Sin diagnóstico capturado todavía.
        </div>
      )}
      {puedeEditar && (
        <button onClick={handleAgregar} disabled={guardando === 'nuevo'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgPanel, border: `1px dashed ${C.border}`, borderRadius: 8, color: C.doradoLight, padding: '0.55rem 0.9rem', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          {guardando === 'nuevo'
            ? <><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Agregando…</>
            : <><Plus size={13}/> Agregar problema/transformación</>}
        </button>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
