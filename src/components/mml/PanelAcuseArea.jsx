import { useState, useEffect, useMemo, useCallback } from 'react'
import { FileCheck2, Save, CheckCircle2, AlertTriangle } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { Button, Input } from '../ui.jsx'
import { estadoAcuseArea, getAreasAcuse, guardarTitularArea, nombreCompleto } from '../../lib/acuseMML.js'
import { generarAcuseMIRPOA } from '../../utils/acuseMIRPOA.js'

// Acuse de captura de MIR y POA por área (pestaña Metas/POA del Expediente).
// - enlace: solo su área; firma con su propio perfil.
// - admin/planeación: todas las áreas del programa, y pueden regenerar el
//   acuse de cualquiera con la firma del enlace de esa área.
// El botón se habilita solo con el área al 100%; si no, lista lo que falta.
export default function PanelAcuseArea({ datos, anio, profile, isEnlace, isAdmin, isPlaneacion }) {
  const esPlaneacion = isAdmin || isPlaneacion
  const miAreaId = profile?.area_id ?? null

  const areaIds = useMemo(() => {
    if (isEnlace) return miAreaId ? [miAreaId] : []
    const ids = new Set((datos.mirNiveles || []).map(n => n.areaEfectivaId).filter(id => id != null))
    return [...ids]
  }, [datos, isEnlace, miAreaId])

  const [areas, setAreas] = useState([])
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setError(null)
    try { setAreas(await getAreasAcuse(areaIds, { conEnlaces: esPlaneacion })) }
    catch (e) { setError(e.message) }
  }, [areaIds, esPlaneacion])

  useEffect(() => { cargar() }, [cargar])

  if (!areaIds.length) return null

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.dorado}55`, borderRadius: 12, padding: '0.9rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <FileCheck2 size={18} color={C.dorado} />
        <div style={{ fontSize: FS.lg, fontWeight: 700, color: C.txt }}>Acuse de captura MIR y POA {anio}</div>
      </div>
      <div style={{ fontSize: FS.xs, color: C.txtSub, marginBottom: '0.75rem' }}>
        PDF con la MIR y el POA de los Componentes y Actividades {isEnlace ? 'de tu área' : 'de cada área'}, firmado por el enlace y el
        titular. Se habilita cuando todos sus niveles están completos. Es constancia: no bloquea cambios posteriores.
      </div>
      {error && <div style={{ color: C.criticoB, fontSize: FS.sm, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {areas.map(a => (
          <FilaAcuse key={a.id} area={a} datos={datos} anio={anio} profile={profile}
            isEnlace={isEnlace} esPlaneacion={esPlaneacion} onTitularGuardado={cargar} />
        ))}
      </div>
    </div>
  )
}

function FilaAcuse({ area, datos, anio, profile, isEnlace, esPlaneacion, onTitularGuardado }) {
  const estado = useMemo(() => estadoAcuseArea(datos.mirNiveles, area.id), [datos, area.id])
  const [titular, setTitular] = useState({ nombre: area.titular?.nombre || '', cargo: area.titular?.cargo || '' })
  const [enlaceSel, setEnlaceSel] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    setTitular({ nombre: area.titular?.nombre || '', cargo: area.titular?.cargo || '' })
  }, [area.titular])

  const titularCambio = titular.nombre.trim() !== (area.titular?.nombre || '') || titular.cargo.trim() !== (area.titular?.cargo || '')
  const enlace = isEnlace
    ? { nombre: nombreCompleto(profile), cargo: profile?.cargo || 'Enlace del área' }
    : area.enlaces[enlaceSel] ? { nombre: nombreCompleto(area.enlaces[enlaceSel]), cargo: area.enlaces[enlaceSel].cargo || 'Enlace del área' } : null

  async function handleTitular() {
    if (!titular.nombre.trim()) { setMsg('Escribe el nombre del titular.'); return }
    setGuardando(true); setMsg(null)
    try { await guardarTitularArea(area.id, titular); await onTitularGuardado() }
    catch (e) { setMsg(e.message) } finally { setGuardando(false) }
  }

  async function handleAcuse() {
    setGenerando(true); setMsg(null)
    try {
      generarAcuseMIRPOA({
        datos, anio, area: { id: area.id, nombre: area.nombre }, niveles: estado.niveles,
        enlace, titular: area.titular, generadoPor: nombreCompleto(profile),
      })
    } catch (e) { setMsg(e.message) } finally { setGenerando(false) }
  }

  const bloqueoTitular = !area.titular || titularCambio
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.7rem', background: C.bgPanel }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: FS.md, fontWeight: 700, color: C.txt }}>
          {area.nombre} <span style={{ fontWeight: 400, color: C.txtMuted, fontSize: FS.xs }}>· {estado.niveles.length} niveles</span>
        </div>
        {estado.completo
          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: FS.xs, color: C.adecuadoB, fontWeight: 700 }}><CheckCircle2 size={14} /> MIR y POA completos</span>
          : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: FS.xs, color: C.riesgoB, fontWeight: 700 }}><AlertTriangle size={14} /> {estado.pendientes.length} nivel{estado.pendientes.length === 1 ? '' : 'es'} con pendientes</span>}
      </div>

      {!estado.completo && (
        <ul style={{ margin: '6px 0 0', paddingLeft: '1.1rem', fontSize: FS.xs, color: C.txtSub }}>
          {estado.pendientes.map(p => <li key={p.etiqueta}><b style={{ color: C.txt }}>{p.etiqueta}:</b> falta {p.faltan.join(', ')}</li>)}
        </ul>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'end' }}>
        <Input label="Titular del área (firma Vo. Bo.)" value={titular.nombre} maxLength={200}
          onChange={e => setTitular(t => ({ ...t, nombre: e.target.value }))} />
        <Input label="Cargo del titular" value={titular.cargo} maxLength={200}
          onChange={e => setTitular(t => ({ ...t, cargo: e.target.value }))} />
        {titularCambio && (
          <Button variant="azul" size="sm" icon={Save} loading={guardando} loadingLabel="Guardando…" onClick={handleTitular}>Guardar titular</Button>
        )}
      </div>

      {esPlaneacion && area.enlaces.length > 1 && (
        <div style={{ marginTop: '0.5rem', fontSize: FS.xs, color: C.txtSub }}>
          Firma del enlace:{' '}
          <select value={enlaceSel} onChange={e => setEnlaceSel(+e.target.value)}
            style={{ background: C.bgCard, color: C.txt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 6px', fontFamily: 'inherit' }}>
            {area.enlaces.map((u, i) => <option key={i} value={i}>{nombreCompleto(u)}</option>)}
          </select>
        </div>
      )}
      {esPlaneacion && area.enlaces.length === 0 && (
        <div style={{ marginTop: '0.5rem', fontSize: FS.xs, color: C.riesgoB }}>El área no tiene enlace activo: la firma del enlace saldrá en blanco.</div>
      )}

      {msg && <div style={{ color: C.criticoB, fontSize: FS.sm, marginTop: 6 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: '0.6rem', flexWrap: 'wrap' }}>
        {estado.completo && bloqueoTitular && (
          <span style={{ fontSize: FS.xs, color: C.txtMuted }}>Guarda el titular para descargar el acuse.</span>
        )}
        <Button variant="guinda" icon={FileCheck2} loading={generando} disabled={!estado.completo || bloqueoTitular} onClick={handleAcuse}>
          Descargar acuse
        </Button>
      </div>
    </div>
  )
}
