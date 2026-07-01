import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// registerType: 'autoUpdate' en vite.config.js requiere que el cliente
// registre el SW explícitamente; sin esto, pestañas ya abiertas pueden
// seguir sirviendo el bundle anterior tras un deploy hasta que se recarguen.
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
