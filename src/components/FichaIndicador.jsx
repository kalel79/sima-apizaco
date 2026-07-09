import { useState, useEffect, useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { jsPDF } from 'jspdf'
import { getAniosDisponiblesIndicador, getFichaIndicador } from '../lib/supabase'
import { semColor } from '../utils/semaforo.js'
import { MESES_NOMBRES } from '../utils/reportesBase.js'
import { C } from '../theme.js'
import { Spinner, ErrMsg, Pill, KPI } from './ui.jsx'

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
}
const modalBox = {
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '1.4rem', width: '100%', maxWidth: 920, maxHeight: '92vh', overflowY: 'auto',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
}
const COLORES_COMPARACION = ['#4A90D9', '#9B59B6', '#2ECC71']

function CustomDot(props) {
  const { cx, cy, payload } = props
  const color = payload.semaforo ? semColor(payload.semaforo) : C.txtMuted
  if (cx == null || cy == null || payload.resultado == null) return null
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke={C.bg} strokeWidth={1.5} />
}

export default function FichaIndicador({ indicadorId, nombre, area, ejeCodigo, nivelMir, anioInicial, onClose }) {
  const [anios,          setAnios]          = useState([])
  const [anioPrincipal,  setAnioPrincipal]  = useState(anioInicial || null)
  const [aniosComparar,  setAniosComparar]  = useState([])
  const [datosPorAnio,   setDatosPorAnio]   = useState({})
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [exportando,     setExportando]     = useState(null)
  const contenidoRef = useRef(null)

  useEffect(() => {
    getAniosDisponiblesIndicador(indicadorId).then(lista => {
      setAnios(lista)
      setAnioPrincipal(prev => prev && lista.includes(prev) ? prev : (lista[lista.length - 1] ?? anioInicial))
    }).catch(e => setError(e.message))
  }, [indicadorId]) // eslint-disable-line

  const cargarAnio = useCallback(async anio => {
    if (anio == null || datosPorAnio[anio]) return
    const ficha = await getFichaIndicador(indicadorId, anio)
    setDatosPorAnio(prev => ({ ...prev, [anio]: ficha }))
  }, [indicadorId, datosPorAnio])

  useEffect(() => {
    if (anioPrincipal == null) return
    setLoading(true); setError(null)
    Promise.all([anioPrincipal, ...aniosComparar].map(cargarAnio))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [anioPrincipal, aniosComparar]) // eslint-disable-line

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleComparar(anio) {
    setAniosComparar(prev => prev.includes(anio) ? prev.filter(a => a !== anio) : [...prev, anio])
  }

  async function exportar(tipo) {
    if (!contenidoRef.current) return
    setExportando(tipo)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(contenidoRef.current, { backgroundColor: C.bg, scale: 2 })
      const fileBase = `SIMA_Ficha_${(nombre || 'indicador').replace(/[^A-Za-z0-9]/g, '_').slice(0, 40)}_${anioPrincipal}`
      if (tipo === 'png') {
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `${fileBase}.png`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
      } else {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
        const pageW = doc.internal.pageSize.getWidth() - 20
        const pageH = doc.internal.pageSize.getHeight() - 20
        const ratio = Math.min(pageW / canvas.width, pageH / canvas.height)
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, canvas.width * ratio, canvas.height * ratio)
        doc.save(`${fileBase}.pdf`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setExportando(null)
    }
  }

  const principal = datosPorAnio[anioPrincipal]
  const chartData = MESES_NOMBRES.map((label, i) => {
    const mes = i + 1
    const row = { mesLabel: label, meta: principal?.meses?.[i]?.meta ?? null, resultado: principal?.meses?.[i]?.resultado ?? null, semaforo: principal?.meses?.[i]?.semaforo ?? null }
    aniosComparar.forEach(a => { row[`resultado_${a}`] = datosPorAnio[a]?.meses?.[i]?.resultado ?? null })
    return row
  })

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: '0.4rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase' }}>
              📈 Ficha del indicador · {ejeCodigo} · {area} · {nivelMir}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.txt, marginTop: 4, lineHeight: 1.3 }}>{nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.txtMuted, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0.9rem 0' }}>
          <select value={anioPrincipal ?? ''} onChange={e => setAnioPrincipal(+e.target.value)}
            style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.txt, padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontFamily: 'inherit' }}>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {anios.filter(a => a !== anioPrincipal).map(a => (
            <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: C.txtSub, cursor: 'pointer' }}>
              <input type="checkbox" checked={aniosComparar.includes(a)} onChange={() => toggleComparar(a)} />
              Comparar {a}
            </label>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => exportar('png')} disabled={!!exportando} style={btnExport}>
            {exportando === 'png' ? '⏳' : '🖼️'} PNG
          </button>
          <button onClick={() => exportar('pdf')} disabled={!!exportando} style={btnExport}>
            {exportando === 'pdf' ? '⏳' : '📄'} PDF
          </button>
        </div>

        {error && <ErrMsg msg={error} />}
        {loading && <Spinner />}

        {!loading && principal && (
          <div ref={contenidoRef} style={{ background: C.bg, padding: '0.4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.65rem', marginBottom: '1rem' }}>
              <KPI label={`Acumulado ${anioPrincipal}`} value={principal.pctAcumuladoAnual != null ? `${(principal.pctAcumuladoAnual * 100).toFixed(1)}%` : 'Sin datos'} sub={principal.semaforoAcumulado || ''} icon="🎯" color={principal.semaforoAcumulado ? semColor(principal.semaforoAcumulado) : C.txtMuted} />
              <KPI label="Meses capturados" value={principal.meses.filter(m => m.resultado != null).length} sub="de 12 meses" icon="📅" color={C.dorado} />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
                <XAxis dataKey="mesLabel" tick={{ fill: C.txtMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.txtMuted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1C1C1C', border: '1px solid #C8A96E', borderRadius: 8, color: '#F0EAE0', fontSize: 12 }} labelStyle={{ color: '#C8A96E', fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="meta" name="Meta" stroke={C.dorado} strokeDasharray="4 3" dot={false} connectNulls />
                <Line type="monotone" dataKey="resultado" name={`Resultado ${anioPrincipal}`} stroke={C.guinda} strokeWidth={2} dot={<CustomDot />} connectNulls={false} />
                {aniosComparar.map((a, i) => (
                  <Line key={a} type="monotone" dataKey={`resultado_${a}`} name={`Resultado ${a}`} stroke={COLORES_COMPARACION[i % COLORES_COMPARACION.length]} strokeWidth={1.5} dot={false} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', margin: '1.1rem 0 0.5rem' }}>
              Captura y validación por mes · {anioPrincipal}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.74rem' }}>
                <thead>
                  <tr>
                    {['Mes', 'Resultado', 'Semáforo', 'Capturó', 'Validado', 'Validó'].map(h => (
                      <th key={h} style={{ textAlign: 'left', color: C.doradoLight, padding: '0.35rem 0.5rem', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {principal.meses.map(m => (
                    <tr key={m.mes}>
                      <td style={{ padding: '0.3rem 0.5rem', color: C.txt, borderBottom: `1px solid ${C.border}` }}>{MESES_NOMBRES[m.mes - 1]}</td>
                      <td style={{ padding: '0.3rem 0.5rem', color: C.txt, borderBottom: `1px solid ${C.border}` }}>{m.resultado ?? '—'}</td>
                      <td style={{ padding: '0.3rem 0.5rem', borderBottom: `1px solid ${C.border}` }}>{m.semaforo ? <Pill sem={m.semaforo} /> : <span style={{ color: C.txtMuted }}>—</span>}</td>
                      <td style={{ padding: '0.3rem 0.5rem', color: C.txtSub, borderBottom: `1px solid ${C.border}` }}>{m.capturado_por ?? '—'}</td>
                      <td style={{ padding: '0.3rem 0.5rem', color: m.validado ? C.optimoB : C.txtMuted, borderBottom: `1px solid ${C.border}` }}>{m.resultado == null ? '—' : (m.validado ? '✔ validado' : 'pendiente')}</td>
                      <td style={{ padding: '0.3rem 0.5rem', color: C.txtSub, borderBottom: `1px solid ${C.border}` }}>{m.validado_por ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const btnExport = {
  background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.txtSub,
  padding: '0.4rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
}
