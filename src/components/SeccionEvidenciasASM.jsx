import { useState, useEffect, useCallback } from 'react'
import {
  listarEvidenciasAsm, subirEvidenciaAsm, borrarEvidenciaAsm, getEvidenciaAsmUrl,
} from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { C } from '../theme.js'

const ICONOS = { pdf: '📕', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', doc: '📄', docx: '📄', xls: '📊', xlsx: '📊' }
function iconoPara(nombre) {
  const ext = nombre?.split('.').pop()?.toLowerCase()
  return ICONOS[ext] || '📎'
}
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* Evidencias de un hallazgo ASM. areaId es el área del indicador ligado al
   hallazgo (para construir el path de Storage y decidir quién puede subir). */
export default function SeccionEvidenciasASM({ hallazgoId, areaId }) {
  const { user, profile, isAdmin, isPlaneacion, isEnlace } = useAuth()
  const [lista,    setLista]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error,    setError]    = useState(null)
  const [medioVerificacion, setMedioVerificacion] = useState('')

  const puedeSubir = isAdmin || isPlaneacion || (isEnlace && profile?.area_id === areaId)

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setLista(await listarEvidenciasAsm(hallazgoId))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [hallazgoId])

  useEffect(() => { cargar() }, [cargar])

  async function handleArchivos(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setSubiendo(true); setError(null)
    try {
      for (const file of files) {
        await subirEvidenciaAsm({ hallazgoId, areaId, file, medioVerificacion })
      }
      setLista(await listarEvidenciasAsm(hallazgoId))
    } catch (e) {
      setError(e.message)
    } finally {
      setSubiendo(false)
    }
  }

  async function handleDescargar(ev) {
    try {
      const url = await getEvidenciaAsmUrl(ev.archivo_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleBorrar(ev) {
    if (!window.confirm('¿Borrar esta evidencia?')) return
    try {
      await borrarEvidenciaAsm(ev)
      setLista(l => l.filter(x => x.id !== ev.id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        📎 Evidencias del hallazgo
      </div>

      {loading && <div style={{ fontSize: '0.78rem', color: C.txtMuted }}>Cargando evidencias…</div>}

      {!loading && (
        <>
          {puedeSubir && (
            <div style={{ marginBottom: 10 }}>
              <input
                placeholder="Medio de verificación (opcional)"
                value={medioVerificacion}
                onChange={e => setMedioVerificacion(e.target.value)}
                style={{ width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.5rem 0.75rem', fontSize: '0.78rem', marginBottom: 8, boxSizing: 'border-box' }}
              />
              <label style={{
                display: 'inline-block', background: subiendo ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
                border: 'none', borderRadius: 8, color: C.txt, padding: '0.55rem 0.9rem', fontSize: '0.78rem',
                fontWeight: 600, cursor: subiendo ? 'not-allowed' : 'pointer',
              }}>
                {subiendo ? '⏳ Subiendo…' : '📤 Subir evidencia'}
                <input type="file" multiple disabled={subiendo}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleArchivos} style={{ display: 'none' }} />
              </label>
              <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 4 }}>
                PDF, JPG, PNG, Word o Excel · máx. 10 MB por archivo
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB }}>
              ❌ {error}
            </div>
          )}

          {lista.length === 0
            ? <div style={{ fontSize: '0.74rem', color: C.txtMuted }}>Sin evidencias subidas todavía.</div>
            : lista.map(ev => {
                const nombre = ev.archivo_url.split('/').pop()
                const puedeBorrar = isAdmin || isPlaneacion || ev.uploaded_by === user?.id
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.7rem', marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>{iconoPara(nombre)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.76rem', color: C.txt, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</div>
                      <div style={{ fontSize: '0.62rem', color: C.txtMuted }}>
                        {formatFecha(ev.uploaded_at)}{ev.medio_verificacion ? ` · ${ev.medio_verificacion}` : ''}
                      </div>
                    </div>
                    <button onClick={() => handleDescargar(ev)} title="Descargar"
                      style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem' }}>
                      ⬇️
                    </button>
                    {puedeBorrar && (
                      <button onClick={() => handleBorrar(ev)} title="Borrar"
                        style={{ background: 'none', border: `1px solid ${C.criticoB}55`, borderRadius: 6, color: C.criticoB, padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                )
              })
          }
        </>
      )}
    </div>
  )
}
