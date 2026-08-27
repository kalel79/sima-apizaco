import { useMemo, useState, useEffect, Fragment } from 'react'
import { AlertTriangle, ClipboardList, FileSpreadsheet, CheckCircle2, Clock, Layers, ChevronDown, ChevronRight } from 'lucide-react'
import { useAvanceMMLAreas, useAvanceMMLProgramas, useAniosMML } from '../../hooks/useSupabase'
import { getAvanceMMLDetalleArea } from '../../lib/supabase'
import { generarExcelAvanceMML } from '../../utils/reportes'
import { Badge, KPI, ESTADO_PRIORIDAD } from '../AvanceCaptura.jsx'
import { C } from '../../theme.js'
import { inp } from './estilos.js'

// Avance de captura del Expediente MML por área (fase_mml_22). Hermano del
// "Avance de Captura" mensual: mismo lenguaje visual (KPIs, badges, orden por
// prioridad) pero midiendo el ejercicio completo — MIR, Riesgos, Ficha de
// Indicador y Metas (POA) — en vez del avance de un mes.
//
// Los porcentajes NO se calculan aquí: los entregan ya resueltos las vistas
// v_avance_mml_areas / v_avance_mml_programas, para que la regla de "qué cuenta
// como capturado" viva en un solo lugar y el Excel y la pantalla no puedan
// divergir.

const BLOQUES = [
  { key: 'mir',     label: 'MIR',     ayuda: 'Indicador vinculado al nivel' },
  { key: 'riesgos', label: 'Riesgos', ayuda: 'Supuestos y medios de verificación' },
  { key: 'ficha',   label: 'Ficha',   ayuda: 'Ficha del indicador: 7 campos' },
  { key: 'metas',   label: 'Metas',   ayuda: 'Metas de los 12 meses' },
]

function colorPct(v) {
  if (v == null) return C.txtMuted
  if (v >= 100) return C.adecuadoB
  if (v >= 60)  return C.optimoB
  if (v > 0)    return C.riesgoB
  return C.criticoB
}

