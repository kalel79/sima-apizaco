import { useState } from 'react'
import { XCircle, Loader2, Zap, Trash2, Plus } from 'lucide-react'
import { upsertAccionAlternativa, eliminarAccionAlternativa, generarAccionesDesdeMedios } from '../../lib/supabase'
import { C } from '../../theme.js'

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.4rem 0.65rem', fontSize: '0.76rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }

// nodosMedio: Medios de primer nivel del árbol de objetivos (candidatos a
// Componente) — decisión 2026-07-23: Acciones/Alternativas se deriva de ahí,
// no se captura suelta.
export default function SeccionAccionesAlternativas({ programaId, anio, acciones, nodosMedio, puedeEditar, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  const mediosSinAccion = (nodosMedio || []).filter(m => !acciones.some(a => a.medio_id === m.id))

  async function handleGenerar() {
    setGuardando('generar'); setError(null)
    try {
      await generarAccionesDesdeMedios({ programaId, anio, medios: nodosMedio, accionesExistentes: acciones })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleCampo(fila, campo, valor) {
    setGuardando(fila.id); setError(null)
    try {
      await upsertAccionAlternativa({
        id: fila.id, programaId, anio, orden: fila.orden,
        medioId: campo === 'medio_id' ? valor : fila.medio_id,
        texto: campo === 'texto' ? valor : fila.texto,
        seleccionada: campo === 'seleccionada' ? valor : fila.seleccionada,
        justificacion: campo === 'justificacion' ? valor : fila.justificacion,
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
      await upsertAccionAlternativa({ programaId, anio, orden: acciones.length + 1, texto: 'Nueva acción…', seleccionada: false })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Quitar esta acción?')) return
    setGuardando(id); setError(null)
    try {
      await eliminarAccionAlternativa(id)
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
        Acciones (PP-FM-08) y Alternativas (PP-FM-09)
      </div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {puedeEditar && mediosSinAccion.length > 0 && (
        <button onClick={handleGenerar} disabled={guardando === 'generar'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', background: `${C.dorado}22`, border: `1px solid ${C.dorado}`, borderRadius: 8, color: C.doradoLight, padding: '0.6rem 0.9rem', fontSize: '0.76rem', fontWeight: 700, cursor: guardando === 'generar' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: '0.8rem' }}>
          {guardando === 'generar'
            ? <><Loader2 size={14} style={{animation:'spin 0.8s linear infinite'}}/> Generando…</>
            : <><Zap size={14}/> Generar {mediosSinAccion.length} acción(es) pendiente(s) de los Medios</>}
        </button>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {acciones.map(fila => (
        <div key={fila.id} style={{ background: C.bgCard, border: `1px solid ${fila.seleccionada ? C.optimoB : C.border}`, borderRadius: 8, padding: '0.7rem', marginBottom: '0.5rem' }}>
          <textarea rows={2} defaultValue={fila.texto} disabled={!puedeEditar}
            onBlur={e => { if (e.target.value !== fila.texto) handleCampo(fila, 'texto', e.target.value) }}
            style={{ ...inp, marginBottom: 6 }} />
          <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
            <select value={fila.medio_id || ''} disabled={!puedeEditar}
              onChange={e => handleCampo(fila, 'medio_id', e.target.value ? +e.target.value : null)} style={inp}>
              <option value="">— sin medio asociado —</option>
              {(nodosMedio || []).map(m => <option key={m.id} value={m.id}>{m.texto.slice(0, 50)}</option>)}
            </select>
            <input placeholder="Justificación (opcional)" defaultValue={fila.justificacion || ''} disabled={!puedeEditar}
              onBlur={e => { if (e.target.value !== fila.justificacion) handleCampo(fila, 'justificacion', e.target.value) }}
              style={inp} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: C.txtSub, cursor: puedeEditar ? 'pointer' : 'default' }}>
            <input type="checkbox" checked={!!fila.seleccionada} disabled={!puedeEditar}
              onChange={e => handleCampo(fila, 'seleccionada', e.target.checked)} />
            Alternativa seleccionada
          </label>
          {puedeEditar && (
            <button onClick={() => handleEliminar(fila.id)} disabled={guardando === fila.id}
              style={{ marginTop: 6, background: 'none', border: `1px solid ${C.criticoB}55`, borderRadius: 6, color: C.criticoB, padding: '0.3rem 0.6rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={11}/> Quitar
            </button>
          )}
        </div>
      ))}
      {!acciones.length && (
        <div style={{ fontSize: '0.76rem', color: C.txtMuted, padding: '0.75rem', textAlign: 'center' }}>
          Sin acciones/alternativas capturadas todavía.
        </div>
      )}
      {puedeEditar && (
        <button onClick={handleAgregar} disabled={guardando === 'nuevo'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgPanel, border: `1px dashed ${C.border}`, borderRadius: 8, color: C.doradoLight, padding: '0.55rem 0.9rem', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          {guardando === 'nuevo'
            ? <><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Agregando…</>
            : <><Plus size={13}/> Agregar acción</>}
        </button>
      )}
    </div>
  )
}
