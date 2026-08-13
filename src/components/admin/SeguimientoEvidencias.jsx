import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Paperclip, Loader2, FileSpreadsheet, Building2, CheckCircle2, XCircle, Search, X } from 'lucide-react'
import { getMatrizEvidencias } from '../../lib/supabase'
import { generarExcelSeguimientoEvidencias } from '../../utils/reportes'
import { useConfiguracionCtx } from '../../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../../utils/periodo'
import { C } from '../../theme.js'

const MESES_LABEL = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function KPI({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ marginBottom: 6 }}><Icon size={18} color={color} /></div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: C.txt, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

// Panel Admin: matriz área × indicador × mes de carga de evidencias. Muestra
// qué áreas/indicadores tienen soporte documental por mes y cuáles solo
// capturaron el resultado numérico sin adjuntar archivo.
export default function SeguimientoEvidencias() {
  const { mesActual, anioActual } = useConfiguracionCtx()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)

  const [matriz, setMatriz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [areaDetalle, setAreaDetalle] = useState(null)

  async function cargar() {
    setLoading(true); setError(null)
    try {
      setMatriz(await getMatrizEvidencias(anioActual))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [anioActual]) // eslint-disable-line

  const areasOrdenadas = useMemo(() => {
    if (!matriz) return []
    return [...matriz.areas].sort((a, b) => (a.pctEvidencia ?? 0) - (b.pctEvidencia ?? 0))
  }, [matriz])

  const resumen = useMemo(() => {
    if (!matriz?.areas?.length) return null
    const totalCeldas = matriz.areas.reduce((s, a) => s + a.totalCeldas, 0)
    const conEvidencia = matriz.areas.reduce((s, a) => s + a.conEvidencia, 0)
    return {
      totalAreas: matriz.areas.length,
      totalIndicadores: matriz.areas.reduce((s, a) => s + a.totalIndicadores, 0),
      pctGlobal: totalCeldas > 0 ? Math.round((conEvidencia / totalCeldas) * 1000) / 10 : null,
      rezago: matriz.areas.filter(a => (a.pctEvidencia ?? 0) < 50).length,
    }
  }, [matriz])

  async function handleExportar() {
    if (!matriz) return
    setExportando(true); setExportError(null)
    try {
      await generarExcelSeguimientoEvidencias({ matriz, periodoLabel })
    } catch (e) {
      setExportError(e.message)
    } finally {
      setExportando(false)
    }
  }

  if (loading) return <div style={{ fontSize: '0.85rem', color: C.txtMuted, padding: '2rem', textAlign: 'center' }}>Cargando seguimiento de evidencias…</div>
  if (error) {
    return (
      <div style={{ background: '#1a0505', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '1rem', color: C.criticoB, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
        <button onClick={cargar} style={{ marginLeft: 12, background: C.guinda, border: 'none', color: C.txt, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Reintentar</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Paperclip size={12} /> Seguimiento de Evidencias por Área
        </div>
        <button onClick={handleExportar} disabled={exportando || !matriz?.areas?.length}
          style={{ background: exportando ? '#444' : `linear-gradient(135deg,#1a3a1a,#1e6b1e)`, border: 'none', borderRadius: 8, color: C.txt, padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: exportando || !matriz?.areas?.length ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
          {exportando ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Generando…</> : <><FileSpreadsheet size={13} /> Exportar Excel</>}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {exportError && (
        <div style={{ fontSize: '0.72rem', color: C.criticoB, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} /> {exportError}</div>
      )}

      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <KPI label="Total de áreas" value={resumen.totalAreas} icon={Building2} color={C.dorado} />
          <KPI label="Total de indicadores" value={resumen.totalIndicadores} icon={FileSpreadsheet} color={C.doradoLight} />
          <KPI label="% Evidencia global" value={resumen.pctGlobal != null ? `${resumen.pctGlobal}%` : '—'} icon={CheckCircle2} color={C.adecuadoB} />
          <KPI label="Áreas con rezago (<50%)" value={resumen.rezago} icon={AlertTriangle} color={C.criticoB} />
          <KPI label="Meses evaluados" value={matriz.meses.length} icon={Building2} color={C.doradoLight} />
        </div>
      )}

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgPanel }}>
                {['Área', 'Indicadores', 'Con Evidencia', 'Sin Evidencia', '% Evidencia', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Área' ? 'left' : 'center', padding: '0.6rem 0.7rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.62rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areasOrdenadas.map(a => (
                <tr key={a.area_id} style={{ borderBottom: `1px solid ${C.border}55` }}>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txt, fontWeight: 600 }}>{a.area}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.totalIndicadores}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.conEvidencia}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.totalCeldas - a.conEvidencia}</td>
                  <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', background: (a.pctEvidencia ?? 0) >= 75 ? C.adecuadoB : (a.pctEvidencia ?? 0) >= 50 ? C.riesgoB : C.criticoB, padding: '2px 8px', borderRadius: 6 }}>
                      {a.pctEvidencia != null ? `${a.pctEvidencia}%` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center' }}>
                    <button onClick={() => setAreaDetalle(a)}
                      style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.35rem 0.7rem', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Search size={12} /> Ver matriz
                    </button>
                  </td>
                </tr>
              ))}
              {!areasOrdenadas.length && (
                <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: C.txtMuted }}>Sin datos de avances capturados todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {areaDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setAreaDetalle(null)}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.2rem', maxWidth: 960, width: '100%', maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: C.txt }}>{areaDetalle.area}</div>
                <div style={{ fontSize: '0.68rem', color: C.txtMuted }}>Evidencias por indicador y mes · {anioActual}</div>
              </div>
              <button onClick={() => setAreaDetalle(null)}
                style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.txtMuted, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                <X size={13} /> Cerrar
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgPanel }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem', color: C.txtSub, fontSize: '0.6rem', textTransform: 'uppercase', position: 'sticky', top: 0, background: C.bgPanel }}>Indicador</th>
                    {matriz.meses.map(m => (
                      <th key={m} style={{ textAlign: 'center', padding: '0.5rem 0.4rem', color: C.txtSub, fontSize: '0.6rem', textTransform: 'uppercase', position: 'sticky', top: 0, background: C.bgPanel }}>{MESES_LABEL[m - 1]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {areaDetalle.indicadores.map(ind => (
                    <tr key={ind.indicador_id} style={{ borderBottom: `1px solid ${C.border}55` }}>
                      <td style={{ padding: '0.5rem 0.6rem', color: C.txt }}>
                        <div style={{ fontWeight: 600 }}>{ind.clave}</div>
                        <div style={{ color: C.txtMuted, fontSize: '0.65rem' }}>{ind.nombre}</div>
                      </td>
                      {matriz.meses.map(m => {
                        const c = ind.porMes[m]
                        const color = c.tieneEvidencia ? C.adecuadoB : c.tieneAvance ? C.criticoB : C.txtMuted
                        const Icono = c.tieneEvidencia ? CheckCircle2 : c.tieneAvance ? XCircle : null
                        const titulo = c.tieneEvidencia
                          ? `${c.nEvidencias} evidencia(s) cargada(s)`
                          : c.tieneAvance ? 'Avance capturado, sin evidencia' : 'Sin avance capturado'
                        return (
                          <td key={m} style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }} title={titulo}>
                            {Icono ? <Icono size={14} color={color} /> : <span style={{ color: C.txtMuted }}>—</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
