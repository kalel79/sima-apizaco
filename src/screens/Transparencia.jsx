import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LOGO_BASE64 } from '../logo.js'
import { getTransparenciaPublica } from '../lib/cierres.js'
import { getSemaforo, semColor } from '../utils/semaforo.js'
import { C } from '../theme.js'
import { Spinner, ErrMsg, Pill, Barra } from '../components/ui.jsx'

const MESES_FULL = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]
const mesLabel = (mes, anio) => `${MESES_FULL[mes - 1]} de ${anio}`
const mesCorto = (mes, anio) => `${MESES_FULL[mes - 1].slice(0, 3)} ${String(anio).slice(2)}`

// Ruta pública SIN LOGIN (ver src/main.jsx: se monta en vez de <App/> para
// /transparencia). Todo el dato viene de get_transparencia_publica(), una
// función SECURITY DEFINER que solo expone meses ya cerrados y publicados
// explícitamente por Planeación — ver supabase/migrations/
// 20260717120000_fase31_portal_transparencia.sql.
export default function Transparencia() {
  const [meses, setMeses]     = useState(undefined) // undefined=cargando
  const [error, setError]     = useState(null)

  useEffect(() => {
    getTransparenciaPublica().then(setMeses).catch(e => setError(e.message))
  }, [])

  const actual       = meses?.[0] || null
  const historicoAsc = useMemo(() => meses ? [...meses].reverse() : [], [meses])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.txt, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{`*{box-sizing:border-box} a{color:inherit}`}</style>

      <header style={{ background: `linear-gradient(90deg,${C.guindaDark} 0%,${C.guinda} 100%)`, borderBottom: '3px solid #C8A96E', padding: '1.4rem 1.2rem' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.dorado}`, flexShrink: 0 }}>
            <img src={LOGO_BASE64} alt="Escudo del H. Ayuntamiento de Apizaco" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.doradoLight, textTransform: 'uppercase' }}>H. Ayuntamiento de Apizaco · 2024–2027</div>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.3rem,4vw,1.7rem)', letterSpacing: 2, color: '#fff', margin: '2px 0' }}>Transparencia SIMA</h1>
            <div style={{ fontSize: '0.68rem', color: C.doradoLight }}>Resultados públicos de los indicadores municipales</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '1.4rem 1.1rem 3rem' }}>
        <p style={{ fontSize: '0.85rem', color: C.txtSub, lineHeight: 1.6, maxWidth: '62ch', marginBottom: '1.6rem' }}>
          Aquí puedes consultar, sin necesidad de una cuenta, qué tanto ha cumplido el Ayuntamiento las metas
          que se propuso en su Plan Municipal de Desarrollo. Las cifras corresponden a meses ya cerrados y
          revisados por la Dirección de Planeación y Evaluación.
        </p>

        {meses === undefined && <Spinner />}
        {error && <ErrMsg msg={error} onRetry={() => window.location.reload()} />}

        {meses && meses.length === 0 && (
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.6rem', textAlign: 'center', color: C.txtMuted, fontSize: '0.85rem' }}>
            📭 Todavía no hay un mes publicado en este portal. Vuelve pronto.
          </div>
        )}

        {actual && (
          <>
            <ResumenMes cierre={actual} />
            <Destacados items={actual.destacados} mes={actual.mes} anio={actual.anio} />
            <AvancePorEje ejes={actual.resumen_ejes} />
            {historicoAsc.length >= 2 && <Evolucion meses={historicoAsc} />}
          </>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '1rem', textAlign: 'center', fontSize: '0.62rem', color: C.txtMuted, letterSpacing: 0.5, lineHeight: 1.7 }}>
        Datos generados por el Sistema de Información Municipal de Avance (SIMA) · Dirección de Planeación y Evaluación<br />
        H. Ayuntamiento de Apizaco · 2024–2027
      </footer>
    </div>
  )
}

function ResumenMes({ cierre }) {
  const g    = cierre.resumen_global || {}
  const pct  = g.pct_global || 0
  const sem  = getSemaforo(pct)
  const col  = semColor(sem)
  const pctS = (pct * 100).toFixed(1)

  const frases = {
    'ÓPTIMO':   'un desempeño sobresaliente, por encima de lo comprometido',
    'ADECUADO': 'un cumplimiento en línea con lo comprometido',
    'RIESGO':   'un avance por debajo de lo comprometido, en seguimiento',
    'CRÍTICO':  'un rezago importante respecto a lo comprometido',
  }

  return (
    <section style={{ background: C.bgCard, border: `1px solid ${col}55`, borderRadius: 14, padding: '1.5rem', marginBottom: '1.4rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.txtMuted, textTransform: 'uppercase', marginBottom: 10 }}>
        Corte de {mesLabel(cierre.mes, cierre.anio)}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 'clamp(2.4rem,8vw,3.2rem)', fontWeight: 900, color: col, fontFamily: 'Georgia,serif' }}>{pctS}%</span>
        <Pill sem={sem} />
      </div>
      <p style={{ fontSize: '0.85rem', color: C.txt, lineHeight: 1.6, maxWidth: '58ch' }}>
        El Ayuntamiento cumplió el <strong style={{ color: col }}>{pctS}%</strong> de las metas comprometidas
        en sus {g.total_indicadores || 0} indicadores con información a {mesLabel(cierre.mes, cierre.anio)}:
        {' '}{frases[sem]}.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, fontSize: '0.72rem', color: C.txtMuted }}>
        <span style={{ color: C.optimoB }}>🟢 {g.optimo || 0} óptimos</span>
        <span style={{ color: C.adecuadoB }}>🟩 {g.adecuado || 0} adecuados</span>
        <span style={{ color: C.riesgoB }}>🟡 {g.riesgo || 0} en riesgo</span>
        <span style={{ color: C.criticoB }}>🔴 {g.critico || 0} críticos</span>
      </div>
    </section>
  )
}

function Destacados({ items, mes, anio }) {
  if (!items?.length) return null
  return (
    <section style={{ marginBottom: '1.4rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.txtMuted, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Indicadores destacados de {mesLabel(mes, anio)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '0.65rem' }}>
        {items.map((ind, i) => {
          const col = semColor(ind.semaforo)
          return (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: '0.65rem', color: C.txtMuted }}>{ind.area}</span>
                <Pill sem={ind.semaforo} />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.txt, lineHeight: 1.35, marginBottom: 8 }}>{ind.nombre}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: col }}>{((ind.pct || 0) * 100).toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AvancePorEje({ ejes }) {
  if (!ejes?.length) return null
  return (
    <section style={{ marginBottom: '1.4rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.txtMuted, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Avance por eje estratégico
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '0.65rem' }}>
        {ejes.map(eje => {
          const p   = eje.pct_promedio || 0
          const sem = getSemaforo(p)
          const col = semColor(sem)
          return (
            <div key={eje.codigo} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderLeft: `4px solid ${eje.color_hex}`, borderRadius: 12, padding: '1rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 17 }}>{eje.icono}</span>
                <Pill sem={sem} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.txt, lineHeight: 1.3, marginBottom: 8 }}>{eje.eje}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Barra pct={Math.min(p, 1.0)} color={col} h={7} />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: col, minWidth: 44, textAlign: 'right' }}>{(p * 100).toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Evolucion({ meses }) {
  const data = meses.map(m => ({
    label: mesCorto(m.mes, m.anio),
    pct: +(((m.resumen_global?.pct_global) || 0) * 100).toFixed(1),
  }))
  return (
    <section style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.txtMuted, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Evolución del cumplimiento global
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.1rem 0.8rem' }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="label" tick={{ fill: C.txtMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.txtMuted, fontSize: 9 }} domain={[0, 'dataMax + 10']} />
            <Tooltip
              contentStyle={{ background: '#1C1C1C', border: '1px solid #C8A96E', borderRadius: 8, color: '#F0EAE0', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              labelStyle={{ color: '#C8A96E', fontWeight: 600 }} itemStyle={{ color: '#F0EAE0' }}
              formatter={v => [`${v}%`, 'Cumplimiento']}
            />
            <Line type="monotone" dataKey="pct" stroke={C.dorado} strokeWidth={2.5} dot={{ r: 3, fill: C.dorado }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
