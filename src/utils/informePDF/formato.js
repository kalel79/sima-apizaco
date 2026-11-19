// ── Formato uniforme de cifras del Informe ───────────────────────────────────
// Todo monto se publica igual: signo de peso, separador de miles y pesos cerrados
// ($24,660,599). Las áreas capturan montos de muchas formas ("150800",
// "24,660,598.91", "$500,000"): aquí se normalizan al generar el PDF, sin
// tocar lo capturado en SIMA.

export const pesos = v => `$${Number(v || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`

// Rótulos de cifra que indican dinero aunque el valor venga sin "$".
const ES_DINERO = /inversi|monto|recurso|derrama|pesos|presupuest|costo|gasto|ingreso|recaud/i
// Número suelto, con o sin "$", comas de miles y decimales.
const NUMERO = /^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?$/

// Cifra principal del logro: montos en pesos y cantidades con separador de
// miles. Textos como "1er lugar", "100%" o "[número]" quedan como están.
export function formatoCifra(valor, etiqueta, monto) {
  const s = String(valor ?? '').trim()
  const m = s.match(NUMERO)
  if (!m) return s
  const n = Number((m[1] + (m[2] || '')).replace(/,/g, ''))
  const mt = Number(monto) || 0
  // Si la cifra es el monto capturado (aun redondeado), se usa el monto exacto.
  const esMonto = mt > 0 && Math.abs(n - mt) < 1
  if (s.startsWith('$') || ES_DINERO.test(etiqueta || '') || esMonto) return pesos(esMonto ? mt : n)
  return n.toLocaleString('es-MX', { maximumFractionDigits: 2 })
}

// Montos dentro de un texto ("$150,800", "$4,480.", "$ 21610.8").
export const montosEnTexto = t => t == null ? t : String(t)
  .replace(/\$\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,2})?(?!\d)/g, (_, e, d) => pesos((e + (d || '')).replace(/,/g, '')))

// Acción lista para el PDF: textos y cifra con el formato uniforme.
export const accionConFormato = a => ({
  ...a,
  accion: montosEnTexto(a.accion),
  descripcion: montosEnTexto(a.descripcion),
  pie_foto: montosEnTexto(a.pie_foto),
  cifra_valor: a.cifra_valor ? formatoCifra(a.cifra_valor, a.cifra_etiqueta, a.monto) : a.cifra_valor,
})
