import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Lock, LockOpen, Table2, ArrowLeft } from 'lucide-react'
import { C, FS } from '../theme.js'
import { Spinner, ErrMsg, Button } from '../components/ui.jsx'
import FormAccionInforme from '../components/informe/FormAccionInforme.jsx'
import ListaAccionesInforme from '../components/informe/ListaAccionesInforme.jsx'
import {
  getInformeActual, getAccionesInforme, getIndicadoresInforme, getAreasInforme,
  setCapturaAbierta, anioMIRInforme,
} from '../lib/informe.js'
import { generarExcelAccionesInforme } from '../utils/informeAccionesExcel.js'

const fmtPeriodo = (ini, fin) => {
  const f = d => new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${f(ini)} al ${f(fin)}`
}

// Pestaña "Informe": captura de acciones relevantes para el Informe de Gobierno.
// - enlace: su área, mientras la captura esté abierta.
// - admin/planeación: tablero de todas las áreas, revisión, abrir/cerrar
//   captura y Excel consolidado para Comunicación Social.
// - directivo: consulta.
export default function InformeGobierno({ areaIdPropia, isEnlace, isAdmin, isPlaneacion }) {
  const esPlaneacion = isAdmin || isPlaneacion
  const [informe, setInforme] = useState(null)
  const [areas, setAreas] = useState([])
  const [acciones, setAcciones] = useState([])        // todas las visibles (tablero) o las del área
  const [areaSel, setAreaSel] = useState(isEnlace ? areaIdPropia : null)
  const [indicadores, setIndicadores] = useState([])
  const [editando, setEditando] = useState(null)      // null | 'nueva' | acción
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => { if (isEnlace) setAreaSel(areaIdPropia) }, [isEnlace, areaIdPropia])

  const cargar = useCallback(async () => {
    setError(null)
    try {
      const inf = await getInformeActual()
      setInforme(inf)
      if (!inf) return
      const [accs, ars] = await Promise.all([
        getAccionesInforme(inf.id, isEnlace ? { areaId: areaIdPropia } : {}),
        isEnlace ? Promise.resolve([]) : getAreasInforme(),
      ])
      setAcciones(accs)
      setAreas(ars)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [isEnlace, areaIdPropia])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!areaSel || !informe) { setIndicadores([]); return }
    let cancel = false
    getIndicadoresInforme(areaSel, anioMIRInforme(informe))
      .then(d => { if (!cancel) setIndicadores(d) })
      .catch(e => { if (!cancel) setError(e.message) })
    return () => { cancel = true }
  }, [areaSel, informe])

  const resumenAreas = useMemo(() => {
    const porArea = new Map()
    acciones.forEach(a => {
      const r = porArea.get(a.area_id) || { total: 0, incluidas: 0, revisadas: 0 }
      r.total++; if (a.incluir_en_informe) r.incluidas++; if (a.revisada) r.revisadas++
      porArea.set(a.area_id, r)
    })
    return areas
      .map(ar => ({ ...ar, ...(porArea.get(ar.id) || { total: 0, incluidas: 0, revisadas: 0 }) }))
      .sort((x, y) => (x.ejes?.orden ?? 99) - (y.ejes?.orden ?? 99) || x.nombre.localeCompare(y.nombre, 'es'))
  }, [acciones, areas])

  if (error) return <ErrMsg msg={error} onRetry={() => { setLoading(true); cargar() }} />
  if (loading) return <Spinner />
  if (!informe) return <ErrMsg msg="No hay ningún Informe de Gobierno dado de alta." />
  if (isEnlace && !areaIdPropia) return <ErrMsg msg="Tu usuario no tiene un área asignada. Pide a Planeación que te la asigne." />

  const puedeEditar = esPlaneacion || (isEnlace && informe.captura_abierta)
  const accionesArea = acciones.filter(a => a.area_id === areaSel)
  const nombreArea = areas.find(a => a.id === areaSel)?.nombre || accionesArea[0]?.area || ''

  async function toggleCaptura() {
    setOcupado(true); setAviso(null)
    try { await setCapturaAbierta(informe.id, !informe.captura_abierta); await cargar() }
    catch (e) { setAviso(e.message) } finally { setOcupado(false) }
  }

  async function descargarExcel() {
    setOcupado(true); setAviso(null)
    try { await generarExcelAccionesInforme(acciones, informe) }
    catch (e) { setAviso(e.message) } finally { setOcupado(false) }
  }

  function trasGuardar() { setEditando(null); cargar() }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: FS.xxs, letterSpacing: 2, color: C.dorado, textTransform: 'uppercase' }}>
          {informe.numero}º Informe de Gobierno
        </div>
        <div style={{ fontSize: FS.xl, fontWeight: 800, color: C.txt }}>Acciones relevantes</div>
        <div style={{ fontSize: FS.sm, color: C.txtSub }}>
          Periodo: {fmtPeriodo(informe.periodo_inicio, informe.periodo_fin)} ·{' '}
          <span style={{ color: informe.captura_abierta ? C.adecuadoB : C.criticoB, fontWeight: 700 }}>
            Captura {informe.captura_abierta ? 'abierta' : 'cerrada'}
          </span>
        </div>
      </div>

      {esPlaneacion && !areaSel && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Button variant={informe.captura_abierta ? 'ambar' : 'verde'} icon={informe.captura_abierta ? Lock : LockOpen}
            loading={ocupado} loadingLabel="…" onClick={toggleCaptura}>
            {informe.captura_abierta ? 'Cerrar captura' : 'Abrir captura'}
          </Button>
          <Button variant="azul" icon={Table2} loading={ocupado} disabled={!acciones.length} onClick={descargarExcel}>
            Excel para Comunicación Social
          </Button>
        </div>
      )}
      {aviso && <div style={{ color: C.criticoB, fontSize: FS.sm, marginBottom: '0.75rem' }}>{aviso}</div>}

      {!areaSel ? (
        <TableroAreas resumen={resumenAreas} totalAcciones={acciones.length} onElegir={id => { setAreaSel(id); setEditando(null) }} />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isEnlace && (
                <Button variant="azul" size="sm" icon={ArrowLeft} onClick={() => { setAreaSel(null); setEditando(null) }}>Áreas</Button>
              )}
              <div style={{ fontSize: FS.lg, fontWeight: 700, color: C.txt }}>
                {nombreArea} <span style={{ color: C.txtMuted, fontWeight: 400, fontSize: FS.sm }}>· {accionesArea.length} acciones</span>
              </div>
            </div>
            {puedeEditar && !editando && (
              <Button variant="guinda" icon={Plus} onClick={() => setEditando('nueva')}>Nueva acción</Button>
            )}
          </div>

          {isEnlace && !informe.captura_abierta && (
            <div style={{ fontSize: FS.sm, color: C.txtSub, marginBottom: '0.75rem' }}>
              La captura está cerrada: puedes consultar tus acciones, pero ya no modificarlas.
            </div>
          )}

          {editando && (
            <FormAccionInforme key={editando === 'nueva' ? 'nueva' : editando.id}
              informe={informe} areaId={areaSel} indicadores={indicadores}
              accion={editando === 'nueva' ? null : editando}
              onGuardada={trasGuardar} onCancelar={() => setEditando(null)} />
          )}

          <ListaAccionesInforme acciones={accionesArea} puedeEditar={puedeEditar} puedeRevisar={esPlaneacion}
            onEditar={a => setEditando(a)} onCambio={cargar} />
        </div>
      )}
    </div>
  )
}

function TableroAreas({ resumen, totalAcciones, onElegir }) {
  const sinCaptura = resumen.filter(r => r.total === 0).length
  const th = { fontSize: FS.xxs, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${C.border}` }
  const td = { fontSize: FS.sm, color: C.txt, padding: '7px 8px', borderBottom: `1px solid ${C.border}` }
  return (
    <div>
      <div style={{ fontSize: FS.sm, color: C.txtSub, marginBottom: '0.5rem' }}>
        {totalAcciones} acciones capturadas · {resumen.length - sinCaptura} de {resumen.length} áreas con captura
        {sinCaptura > 0 && <span style={{ color: C.riesgoB }}> · {sinCaptura} en cero</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Eje</th><th style={th}>Área</th>
              <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
              <th style={{ ...th, textAlign: 'center' }}>En informe</th>
              <th style={{ ...th, textAlign: 'center' }}>Revisadas</th>
            </tr>
          </thead>
          <tbody>
            {resumen.map(r => (
              <tr key={r.id} onClick={() => onElegir(r.id)} style={{ cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.guinda}22` }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <td style={{ ...td, color: C.txtSub }}>{r.ejes?.codigo || '—'}</td>
                <td style={td}>{r.nombre}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: r.total ? C.txt : C.riesgoB }}>{r.total}</td>
                <td style={{ ...td, textAlign: 'center' }}>{r.incluidas}</td>
                <td style={{ ...td, textAlign: 'center', color: r.total && r.revisadas === r.total ? C.adecuadoB : C.txt }}>{r.revisadas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
