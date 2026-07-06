import { useMemo, useState } from 'react'
import { useAvanceCapturaAreas } from '../hooks/useSupabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { useAuth } from '../hooks/useAuth'
import { formatPeriodoLabel } from '../utils/periodo'
import { generarExcelAvanceCaptura } from '../utils/reportes'
import { getAvancesDetalleArea, corregirAvance, desvalidarAvance } from '../lib/supabase'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C8A96E', doradoLight: '#E2C998',
  bg: '#0D0D0D', bgCard: '#161616', bgPanel: '#1C1C1C',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050', txtSub: '#A09080',
  correccion: '#C9A961', desvalidar: '#FF8C00',
  ok: '#00B050', error: '#C00000',
}

const ESTADO_COLOR = {
  COMPLETO:          '#00B050',
  'EN PROGRESO':     '#FFC000',
  PENDIENTE:         '#C00000',
  'SIN INDICADORES': '#5a5a5a',
}

const SEM_COLOR = {
  'ÓPTIMO':   '#046205',
  'ADECUADO': '#00B050',
  'RIESGO':   '#FFC000',
  'CRÍTICO':  '#C00000',
}

function pctStr(val) {
  if (val == null) return '—'
  return ((+val) * 100).toFixed(1) + '%'
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
}
const modalBox = {
  background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '1.4rem', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
}
const inp = {
  width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.txt, padding: '0.55rem 0.75rem', fontSize: '0.82rem', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}
const label = {
  fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1,
  display: 'block', marginBottom: 5,
}

// Orden pedido: primero lo que necesita atención (PENDIENTE), luego EN
// PROGRESO, luego COMPLETO; SIN INDICADORES al final (no requiere acción).
const ESTADO_PRIORIDAD = { PENDIENTE: 0, 'EN PROGRESO': 1, COMPLETO: 2, 'SIN INDICADORES': 3 }

function Badge({ estado }) {
  const color = ESTADO_COLOR[estado] || C.txtMuted
  const textColor = estado === 'EN PROGRESO' ? '#7A5800' : '#fff'
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1, background: color, color: textColor, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {estado}
    </span>
  )
}