// Barra + número: el número solo no deja comparar de un vistazo entre áreas.
function Pct({ valor }) {
  const color = colorPct(valor)
  return (
    <div style={{ minWidth: 62 }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color, marginBottom: 3 }}>
        {valor == null ? '—' : `${valor}%`}
      </div>
      <div style={{ height: 4, background: C.bgPanel, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(valor ?? 0, 100)}%`, background: color, borderRadius: 3 }}/>
      </div>
    </div>
  )
}

const th = { padding: '0.5rem 0.6rem', textAlign: 'left', fontSize: '0.62rem', letterSpacing: 1, color: C.dorado, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }
const td = { padding: '0.5rem 0.6rem', fontSize: '0.78rem', color: C.txt, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }

export default function AvanceCapturaMML() {
  const { data: anios, loading: lAnios, error: eAnios } = useAniosMML()
  const [anio, setAnio] = useState(null)

  // Arranca en el año más reciente con árbol capturado — hoy 2027 — en vez de
  // clavarlo en el código: el selector se puebla solo cuando entre 2028.
  useEffect(() => {
    if (anio == null && anios?.length) setAnio(Math.max(...anios))
  }, [anios, anio])

  const { data: areas,     loading: lAreas, error: eAreas } = useAvanceMMLAreas(anio)
  const { data: programas, loading: lProg,  error: eProg }  = useAvanceMMLProgramas(anio)

  const [exportando, setExportando] = useState(false)
  const [exportError, setExportError] = useState(null)

  const [abierta, setAbierta] = useState(null)      // area_id con el detalle desplegado
  const [detalle, setDetalle] = useState([])
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState(null)

  // Pendientes primero: el reporte existe para detectar quién no ha capturado.
  const ordenadas = useMemo(() => {
    if (!areas) return []
    return [...areas].sort((a, b) => {
      const pa = ESTADO_PRIORIDAD[a.estado_captura] ?? 9
      const pb = ESTADO_PRIORIDAD[b.estado_captura] ?? 9
      if (pa !== pb) return pa - pb
      return (a.pct_global ?? 0) - (b.pct_global ?? 0) || a.area.localeCompare(b.area, 'es')
    })
  }, [areas])

  const resumen = useMemo(() => {
    if (!areas?.length) return null
    const conNiveles = areas.filter(a => a.total_niveles > 0)
    const cap = conNiveles.reduce((s, a) => s + (a.total_capturados || 0), 0)
    const esp = conNiveles.reduce((s, a) => s + (a.total_esperados  || 0), 0)
    return {
      areasConNiveles: conNiveles.length,
      completas:  conNiveles.filter(a => a.estado_captura === 'COMPLETO').length,
      pendientes: conNiveles.filter(a => a.estado_captura === 'PENDIENTE').length,
      pctGlobal: esp > 0 ? Math.round(cap / esp * 1000) / 10 : null,
    }
  }, [areas])

  async function alternarDetalle(area) {
    if (abierta === area.area_id) { setAbierta(null); return }
    setAbierta(area.area_id)
    setDetalle([]); setDetalleLoading(true); setDetalleError(null)
    try {
      setDetalle(await getAvanceMMLDetalleArea(area.area_id, anio))
    } catch (e) {
      setDetalleError(e.message)
    } finally {
      setDetalleLoading(false)
    }
  }

  async function handleExportar() {
    if (!ordenadas.length) return
    setExportando(true); setExportError(null)
    try {
      await generarExcelAvanceMML({ areas: ordenadas, programas: programas || [], anio })
    } catch (e) {
      setExportError(e.message)
    } finally {
      setExportando(false)
    }
  }

  // El error va ANTES que el loading y cubre las tres consultas: si falla la de
  // años, `anio` se queda en null para siempre y colgar el spinner de esa
  // condición dejaba la pantalla cargando eternamente, tragándose el motivo.
  const loading = lAnios || lAreas || lProg
  const error   = eAnios || eAreas || eProg

  if (error) {
    return (
      <div style={{ background: '#1a0505', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '1rem', color: C.criticoB, fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }}/>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No se pudo cargar el avance del Expediente MML.</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.74rem' }}>{error}</div>
          <div style={{ color: C.txtMuted, marginTop: 6, fontSize: '0.74rem' }}>
            Si el mensaje habla de una relación inexistente, falta aplicar la migración
            <code style={{ margin: '0 4px' }}>fase_mml_22</code>en la base.
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ fontSize: '0.85rem', color: C.txtMuted, padding: '2rem', textAlign: 'center' }}>Cargando avance del Expediente MML…</div>

  if (!anios?.length) {
    return (
      <div style={{ fontSize: '0.85rem', color: C.txtMuted, padding: '2rem', textAlign: 'center' }}>
        Todavía no hay ningún Árbol de Objetivos capturado, así que no hay avance que medir.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
          <ClipboardList size={12}/> Avance de captura del Expediente MML · {anio}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={anio ?? ''} onChange={e => { setAnio(+e.target.value); setAbierta(null) }}
            style={{ ...inp, width: 'auto', padding: '0.45rem 0.7rem', fontSize: '0.75rem' }}>
            {(anios || []).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={handleExportar} disabled={exportando || !ordenadas.length}
            style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.txt, padding: '0.5rem 0.9rem', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit', cursor: exportando ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={13}/> {exportando ? 'Generando…' : 'Exportar Excel'}
          </button>
        </div>
      </div>

      {exportError && (
        <div style={{ background: '#1a0505', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 0.9rem', color: C.criticoB, fontSize: '0.78rem', marginBottom: '1rem' }}>
          {exportError}
        </div>
      )}

      {resumen && (
        <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '1.2rem' }}>
          <KPI label="Áreas con niveles asignados" value={resumen.areasConNiveles} icon={Layers} color={C.dorado}/>
          <KPI label="Áreas completas"  value={resumen.completas}  icon={CheckCircle2} color={C.adecuadoB}/>
          <KPI label="Áreas sin iniciar" value={resumen.pendientes} icon={Clock} color={C.criticoB}/>
          <KPI label="Avance global del ejercicio" value={resumen.pctGlobal == null ? '—' : `${resumen.pctGlobal}%`} icon={ClipboardList} color={colorPct(resumen.pctGlobal)}/>
        </div>
      )}

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: 'auto', marginBottom: '1.4rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={th}>Área</th>
              <th style={th}>Niveles</th>
              {BLOQUES.map(b => <th key={b.key} style={th} title={b.ayuda}>{b.label}</th>)}
              <th style={th}>Global</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map(a => (
              <Fragment key={a.area_id}>
                <tr onClick={() => a.total_niveles > 0 && alternarDetalle(a)}
                  style={{ cursor: a.total_niveles > 0 ? 'pointer' : 'default' }}>
                  <td style={{ ...td, fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {a.total_niveles > 0 && (abierta === a.area_id ? <ChevronDown size={13}/> : <ChevronRight size={13}/>)}
                      {a.area}
                    </span>
                  </td>
                  <td style={td}>{a.total_niveles}</td>
                  {BLOQUES.map(b => <td key={b.key} style={td}><Pct valor={a[`pct_${b.key}`]}/></td>)}
                  <td style={td}><Pct valor={a.pct_global}/></td>
                  <td style={td}><Badge estado={a.estado_captura}/></td>
                </tr>
                {abierta === a.area_id && (
                  <tr>
                    <td colSpan={8} style={{ ...td, background: C.bgPanel, padding: '0.7rem 1rem' }}>
                      {detalleLoading && <div style={{ fontSize: '0.75rem', color: C.txtMuted }}>Cargando detalle…</div>}
                      {detalleError && <div style={{ fontSize: '0.75rem', color: C.criticoB }}>{detalleError}</div>}
                      {!detalleLoading && !detalleError && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...th, color: C.txtSub }}>Nivel</th>
                              <th style={{ ...th, color: C.txtSub }}>Indicador</th>
                              <th style={{ ...th, color: C.txtSub }}>MIR</th>
                              <th style={{ ...th, color: C.txtSub }}>Riesgos</th>
                              <th style={{ ...th, color: C.txtSub }}>Ficha</th>
                              <th style={{ ...th, color: C.txtSub }}>Metas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalle.map(d => (
                              <tr key={d.nodo_id}>
                                <td style={{ ...td, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{d.nivel}</td>
                                <td style={{ ...td, fontSize: '0.72rem' }}>
                                  {d.indicador_id
                                    ? `${d.indicador_clave ? d.indicador_clave + ' · ' : ''}${d.indicador_nombre || ''}`
                                    : <span style={{ color: C.criticoB }}>— sin indicador vinculado —</span>}
                                </td>
                                <td style={{ ...td, fontSize: '0.72rem' }}>{d.d_mir}/1</td>
                                <td style={{ ...td, fontSize: '0.72rem' }}>{d.d_riesgos}/2</td>
                                <td style={{ ...td, fontSize: '0.72rem' }}>{d.d_ficha}/7</td>
                                <td style={{ ...td, fontSize: '0.72rem' }}>{d.d_metas}/12</td>
                              </tr>
                            ))}
                            {!detalle.length && (
                              <tr><td colSpan={6} style={{ ...td, fontSize: '0.72rem', color: C.txtMuted }}>Sin niveles asignados a esta área.</td></tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fin y Propósito no tienen área responsable: son del programa completo,
          así que se reportan aparte y no se le cargan a nadie. */}
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', marginBottom: '0.7rem' }}>
        Por programa · incluye Fin y Propósito (sin área responsable)
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={th}>Programa</th>
              <th style={th}>Niveles</th>
              <th style={th}>Fin/Prop.</th>
              {BLOQUES.map(b => <th key={b.key} style={th}>{b.label}</th>)}
              <th style={th}>Global</th>
              <th style={th}>Ficha del Proyecto</th>
            </tr>
          </thead>
          <tbody>
            {(programas || []).map(p => (
              <tr key={p.programa_id}>
                <td style={{ ...td, fontWeight: 600 }}>{p.clave} · {p.programa}</td>
                <td style={td}>{p.total_niveles}</td>
                <td style={td}>{p.niveles_sin_area}</td>
                {BLOQUES.map(b => <td key={b.key} style={td}><Pct valor={p[`pct_${b.key}`]}/></td>)}
                <td style={td}><Pct valor={p.pct_global}/></td>
                <td style={td}><Badge estado={p.tiene_ficha_proyecto ? 'COMPLETO' : 'PENDIENTE'}/></td>
              </tr>
            ))}
            {!programas?.length && (
              <tr><td colSpan={9} style={{ ...td, color: C.txtMuted }}>Sin árbol capturado para {anio}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginTop: '0.9rem', lineHeight: 1.6 }}>
        Cada nivel de la MIR exige 22 datos: 1 de MIR (indicador vinculado), 2 de Riesgos
        (supuestos y medios de verificación), 7 de la Ficha del indicador y 12 de Metas
        (una por mes). No se cuentan Frecuencia ni Unidad de medida: tienen valor por
        omisión, así que siempre se verían capturadas.
      </div>
    </div>
  )
}
