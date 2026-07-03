import { useMemo, useState } from 'react'
import { useAvanceCapturaAreas } from '../hooks/useSupabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { generarExcelAvanceCaptura } from '../utils/reportes'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C8A96E', doradoLight: '#E2C998',
  bg: '#0D0D0D', bgCard: '#161616', bgPanel: '#1C1C1C',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050', txtSub: '#A09080',
}

const ESTADO_COLOR = {
  COMPLETO:          '#00B050',
  'EN PROGRESO':     '#FFC000',
  PENDIENTE:         '#C00000',
  'SIN INDICADORES': '#5a5a5a',
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
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  const [exportando, setExportando] = useState(false)
  const [exportError, setExportError] = useState(null)

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
                {['Área', 'Total Indicadores', 'Capturados', 'Validados', '% Captura', '% Validación', 'Estado'].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
