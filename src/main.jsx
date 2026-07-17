import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import Transparencia from './screens/Transparencia.jsx'

// registerType: 'autoUpdate' en vite.config.js requiere que el cliente
// registre el SW explícitamente; sin esto, pestañas ya abiertas pueden
// seguir sirviendo el bundle anterior tras un deploy hasta que se recarguen.
registerSW({ immediate: true })

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
