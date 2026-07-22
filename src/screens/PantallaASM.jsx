import { useState, useMemo } from 'react'
import { useAsmConsolidado } from '../hooks/useSupabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { generarExcelASM } from '../utils/reportesExcelASM'
import { useAuth } from '../hooks/useAuth'
import { C } from '../theme.js'
import { Spinner, ErrMsg, KPI } from '../components/ui.jsx'
import CapturaASM from './CapturaASM.jsx'
import SeguimientoASM from './SeguimientoASM.jsx'

const TIPOS = ['CRÍTICO', 'RIESGO', 'ADECUADO', 'ÓPTIMO']
const ESTATUS = ['No Iniciado', 'En Proceso', 'Cerrado', 'Atrasado']
const SEM_COLOR = { 'ÓPTIMO': C.optimoB, 'ADECUADO': C.adecuadoB, 'RIESGO': C.riesgoB, 'CRÍTICO': C.criticoB }

export default function PantallaASM() {
  const { isAdmin, isPlaneacion, isEnlace } = useAuth()
  const puedeCapturarASM = isAdmin || isPlaneacion || isEnlace
  const [tab, setTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', l: '📊 Dashboard' },
    ...(puedeCapturarASM ? [
      { id: 'captura', l: '📝 Registrar hallazgo' },
      { id: 'seguimiento', l: '📆 Seguimiento' },
    ] : []),
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? C.guinda : C.bgPanel, border: `1px solid ${tab === t.id ? C.guinda : C.border}`,
              borderRadius: 8, color: tab === t.id ? '#fff' : C.txtSub, padding: '0.5rem 0.85rem', fontSize: '0.74rem',
              fontWeight: tab === t.id ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer',
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardASM />}
      {tab === 'captura' && puedeCapturarASM && <CapturaASM />}
      {tab === 'seguimiento' && puedeCapturarASM && <SeguimientoASM />}
    </div>
  )
}

