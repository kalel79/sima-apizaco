import { useState, useMemo, useEffect, Fragment } from 'react'
import { useComparativoPMD } from '../hooks/useSupabase'
import { getIndicadoresPorPrograma, getDetalleIndicadoresPMD } from '../lib/supabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { generarReportePMD } from '../utils/reportesPMD'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C8A96E', doradoLight: '#E2C998',
  bg: '#0D0D0D', bgCard: '#161616', bgPanel: '#1C1C1C',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050', txtSub: '#A09080',
}

const SEM = {
  'ÓPTIMO':   '#046205',
  'ADECUADO': '#00B050',
  'RIESGO':   '#FFC000',
  'CRÍTICO':  '#C00000',
}

function semColor(sem) { return SEM[sem] || C.txtMuted }

// v_comparativo_pmd devuelve pct_promedio ya en escala de porcentaje (ej. 101.45),
// no como fracción — mismos umbrales que usa la vista para clasificar cada indicador.
function getSemaforo(pct) {
  if (pct == null) return null
  if (pct >= 110) return 'ÓPTIMO'
  if (pct >= 90)  return 'ADECUADO'
  if (pct >= 70)  return 'RIESGO'
  return 'CRÍTICO'
}

function Pill({ sem }) {
  if (!sem) {
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, background: '#3a3a3a', color: C.txtMuted, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        Sin datos
      </span>
    )
  }
  const color = semColor(sem)
  const textColor = sem === 'RIESGO' ? '#7A5800' : '#fff'
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 2, background: color, color: textColor, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {sem}
    </span>
  )
}

