import { useState, useMemo } from 'react'
import { useIndicadores } from '../hooks/useSupabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { semColor } from '../utils/semaforo.js'
import { C } from '../theme.js'
import { Spinner, ErrMsg, Pill, Barra } from '../components/ui.jsx'
import SeccionEvidencias from '../components/SeccionEvidencias'

/* ── INDICADORES ─────────────────────────────────────────────── */
export default function PantallaIndicadores() {
  const [busqueda, setBusqueda] = useState('')
  const [semaforo, setSemaforo] = useState('')
  const filtros = useMemo(()=>({busqueda,semaforo}),[busqueda,semaforo])
  const {data, loading, error, refetch} = useIndicadores(filtros)
  const { mesActual, anioActual } = useConfiguracionCtx()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  const [expandido, setExpandido] = useState(null)

  const inp = {background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:6,color:C.txt,padding:'0.45rem 0.7rem',fontSize:'0.78rem',fontFamily:'inherit',outline:'none'}

  return (
    <div>
      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.8rem'}}>
        <input placeholder="🔍 Buscar indicador o área…" value={busqueda}
          onChange={e=>setBusqueda(e.target.value)} style={{...inp,flex:'1 1 200px'}}/>
        <select value={semaforo} onChange={e=>setSemaforo(e.target.value)} style={inp}>
          <option value="">Todos los semáforos</option>
          {['ÓPTIMO','ADECUADO','RIESGO','CRÍTICO'].map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={refetch} style={{...inp,cursor:'pointer',background:C.bgPanel}}>🔄</button>
      </div>

      {loading && <Spinner/>}
      {error   && <ErrMsg msg={error} onRetry={refetch}/>}

      {!loading && !error && (
        <>
          <div style={{fontSize:'0.68rem',color:C.txtMuted,marginBottom:'0.7rem'}}>
            {(data||[]).length} indicadores con avance · {periodoLabel}
          </div>
          {(data||[]).map(row=>{
            const col = semColor(row.semaforo)
            const abierto = expandido === row.id
            return (
              <div key={row.id} onClick={()=>setExpandido(abierto ? null : row.id)}
                style={{background:C.bgCard,border:`1px solid ${abierto?C.dorado:C.border}`,borderLeft:`4px solid ${row.eje_color||C.guinda}`,borderRadius:8,padding:'0.8rem 0.95rem',marginBottom:'0.55rem',cursor:'pointer'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:6,marginBottom:7}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:3}}>
                      <span style={{fontSize:'0.6rem',background:(row.eje_color||C.guinda)+'22',color:row.eje_color||C.guinda,border:`1px solid ${(row.eje_color||C.guinda)}44`,padding:'1px 6px',borderRadius:4}}>
                        {row.eje_icono} {row.eje_codigo}
                      </span>
                      <span style={{fontSize:'0.62rem',color:C.txtSub}}>{row.nivel_mir}</span>
                    </div>
                    <div style={{fontSize:'0.82rem',fontWeight:600,color:C.txt,lineHeight:1.35}}>{row.indicador}</div>
                    <div style={{fontSize:'0.65rem',color:C.txtMuted,marginTop:3}}>{row.area}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                    <Pill sem={row.semaforo}/>
                    <span style={{fontSize:'0.7rem',color:row.tendencia==='▲'?C.optimoB:row.tendencia==='▼'?C.criticoB:C.txtMuted}}>{row.tendencia}</span>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <Barra pct={Math.min(row.pct_cumplimiento,1.0)} color={col}/>
                  <span style={{fontSize:'0.82rem',fontWeight:700,color:col,minWidth:44,textAlign:'right'}}>{((row.pct_cumplimiento||0)*100).toFixed(1)}%</span>
                </div>
                <div style={{display:'flex',gap:14,marginTop:5,fontSize:'0.65rem',color:C.txtMuted}}>
                  <span>📌 Meta: <strong style={{color:C.doradoLight}}>{row.meta_evaluable}</strong></span>
                  <span>📊 Real: <strong style={{color:col}}>{row.resultado}</strong></span>
                </div>
                {abierto && (
                  <div onClick={e=>e.stopPropagation()}>
                    <SeccionEvidencias indicadorId={row.indicador_id} mes={mesActual} anio={anioActual}/>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
