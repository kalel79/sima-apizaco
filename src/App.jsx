import { LOGO_BASE64 } from './logo.js'
import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, ResponsiveContainer } from 'recharts'
import {
  useDashboardGlobal, useResumenEjes, useResumenAreas,
  useAlertasLogros, useIndicadores, useIndicadoresLista
} from './hooks/useSupabase'
import {
  guardarAvance, getAvanceActual, getResumenValidacionArea,
  validarInformacionMes, reautenticar,
} from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import { useConfiguracion } from './hooks/useConfiguracion'
import { formatPeriodoLabel } from './utils/periodo'
import { signOut } from './lib/auth'
import Login from './components/Login'
import AdminUsuarios from './components/AdminUsuarios'
import SeccionEvidencias from './components/SeccionEvidencias'

/* ── PALETA INSTITUCIONAL ───────────────────────────────────── */
const C = {
  guinda:'#7B1F2C', guindaMid:'#A52020', guindaDark:'#51141D',
  dorado:'#C8A96E', doradoLight:'#E2C998',
  bg:'#0D0D0D', bgCard:'#161616', bgPanel:'#1C1C1C',
  border:'#2A2A2A', txt:'#F0EAE0', txtMuted:'#706050', txtSub:'#A09080',
  // Semáforo corregido según especificación Hugo
  optimoB:  '#046205',  // verde oscuro óptimo
  adecuadoB:'#00B050',  // verde claro adecuado
  riesgoB:  '#FFC000',  // amarillo riesgo
  criticoB: '#C00000',  // rojo crítico
}

const SEM = {
  'ÓPTIMO':   { color: '#046205', bg: '#046205' },
  'ADECUADO': { color: '#00B050', bg: '#00B050' },
  'RIESGO':   { color: '#FFC000', bg: '#FFC000' },
  'CRÍTICO':  { color: '#C00000', bg: '#C00000' },
}

function semColor(sem) { return SEM[sem]?.color || C.adecuadoB }

function getSemaforo(pct) {
  if (pct > 1.10)  return 'ÓPTIMO'
  if (pct >= 0.90) return 'ADECUADO'
  if (pct >= 0.70) return 'RIESGO'
  return 'CRÍTICO'
}

/* ── COMPONENTES BASE ───────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}>
      <div style={{width:34,height:34,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.guinda}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ErrMsg({msg, onRetry}) {
  return (
    <div style={{background:'#1a0505',border:`1px solid ${C.criticoB}`,borderRadius:8,padding:'1rem',color:C.criticoB,fontSize:'0.82rem'}}>
      ⚠️ {msg}
      {onRetry && <button onClick={onRetry} style={{marginLeft:12,background:C.guinda,border:'none',color:C.txt,padding:'3px 10px',borderRadius:4,cursor:'pointer',fontSize:'0.75rem'}}>Reintentar</button>}
    </div>
  )
}

function Pill({sem}) {
  const color = semColor(sem)
  const textColor = sem === 'RIESGO' ? '#7A5800' : '#fff'
  return (
    <span style={{fontSize:'0.65rem',fontWeight:800,letterSpacing:2,background:color,color:textColor,padding:'2px 8px',borderRadius:6,textTransform:'uppercase',whiteSpace:'nowrap'}}>
      {sem}
    </span>
  )
}

function Barra({pct, color, h=6}) {
  const r = h >= 8 ? 4 : 3
  return (
    <div style={{flex:1,height:h,background:'#ffffff09',borderRadius:r}}>
      <div style={{width:`${Math.min((pct||0)*100,100)}%`,height:'100%',background:color,borderRadius:r,transition:'width 0.8s ease'}}/>
    </div>
  )
}

function KPI({label, value, sub, icon, color}) {
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderTop:`3px solid ${color}`,borderRadius:12,padding:'1.1rem',boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:20}}>{icon}</span>
        <span style={{fontSize:'2rem',fontWeight:800,color}}>{value}</span>
      </div>
      <div style={{fontSize:'0.75rem',color:C.txt,fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:'0.65rem',color:C.txtMuted,marginTop:2}}>{sub}</div>}
    </div>
  )
}

/* ── DASHBOARD ───────────────────────────────────────────────── */
function PantallaDashboard() {
  const {data:g,    loading:lg, error:eg, refetch:rg} = useDashboardGlobal()
  const {data:ejes, loading:le, error:ee, refetch:re} = useResumenEjes()
  const [selEje, setSelEje] = useState(null)
  const { mesActual, anioActual } = useConfiguracion()
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
          </div>
        )
      })}
    </div>
  )
}

