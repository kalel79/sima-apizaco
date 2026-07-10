import { useState, useEffect, useCallback } from 'react'
import {
  getIndicadorAreaId, getAvancePorIndicador, listarEvidencias,
  subirEvidencia, borrarEvidencia, getEvidenciaUrl,
} from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C8A96E', doradoLight: '#E2C998',
  bgCard: '#161616', bgPanel: '#1C1C1C',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050', txtSub: '#A09080',
  criticoB: '#C00000',
}

const ICONOS = { pdf: '📕', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', doc: '📄', docx: '📄', xls: '📊', xlsx: '📊' }
function iconoPara(nombre) {
  const ext = nombre?.split('.').pop()?.toLowerCase()
  return ICONOS[ext] || '📎'
}
function formatTamano(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* Sección de evidencias para un indicador+periodo. Resuelve por sí misma
   el area_id del indicador y el avance_id del periodo, así sirve igual
   para Captura (enlace) y para el detalle de Indicadores (admin/planeación). */
export default function SeccionEvidencias({ indicadorId, mes, anio }) {
  const { profile, isAdmin, isPlaneacion, isEnlace, isCoordinador } = useAuth()
  const [areaId,   setAreaId]   = useState(null)
  const [avanceId, setAvanceId] = useState(undefined) // undefined=cargando, null=sin avance
  const [lista,    setLista]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error,    setError]    = useState(null)

  const puedeSubir = isAdmin || isPlaneacion || (isEnlace && areaId != null && profile?.area_id === areaId)
  // subido_por referencia usuarios.id (igual que avances.capturado_por), NO auth.uid()/profile.auth_uid
  const usuarioId = profile?.id

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [area, avId] = await Promise.all([
        getIndicadorAreaId(indicadorId),
        getAvancePorIndicador(indicadorId, mes, anio),
      ])
      setAreaId(area)
      setAvanceId(avId)
      setLista(avId ? await listarEvidencias(avId) : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [indicadorId, mes, anio])

  useEffect(() => { cargar() }, [cargar])

  async function handleArchivos(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length || !avanceId) return
    setSubiendo(true); setError(null)
    try {
      for (const file of files) {
        await subirEvidencia({ avanceId, indicadorId, areaId, anio, mes, file, userId: usuarioId })
      }
      setLista(await listarEvidencias(avanceId))
    } catch (e) {
      setError(e.message)
    } finally {
      setSubiendo(false)
    }
  }

  async function handleDescargar(ev) {
    try {
      const url = await getEvidenciaUrl(ev.url_storage)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleBorrar(ev) {
    if (!window.confirm(`¿Borrar "${ev.nombre_archivo}"?`)) return
    try {
      await borrarEvidencia(ev)
      setLista(l => l.filter(x => x.id !== ev.id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem', marginTop: '0.8rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        📎 Evidencias
      </div>

      {loading && <div style={{ fontSize: '0.78rem', color: C.txtMuted }}>Cargando evidencias…</div>}

      {!loading && avanceId === null && (
        <div style={{ fontSize: '0.78rem', color: C.txtMuted }}>
          Aún no hay un avance capturado en este periodo. Guarda el avance primero para poder subir evidencias.
        </div>
      )}

      {!loading && avanceId && (
        <>
          {puedeSubir && (
            <div style={{ marginBottom: 10 }}>
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
                const puedeBorrar = isAdmin || isPlaneacion || ev.subido_por === usuarioId
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.5rem 0.7rem', marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>{iconoPara(ev.nombre_archivo)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.76rem', color: C.txt, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.nombre_archivo}</div>
                      <div style={{ fontSize: '0.62rem', color: C.txtMuted }}>{formatFecha(ev.created_at)} · {formatTamano(ev.tamano_bytes)}</div>
                    </div>
                    {!isCoordinador && (
                      <button onClick={() => handleDescargar(ev)} title="Descargar"
                        style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem' }}>
                        ⬇️
                      </button>
                    )}
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
