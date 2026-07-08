import { LOGO_BASE64 } from './logo.js'
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useConfiguracion } from './hooks/useConfiguracion'
import { ConfiguracionContext } from './contexts/ConfiguracionContext'
import { formatPeriodoLabel } from './utils/periodo'
import { signOut } from './lib/auth'
import { C } from './theme.js'
import { ErrMsg } from './components/ui.jsx'
import Login from './components/Login'
import CambiarContrasena from './components/CambiarContrasena'
import AdminUsuarios from './components/AdminUsuarios'
import PantallaPMD from './components/PantallaPMD'
import PantallaDashboard from './screens/Dashboard.jsx'
import PantallaIndicadores from './screens/Indicadores.jsx'
import PantallaAreas from './screens/Areas.jsx'
import PantallaAlertas from './screens/Alertas.jsx'
import PantallaCaptura from './screens/Captura.jsx'

/* ── APP PRINCIPAL ───────────────────────────────────────────── */
const NAV_ANTES_PMD = [
  {id:'dashboard',  l:'Dashboard',  icon:'📊'},
  {id:'indicadores',l:'Indicadores',icon:'🎯'},
  {id:'areas',      l:'Áreas',      icon:'🏢'},
]
const NAV_PMD = {id:'pmd', l:'PMD', icon:'🗺️'}
const NAV_DESPUES_PMD = [
  {id:'alertas',    l:'Alertas',    icon:'🔔'},
  {id:'captura',    l:'Captura',    icon:'✍️'},
]

export default function App() {
  const [pan, setPan] = useState('dashboard')
  const { user, profile, loading, error: authError, rol, area, isEnlace, isAdmin, isPlaneacion, isDirectivo, refetchProfile } = useAuth()

  // PMD: visible para admin/planeación/directivo — el enlace solo captura sus indicadores
  const puedeVerPMD = isAdmin || isPlaneacion || isDirectivo
  const NAV = [...NAV_ANTES_PMD, ...(puedeVerPMD ? [NAV_PMD] : []), ...NAV_DESPUES_PMD]
  const { mesActual, anioActual, loading: cfgLoading, refetch: refetchCfg } = useConfiguracion()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)

  // useConfiguracion() dispara su primer fetch al montar App, que ocurre
  // antes de que termine el login. Sin sesión todavía, RLS filtra en
  // silencio todas las filas de `configuracion` (0 filas, sin error) y el
  // hook se queda pegado en sus valores por defecto. Se repite el fetch en
  // cuanto hay un usuario autenticado para traer el valor real.
  useEffect(() => {
    if (user?.id) refetchCfg()
  }, [user?.id]) // eslint-disable-line

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

  if (authError) {
    return (
      <div style={{background:'#0D0D0D', minHeight:'100vh', display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'center',
        color:'#F0EAE0', fontFamily:'Inter,sans-serif', gap:'1rem', padding:'1rem', textAlign:'center'}}>
        <ErrMsg msg={authError} onRetry={()=>window.location.reload()}/>
      </div>
    )
  }

  if (!user) return <Login/>

  if (profile?.primer_login) return <CambiarContrasena user={user} onDone={refetchProfile}/>

  const nombreUsuario = profile?.nombre || user.email
  const labelRol = profile?.cargo || profile?.roles?.nombre || rol

  return (
    <ConfiguracionContext.Provider value={{ mesActual, anioActual, loading: cfgLoading, refetchCfg }}>
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
          {(isAdmin || isPlaneacion) && (
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
        {pan==='pmd'         && puedeVerPMD && <PantallaPMD/>}
        {pan==='alertas'     && <PantallaAlertas/>}
        {pan==='captura'     && <PantallaCaptura areaCoordinador={isEnlace ? area : null}/>}
        {pan==='admin'       && (isAdmin || isPlaneacion) && <AdminUsuarios/>}
      </main>

      <footer style={{borderTop:`1px solid ${C.border}`,padding:'0.6rem 1rem',textAlign:'center',fontSize:'0.58rem',color:C.txtMuted,letterSpacing:1}}>
        SIMA · H. Ayuntamiento de Apizaco · Dirección de Planeación y Evaluación · Hugo Montiel Robles · 2026 · v3.0
      </footer>
    </div>
    </ConfiguracionContext.Provider>
  )
}
