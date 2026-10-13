import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, CheckCircle2, Circle, EyeOff, Eye } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { eliminarAccion, setRevisionAccion, getFotosAcciones, urlsFotos } from '../../lib/informe.js'
import FotosAccion from './FotosAccion.jsx'

const fmtFecha = f => f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const fmtMonto = m => m != null ? Number(m).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : null

function Etiqueta({ children, color }) {
  return (
    <span style={{ fontSize: FS.xxs, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color,
      border: `1px solid ${color}`, borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap' }}>{children}</span>
  )
}

function BotonIcono({ icon: Icon, title, color = C.txtSub, onClick, disabled }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} disabled={disabled}
      style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 6px',
        cursor: disabled ? 'default' : 'pointer', color, display: 'flex', alignItems: 'center', gap: 4, fontSize: FS.xxs, fontFamily: 'inherit' }}>
      <Icon size={14} /> {title}
    </button>
  )
}

// Lista de acciones de un área. puedeEditar = enlace con captura abierta, o
// admin/planeación; puedeRevisar = admin/planeación.
export default function ListaAccionesInforme({ acciones, puedeEditar, puedeRevisar, onEditar, onCambio }) {
  const [borrando, setBorrando] = useState(null)   // id en confirmación
  const [ocupado, setOcupado] = useState(null)
  const [error, setError] = useState(null)
  const [fotos, setFotos] = useState({})          // accion_id → [{...foto, url}]

  const idsClave = acciones.map(a => a.id).join(',')
  const cargarFotos = useCallback(async () => {
    try {
      const filas = await getFotosAcciones(acciones.map(a => a.id))
      const urls = await urlsFotos(filas.map(f => f.storage_path))
      const mapa = {}
      filas.forEach(f => { (mapa[f.accion_id] ||= []).push({ ...f, url: urls[f.storage_path] }) })
      setFotos(mapa)
    } catch (e) { setError(e.message) }
  }, [idsClave]) // eslint-disable-line

  useEffect(() => { cargarFotos() }, [cargarFotos])

  async function ejecutar(id, fn) {
    setOcupado(id); setError(null)
    try { await fn(); onCambio() } catch (e) { setError(e.message) } finally { setOcupado(null); setBorrando(null) }
  }

  if (!acciones.length) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: C.txtMuted, fontSize: FS.sm,
        border: `1px dashed ${C.border}`, borderRadius: 10 }}>
        Todavía no hay acciones capturadas para esta área.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {error && <div style={{ color: C.criticoB, fontSize: FS.sm }}>{error}</div>}
      {acciones.map(a => (
        <div key={a.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.8rem',
          opacity: a.incluir_en_informe ? 1 : 0.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ fontSize: FS.xxs, color: C.txtMuted, marginBottom: 2 }}>
                #{a.id} · {fmtFecha(a.fecha)}{a.coordinacion ? ` · ${a.coordinacion}` : ''}
              </div>
              <div style={{ fontSize: FS.md, fontWeight: 700, color: C.txt }}>{a.accion}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {a.revisada ? <Etiqueta color={C.adecuadoB}>Revisada</Etiqueta> : <Etiqueta color={C.txtMuted}>Sin revisar</Etiqueta>}
              {!a.incluir_en_informe && <Etiqueta color={C.criticoB}>Fuera del informe</Etiqueta>}
            </div>
          </div>

          <div style={{ fontSize: FS.xs, color: C.txtSub, marginTop: 6 }}>
            {a.indicador_id
              ? <>MIR: <b style={{ color: C.txt }}>{a.indicador_clave}</b> {a.indicador} · {a.nivel_mir}{a.programa_pmd ? ` · PMD: ${a.programa_pmd}` : ''}</>
              : <>No vinculada a MIR · <i>{a.justificacion}</i></>}
          </div>

          <div style={{ fontSize: FS.sm, color: C.txt, marginTop: 6, whiteSpace: 'pre-wrap' }}>{a.descripcion}</div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: FS.xs, color: C.txtSub, marginTop: 6, flexWrap: 'wrap' }}>
            {fmtMonto(a.monto) && <span>Monto: <b style={{ color: C.txt }}>{fmtMonto(a.monto)}</b></span>}
            {a.beneficiarios != null && <span>Beneficiarios: <b style={{ color: C.txt }}>{a.beneficiarios.toLocaleString('es-MX')}</b></span>}
            <span>Foto: {a.tiene_foto ? 'Sí' : 'No'} · Video: {a.tiene_video ? 'Sí' : 'No'}</span>
          </div>

          <FotosAccion accion={a} fotos={fotos[a.id] || []} puedeEditar={puedeEditar}
            onCambio={() => { cargarFotos(); onCambio() }} />

          {(puedeEditar || puedeRevisar) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {puedeRevisar && (
                <>
                  <BotonIcono icon={a.revisada ? CheckCircle2 : Circle} color={a.revisada ? C.adecuadoB : C.txtSub}
                    title={a.revisada ? 'Revisada' : 'Marcar revisada'} disabled={ocupado === a.id}
                    onClick={() => ejecutar(a.id, () => setRevisionAccion(a.id, { revisada: !a.revisada }))} />
                  <BotonIcono icon={a.incluir_en_informe ? EyeOff : Eye} disabled={ocupado === a.id}
                    title={a.incluir_en_informe ? 'Quitar del informe' : 'Volver a incluir'}
                    onClick={() => ejecutar(a.id, () => setRevisionAccion(a.id, { incluir_en_informe: !a.incluir_en_informe }))} />
                </>
              )}
              {puedeEditar && (
                <>
                  <BotonIcono icon={Pencil} title="Editar" onClick={() => onEditar(a)} disabled={ocupado === a.id} />
                  {borrando === a.id ? (
                    <>
                      <BotonIcono icon={Trash2} color={C.criticoB} title="Confirmar eliminar" disabled={ocupado === a.id}
                        onClick={() => ejecutar(a.id, () => eliminarAccion(a.id))} />
                      <BotonIcono icon={Circle} title="No" onClick={() => setBorrando(null)} />
                    </>
                  ) : (
                    <BotonIcono icon={Trash2} title="Eliminar" onClick={() => setBorrando(a.id)} disabled={ocupado === a.id} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
