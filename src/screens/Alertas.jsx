import { useAlertasLogros } from '../hooks/useSupabase'
import { C } from '../theme.js'
import { Spinner, ErrMsg, Barra } from '../components/ui.jsx'

/* ── ALERTAS ─────────────────────────────────────────────────── */
export default function PantallaAlertas() {
  const {data, loading, error, refetch} = useAlertasLogros()
  if (loading) return <Spinner/>
  if (error)   return <ErrMsg msg={error} onRetry={refetch}/>

  const criticos = (data||[]).filter(r=>r.semaforo==='CRÍTICO').slice(0,20)
  const riesgo   = (data||[]).filter(r=>r.semaforo==='RIESGO').slice(0,20)
  const logros   = (data||[]).filter(r=>r.semaforo==='ÓPTIMO').slice(0,20)

  const Grupo = ({titulo, items, color}) => (
    <div style={{marginBottom:'1.5rem'}}>
      <div style={{fontSize:'0.65rem',letterSpacing:2,color,textTransform:'uppercase',borderBottom:`1px solid ${color}44`,paddingBottom:6,marginBottom:'0.6rem'}}>
        {titulo} ({items.length})
      </div>
      {items.length===0
        ? <div style={{fontSize:'0.78rem',color:C.txtMuted}}>Sin registros</div>
        : items.map((r,i)=>(
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
          ))
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
