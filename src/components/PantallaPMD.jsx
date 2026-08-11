import { useState, useMemo, useEffect, Fragment } from 'react'
import {
  ClipboardList, TrendingUp, Target, Gauge, AlertTriangle, ChevronUp,
  Map, Loader2, FileText,
} from 'lucide-react'
import { useComparativoPMD } from '../hooks/useSupabase'
import { getIndicadoresPorPrograma, getDetalleIndicadoresPMD, getNombresEjes, getProgramasPresupuestariosDePmd, getProgramasPresupuestariosPorPmd } from '../lib/supabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { generarReportePMD } from '../utils/reportesPMD'
import Sparkline from './Sparkline.jsx'
import { agruparPorNivelMir } from '../utils/nivelMir.js'

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

function KPI({ label, value, sub, icon: Icon, color }) {
  const esTexto = typeof value === 'string' && value.length > 6
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '1.1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ marginBottom: 6 }}>
        <Icon size={18} color={color}/>
      </div>
      <div style={{ fontSize: esTexto ? '1.1rem' : '1.6rem', fontWeight: 800, color, lineHeight: 1.2, wordBreak: 'break-word', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: C.txt, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function FichaIndicador({ i }) {
  const campos = [
    ['Objetivo (MIR)', i.objetivo_mir],
    ['Definición', i.definicion],
    ['Fórmula', i.formula],
    ['Tipo', i.tipo_indicador],
    ['Dimensión', i.dimension],
    ['Sentido', i.sentido],
    ['Unidad de medida', i.unidad_medida],
    ['Frecuencia', i.frecuencia],
    ['Medios de verificación', i.medios_verificacion],
    ['Supuestos (MIR)', i.supuestos_mir],
    ['Interpretación', i.interpretacion],
  ].filter(([, v]) => v)
  if (!campos.length) {
    return <div style={{ fontSize: '0.7rem', color: C.txtMuted, padding: '0.6rem 0.75rem' }}>Este indicador aún no tiene ficha técnica capturada.</div>
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6, padding: '0.6rem 0.75rem' }}>
      {campos.map(([l, v]) => (
        <div key={l} style={{ background: C.bgPanel, borderRadius: 6, padding: '0.45rem 0.6rem' }}>
          <div style={{ fontSize: '0.58rem', color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
          <div style={{ fontSize: '0.7rem', color: C.txt, marginTop: 2, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{v}</div>
        </div>
      ))}
    </div>
  )
}

/* Tarjeta(s) del programa presupuestario asociado al programa PMD, con su
   objetivo central del árbol de objetivos MML. Casi siempre es una sola;
   el programa PMD #34 cruza con dos (003 y 037) y se muestran ambas. */
function ProgramasPresupuestarios({ programaId, anio }) {
  const [progs, setProgs] = useState(null)

  useEffect(() => {
    let cancel = false
    setProgs(null)
    getProgramasPresupuestariosDePmd(programaId, anio)
      .then(d => { if (!cancel) setProgs(d) })
      .catch(() => { if (!cancel) setProgs([]) }) // contexto opcional: si falla, no bloquea el detalle
    return () => { cancel = true }
  }, [programaId, anio])

  if (!progs?.length) return null

  return (
    <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
      {progs.map(p => (
        <div key={p.clave} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.dorado}`, borderRadius: 6, padding: '0.6rem 0.75rem' }}>
          <div style={{ fontSize: '0.6rem', color: C.txtMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Programa presupuestario</div>
          <div style={{ fontSize: '0.76rem', color: C.txt, fontWeight: 700, marginTop: 2 }}>{p.clave} — {p.nombre}</div>
          {p.objetivo_central && (
            <div style={{ fontSize: '0.72rem', color: C.txtSub, marginTop: 4, lineHeight: 1.45 }}>
              <span style={{ fontStyle: 'italic', color: C.txtMuted }}>Objetivo central: </span>{p.objetivo_central}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DetalleIndicadores({ programaId, mes, anio }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fichaAbierta, setFichaAbierta] = useState(null) // clave del indicador expandido

  useEffect(() => {
    let cancel = false
    setLoading(true); setError(null); setFichaAbierta(null)
    getIndicadoresPorPrograma(programaId, mes, anio)
      .then(d => { if (!cancel) setData(d) })
      .catch(e => { if (!cancel) setError(e.message) })
      .finally(() => { if (!cancel) setLoading(false) })
    return () => { cancel = true }
  }, [programaId, mes, anio])

  const grupos = useMemo(() => agruparPorNivelMir(data), [data])

  if (loading) return <div style={{ fontSize: '0.75rem', color: C.txtMuted, padding: '0.75rem' }}>Cargando indicadores…</div>
  if (error)   return <div style={{ fontSize: '0.75rem', color: '#C00000', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13}/> {error}</div>
  if (!data?.length) return <div style={{ fontSize: '0.75rem', color: C.txtMuted, padding: '0.75rem' }}>Este programa no tiene indicadores MIR vinculados.</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Nivel MIR', 'Clave', 'Indicador', 'Área', 'Meta acum.', 'Resultado acum.', '%', 'Tendencia', 'Semáforo', ''].map((h, idx) => (
              <th key={idx} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.62rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map(g => (
            <Fragment key={g.tipo}>
              <tr style={{ background: C.bgPanel }}>
                <td colSpan={10} style={{ padding: '0.45rem 0.5rem' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, letterSpacing: 2, color: C.dorado, textTransform: 'uppercase' }}>{g.label}</span>
                  {g.desc && <span style={{ fontSize: '0.62rem', color: C.txtMuted, marginLeft: 8 }}>{g.desc}</span>}
                </td>
              </tr>
              {g.indicadores.map(i => {
                const abierta = fichaAbierta === i.clave
                return (
                  <Fragment key={i.clave}>
                    <tr style={{ borderBottom: `1px solid ${C.border}55` }}>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub, whiteSpace: 'nowrap' }}>{i.nivel_mir || '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txtMuted }}>{i.clave}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txt }}>{i.nombre}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.area_nombre}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.meta_acumulada ?? '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.resultado_acumulado ?? '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: C.txtSub }}>{i.pct_pmd != null ? `${i.pct_pmd.toFixed(1)}%` : '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }} title="Evolución del % acumulado, enero → mes actual">
                        <Sparkline valores={i.serie_acumulada} color={semColor(i.semaforo)}/>
                      </td>
                      <td style={{ padding: '0.4rem 0.5rem' }}><Pill sem={i.semaforo}/></td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        <button onClick={() => setFichaAbierta(abierta ? null : i.clave)}
                          style={{ background: abierta ? C.guinda : 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: abierta ? C.txt : C.doradoLight, padding: '0.25rem 0.55rem', fontSize: '0.62rem', fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {abierta ? <><ChevronUp size={11}/> Ficha</> : <><ClipboardList size={11}/> Ficha</>}
                        </button>
                      </td>
                    </tr>
                    {abierta && (
                      <tr style={{ borderBottom: `1px solid ${C.border}55` }}>
                        <td colSpan={10} style={{ padding: 0, background: `${C.bgCard}` }}>
                          <FichaIndicador i={i}/>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </Fragment>
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

  // Ocultos temporalmente a pedido de Hugo (2026-08-05): programas sin
  // indicador vinculado o sin meta capturada para el año en curso, mientras
  // Planeación termina de alinearlos. Cuando estén listos, basta con quitar
  // este filtro — la vista sigue trayendo esos programas por si se necesitan.
  const visibles = useMemo(() => {
    if (!data) return []
    return data.filter(p => Number(p.total_indicadores) > 0 && Number(p.indicadores_con_meta_anio) > 0)
  }, [data])

  async function handleDescargarReporte() {
    if (!visibles.length) return
    setGenerandoPDF(true); setPdfError(null)
    try {
      const [detallePorPrograma, presupuestarioPorPrograma, ejes] = await Promise.all([
        incluirDetalle ? getDetalleIndicadoresPMD(mesActual, anioActual) : Promise.resolve({}),
        incluirDetalle ? getProgramasPresupuestariosPorPmd(anioActual) : Promise.resolve({}),
        getNombresEjes(),
      ])
      generarReportePMD({
        programas: visibles,
        mesActual, anioActual, periodoLabel,
        incluirDetalle, detallePorPrograma, presupuestarioPorPrograma, ejes,
      })
    } catch (e) {
      setPdfError(e.message)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const ejesDisponibles = useMemo(() => {
    return Array.from(new Set(visibles.map(p => p.eje).filter(Boolean))).sort()
  }, [visibles])

  const filtrados = useMemo(() => {
    let r = visibles
    if (eje) r = r.filter(p => p.eje === eje)
    if (busq) {
      const q = busq.toLowerCase()
      r = r.filter(p => p.programa_nombre?.toLowerCase().includes(q))
    }
    return r
  }, [visibles, eje, busq])

  const resumen = useMemo(() => {
    if (!visibles.length) return null
    const conAvance = visibles.filter(p => p.indicadores_con_avance > 0).length
    const conPct = visibles.filter(p => p.pct_promedio != null)
    const pctGlobal = conPct.length
      ? conPct.reduce((s, p) => s + Number(p.pct_promedio), 0) / conPct.length
      : null
    const totales = visibles.reduce((acc, p) => ({
      optimo:   acc.optimo   + (p.optimo   || 0),
      adecuado: acc.adecuado + (p.adecuado || 0),
      riesgo:   acc.riesgo   + (p.riesgo   || 0),
      critico:  acc.critico  + (p.critico  || 0),
    }), { optimo: 0, adecuado: 0, riesgo: 0, critico: 0 })
    return { total: visibles.length, conAvance, sinAvance: visibles.length - conAvance, pctGlobal, ...totales }
  }, [visibles])

  const inp = {
    width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.txt, padding: '0.55rem 0.8rem', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  if (loading) return <div style={{ fontSize: '0.85rem', color: C.txtMuted, padding: '2rem', textAlign: 'center' }}>Cargando comparativo PMD…</div>
  if (error) {
    return (
      <div style={{ background: '#1a0505', border: '1px solid #C00000', borderRadius: 8, padding: '1rem', color: '#C00000', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} style={{flexShrink:0}}/> {error}
        <button onClick={refetch} style={{ marginLeft: 12, background: C.guinda, border: 'none', color: C.txt, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Map size={12}/> Plan Municipal de Desarrollo · Comparativo vs. avance MIR
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: C.txtSub, cursor: 'pointer' }}>
            <input type="checkbox" checked={incluirDetalle} onChange={e => setIncluirDetalle(e.target.checked)}/>
            Incluir detalle por indicador
          </label>
          <button onClick={handleDescargarReporte} disabled={generandoPDF || !visibles.length}
            style={{ background: generandoPDF ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`, border: 'none', borderRadius: 8, color: C.txt, padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: generandoPDF || !visibles.length ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            {generandoPDF
              ? <><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Generando…</>
              : <><FileText size={13}/> Descargar Reporte PDF</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {pdfError && (
        <div style={{ fontSize: '0.72rem', color: '#C00000', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13}/> {pdfError}</div>
      )}

      {/* Resumen ejecutivo */}
      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <KPI label="Programas PMD" value={resumen.total} icon={ClipboardList} color={C.dorado}/>
          <KPI label="Con avance registrado" value={resumen.conAvance} sub={`${resumen.sinAvance} sin datos`} icon={TrendingUp} color="#00B050"/>
          <KPI label="% Promedio global" value={resumen.pctGlobal != null ? `${resumen.pctGlobal.toFixed(1)}%` : '—'} icon={Target} color={C.doradoLight}/>
          <KPI label="Óptimo / Adecuado" value={`${resumen.optimo} / ${resumen.adecuado}`} sub={`Riesgo: ${resumen.riesgo} · Crítico: ${resumen.critico}`} icon={Gauge} color="#046205"/>
        </div>
      )}

      {/* Filtros */}
      <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
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
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, whiteSpace: 'nowrap' }}>
                        {Number(p.total_indicadores) === 0
                          ? <span style={{ fontSize: '0.64rem', color: C.txtMuted, fontStyle: 'italic' }}>Sin indicadores MIR vinculados</span>
                          : `${p.indicadores_con_avance}/${p.total_indicadores}`}
                      </td>
                      <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub }}>{pct != null ? `${pct.toFixed(1)}%` : '—'}</td>
                      <td style={{ padding: '0.55rem 0.7rem' }}>
                        {Number(p.total_indicadores) === 0
                          ? <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1, background: '#3a3a3a', color: C.txtSub, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Pendiente de alineación</span>
                          : <Pill sem={sem}/>}
                      </td>
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
                            {Number(p.total_indicadores) > 0 && <ProgramasPresupuestarios programaId={p.programa_id} anio={anioActual}/>}
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