function KPI({ label, value, sub, icon, color }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '1.1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ fontSize: '0.72rem', color: C.txt, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function DetalleIndicadores({ programaId, mes, anio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancel = false
    setLoading(true); setError(null)
    getIndicadoresPorPrograma(programaId, mes, anio)
      .then(d => { if (!cancel) setData(d) })
      .catch(e => { if (!cancel) setError(e.message) })
      .finally(() => { if (!cancel) setLoading(false) })
    return () => { cancel = true }
  }, [programaId, mes, anio])

  if (loading) return <div style={{ fontSize: '0.75rem', color: C.txtMuted, padding: '0.75rem' }}>Cargando indicadores…</div>
  if (error)   return <div style={{ fontSize: '0.75rem', color: '#C00000', padding: '0.75rem' }}>⚠️ {error}</div>
  if (!data?.length) return <div style={{ fontSize: '0.75rem', color: C.txtMuted, padding: '0.75rem' }}>Este programa no tiene indicadores vinculados.</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Clave', 'Indicador', 'Área', 'Meta acum.', 'Resultado acum.', '%', 'Semáforo'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.62rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((i, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${C.border}55` }}>
              <td style={{ padding: '0.4rem 0.5rem', color: C.txtMuted }}>{i.clave}</td>
              <td style={{ padding: '0.4rem 0.5rem', color: C.txt }}>{i.nombre}</td>
              <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.area_nombre}</td>
              <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.meta_acumulada ?? '—'}</td>
              <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.resultado_acumulado ?? '—'}</td>
              <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.pct_pmd != null ? `${i.pct_pmd.toFixed(1)}%` : '—'}</td>
              <td style={{ padding: '0.4rem 0.5rem' }}><Pill sem={i.semaforo}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PantallaPMD() {
  const { data, loading, error, refetch } = useComparativoPMD()
  const { mesActual, anioActual } = useConfiguracionCtx()
  const [eje, setEje] = useState('')
  const [busq, setBusq] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [incluirDetalle, setIncluirDetalle] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)

  async function handleDescargarReporte() {
    if (!data?.length) return
    setGenerandoPDF(true); setPdfError(null)
    try {
      const detallePorPrograma = incluirDetalle
        ? await getDetalleIndicadoresPMD(mesActual, anioActual)
        : {}
      generarReportePMD({
        programas: data,
        mesActual, anioActual, periodoLabel,
        incluirDetalle, detallePorPrograma,
      })
    } catch (e) {
      setPdfError(e.message)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const ejesDisponibles = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.map(p => p.eje).filter(Boolean))).sort()
  }, [data])

  const filtrados = useMemo(() => {
    if (!data) return []
    let r = data
    if (eje) r = r.filter(p => p.eje === eje)
    if (busq) {
      const q = busq.toLowerCase()
      r = r.filter(p => p.programa_nombre?.toLowerCase().includes(q))
    }
    return r
  }, [data, eje, busq])

  const resumen = useMemo(() => {
    if (!data?.length) return null
    const conAvance = data.filter(p => p.indicadores_con_avance > 0).length
    const conPct = data.filter(p => p.pct_promedio != null)
    const pctGlobal = conPct.length
      ? conPct.reduce((s, p) => s + Number(p.pct_promedio), 0) / conPct.length
      : null
    const totales = data.reduce((acc, p) => ({
      optimo:   acc.optimo   + (p.optimo   || 0),
      adecuado: acc.adecuado + (p.adecuado || 0),
      riesgo:   acc.riesgo   + (p.riesgo   || 0),
      critico:  acc.critico  + (p.critico  || 0),
    }), { optimo: 0, adecuado: 0, riesgo: 0, critico: 0 })
    return { total: data.length, conAvance, sinAvance: data.length - conAvance, pctGlobal, ...totales }
  }, [data])

  const inp = {
    width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.txt, padding: '0.55rem 0.8rem', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  if (loading) return <div style={{ fontSize: '0.85rem', color: C.txtMuted, padding: '2rem', textAlign: 'center' }}>Cargando comparativo PMD…</div>
  if (error) {
    return (
      <div style={{ background: '#1a0505', border: '1px solid #C00000', borderRadius: 8, padding: '1rem', color: '#C00000', fontSize: '0.82rem' }}>
        ⚠️ {error}
        <button onClick={refetch} style={{ marginLeft: 12, background: C.guinda, border: 'none', color: C.txt, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase' }}>
          🗺️ Plan Municipal de Desarrollo · Comparativo vs. avance MIR
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: C.txtSub, cursor: 'pointer' }}>
            <input type="checkbox" checked={incluirDetalle} onChange={e => setIncluirDetalle(e.target.checked)}/>
            Incluir detalle por indicador
          </label>
          <button onClick={handleDescargarReporte} disabled={generandoPDF || !data?.length}
            style={{ background: generandoPDF ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`, border: 'none', borderRadius: 8, color: C.txt, padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: generandoPDF || !data?.length ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {generandoPDF ? '⏳ Generando…' : '📄 Descargar Reporte PDF'}
          </button>
        </div>
      </div>
      {pdfError && (
        <div style={{ fontSize: '0.72rem', color: '#C00000', marginBottom: '1rem' }}>⚠️ {pdfError}</div>
      )}

      {/* Resumen ejecutivo */}
      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <KPI label="Programas PMD" value={resumen.total} icon="📋" color={C.dorado}/>
          <KPI label="Con avance registrado" value={resumen.conAvance} sub={`${resumen.sinAvance} sin datos`} icon="📈" color="#00B050"/>
          <KPI label="% Promedio global" value={resumen.pctGlobal != null ? `${resumen.pctGlobal.toFixed(1)}%` : '—'} icon="🎯" color={C.doradoLight}/>
          <KPI label="Óptimo / Adecuado" value={`${resumen.optimo} / ${resumen.adecuado}`} sub={`Riesgo: ${resumen.riesgo} · Crítico: ${resumen.critico}`} icon="🚦" color="#046205"/>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>Eje</label>
          <select value={eje} onChange={e => setEje(e.target.value)} style={inp}>
            <option value="">— Todos los ejes —</option>
            {ejesDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>Buscar programa</label>
          <input value={busq} onChange={e => setBusq(e.target.value)} placeholder="Filtra por nombre del programa…" style={inp}/>
        </div>
      </div>

      {/* Tabla comparativa */}
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgPanel }}>
                {['#', 'Programa PMD', 'Eje', 'Indicadores', '% Avance', 'Semáforo', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.7rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.62rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: C.txtMuted, fontSize: '0.78rem' }}>No hay programas que coincidan con el filtro.</td></tr>
              )}
              {filtrados.map(p => {
                const pct = p.pct_promedio != null ? Number(p.pct_promedio) : null
                const sem = getSemaforo(pct)
                const abierto = expandido === p.programa_id
                return (
                  <Fragment key={p.programa_id}>
                    <tr style={{ borderBottom: `1px solid ${C.border}55` }}>
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txtMuted }}>{p.numero}</td>
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txt, fontWeight: 600, maxWidth: 260 }}>{p.programa_nombre}</td>
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub }}>{p.eje}</td>
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub }}>{p.indicadores_con_avance}/{p.total_indicadores}</td>
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub }}>{pct != null ? `${pct.toFixed(1)}%` : '—'}</td>
                      <td style={{ padding: '0.55rem 0.7rem' }}><Pill sem={sem}/></td>
                      <td style={{ padding: '0.55rem 0.7rem' }}>
                        <button onClick={() => setExpandido(abierto ? null : p.programa_id)}
                          style={{ background: abierto ? C.guinda : C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.35rem 0.7rem', fontSize: '0.68rem', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {abierto ? 'Ocultar' : 'Ver detalle'}
                        </button>
                      </td>
                    </tr>
                    {abierto && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, background: C.bg }}>
                          <div style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 6 }}>Detalle del programa</div>
                            <div style={{ fontSize: '0.78rem', color: C.txt, fontWeight: 600, marginBottom: 6 }}>{p.programa_nombre}</div>
                            {p.objetivo && <div style={{ fontSize: '0.75rem', color: C.txtSub, marginBottom: 8, lineHeight: 1.4 }}>{p.objetivo}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6, marginBottom: 12 }}>
                              {[['Meta PMD', p.meta_pmd], ['Responsable', p.responsable], ['Plazo', p.plazo]].map(([l, v]) => (
                                <div key={l} style={{ background: C.bgPanel, borderRadius: 6, padding: '0.5rem 0.6rem' }}>
                                  <div style={{ fontSize: '0.6rem', color: C.txtMuted }}>{l}</div>
                                  <div style={{ fontSize: '0.74rem', color: C.txt, fontWeight: 600, marginTop: 2 }}>{v || '—'}</div>
                                </div>
                              ))}
                            </div>
                            <DetalleIndicadores programaId={p.programa_id} mes={mesActual} anio={anioActual}/>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
