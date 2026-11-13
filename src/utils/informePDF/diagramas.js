// ── Diagramas vectoriales de las acciones dentro del PDF del Informe ─────────
// Las plantillas están en diagramasSvg.js; aquí solo se dibujan con svg2pdf.
import { svg2pdf } from 'svg2pdf.js'
import { svgDiagrama, DIAGRAMA_W, DIAGRAMA_H } from './diagramasSvg.js'

export { diagramaValido, DIAGRAMA_RATIO } from './diagramasSvg.js'

// Dibuja el diagrama en el PDF dentro de la caja (x, y, w, h) en mm.
// svg2pdf necesita el SVG en el documento para resolver estilos y degradados.
export async function dibujarDiagrama(doc, spec, x, y, w, h) {
  const svg = svgDiagrama(spec)
  if (!svg) return false
  const el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${DIAGRAMA_W}px;height:${DIAGRAMA_H}px;overflow:hidden`
  host.appendChild(document.importNode(el, true))
  document.body.appendChild(host)
  try {
    // svg2pdf arranca con el estilo vigente del documento: si quedó en negrita
    // (encabezado de página), un texto en una familia sin negrita cae en Times.
    doc.setFont('Sans', 'normal')
    await svg2pdf(host.firstElementChild, doc, { x, y, width: w, height: h })
  } finally {
    host.remove()
  }
  return true
}
