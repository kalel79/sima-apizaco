import '@fontsource-variable/inter'
import './styles/responsive.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { instalarRecargaPorVersion } from './lib/recargaVersion.js'
import Transparencia from './screens/Transparencia.jsx'

// registerType: 'autoUpdate' en vite.config.js requiere que el cliente
// registre el SW explícitamente; sin esto, pestañas ya abiertas pueden
// seguir sirviendo el bundle anterior tras un deploy hasta que se recarguen.
// En iPhone la PWA vuelve del segundo plano sin navegar, así que Safari no
// busca SW nuevo por su cuenta: se fuerza la revisión al volver a primer plano
// (autoUpdate recarga la página cuando el SW nuevo toma el control).
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    if (!registro) return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registro.update().catch(() => {})
    })
  },
})

// Si aun así un import() dinámico apunta a un chunk de un deploy anterior
// ("Importing a module script failed" en Safari), recarga una vez.
instalarRecargaPorVersion()

// No hay router: es la única ruta pública del SPA (fase 3.1), así que basta
// con decidir por pathname qué árbol montar. /transparencia nunca pasa por
// <App/> ni por useAuth — no requiere sesión. Ver vercel.json para el
// rewrite que sirve index.html en esta ruta.
const esPortalTransparencia = window.location.pathname.startsWith('/transparencia')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esPortalTransparencia ? <Transparencia /> : <App />}
  </React.StrictMode>
)
