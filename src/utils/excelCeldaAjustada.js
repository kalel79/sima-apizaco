// ── Ajuste preciso de celdas de Excel (Expediente MML) ───────────────────────
// alturaAjustada() en reportesBase.js (compartida con el informe mensual, no
// se toca aquí) estima el alto por conteo de caracteres — funciona bien para
// ese reporte pero es demasiado imprecisa para las tablas del Expediente MML
// (narrativas largas en columnas angostas): subestimar el alto hace que el
// texto se corte visualmente contra el borde/relleno de la celda de abajo.
// Aquí se mide el texto de verdad con canvas 2D (mismo mecanismo que ya usa
// arbolDiagramaCanvas.js para las cajas del árbol) y, si ni así cabe en un
// alto razonable, se reduce la fuente en vez de seguir agrandando la fila.
const PX_POR_UNIDAD_EXCEL = 7 // aproximación estándar de Excel: ancho de columna en "unidades" → px de fuente por defecto

let _canvas = null
function ctx2d() {
  if (!_canvas) _canvas = document.createElement('canvas')
  return _canvas.getContext('2d')
}

// Respeta \n como corte de párrafo (igual que wrapText en
// arbolDiagramaCanvas.js) — un split(/\s+/) simple lo trataría como un
// espacio más y perdería saltos de línea intencionales del texto capturado.
function contarLineas(texto, anchoPx, fontPx, bold) {
  const c = ctx2d()
  c.font = `${bold ? 'bold ' : ''}${fontPx}px Arial`
  const parrafos = String(texto ?? '').split('\n')
  let lineas = 0
  parrafos.forEach(parrafo => {
    const palabras = parrafo.split(/\s+/).filter(Boolean)
    if (!palabras.length) { lineas += 1; return }
    let linea = ''
    palabras.forEach(w => {
      const prueba = linea ? `${linea} ${w}` : w
      if (c.measureText(prueba).width > anchoPx && linea) { lineas++; linea = w } else linea = prueba
    })
    if (linea) lineas++
  })
  return Math.max(1, lineas)
}

// Ajusta una celda: reduce fontPt (desde fontMaxPt) hasta fontMinPt si hace
// falta para que el alto resultante no rebase `altoTopePt` — más allá de ese
// tope se acepta el fontMinPt tal cual (última salvaguarda, no queda más
// remedio que una fila alta con texto extremadamente largo).
export function ajustarCelda(texto, anchoUnidades, { fontMaxPt = 9.5, fontMinPt = 7, bold = false, altoTopePt = 140 } = {}) {
  const anchoPx = Math.max(18, anchoUnidades * PX_POR_UNIDAD_EXCEL - 8)
  let fontPt = fontMaxPt
  for (; fontPt > fontMinPt; fontPt -= 0.5) {
    const lineas = contarLineas(texto, anchoPx, fontPt * 1.333, bold)
    const altoPt = Math.max(14.4, lineas * fontPt * 1.35 + 5)
    if (altoPt <= altoTopePt) return { fontPt, altoPt }
  }
  const lineas = contarLineas(texto, anchoPx, fontMinPt * 1.333, bold)
  return { fontPt: fontMinPt, altoPt: Math.max(14.4, lineas * fontMinPt * 1.35 + 5) }
}

// Alto de una fila completa = el máximo entre todas sus celdas (cada una ya
// ajustada a su propio ancho/formato) — el llamador aplica el fontPt
// devuelto por celda (pueden terminar en tamaños distintos entre sí si una
// celda necesitó achicarse más que las demás).
export function alturaFilaPrecisa(celdas) {
  const ajustadas = celdas.map(c => ({ ...c, ...ajustarCelda(c.texto, c.anchoUnidades, c) }))
  const altoPt = Math.max(...ajustadas.map(c => c.altoPt), 14.4)
  return { altoPt, celdas: ajustadas }
}
