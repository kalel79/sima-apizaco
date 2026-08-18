import { useState, useEffect } from 'react'
import { XCircle, Loader2, Trash2, Plus } from 'lucide-react'
import { upsertArbolNodo, eliminarArbolNodo, actualizarAreaResponsable, getAreasDePrograma } from '../../lib/supabase'
import { C } from '../../theme.js'

const TIPOS_POR_ARBOL = {
  PROBLEMA: ['CENTRAL', 'CAUSA', 'EFECTO'],
  OBJETIVOS: ['OBJETIVO', 'MEDIO', 'FIN'],
}
const TITULO_POR_ARBOL = {
  PROBLEMA: 'Árbol del Problema (PP-FM-04)',
  OBJETIVOS: 'Árbol de Objetivos (PP-FM-07)',
}

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.4rem 0.65rem', fontSize: '0.76rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const sel = { ...inp, resize: undefined }

export default function SeccionArbol({ programaId, anio, arbol, nodos, puedeEditar, puedeAsignarArea, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)
  const [areas, setAreas] = useState([])
  const tipos = TIPOS_POR_ARBOL[arbol]

  // Área responsable (fase_mml_09) solo aplica al Árbol de Objetivos, por
  // Componente (MEDIO hijo directo del Objetivo raíz) — las Actividades la
  // heredan de su Componente, nunca se captura en ellas.
  const raiz = arbol === 'OBJETIVOS' ? nodos.find(n => n.tipo === 'OBJETIVO' && !n.padre_id) : null

  useEffect(() => {
    if (arbol !== 'OBJETIVOS' || !programaId) return
    let cancel = false
    getAreasDePrograma(programaId).then(a => { if (!cancel) setAreas(a) }).catch(() => {})
    return () => { cancel = true }
  }, [arbol, programaId])

  async function handleArea(nodo, areaId) {
    setGuardando(nodo.id); setError(null)
    try {
      await actualizarAreaResponsable(nodo.id, areaId ? +areaId : null)
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleCampo(nodo, campo, valor) {
    setGuardando(nodo.id); setError(null)
    try {
      await upsertArbolNodo({
        id: nodo.id, programaId, anio, arbol,
        tipo: campo === 'tipo' ? valor : nodo.tipo,
        padreId: campo === 'padre_id' ? (valor || null) : nodo.padre_id,
        orden: nodo.orden,
        texto: campo === 'texto' ? valor : nodo.texto,
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
      await upsertArbolNodo({
        programaId, anio, arbol, tipo: tipos[1], padreId: null,
        orden: nodos.length + 1, texto: 'Nuevo nodo…',
      })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Quitar este nodo? (si tiene hijos, quedarán sin padre)')) return
    setGuardando(id); setError(null)
    try {
      await eliminarArbolNodo(id)
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
        {TITULO_POR_ARBOL[arbol]}
      </div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {nodos.map(nodo => (
        <div key={nodo.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.7rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 180px', gap: 8, marginBottom: 6 }}>
            <select value={nodo.tipo} disabled={!puedeEditar}
              onChange={e => handleCampo(nodo, 'tipo', e.target.value)} style={sel}>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea rows={1} defaultValue={nodo.texto} disabled={!puedeEditar}
              onBlur={e => { if (e.target.value !== nodo.texto) handleCampo(nodo, 'texto', e.target.value) }}
              style={{ ...inp, resize: 'vertical' }} />
            <select value={nodo.padre_id || ''} disabled={!puedeEditar}
              onChange={e => handleCampo(nodo, 'padre_id', e.target.value ? +e.target.value : null)} style={sel}>
              <option value="">— sin padre (raíz) —</option>
              {nodos.filter(n => n.id !== nodo.id).map(n => (
                <option key={n.id} value={n.id}>[{n.tipo}] {n.texto.slice(0, 40)}</option>
              ))}
            </select>
          </div>
          {arbol === 'OBJETIVOS' && nodo.tipo === 'MEDIO' && raiz && (
            nodo.padre_id === raiz.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: '0.62rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1 }}>Área responsable:</span>
                {puedeAsignarArea ? (
                  <select value={nodo.area_responsable_id || ''} disabled={guardando === nodo.id}
                    onChange={e => handleArea(nodo, e.target.value)} style={{ ...sel, width: 220 }}>
                    <option value="">— sin asignar —</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: '0.74rem', color: nodo.area_responsable_id ? C.txt : C.txtMuted }}>
                    {areas.find(a => a.id === nodo.area_responsable_id)?.nombre || '— sin asignar —'}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 6 }}>
                Área responsable: hereda de «{nodos.find(n => n.id === nodo.padre_id)?.texto?.slice(0, 40) || '—'}»
              </div>
            )
          )}
          {puedeEditar && (
            <button onClick={() => handleEliminar(nodo.id)} disabled={guardando === nodo.id}
              style={{ background: 'none', border: `1px solid ${C.criticoB}55`, borderRadius: 6, color: C.criticoB, padding: '0.3rem 0.6rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={11}/> Quitar
            </button>
          )}
        </div>
      ))}
      {!nodos.length && (
        <div style={{ fontSize: '0.76rem', color: C.txtMuted, padding: '0.75rem', textAlign: 'center' }}>
          Sin árbol capturado todavía.
        </div>
      )}
      {puedeEditar && (
        <button onClick={handleAgregar} disabled={guardando === 'nuevo'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgPanel, border: `1px dashed ${C.border}`, borderRadius: 8, color: C.doradoLight, padding: '0.55rem 0.9rem', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          {guardando === 'nuevo'
            ? <><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Agregando…</>
            : <><Plus size={13}/> Agregar nodo</>}
        </button>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