/* ── INDICADORES ─────────────────────────────────────────────── */
function PantallaIndicadores() {
  const [busqueda, setBusqueda] = useState('')
  const [semaforo, setSemaforo] = useState('')
  const filtros = useMemo(()=>({busqueda,semaforo}),[busqueda,semaforo])
  const {data, loading, error, refetch} = useIndicadores(filtros)
  const { mesActual, anioActual } = useConfiguracion()
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

/* ── ÁREAS ───────────────────────────────────────────────────── */
function PantallaAreas() {
  const {data, loading, error, refetch} = useResumenAreas()
  const { mesActual, anioActual } = useConfiguracion()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  if (loading) return <Spinner/>
  if (error)   return <ErrMsg msg={error} onRetry={refetch}/>
  return (
    <div>
      <div style={{fontSize:'0.62rem',letterSpacing:3,color:C.txtMuted,textTransform:'uppercase',marginBottom:'0.8rem'}}>
        Áreas responsables · Ranking {periodoLabel}
      </div>
      {(data||[]).map((area,i)=>{
        const p   = Math.min(area.pct_promedio||0, 1.0)
        const col = p>0.90?C.optimoB:p>=0.90?C.adecuadoB:p>=0.70?C.riesgoB:C.criticoB
        const sem = getSemaforo(area.pct_promedio||0)
        const colReal = semColor(sem)
        return (
          <div key={area.area} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`4px solid ${colReal}`,borderRadius:8,padding:'0.75rem 0.95rem',marginBottom:'0.5rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,flexWrap:'wrap',gap:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:'0.65rem',color:C.txtMuted,minWidth:20}}>#{i+1}</span>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:600,color:C.txt}}>{area.area}</div>
                  <div style={{fontSize:'0.62rem',color:C.txtMuted,marginTop:2}}>
                    {area.eje_icono} {area.eje_codigo} · {area.total_indicadores} indicadores
                  </div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'1.05rem',fontWeight:800,color:colReal,fontFamily:'Georgia,serif'}}>
                  {((area.pct_promedio||0)*100).toFixed(1)}%
                </div>
                <div style={{display:'flex',gap:5,justifyContent:'flex-end',fontSize:'0.6rem',marginTop:2}}>
                  {area.en_ok  >0 && <span style={{color:C.optimoB}}>✓{area.en_ok}</span>}
                  {area.riesgo >0 && <span style={{color:C.riesgoB}}>⚠{area.riesgo}</span>}
                  {area.critico>0 && <span style={{color:C.criticoB}}>✖{area.critico}</span>}
                </div>
              </div>
            </div>
            <Barra pct={p} color={colReal} h={5}/>
          </div>
        )
      })}
    </div>
  )
}

/* ── ALERTAS ─────────────────────────────────────────────────── */
function PantallaAlertas() {
  const {data, loading, error, refetch} = useAlertasLogros()
  if (loading) return <Spinner/>
  if (error)   return <ErrMsg msg={error} onRetry={refetch}/>

  const criticos = (data||[]).filter(r=>r.semaforo==='CRÍTICO').slice(0,10)
  const riesgo   = (data||[]).filter(r=>r.semaforo==='RIESGO').slice(0,8)
  const logros   = (data||[]).filter(r=>r.semaforo==='ÓPTIMO').slice(0,10)

  const Grupo = ({titulo, items, color}) => (
    <div style={{marginBottom:'1.5rem'}}>
      <div style={{fontSize:'0.65rem',letterSpacing:2,color,textTransform:'uppercase',borderBottom:`1px solid ${color}44`,paddingBottom:6,marginBottom:'0.6rem'}}>
        {titulo} ({items.length})
      </div>
      {items.length===0
        ? <div style={{fontSize:'0.78rem',color:C.txtMuted}}>Sin registros</div>
        : items.map((r,i)=>{
            const textColor = color === C.riesgoB ? '#7A5800' : '#fff'
            return (
              <div key={i} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderLeft:`4px solid ${color}`,borderRadius:8,padding:'0.75rem 0.95rem',marginBottom:'0.5rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,marginBottom:4}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.65rem',color:C.txtMuted,marginBottom:2}}>{r.area} · {r.eje_icono} {r.eje_codigo}</div>
                    <div style={{fontSize:'0.8rem',fontWeight:600,color:C.txt}}>{r.indicador}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'1rem',fontWeight:800,color}}>{((r.pct_cumplimiento||0)*100).toFixed(1)}%</div>
                    {r.brecha>0 && <div style={{fontSize:'0.62rem',color:C.txtMuted}}>Brecha: {parseFloat(r.brecha).toFixed(1)}</div>}
                  </div>
                </div>
                <Barra pct={Math.min(r.pct_cumplimiento,1.0)} color={color} h={4}/>
              </div>
            )
          })
      }
    </div>
  )

  return (
    <div>
      <Grupo titulo="🔴 Indicadores críticos" items={criticos} color={C.criticoB}/>
      <Grupo titulo="🟡 En riesgo"            items={riesgo}   color={C.riesgoB}/>
      <Grupo titulo="🏆 Logros destacados"    items={logros}   color={C.optimoB}/>
    </div>
  )
}