function DashboardASM() {
  const [ejeCodigo, setEjeCodigo] = useState('')
  const [areaId, setAreaId] = useState('')
  const [tipoHallazgo, setTipoHallazgo] = useState('')
  const [estatus, setEstatus] = useState('')
  const filtros = useMemo(() => ({
    ejeCodigo: ejeCodigo || undefined,
    areaId: areaId ? +areaId : undefined,
    tipoHallazgo: tipoHallazgo || undefined,
    estatus: estatus || undefined,
  }), [ejeCodigo, areaId, tipoHallazgo, estatus])

  const { data, loading, error, refetch } = useAsmConsolidado(filtros)
  const { mesActual, anioActual } = useConfiguracionCtx()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  const [exportando, setExportando] = useState(false)

  const filas = data || []

  const hallazgosUnicos = useMemo(() => {
    const map = new Map()
    filas.forEach(f => map.set(f.hallazgo_id, f))
    return Array.from(map.values())
  }, [filas])

  const resumen = useMemo(() => {
    const total = hallazgosUnicos.length
    const conteo = { 'CRÍTICO': 0, 'RIESGO': 0, 'ADECUADO': 0, 'ÓPTIMO': 0 }
    hallazgosUnicos.forEach(h => { if (conteo[h.tipo_hallazgo] != null) conteo[h.tipo_hallazgo]++ })
    const totalAcciones = filas.length
    const atrasadas = filas.filter(f => f.estatus === 'Atrasado').length
    return {
      total,
      pct: Object.fromEntries(TIPOS.map(t => [t, total ? Math.round((conteo[t] / total) * 100) : 0])),
      pctAtrasadas: totalAcciones ? Math.round((atrasadas / totalAcciones) * 100) : 0,
    }
  }, [filas, hallazgosUnicos])

  // Catálogos de filtro derivados de los datos ya cargados (sin ida y vuelta extra).
  const areasDisponibles = useMemo(() => {
    const map = new Map()
    filas.forEach(f => { if (f.area_id != null) map.set(f.area_id, f.area_nombre) })
    return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [filas])
  const ejesDisponibles = useMemo(() => {
    const map = new Map()
    filas.forEach(f => { if (f.eje_codigo) map.set(f.eje_codigo, f.eje_nombre) })
    return Array.from(map, ([codigo, nombre]) => ({ codigo, nombre }))
  }, [filas])

  const inp = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.45rem 0.7rem', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }

  async function handleExportar() {
    setExportando(true)
    try {
      await generarExcelASM(filas, periodoLabel)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
        <KPI label="Hallazgos totales" value={resumen.total} icon="📌" color={C.dorado} />
        <KPI label="% CRÍTICO" value={`${resumen.pct['CRÍTICO']}%`} icon="🔴" color={C.criticoB} />
        <KPI label="% RIESGO" value={`${resumen.pct['RIESGO']}%`} icon="🟡" color={C.riesgoB} />
        <KPI label="% ADECUADO" value={`${resumen.pct['ADECUADO']}%`} icon="🟢" color={C.adecuadoB} />
        <KPI label="% ÓPTIMO" value={`${resumen.pct['ÓPTIMO']}%`} icon="🏆" color={C.optimoB} />
        <KPI label="Acciones atrasadas" value={`${resumen.pctAtrasadas}%`} icon="⏰" color={C.criticoB} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
        <select value={ejeCodigo} onChange={e => setEjeCodigo(e.target.value)} style={inp}>
          <option value="">Todos los ejes</option>
          {ejesDisponibles.map(e => <option key={e.codigo} value={e.codigo}>{e.nombre}</option>)}
        </select>
        <select value={areaId} onChange={e => setAreaId(e.target.value)} style={inp}>
          <option value="">Todas las áreas</option>
          {areasDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select value={tipoHallazgo} onChange={e => setTipoHallazgo(e.target.value)} style={inp}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={estatus} onChange={e => setEstatus(e.target.value)} style={inp}>
          <option value="">Todos los estatus</option>
          {ESTATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={refetch} style={{ ...inp, cursor: 'pointer', background: C.bgPanel }}>🔄</button>
        <button onClick={handleExportar} disabled={exportando || !filas.length}
          style={{ ...inp, cursor: exportando ? 'not-allowed' : 'pointer', background: C.guinda, color: '#fff', fontWeight: 600, opacity: !filas.length ? 0.5 : 1 }}>
          {exportando ? '⏳ Exportando…' : '📥 Exportar Excel'}
        </button>
      </div>

      {loading && <Spinner />}
      {error && <ErrMsg msg={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: '0.7rem' }}>
            {filas.length} acciones de mejora de {hallazgosUnicos.length} hallazgos · {periodoLabel}
          </div>
          {filas.map(f => <FilaASM key={f.accion_id} f={f} />)}
          {!filas.length && (
            <div style={{ fontSize: '0.78rem', color: C.txtMuted, padding: '1rem', textAlign: 'center' }}>
              Sin hallazgos ASM registrados con estos filtros.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FilaASM({ f }) {
  const col = SEM_COLOR[f.tipo_hallazgo] || C.txtMuted
  const estatusColor = f.estatus === 'Atrasado' ? C.criticoB : f.estatus === 'Cerrado' ? C.optimoB : C.dorado
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderLeft: `4px solid ${f.eje_color || C.guinda}`, borderRadius: 8, padding: '0.8rem 0.95rem', marginBottom: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.6rem', color: C.txtSub }}>{f.folio} · {f.area_nombre}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.txt, marginTop: 2 }}>{f.indicador_nombre}</div>
        </div>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: 1, background: col, color: '#fff', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {f.tipo_hallazgo}
        </span>
      </div>
      <div style={{ fontSize: '0.75rem', color: C.txtSub, marginBottom: 6 }}>{f.hallazgo}</div>
      <div style={{ fontSize: '0.74rem', color: C.txt, marginBottom: 4 }}>➡️ {f.accion}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', color: C.txtMuted, flexWrap: 'wrap' }}>
        <span>👤 {f.responsable_nombre || '—'}</span>
        <span>📅 Compromiso: {f.fecha_compromiso}</span>
        <span>📊 {f.porcentaje_avance}%</span>
        <span style={{ color: estatusColor, fontWeight: 700 }}>
          {f.estatus}{f.estatus !== 'Cerrado' ? ` (${f.dias_al_vencimiento >= 0 ? f.dias_al_vencimiento + ' días' : Math.abs(f.dias_al_vencimiento) + ' días de retraso'})` : ''}
        </span>
      </div>
    </div>
  )
}
