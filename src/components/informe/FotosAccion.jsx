import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { subirFotoAccion, borrarFotoAccion, FOTOS_MAX } from '../../lib/informe.js'

// Fotografías de una acción (fase_informe_02). fotos: filas de
// informe_acciones_fotos con su URL firmada en `url`. Las sube el enlace con
// la captura abierta o admin/planeación; el PDF del Informe las usa tal cual.
export default function FotosAccion({ accion, fotos, puedeEditar, onCambio }) {
  const input = useRef(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  const [confirmar, setConfirmar] = useState(null)

  async function subir(files) {
    setOcupado(true); setError(null)
    try {
      let actuales = fotos
      for (const file of [...files].slice(0, FOTOS_MAX - fotos.length)) {
        const nueva = await subirFotoAccion(accion, file, actuales)
        actuales = [...actuales, nueva]
      }
      onCambio()
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
      if (input.current) input.current.value = ''
    }
  }

  async function borrar(f) {
    setOcupado(true); setError(null)
    try { await borrarFotoAccion(f); onCambio() } catch (e) { setError(e.message) } finally { setOcupado(false); setConfirmar(null) }
  }

  if (!fotos.length && !puedeEditar) return null

  const caja = { width: 92, height: 69, borderRadius: 6, overflow: 'hidden', position: 'relative', flex: 'none', background: C.bgPanel, border: `1px solid ${C.border}` }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: FS.xxs, color: C.txtMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        Fotografías para el Informe · {fotos.length}/{FOTOS_MAX}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {fotos.map(f => (
          <div key={f.id} style={caja}>
            {f.url && <img src={f.url} alt={`Foto ${f.orden} de la acción`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            {puedeEditar && (
              confirmar === f.id ? (
                <button onClick={() => borrar(f)} disabled={ocupado}
                  style={{ position: 'absolute', inset: 0, background: '#000b', color: C.criticoB, border: 'none', fontSize: FS.xxs, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Quitar foto
                </button>
              ) : (
                <button title="Quitar foto" aria-label="Quitar foto" onClick={() => setConfirmar(f.id)} disabled={ocupado}
                  style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#000a', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}>
                  <X size={12} />
                </button>
              )
            )}
          </div>
        ))}
        {puedeEditar && fotos.length < FOTOS_MAX && (
          <button onClick={() => input.current?.click()} disabled={ocupado}
            style={{ ...caja, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              border: `1px dashed ${C.dorado}88`, color: C.dorado, cursor: ocupado ? 'default' : 'pointer', fontSize: FS.xxs, fontFamily: 'inherit' }}>
            <ImagePlus size={18} />
            {ocupado ? 'Subiendo…' : 'Agregar foto'}
          </button>
        )}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
          onChange={e => e.target.files?.length && subir(e.target.files)} />
      </div>
      {error && <div style={{ color: C.criticoB, fontSize: FS.xs, marginTop: 4 }}>{error}</div>}
    </div>
  )
}
