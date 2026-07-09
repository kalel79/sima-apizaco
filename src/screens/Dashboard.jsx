import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, ResponsiveContainer } from 'recharts'
import { useDashboardGlobal, useResumenEjes, useIndicadores } from '../hooks/useSupabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { getSemaforo, semColor } from '../utils/semaforo.js'
import { C } from '../theme.js'
import { Spinner, ErrMsg, Pill, Barra, KPI } from '../components/ui.jsx'
import FichaIndicador from '../components/FichaIndicador'

/* ── DASHBOARD ───────────────────────────────────────────────── */
export default function PantallaDashboard() {
  const {data:g,    loading:lg, error:eg, refetch:rg} = useDashboardGlobal()
  const {data:ejes, loading:le, error:ee, refetch:re} = useResumenEjes()
  const [selEje, setSelEje] = useState(null)
  const { mesActual, anioActual } = useConfiguracionCtx()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)

  if (lg||le) return <Spinner/>
  if (eg) return <ErrMsg msg={eg} onRetry={rg}/>
  if (ee) return <ErrMsg msg={ee} onRetry={re}/>

  const pct    = g?.pct_global || 0
  const pctPct = (pct*100).toFixed(1)
  const semG   = getSemaforo(pct)
  const colG   = semColor(semG)

  const pieData = [
    {name:'Óptimo',  value:g?.optimo  ||0, fill:C.optimoB},
    {name:'Adecuado',value:g?.adecuado||0, fill:C.adecuadoB},
    {name:'Riesgo',  value:g?.riesgo  ||0, fill:C.riesgoB},
    {name:'Crítico', value:g?.critico ||0, fill:C.criticoB},
  ]
  const barData = (ejes||[]).map(e=>({
    name: e.codigo,
    pct:  +((Math.min(e.pct_promedio||0,1.0))*100).toFixed(1),
    fill: e.color_hex||C.guinda
  }))

  return (
    <div>
      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.65rem',marginBottom:'1.2rem'}}>
        <KPI label="Cumplimiento global" value={`${pctPct}%`}              sub={periodoLabel}         icon="📊" color={colG}/>
        <KPI label="Con avance"          value={g?.total_indicadores||0}   sub="indicadores capturados" icon="🎯" color={C.dorado}/>
        <KPI label="Ejes estratégicos"   value={(ejes||[]).length}          sub="MIR 2024–2027"       icon="🏛️" color={C.guinda}/>
        <KPI label="Riesgo / Crítico"    value={(g?.riesgo||0)+(g?.critico||0)} sub="requieren atención" icon="🔴" color={C.criticoB}/>
        <KPI label="Óptimo / Adecuado"   value={(g?.optimo||0)+(g?.adecuado||0)} sub="buen desempeño" icon="✅" color={C.optimoB}/>
      </div>

      {/* Gauge + Pie + Barras */}
      <div style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr',gap:'1rem',background:C.bgCard,borderRadius:12,padding:'1.2rem',marginBottom:'1.2rem',border:`1px solid ${colG}44`,alignItems:'center'}}>
        <div style={{textAlign:'center'}}>
          <svg width="110" height="95" viewBox="0 0 110 95">
            <circle cx="55" cy="58" r="42" fill="none" stroke="#ffffff08" strokeWidth={10}
              strokeDasharray={`${2*Math.PI*42*0.75} ${2*Math.PI*42}`}
              strokeDashoffset={-(2*Math.PI*42*0.125)} strokeLinecap="round"/>
            <circle cx="55" cy="58" r="42" fill="none" stroke={colG} strokeWidth={10}
              strokeDasharray={`${2*Math.PI*42*0.75*Math.min(pct,1.0)} ${2*Math.PI*42}`}
              strokeDashoffset={-(2*Math.PI*42*0.125)} strokeLinecap="round"/>
            <text x="55" y="55" textAnchor="middle" fill={colG} fontSize={14} fontWeight={700} fontFamily="Georgia,serif">{pctPct}%</text>
            <text x="55" y="70" textAnchor="middle" fill={C.txtMuted} fontSize={7}>CUMPLIMIENTO</text>
          </svg>
          <div style={{fontSize:'0.65rem',color:colG,letterSpacing:1,fontWeight:700}}>{semG}</div>
        </div>

        <div>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.txtMuted,textTransform:'uppercase',marginBottom:4}}>Semáforo municipal</div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={46} dataKey="value" paddingAngle={2}>
                {pieData.map((p,i)=><Cell key={i} fill={p.fill}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'#1C1C1C',border:'1px solid #C8A96E',borderRadius:8,color:'#F0EAE0',fontSize:12,fontFamily:'Inter, sans-serif'}} labelStyle={{color:'#C8A96E',fontWeight:600}} itemStyle={{color:'#F0EAE0'}} formatter={(v,n)=>[`${v} ind.`,n]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
            {pieData.map(p=>(
              <div key={p.name} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:p.fill}}/>
                <span style={{fontSize:'0.63rem',color:C.txtMuted}}>{p.name}: <strong style={{color:p.fill}}>{p.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.txtMuted,textTransform:'uppercase',marginBottom:4}}>% por eje</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={barData} margin={{top:0,right:0,left:-25,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08"/>
              <XAxis dataKey="name" tick={{fill:C.txtMuted,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.txtMuted,fontSize:8}} domain={[0,100]}/>
              <Tooltip contentStyle={{background:'#1C1C1C',border:'1px solid #C8A96E',borderRadius:8,color:'#F0EAE0',fontSize:12,fontFamily:'Inter, sans-serif'}} labelStyle={{color:'#C8A96E',fontWeight:600}} itemStyle={{color:'#F0EAE0'}} formatter={v=>[`${v}%`,'Avance']}/>
              <Bar dataKey="pct" radius={[3,3,0,0]}>{barData.map((d,i)=><Cell key={i} fill={d.fill}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ejes */}
      <div style={{fontSize:'0.62rem',letterSpacing:3,color:C.txtMuted,textTransform:'uppercase',marginBottom:'0.6rem'}}>Ejes estratégicos · Toca para ver indicadores</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:'0.65rem'}}>
        {(ejes||[]).map(eje=>{
          const p   = eje.pct_promedio||0
          const sem = getSemaforo(p)
          const col = semColor(sem)
          const sel = selEje===eje.codigo
          return (
            <div key={eje.codigo} onClick={()=>setSelEje(sel?null:eje.codigo)}
              style={{background:sel?C.bgPanel:C.bgCard,border:`1px solid ${sel?eje.color_hex:C.border}`,borderLeft:`4px solid ${eje.color_hex}`,borderRadius:12,padding:'1rem 1.2rem',cursor:'pointer',transition:'all 0.18s',boxShadow:sel?`0 0 10px ${eje.color_hex}33`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <span style={{fontSize:18}}>{eje.icono}</span>
                <Pill sem={sem}/>
              </div>
              <div style={{fontSize:'0.78rem',fontWeight:600,color:C.txt,lineHeight:1.3,marginBottom:8}}>{eje.eje}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <Barra pct={Math.min(p,1.0)} color={col} h={8}/>
                <span style={{fontSize:'1rem',fontWeight:800,color:col,minWidth:44,textAlign:'right'}}>{(p*100).toFixed(1)}%</span>
              </div>
              <div style={{display:'flex',gap:10,fontSize:'0.63rem',color:C.txtMuted,flexWrap:'wrap'}}>
                <span>📊 {eje.total_indicadores} ind.</span>
                <span style={{color:C.optimoB}}>🟢 {eje.optimo}</span>
                <span style={{color:C.adecuadoB}}>🟩 {eje.adecuado}</span>
                {eje.riesgo >0 && <span style={{color:C.riesgoB}}>🟡 {eje.riesgo}</span>}
                {eje.critico>0 && <span style={{color:C.criticoB}}>🔴 {eje.critico}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {selEje && <DetalleEje ejeId={selEje} color={(ejes||[]).find(e=>e.codigo===selEje)?.color_hex||C.guinda}/>}
    </div>
  )
}

function DetalleEje({ejeId, color}) {
  const filtros = useMemo(()=>({ejeId}),[ejeId])
  const {data, loading, error} = useIndicadores(filtros)
  const { anioActual } = useConfiguracionCtx()
  const [fichaRow, setFichaRow] = useState(null)
  if (loading) return <Spinner/>
  if (error)   return <ErrMsg msg={error}/>
  return (
    <div style={{marginTop:'1rem',background:C.bgCard,border:`1px solid ${color}55`,borderRadius:12,padding:'1rem'}}>
      <div style={{fontSize:'0.62rem',letterSpacing:3,color,textTransform:'uppercase',marginBottom:8}}>Indicadores del eje</div>
      {(data||[]).map(row=>{
        const col = semColor(row.semaforo)
        return (
          <div key={row.id} style={{background:C.bgPanel,borderRadius:7,padding:'0.65rem 0.85rem',marginBottom:5,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:5}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.65rem',color:C.txtMuted,marginBottom:2}}>{row.nivel_mir} · {row.area}</div>
                <div style={{fontSize:'0.8rem',fontWeight:600,color:C.txt,lineHeight:1.3}}>{row.indicador}</div>
              </div>
              <Pill sem={row.semaforo}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Barra pct={Math.min(row.pct_cumplimiento,1.0)} color={col} h={5}/>
              <span style={{fontSize:'0.78rem',fontWeight:700,color:col,minWidth:44,textAlign:'right'}}>{((row.pct_cumplimiento||0)*100).toFixed(1)}%</span>
              <span style={{fontSize:'0.62rem',color:C.txtMuted,minWidth:55}}>{row.resultado}/{row.meta_evaluable}</span>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:5}}>
              <button onClick={()=>setFichaRow(row)}
                style={{background:'none',border:`1px solid ${C.border}`,borderRadius:6,color:C.doradoLight,padding:'0.25rem 0.55rem',cursor:'pointer',fontSize:'0.65rem'}}>
                📈 Ver ficha
              </button>
            </div>
          </div>
        )
      })}

      {fichaRow && (
        <FichaIndicador
          indicadorId={fichaRow.indicador_id}
          nombre={fichaRow.indicador}
          area={fichaRow.area}
          ejeCodigo={fichaRow.eje_codigo}
          nivelMir={fichaRow.nivel_mir}
          anioInicial={anioActual}
          onClose={()=>setFichaRow(null)}
        />
      )}
    </div>
  )
}
