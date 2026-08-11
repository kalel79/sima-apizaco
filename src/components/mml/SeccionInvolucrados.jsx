import { useState } from 'react'
import { XCircle, Trash2, Plus } from 'lucide-react'
import { upsertInvolucrado, eliminarInvolucrado } from '../../lib/supabase'
import { C } from '../../theme.js'

const CATEGORIAS = ['BENEFICIARIO', 'EJECUTOR', 'OPOSITOR', 'INDIFERENTE']
const CATEGORIA_LABEL = { BENEFICIARIO: 'Beneficiarios', EJECUTOR: 'Ejecutores', OPOSITOR: 'Opositores', INDIFERENTE: 'Indiferentes' }

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.4rem 0.65rem', fontSize: '0.76rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

export default function SeccionInvolucrados({ programaId, anio, involucrados, puedeEditar, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  async function handleActor(fila, texto) {
    setGuardando(fila.id); setError(null)
    try {
      await upsertInvolucrado({ id: fila.id, programaId, anio, categoria: fila.categoria, actor: texto, orden: fila.orden })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleAgregar(categoria) {
    const enEsaCategoria = involucrados.filter(i => i.categoria === categoria)
    setGuardando('nuevo-' + categoria); setError(null)
    try {
      await upsertInvolucrado({ programaId, anio, categoria, actor: 'Nuevo actor…', orden: enEsaCategoria.length + 1 })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Quitar este actor?')) return
    setGuardando(id); setError(null)
    try {
      await eliminarInvolucrado(id)
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
        Mapa de Relaciones / Análisis de Involucrados (PP-FM-05)
      </div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.7rem' }}>
        {CATEGORIAS.map(cat => {
          const filas = involucrados.filter(i => i.categoria === cat)
          return (
            <div key={cat} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.7rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.doradoLight, marginBottom: 6 }}>{CATEGORIA_LABEL[cat]}</div>
              {filas.map(fila => (
                <div key={fila.id} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                  <input defaultValue={fila.actor} disabled={!puedeEditar}
                    onBlur={e => { if (e.target.value !== fila.actor) handleActor(fila, e.target.value) }}
                    style={{ ...inp, opacity: guardando === fila.id ? 0.5 : 1 }} />
                  {puedeEditar && (
                    <button onClick={() => handleEliminar(fila.id)} disabled={guardando === fila.id}
                      style={{ background: 'none', border: `1px solid ${C.criticoB}55`, borderRadius: 6, color: C.criticoB, padding: '0.3rem 0.4rem', fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex' }}>
                      <Trash2 size={12}/>
                    </button>
                  )}
                </div>
              ))}
              {!filas.length && <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 6 }}>Sin actores.</div>}
              {puedeEditar && (
                <button onClick={() => handleAgregar(cat)} disabled={guardando === 'nuevo-' + cat}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.35rem 0.6rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                  <Plus size={12}/> Agregar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