/* ── CAPTURA ─────────────────────────────────────────────────── */
const ANIOS_PROGRAMA = [2024, 2025, 2026, 2027]

function PantallaCaptura({ areaCoordinador }) {
  const { profile, isEnlace, user } = useAuth()
  const {data:listaCompleta, loading:loadLista} = useIndicadoresLista()
  const { mesActual, anioActual, loading: cfgLoading } = useConfiguracion()
  const lista = useMemo(() => {
    if (!listaCompleta) return []
    if (areaCoordinador) return listaCompleta.filter(i => i.area_nombre === areaCoordinador)
    return listaCompleta
  }, [listaCompleta, areaCoordinador])
  const [form,   setForm]   = useState({indicadorId:'', mes: mesActual ?? 5, anio: anioActual ?? 2026, resultado:'', observaciones:''})
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busq,   setBusq]   = useState('')
  const [evVersion, setEvVersion] = useState(0)
  const [estadoAvance, setEstadoAvance] = useState(null)
  const [resumenVal, setResumenVal] = useState(null)
  const [showValidarModal, setShowValidarModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [validando, setValidando] = useState(false)
  const [validarError, setValidarError] = useState(null)

  // El enlace siempre captura en el mes/año actual definido por Planeación;
  // admin/planeación pueden moverse libremente, por eso solo se sincroniza
  // de forma forzada para el enlace.
  useEffect(() => {
    if (!cfgLoading && isEnlace) setForm(f => ({ ...f, mes: mesActual, anio: anioActual }))
  }, [cfgLoading, isEnlace, mesActual, anioActual])

  useEffect(() => {
    if (!cfgLoading && !isEnlace) setForm(f => (f.indicadorId ? f : { ...f, mes: mesActual, anio: anioActual }))
  }, [cfgLoading]) // eslint-disable-line

  const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

  // Filtrar lista por búsqueda
  const listaFiltrada = useMemo(()=>{
    if (!busq) return lista||[]
    const q = busq.toLowerCase()
    return (lista||[]).filter(i=>
      i.nombre?.toLowerCase().includes(q) ||
      i.area_nombre?.toLowerCase().includes(q)
    )
  }, [lista, busq])

  // Estado del avance del indicador/periodo seleccionados (para saber si ya está validado)
  useEffect(() => {
    if (!form.indicadorId) { setEstadoAvance(null); return }
    let cancel = false
    getAvanceActual(+form.indicadorId, +form.mes, +form.anio)
      .then(d => { if (!cancel) setEstadoAvance(d) })
      .catch(() => { if (!cancel) setEstadoAvance(null) })
    return () => { cancel = true }
  }, [form.indicadorId, form.mes, form.anio, evVersion])

  // Resumen de validación del mes (solo enlace)
  useEffect(() => {
    if (!isEnlace || !profile?.area_id || cfgLoading) { setResumenVal(null); return }
    let cancel = false
    getResumenValidacionArea(profile.area_id, mesActual, anioActual)
      .then(r => { if (!cancel) setResumenVal(r) })
      .catch(() => { if (!cancel) setResumenVal(null) })
    return () => { cancel = true }
  }, [isEnlace, profile?.area_id, mesActual, anioActual, cfgLoading, evVersion])

  const bloqueadoPorValidacion = isEnlace && estadoAvance?.validado === true

  async function handleGuardar() {
    if (!form.indicadorId || form.resultado==='' || bloqueadoPorValidacion) return
    setSaving(true); setStatus(null)
    try {
      await guardarAvance({
        indicadorId:   +form.indicadorId,
        mes:           +form.mes,
        anio:          +form.anio,
        resultado:     +form.resultado,
        observaciones:  form.observaciones,
        usuarioId:     profile?.id ?? null,
      })
      setStatus('ok')
      setForm(f=>({...f, resultado:'', observaciones:''}))
      setEvVersion(v=>v+1)
    } catch(e) {
      setStatus('error:'+e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmarValidar() {
    if (!passwordInput || !user?.email || !profile?.area_id) return
    setValidando(true); setValidarError(null)
    try {
      await reautenticar(user.email, passwordInput)
      await validarInformacionMes({ areaId: profile.area_id, mes: mesActual, anio: anioActual, usuarioId: profile.id })
      setShowValidarModal(false)
      setPasswordInput('')
      setEvVersion(v=>v+1)
    } catch (e) {
      setValidarError(e.message)
    } finally {
      setValidando(false)
    }
  }

  const selInd = (lista||[]).find(i=>i.id===+form.indicadorId)
  const inp = {width:'100%',background:C.bgPanel,border:`1px solid ${C.border}`,borderRadius:6,color:C.txt,padding:'0.5rem 0.75rem',fontSize:'0.8rem',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}

  return (
    <div style={{maxWidth:640}}>
      <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'1.2rem',marginBottom:'1rem'}}>
        <div style={{fontSize:'0.62rem',letterSpacing:3,color:C.dorado,textTransform:'uppercase',marginBottom:'1rem'}}>
          📝 Captura de Avance · SIMA — {(lista||[]).length} indicadores disponibles
        </div>

        {status==='ok' && (
          <div style={{background:'#04620522',border:`1px solid ${C.optimoB}`,borderRadius:8,padding:'0.65rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:C.optimoB}}>
            ✅ Avance guardado correctamente en Supabase
          </div>
        )}
        {status?.startsWith('error') && (
          <div style={{background:'#C0000022',border:`1px solid ${C.criticoB}`,borderRadius:8,padding:'0.65rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:C.criticoB}}>
            ❌ {status.replace('error:','')}
          </div>
        )}

        <div style={{display:'grid',gap:'0.75rem'}}>

          {/* Buscador + Selector dropdown normal */}
          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>
              Buscar indicador ({(lista||[]).length} disponibles)
            </label>
            <input
              placeholder="Filtra por nombre o área…"
              value={busq}
              onChange={e=>{ setBusq(e.target.value); setForm(f=>({...f,indicadorId:''})) }}
              style={{...inp, marginBottom:6}}
            />
          </div>

          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>
              Indicador {busq && `· ${listaFiltrada.length} resultado(s)`}
            </label>
            {loadLista
              ? <div style={{fontSize:'0.78rem',color:C.txtMuted,padding:'0.5rem'}}>Cargando indicadores…</div>
              : (
                <select
                  value={form.indicadorId}
                  onChange={e=>setForm(f=>({...f,indicadorId:e.target.value}))}
                  style={inp}
                >
                  <option value="">— Selecciona un indicador —</option>
                  {listaFiltrada.map(i=>(
                    <option key={i.id} value={i.id}>
                      [{i.area_nombre}] {i.nombre}
                    </option>
                  ))}
                </select>
              )
            }
          </div>

          {/* Mes / Año / Trimestre */}
          {isEnlace ? (
            <div style={{background:C.bgPanel,border:`1px solid ${C.border}`,borderRadius:8,padding:'0.65rem 0.85rem'}}>
              <div style={{fontSize:'0.78rem',color:C.txt}}>
                🗓 Periodo de captura: <strong style={{color:C.doradoLight}}>{MESES[(form.mes||1)-1]} {form.anio}</strong>
              </div>
              <div style={{fontSize:'0.62rem',color:C.txtMuted,marginTop:2}}>Definido por Planeación — no editable.</div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.6rem'}}>
              <div>
                <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Mes</label>
                <select value={form.mes} onChange={e=>setForm(f=>({...f,mes:+e.target.value}))} style={inp}>
                  {MESES.map((m,i)=><option key={m} value={i+1}>{m} {form.anio}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Año</label>
                <select value={form.anio} onChange={e=>setForm(f=>({...f,anio:+e.target.value}))} style={inp}>
                  {ANIOS_PROGRAMA.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Trimestre rápido</label>
                <div style={{display:'flex',gap:5}}>
                  {[1,2,3,4].map(t=>{
                    const meses=[[1,2,3],[4,5,6],[7,8,9],[10,11,12]][t-1]
                    const activo=meses.includes(+form.mes)
                    return (
                      <button key={t} onClick={()=>setForm(f=>({...f,mes:meses[0]}))}
                        style={{flex:1,padding:'0.45rem 0',background:activo?C.guinda:C.bgPanel,border:`1px solid ${activo?C.guinda:C.border}`,borderRadius:5,color:C.txt,fontSize:'0.72rem',fontFamily:'inherit',cursor:'pointer'}}>
                        T{t}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {bloqueadoPorValidacion && (
            <div style={{background:'#04620522',border:`1px solid ${C.optimoB}`,borderRadius:8,padding:'0.65rem 1rem',fontSize:'0.78rem',color:C.optimoB}}>
              ✅ Esta información ya fue validada{estadoAvance?.validado_at ? ` el ${new Date(estadoAvance.validado_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}` : ''}. No se puede editar — si necesitas corregirla, contacta a Planeación.
            </div>
          )}

          {/* Resultado */}
          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Valor real alcanzado</label>
            <input type="number" value={form.resultado} disabled={bloqueadoPorValidacion}
              onChange={e=>setForm(f=>({...f,resultado:e.target.value}))}
              placeholder="Ingresa el resultado numérico…" style={{...inp, opacity:bloqueadoPorValidacion?0.5:1}}/>
          </div>

          {/* Observaciones */}
          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Observaciones / evidencia</label>
            <textarea rows={3} value={form.observaciones} disabled={bloqueadoPorValidacion}
              onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))}
              placeholder="Descripción del avance, fuente de verificación, número de oficio…"
              style={{...inp,resize:'vertical', opacity:bloqueadoPorValidacion?0.5:1}}/>
          </div>

          <button onClick={handleGuardar}
            disabled={saving||!form.indicadorId||form.resultado===''||bloqueadoPorValidacion}
            style={{background:saving?'#444':`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.75rem',fontSize:'0.85rem',fontWeight:700,fontFamily:'inherit',cursor:saving?'not-allowed':'pointer',letterSpacing:1,opacity:(!form.indicadorId||form.resultado===''||bloqueadoPorValidacion)?0.5:1}}>
            {saving?'⏳ Guardando en Supabase…':'💾 GUARDAR AVANCE EN SIMA'}
          </button>
        </div>
      </div>

      {/* Ficha del indicador seleccionado */}
      {selInd && (
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:'1rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.dorado,textTransform:'uppercase',marginBottom:6}}>Ficha del indicador seleccionado</div>
          <div style={{fontSize:'0.82rem',fontWeight:600,color:C.txt,marginBottom:8,lineHeight:1.4}}>{selInd.nombre}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {[['Área',selInd.area_nombre],['Nivel MIR',selInd.nivel_mir]].map(([l,v])=>(
              <div key={l} style={{background:C.bgPanel,borderRadius:6,padding:'0.5rem 0.6rem'}}>
                <div style={{fontSize:'0.6rem',color:C.txtMuted}}>{l}</div>
                <div style={{fontSize:'0.78rem',color:C.txt,fontWeight:600,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
          <SeccionEvidencias
            key={`${selInd.id}-${form.mes}-${form.anio}-${evVersion}`}
            indicadorId={selInd.id} mes={+form.mes} anio={+form.anio}
          />
        </div>
      )}

      {/* Validación del mes (solo enlace) */}
      {isEnlace && resumenVal && resumenVal.capturados > 0 && (
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:'1rem',marginTop:'1rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.dorado,textTransform:'uppercase',marginBottom:8}}>🔒 Validación del mes</div>
          <div style={{fontSize:'0.78rem',color:C.txtSub,marginBottom:10}}>
            {resumenVal.validados} de {resumenVal.capturados} indicadores capturados ya validados
            {resumenVal.capturados < resumenVal.totalIndicadores ? ` (tu área tiene ${resumenVal.totalIndicadores} en total).` : '.'}
          </div>
          {resumenVal.pendientes > 0 ? (
            <button onClick={()=>{ setValidarError(null); setPasswordInput(''); setShowValidarModal(true) }}
              style={{background:`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.6rem 1rem',fontSize:'0.8rem',fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>
              🔒 Validar información del mes
            </button>
          ) : (
            <div style={{fontSize:'0.78rem',color:C.optimoB}}>✅ Toda la información de este mes ya fue validada.</div>
          )}
        </div>
      )}

      {/* Modal de confirmación con contraseña */}
      {showValidarModal && (
        <div style={{position:'fixed',inset:0,background:'#000000aa',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}
          onClick={()=>!validando && setShowValidarModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.bgCard,border:`1px solid ${C.dorado}55`,borderRadius:12,padding:'1.3rem',width:320,maxWidth:'90vw'}}>
            <div style={{fontSize:'0.85rem',fontWeight:700,color:C.txt,marginBottom:8}}>🔒 Confirmar validación</div>
            <div style={{fontSize:'0.75rem',color:C.txtSub,marginBottom:12,lineHeight:1.4}}>
              Esto marcará como definitiva la información capturada de tu área para {MESES[(mesActual||1)-1]} {anioActual}. Ya no podrás editarla. Ingresa tu contraseña para confirmar.
            </div>
            <input type="password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)}
              placeholder="Tu contraseña…" style={{...inp, marginBottom:10}}
              onKeyDown={e=>{ if(e.key==='Enter') handleConfirmarValidar() }}/>
            {validarError && <div style={{fontSize:'0.72rem',color:C.criticoB,marginBottom:10}}>❌ {validarError}</div>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowValidarModal(false)} disabled={validando}
                style={{flex:1,background:C.bgPanel,border:`1px solid ${C.border}`,borderRadius:8,color:C.txt,padding:'0.55rem',fontSize:'0.78rem',fontFamily:'inherit',cursor:'pointer'}}>
                Cancelar
              </button>
              <button onClick={handleConfirmarValidar} disabled={validando||!passwordInput}
                style={{flex:1,background:validando?'#444':`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.55rem',fontSize:'0.78rem',fontWeight:700,fontFamily:'inherit',cursor:validando?'not-allowed':'pointer'}}>
                {validando?'Validando…':'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── APP PRINCIPAL ───────────────────────────────────────────── */
const NAV = [
  {id:'dashboard',  l:'Dashboard',  icon:'📊'},
  {id:'indicadores',l:'Indicadores',icon:'🎯'},
  {id:'areas',      l:'Áreas',      icon:'🏢'},
  {id:'alertas',    l:'Alertas',    icon:'🔔'},
  {id:'captura',    l:'Captura',    icon:'✍️'},
]

export default function App() {
  const [pan, setPan] = useState('dashboard')
  const { user, profile, loading, rol, area, isEnlace, isAdmin } = useAuth()
  const { mesActual, anioActual } = useConfiguracion()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)

  if (loading) {
    return (
      <div style={{background:'#0D0D0D', minHeight:'100vh', display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'center',
        color:'#F0EAE0', fontFamily:'Inter,sans-serif', gap:'1rem'}}>
        <div style={{fontSize:'1rem', color:'#C8A96E'}}>Cargando SIMA...</div>
        <div style={{fontSize:'0.8rem', color:'#706050'}}>
          user: {user ? user.email : 'null'} |
          profile: {profile ? profile.nombre : 'null'} |
          loading: {String(loading)}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{marginTop:'1rem', background:'#7B1F2C', border:'none',
            color:'white', padding:'8px 20px', borderRadius:6, cursor:'pointer'}}>
          Reintentar
        </button>
      </div>
    )
  }

  if (!user) return <Login/>

  const nombreUsuario = profile?.nombre || user.email
  const labelRol = profile?.cargo || profile?.roles?.nombre || rol

  return (
    <div style={{background:C.bg,minHeight:'100vh',color:C.txt,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#7B1F2C55;border-radius:2px}input,select,textarea{outline:none}select option{padding:6px 10px;background:#1C1C1C;color:#F0EAE0}`}</style>

      {/* Header con logo */}
      <header style={{background:`linear-gradient(90deg,${C.guindaDark} 0%,${C.guinda} 100%)`,borderBottom:'3px solid #C8A96E',padding:'0.75rem 1.5rem',position:'sticky',top:0,zIndex:100}}>
        <div style={{maxWidth:980,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <div style={{width:52,height:52,borderRadius:'50%',overflow:'hidden',border:`2px solid ${C.dorado}`,flexShrink:0,background:'transparent'}}>
              <img src={LOGO_BASE64} alt="Escudo Apizaco" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div>
              <div style={{fontSize:'0.5rem',letterSpacing:2,color:C.doradoLight,textTransform:'uppercase'}}>H. Ayuntamiento de Apizaco · 2024–2027</div>
              <div style={{fontWeight:900,fontSize:'clamp(1.2rem,3vw,1.5rem)',letterSpacing:4,color:'#fff'}}>SIMA</div>
              <div style={{fontSize:'0.5rem',color:C.doradoLight,letterSpacing:1}}>Sistema de Información Municipal de Avance</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:'#ffffff15',borderRadius:20,padding:'4px 10px',fontSize:'0.6rem',color:C.doradoLight,letterSpacing:1}}>{periodoLabel}</div>
            <div style={{width:7,height:7,borderRadius:'50%',background:C.optimoB,boxShadow:`0 0 6px ${C.optimoB}`}} title="Conectado a Supabase"/>
            {/* Info usuario */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:1}}>
              <span style={{fontSize:'0.62rem',color:'#fff',fontWeight:600}}>{nombreUsuario}</span>
              <span style={{fontSize:'0.55rem',color:C.doradoLight,letterSpacing:1,textTransform:'uppercase'}}>{labelRol}{area ? ` · ${area}` : ''}</span>
            </div>
            <button onClick={()=>signOut()} style={{background:'#ffffff18',border:`1px solid ${C.dorado}55`,borderRadius:6,color:C.doradoLight,padding:'4px 10px',fontSize:'0.6rem',fontFamily:'inherit',cursor:'pointer',letterSpacing:1}}>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav style={{background:'#0a0a0a',borderBottom:`1px solid ${C.border}`,overflowX:'auto',position:'sticky',top:62,zIndex:99}}>
        <div style={{display:'flex',maxWidth:980,margin:'0 auto'}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setPan(n.id)}
              style={{flex:1,padding:'0.65rem 0.3rem',border:'none',background:pan===n.id?`${C.guinda}33`:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'0.68rem',letterSpacing:2,textTransform:'uppercase',whiteSpace:'nowrap',
                color:pan===n.id?C.dorado:C.txtMuted,
                borderBottom:pan===n.id?`2px solid ${C.dorado}`:'2px solid transparent',
                fontWeight:pan===n.id?700:400}}>
              <span style={{display:'block',fontSize:15,marginBottom:1}}>{n.icon}</span>{n.l}
            </button>
          ))}
          {isAdmin && (
            <button onClick={()=>setPan('admin')}
              style={{flex:1,padding:'0.65rem 0.3rem',border:'none',background:pan==='admin'?`${C.guinda}33`:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'0.68rem',letterSpacing:2,textTransform:'uppercase',whiteSpace:'nowrap',
                color:pan==='admin'?C.dorado:C.txtMuted,
                borderBottom:pan==='admin'?`2px solid ${C.dorado}`:'2px solid transparent',
                fontWeight:pan==='admin'?700:400}}>
              <span style={{display:'block',fontSize:15,marginBottom:1}}>⚙️</span>Admin
            </button>
          )}
        </div>
      </nav>

      {/* Contenido */}
      <main style={{maxWidth:980,margin:'0 auto',padding:'1.1rem 0.85rem 4rem'}}>
        {pan==='dashboard'   && <PantallaDashboard/>}
        {pan==='indicadores' && <PantallaIndicadores/>}
        {pan==='areas'       && <PantallaAreas/>}
        {pan==='alertas'     && <PantallaAlertas/>}
        {pan==='captura'     && <PantallaCaptura areaCoordinador={isEnlace ? area : null}/>}
        {pan==='admin'       && isAdmin && <AdminUsuarios/>}
      </main>

      <footer style={{borderTop:`1px solid ${C.border}`,padding:'0.6rem 1rem',textAlign:'center',fontSize:'0.58rem',color:C.txtMuted,letterSpacing:1}}>
        SIMA · H. Ayuntamiento de Apizaco · Dirección de Planeación y Evaluación · Hugo Montiel Robles · 2026 · v3.0
      </footer>
    </div>
  )
}
