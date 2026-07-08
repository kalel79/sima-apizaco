import { useResumenAreas } from '../hooks/useSupabase'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { getSemaforo, semColor } from '../utils/semaforo.js'
import { C } from '../theme.js'
import { Spinner, ErrMsg, Barra } from '../components/ui.jsx'

/* ── ÁREAS ───────────────────────────────────────────────────── */
export default function PantallaAreas() {
  const {data, loading, error, refetch} = useResumenAreas()
  const { mesActual, anioActual } = useConfiguracionCtx()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  if (loading) return <Spinner/>
  if (error)   return <ErrMsg msg={error} onRetry={refetch}/>
  return (
    <div>
      <div style={{fontSize:'0.62rem',letterSpacing:3,color:C.txtMuted,textTransform:'uppercase',marginBottom:'0.8rem'}}>
        Áreas responsables · Ranking {periodoLabel}
      </div>
      {(data||[]).map((area,i)=>{
        const p       = Math.min(area.pct_promedio||0, 1.0)
        const sem     = getSemaforo(area.pct_promedio||0)
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
