// ── Recuperación ante un deploy nuevo ─────────────────────────────────────────
// Cada deploy cambia el hash de los chunks que se cargan bajo demanda (p. ej.
// informeGobierno-XXXX.js). Si el iPhone tiene SIMA abierto desde antes del
// deploy (PWA en pantalla de inicio o pestaña de Safari en segundo plano), el
// bundle viejo pide un chunk que ya no existe y Safari responde
// "Importing a module script failed". La solución es recargar para tomar la
// versión nueva; se hace una sola vez por minuto para no entrar en bucle.

const CLAVE = 'sima:recargaPorVersion'
const VENTANA_MS = 60_000

function recargaReciente() {
  try {
    const t = Number(sessionStorage.getItem(CLAVE) || 0)
    return Date.now() - t < VENTANA_MS
  } catch { return false }
}

export function recargarPorVersionNueva() {
  if (recargaReciente()) return false
  try { sessionStorage.setItem(CLAVE, String(Date.now())) } catch { /* modo privado */ }
  window.location.reload()
  return true
}

export function esErrorDeChunk(err) {
  const msg = String(err?.message || err || '')
  return /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS/i.test(msg)
}

// Vite emite `vite:preloadError` cuando falla un import() dinámico.
export function instalarRecargaPorVersion() {
  window.addEventListener('vite:preloadError', (e) => {
    if (recargarPorVersionNueva()) e.preventDefault()
  })
}
