import { C } from '../theme.js'
import { semColor } from '../utils/semaforo.js'

/* ── COMPONENTES BASE ───────────────────────────────────────── */
export function Spinner() {
  return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}>
      <div style={{width:34,height:34,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.guinda}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function ErrMsg({msg, onRetry}) {
  return (
    <div style={{background:'#1a0505',border:`1px solid ${C.criticoB}`,borderRadius:8,padding:'1rem',color:C.criticoB,fontSize:'0.82rem'}}>
      ⚠️ {msg}
      {onRetry && <button onClick={onRetry} style={{marginLeft:12,background:C.guinda,border:'none',color:C.txt,padding:'3px 10px',borderRadius:4,cursor:'pointer',fontSize:'0.75rem'}}>Reintentar</button>}
    </div>
  )
}

export function Pill({sem}) {
  const color = semColor(sem)
  const textColor = sem === 'RIESGO' ? '#7A5800' : '#fff'
  return (
    <span style={{fontSize:'0.65rem',fontWeight:800,letterSpacing:2,background:color,color:textColor,padding:'2px 8px',borderRadius:6,textTransform:'uppercase',whiteSpace:'nowrap'}}>
      {sem}
    </span>
  )
}

export function Barra({pct, color, h=6}) {
  const r = h >= 8 ? 4 : 3
  return (
    <div style={{flex:1,height:h,background:'#ffffff09',borderRadius:r}}>
      <div style={{width:`${Math.min((pct||0)*100,100)}%`,height:'100%',background:color,borderRadius:r,transition:'width 0.8s ease'}}/>
    </div>
  )
}

export function KPI({label, value, sub, icon, color}) {
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