function KPI({ label, value, icon, color }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: C.txt, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

export default function AvanceCaptura() {
  const { data, loading, error, refetch } = useAvanceCapturaAreas()
  const { mesActual, anioActual } = useConfiguracionCtx()
  const { profile } = useAuth()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  const [exportando, setExportando] = useState(false)
  const [exportError, setExportError] = useState(null)

  // Panel "Ver indicadores" por área
  const [detalleArea, setDetalleArea] = useState(null)
  const [detalle, setDetalle] = useState([])
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState(null)

  // Modal "Corregir"
  const [corrigiendo, setCorrigiendo] = useState(null)
  const [corrForm, setCorrForm] = useState({ resultado: '', meta: '', justificacion: '' })
  const [corrSaving, setCorrSaving] = useState(false)
  const [corrError, setCorrError] = useState(null)

  // Modal "Desvalidar"
  const [desvalidando, setDesvalidando] = useState(null)
  const [desvMotivo, setDesvMotivo] = useState('')
  const [desvSaving, setDesvSaving] = useState(false)
  const [desvError, setDesvError] = useState(null)

  async function abrirDetalle(area) {
    setDetalleArea(area)
    setDetalle([])
    setDetalleLoading(true); setDetalleError(null)
    try {
      const rows = await getAvancesDetalleArea(area.area_id, mesActual, anioActual)
      setDetalle(rows)
    } catch (e) {
      setDetalleError(e.message)
    } finally {
      setDetalleLoading(false)
    }
  }

  async function recargarDetalle() {
    if (!detalleArea) return
    try {
      const rows = await getAvancesDetalleArea(detalleArea.area_id, mesActual, anioActual)
      setDetalle(rows)
    } catch (e) {
      setDetalleError(e.message)
    }
  }

  function abrirCorregir(row) {
    setCorrigiendo(row)
    setCorrForm({ resultado: row.resultado ?? '', meta: row.meta_programada ?? '', justificacion: '' })
    setCorrError(null)
  }

  async function guardarCorreccion() {
    if (!corrigiendo) return
    if (corrForm.resultado === '' || isNaN(+corrForm.resultado)) {
      setCorrError('Ingresa un resultado numérico válido.'); return
    }
    if (!corrForm.justificacion || corrForm.justificacion.trim().length < 10) {
      setCorrError('La justificación debe tener al menos 10 caracteres.'); return
    }
    setCorrSaving(true); setCorrError(null)
    try {
      await corregirAvance(
        corrigiendo.avance_id,
        +corrForm.resultado,
        corrForm.meta === '' ? null : +corrForm.meta,
        corrForm.justificacion.trim(),
        profile?.id ?? null,
      )
      setCorrigiendo(null)
      await recargarDetalle()
      await refetch()
    } catch (e) {
      setCorrError(e.message)
    } finally {
      setCorrSaving(false)
    }
  }

  function abrirDesvalidar(row) {
    setDesvalidando(row)
    setDesvMotivo('')
    setDesvError(null)
  }

  async function confirmarDesvalidacion() {
    if (!desvalidando) return
    if (!desvMotivo || desvMotivo.trim().length < 10) {
      setDesvError('Ingresa un motivo de al menos 10 caracteres.'); return
    }
    setDesvSaving(true); setDesvError(null)
    try {
      await desvalidarAvance(desvalidando.avance_id, desvMotivo.trim(), profile?.id ?? null)
      setDesvalidando(null)
      await recargarDetalle()
      await refetch()
    } catch (e) {
      setDesvError(e.message)
    } finally {
      setDesvSaving(false)
    }
  }

  const ordenadas = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => {
      const pa = ESTADO_PRIORIDAD[a.estado_captura] ?? 9
      const pb = ESTADO_PRIORIDAD[b.estado_captura] ?? 9
      if (pa !== pb) return pa - pb
      return a.area.localeCompare(b.area, 'es')
    })
  }, [data])

  const resumen = useMemo(() => {
    if (!data?.length) return null
    const count = estado => data.filter(a => a.estado_captura === estado).length
    return {
      total: data.length,
      completas: count('COMPLETO'),
      enProgreso: count('EN PROGRESO'),
      pendientes: count('PENDIENTE'),
    }
  }, [data])

  async function handleExportar() {
    if (!data?.length) return
    setExportando(true); setExportError(null)
    try {
      await generarExcelAvanceCaptura({ areas: ordenadas, periodoLabel })
    } catch (e) {
      setExportError(e.message)
    } finally {
      setExportando(false)
    }
  }

  if (loading) return <div style={{ fontSize: '0.85rem', color: C.txtMuted, padding: '2rem', textAlign: 'center' }}>Cargando avance de captura…</div>
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
          📊 Avance de Captura del Mes por Área
        </div>
        <button onClick={handleExportar} disabled={exportando || !data?.length}
          style={{ background: exportando ? '#444' : `linear-gradient(135deg,#1a3a1a,#1e6b1e)`, border: 'none', borderRadius: 8, color: C.txt, padding: '0.5rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: exportando || !data?.length ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
          {exportando ? '⏳ Generando…' : '📊 Exportar Excel'}
        </button>
      </div>
      {exportError && (
        <div style={{ fontSize: '0.72rem', color: '#C00000', marginBottom: '1rem' }}>⚠️ {exportError}</div>
      )}

      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <KPI label="Total de áreas" value={resumen.total} icon="🏢" color={C.dorado}/>
          <KPI label="Captura completa" value={resumen.completas} icon="✅" color={ESTADO_COLOR.COMPLETO}/>
          <KPI label="En progreso" value={resumen.enProgreso} icon="🕓" color={ESTADO_COLOR['EN PROGRESO']}/>
          <KPI label="Sin captura" value={resumen.pendientes} icon="⚠️" color={ESTADO_COLOR.PENDIENTE}/>
          <KPI label="Periodo actual" value={periodoLabel} icon="📅" color={C.doradoLight}/>
        </div>
      )}

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgPanel }}>
                {['Área', 'Total Indicadores', 'Capturados', 'Validados', '% Captura', '% Validación', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Área' ? 'left' : 'center', padding: '0.6rem 0.7rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.62rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenadas.map(a => (
                <tr key={a.area_id} style={{ borderBottom: `1px solid ${C.border}55` }}>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txt, fontWeight: 600 }}>{a.area}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.total_indicadores}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.capturados}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.validados}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.pct_captura != null ? `${a.pct_captura}%` : '—'}</td>
                  <td style={{ padding: '0.55rem 0.7rem', color: C.txtSub, textAlign: 'center' }}>{a.pct_validacion != null ? `${a.pct_validacion}%` : '—'}</td>
                  <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center' }}><Badge estado={a.estado_captura}/></td>
                  <td style={{ padding: '0.55rem 0.7rem', textAlign: 'center' }}>
                    <button onClick={() => abrirDetalle(a)}
                      style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.35rem 0.7rem', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      🔍 Ver indicadores
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: detalle de indicadores del área ── */}
      {detalleArea && (
        <div style={overlay} onClick={() => setDetalleArea(null)}>
          <div style={{ ...modalBox, maxWidth: 920 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: C.txt }}>{detalleArea.area}</div>
                <div style={{ fontSize: '0.68rem', color: C.txtMuted }}>Indicadores · {periodoLabel}</div>
              </div>
              <button onClick={() => setDetalleArea(null)}
                style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.txtMuted, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                ✕ Cerrar
              </button>
            </div>

            {detalleLoading && <div style={{ fontSize: '0.8rem', color: C.txtMuted, padding: '1rem', textAlign: 'center' }}>Cargando indicadores…</div>}
            {detalleError && (
              <div style={{ background: '#1a0505', border: `1px solid ${C.error}`, borderRadius: 8, padding: '0.75rem 1rem', color: C.error, fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                ⚠️ {detalleError}
              </div>
            )}

            {!detalleLoading && !detalleError && (
              <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgPanel }}>
                      {['Clave', 'Indicador', 'Meta', 'Resultado', '%', 'Semáforo', 'Validado', 'Acciones'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Indicador' ? 'left' : 'center', padding: '0.55rem 0.6rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem', position: 'sticky', top: 0, background: C.bgPanel }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map(row => (
                      <tr key={row.indicador_id} style={{ borderBottom: `1px solid ${C.border}55` }}>
                        <td style={{ padding: '0.5rem 0.6rem', color: C.txtSub, whiteSpace: 'nowrap' }}>{row.clave}</td>
                        <td style={{ padding: '0.5rem 0.6rem', color: C.txt }}>{row.nombre}</td>
                        <td style={{ padding: '0.5rem 0.6rem', color: C.txtSub, textAlign: 'center' }}>{row.meta_programada ?? '—'}</td>
                        <td style={{ padding: '0.5rem 0.6rem', color: C.txtSub, textAlign: 'center' }}>{row.resultado ?? '—'}</td>
                        <td style={{ padding: '0.5rem 0.6rem', color: C.txtSub, textAlign: 'center' }}>{pctStr(row.pct_cumplimiento)}</td>
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>
                          {row.semaforo
                            ? <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fff', background: SEM_COLOR[row.semaforo] || '#555', padding: '2px 7px', borderRadius: 6 }}>{row.semaforo}</span>
                            : <span style={{ color: C.txtMuted }}>—</span>}
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>{row.validado ? '✅' : '—'}</td>
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.validado && row.avance_id ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button onClick={() => abrirCorregir(row)}
                                style={{ background: C.correccion, border: 'none', borderRadius: 6, color: '#241a05', padding: '0.3rem 0.55rem', fontSize: '0.65rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>
                                ✏️ Corregir
                              </button>
                              <button onClick={() => abrirDesvalidar(row)}
                                style={{ background: C.desvalidar, border: 'none', borderRadius: 6, color: '#2a1600', padding: '0.3rem 0.55rem', fontSize: '0.65rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>
                                ↩️ Desvalidar
                              </button>
                            </div>
                          ) : <span style={{ color: C.txtMuted }}>—</span>}
                        </td>
                      </tr>
                    ))}
                    {!detalle.length && (
                      <tr><td colSpan={8} style={{ padding: '1rem', textAlign: 'center', color: C.txtMuted }}>Esta área no tiene indicadores asignados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: corregir avance validado ── */}
      {corrigiendo && (
        <div style={overlay} onClick={() => !corrSaving && setCorrigiendo(null)}>
          <div style={{ ...modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: C.correccion, marginBottom: 4 }}>✏️ Corregir avance validado</div>
            <div style={{ fontSize: '0.72rem', color: C.txtMuted, marginBottom: '1rem' }}>
              {corrigiendo.clave} · {corrigiendo.nombre} · {periodoLabel}
            </div>

            {corrError && (
              <div style={{ background: '#1a0505', border: `1px solid ${C.error}`, borderRadius: 8, padding: '0.6rem 0.85rem', color: C.error, fontSize: '0.75rem', marginBottom: '0.85rem' }}>
                ⚠️ {corrError}
              </div>
            )}

            <div style={{ display: 'grid', gap: '0.85rem' }}>
              <div>
                <label style={label}>Nuevo resultado</label>
                <input type="number" step="any" value={corrForm.resultado}
                  onChange={e => setCorrForm(f => ({ ...f, resultado: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={label}>Nueva meta (opcional — deja igual si no cambia)</label>
                <input type="number" step="any" value={corrForm.meta}
                  onChange={e => setCorrForm(f => ({ ...f, meta: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={label}>Justificación (mínimo 10 caracteres)</label>
                <textarea rows={3} value={corrForm.justificacion}
                  onChange={e => setCorrForm(f => ({ ...f, justificacion: e.target.value }))}
                  style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}/>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
              <button onClick={guardarCorreccion} disabled={corrSaving}
                style={{ flex: 1, background: corrSaving ? '#444' : C.correccion, border: 'none', borderRadius: 8, color: '#241a05', padding: '0.65rem', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: corrSaving ? 'not-allowed' : 'pointer' }}>
                {corrSaving ? '⏳ Guardando…' : '💾 Guardar corrección'}
              </button>
              <button onClick={() => setCorrigiendo(null)} disabled={corrSaving}
                style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.txtMuted, padding: '0.65rem 1rem', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: desvalidar avance ── */}
      {desvalidando && (
        <div style={overlay} onClick={() => !desvSaving && setDesvalidando(null)}>
          <div style={{ ...modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: C.desvalidar, marginBottom: 4 }}>↩️ Desvalidar avance</div>
            <div style={{ fontSize: '0.72rem', color: C.txtMuted, marginBottom: '1rem' }}>
              {desvalidando.clave} · {desvalidando.nombre} · {periodoLabel}
            </div>

            <div style={{ background: '#2a1600', border: `1px solid ${C.desvalidar}`, borderRadius: 8, padding: '0.75rem 1rem', color: C.doradoLight, fontSize: '0.76rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Esta acción devolverá el indicador al enlace para que lo recapture. El avance actual se conserva pero quedará desbloqueado.
            </div>

            {desvError && (
              <div style={{ background: '#1a0505', border: `1px solid ${C.error}`, borderRadius: 8, padding: '0.6rem 0.85rem', color: C.error, fontSize: '0.75rem', marginBottom: '0.85rem' }}>
                ⚠️ {desvError}
              </div>
            )}

            <label style={label}>Motivo de desvalidación (mínimo 10 caracteres)</label>
            <textarea rows={3} value={desvMotivo} onChange={e => setDesvMotivo(e.target.value)}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}/>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
              <button onClick={confirmarDesvalidacion} disabled={desvSaving}
                style={{ flex: 1, background: desvSaving ? '#444' : C.desvalidar, border: 'none', borderRadius: 8, color: '#2a1600', padding: '0.65rem', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: desvSaving ? 'not-allowed' : 'pointer' }}>
                {desvSaving ? '⏳ Procesando…' : '↩️ Confirmar desvalidación'}
              </button>
              <button onClick={() => setDesvalidando(null)} disabled={desvSaving}
                style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.txtMuted, padding: '0.65rem 1rem', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
