// ── Secciones del Expediente MML — una función por formato PP-FM ─────────────
// Mismo patrón que informeGobiernoSecciones.js: cada función dibuja un bloque
// visual completo sobre un `doc` de jsPDF ya posicionado en la página correcta.
import autoTable from 'jspdf-autotable'
import { LOGO_BASE64 } from '../logo.js'
import { GUINDA, DORADO, GRIS, BLANCO, ENTIDAD_NOMBRE, setColor, setFill, setDraw } from './reportesBase.js'
import { CAPITULOS_LABEL, CATEGORIA_INVOLUCRADOS_LABEL, INDICE_FORMATOS, NIVEL_MIR_LABEL } from './expedienteMMLContenido.js'

const ML = 14
const FIRMAS_MARGEN_INF = 34 // espacio reservado abajo para que rol+nombre+cargo no se corten
const BANNER_H = 24 // antes 20 — se agrandó para el logo más grande + la línea de subtítulo

// Texto de subtítulo del encabezado para las páginas posteriores al índice.
export function subtituloAnteproyecto(anio) {
  return anio ? `ANTEPROYECTO DE PRESUPUESTO DE EGRESOS ${anio}` : null
}

// ── Encabezado institucional (banner guinda + logo + título + folio) ─────────
export function drawEncabezado(doc, titulo, folio, subtitulo) {
  const W = doc.internal.pageSize.width
  setFill(doc, GUINDA); doc.rect(0, 0, W, BANNER_H, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', ML, 4, 16, 16) } catch { /* logo opcional */ }
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setColor(doc, BLANCO)
  doc.text(ENTIDAD_NOMBRE.toUpperCase(), W / 2, 7, { align: 'center' })
  doc.setFontSize(8.5)
  doc.text(titulo, W / 2, 13, { align: 'center' })
  if (subtitulo) {
    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    doc.text(subtitulo, W / 2, 18.5, { align: 'center' })
  }
  if (folio) {
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal')
    doc.text(folio, W - ML, BANNER_H - 2, { align: 'right' })
  }
  return BANNER_H + 6 // Y donde puede empezar el contenido
}

// ── Bloque de datos de identificación (Eje/Programa/Unidad) ──────────────────
export function drawDatosPrograma(doc, datos, startY) {
  const W = doc.internal.pageSize.width
  const p = datos.programa || {}
  const rows = [
    ['Eje:', `${p.eje_id ?? ''} — ${datos.ejeNombre || ''}`],
    ['Programa:', `${p.clave || ''} ${p.nombre || ''}`],
    ['Unidad Responsable:', p.unidad_resp || '—'],
  ]
  autoTable(doc, {
    startY, margin: { left: ML, right: ML },
    body: rows, theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: GUINDA, cellWidth: 38 } },
  })
  return doc.lastAutoTable.finalY + 3
}

// ── Firmas (4 columnas: Autorizó / Vo.Bo. / Elaboró / Responsable del Proyecto) ──
export function drawFirmasMML(doc, datos, y) {
  const W = doc.internal.pageSize.width
  const p = datos.programa || {}
  const f = datos.firmas || {}
  const firmantes = [
    { rol: 'AUTORIZÓ', nombre: f.AUTORIZA?.nombre || '—', cargo: f.AUTORIZA?.cargo || '' },
    { rol: 'VO. BO.', nombre: f.VOBO?.nombre || '—', cargo: f.VOBO?.cargo || '' },
    { rol: 'ELABORÓ', nombre: f.ELABORO_PRESUPUESTAL?.nombre || '—', cargo: f.ELABORO_PRESUPUESTAL?.cargo || '' },
    // Preferir el catálogo firmas_programa (rol ELABORO, con override por
    // programa) y usar programas.elaboro_* como respaldo si ese rol no está
    // sembrado para este programa.
    { rol: 'RESPONSABLE DEL PROYECTO', nombre: f.ELABORO?.nombre || p.elaboro_nombre || '—', cargo: f.ELABORO?.cargo || p.elaboro_cargo || '' },
  ]
  const colW = (W - ML * 2 - 9) / 4
  doc.setFontSize(6.2)
  firmantes.forEach((fm, i) => {
    const xL = ML + i * (colW + 3), xC = xL + colW / 2, lineY = y + 15
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(fm.rol, xC, y, { align: 'center' })
    setDraw(doc, [150, 150, 150]); doc.setLineWidth(0.3)
    doc.line(xL + 2, lineY, xL + colW - 2, lineY)
    doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30])
    const nLines = doc.splitTextToSize(fm.nombre, colW - 4)
    doc.text(nLines, xC, lineY + 4, { align: 'center' })
    doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    const cLines = doc.splitTextToSize(fm.cargo, colW - 4)
    doc.text(cLines, xC, lineY + 4 + nLines.length * 3.2, { align: 'center' })
  })
}

// ── Página 1: Ficha de Proyecto ───────────────────────────────────────────────
export function drawFichaProyecto(doc, datos, anio) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'FICHA DE PROYECTO', null)
  const p = datos.programa || {}

  const filas = [
    ['Clave programática', p.clave_programatica || '—'],
    ['Finalidad', p.finalidad || '—'],
    ['Función', p.funcion || '—'],
    ['Subfunción', p.subfuncion || '—'],
    ['Tipo de proyecto', p.tipo_proyecto || '—'],
    ['Fuentes de financiamiento', p.fuentes_financiamiento || '—'],
  ]
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Nombre del programa', `${p.clave || ''} ${p.nombre || ''}`]],
    body: filas, theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 8, halign: 'center' },
    styles: { fontSize: 7.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })
  y = doc.lastAutoTable.finalY + 4

  const presupuesto = datos.presupuesto || []
  const total = presupuesto.reduce((a, r) => a + (Number(r.importe) || 0), 0)
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Capítulo', 'Concepto', 'Importe']],
    body: [
      ...presupuesto.map(r => [String(r.capitulo), CAPITULOS_LABEL[r.capitulo] || '', `$${Number(r.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`]),
      ['', 'TOTAL', `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 8, halign: 'center' },
    styles: { fontSize: 7.5 },
    didParseCell(d) { if (d.row.index === presupuesto.length) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = DORADO } },
  })
  y = doc.lastAutoTable.finalY + 6

  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Periodo de ejecución:', ML, y)
  doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
  doc.text(`01 de enero de ${anio}  al  31 de diciembre de ${anio}`, ML + 38, y)
  y += 6
  doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Responsable del proyecto:', ML, y)
  doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
  doc.text(`${p.elaboro_nombre || '—'}  ·  ${p.elaboro_cargo || ''}`, ML + 42, y)

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── Página 2: Descripción de Programa (prosa auto-generada) ──────────────────
export function drawDescripcionPrograma(doc, datos) {
  const H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'DESCRIPCIÓN DE PROGRAMA', null)
  const diag = (datos.diagnostico || [])[0]
  const proposito = (datos.mirNiveles || []).find(n => n.tipo === 'PROPOSITO')
  const fin = (datos.mirNiveles || []).find(n => n.tipo === 'FIN')

  function bloque(titulo, texto) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(titulo, ML, y)
    y += 4
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
    const lines = doc.splitTextToSize(texto || '—', doc.internal.pageSize.width - ML * 2)
    doc.text(lines, ML, y)
    y += lines.length * 3.6 + 6
  }

  bloque('DESCRIPCIÓN', diag?.transformacion_deseada)
  bloque('JUSTIFICACIÓN', diag?.situacion_actual)
  bloque('OBJETIVOS ESTRATÉGICOS',
    [proposito?.resumen_narrativo, fin?.resumen_narrativo].filter(Boolean).join('. '))

  const filasMetas = (datos.mirNiveles || []).map(n => [NIVEL_MIR_LABEL[n.tipo] || n.tipo, n.resumen_narrativo || '—'])
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML, bottom: FIRMAS_MARGEN_INF },
    head: [['Nivel', 'Metas (resumen narrativo)']],
    body: filasMetas, theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 8, halign: 'center' },
    styles: { fontSize: 7 },
    columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' } },
  })

  // margin.bottom fuerza salto de página si la tabla no cabe (programas con
  // muchos niveles MIR, ej. 26 en 037/012) en vez de invadir el pie de firmas.
  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── Índice ─────────────────────────────────────────────────────────────────
export function drawIndice(doc) {
  let y = drawEncabezado(doc, 'ÍNDICE — FORMATOS PROGRAMÁTICOS', null)
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['No.', 'Formato', 'Folio']],
    body: INDICE_FORMATOS.map(f => [String(f.no), f.formato, f.folio]),
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 8, halign: 'center' },
    styles: { fontSize: 8 },
  })
}

// ── PP-FM-03: Transformación Deseada ─────────────────────────────────────────
export function drawTransformacionDeseada(doc, datos) {
  const H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'TRANSFORMACIÓN DESEADA', 'PP-FM-03-00', subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)
  const filas = (datos.diagnostico || []).map(d => [d.situacion_actual, d.transformacion_deseada || '—'])
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Diagnóstico (Situación Actual)', 'Transformación Deseada']],
    body: filas.length ? filas : [['—', '—']],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 8, halign: 'center' },
    styles: { fontSize: 7.5, cellPadding: 2 },
  })
  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// Tamaño de fuente más grande posible (hasta fontMax) para que `texto` llene
// el alto disponible sin desbordarlo — mismo criterio de proporción que
// alturaCajaDinamica pero al revés: aquí el cuadro es de tamaño fijo y se
// ajusta la fuente, no la caja, para que las 4 categorías se vean parejas
// entre sí sin importar cuánto contenido tenga cada una.
function textoAutoFit(doc, texto, w, hMax, { fontMax = 9.5, fontMin = 6.5 } = {}) {
  const RATIO_LINEA = 2.5 / 6 // mismo interlineado que usa drawCaja (2.5mm a 6pt)
  let fontSize = fontMax, lineas
  doc.setFont('helvetica', 'normal')
  do {
    doc.setFontSize(fontSize)
    lineas = doc.splitTextToSize(texto, w)
    if (lineas.length * fontSize * RATIO_LINEA <= hMax || fontSize <= fontMin) break
    fontSize -= 0.5
  } while (true)
  return { fontSize, lineas, lineHeight: fontSize * RATIO_LINEA }
}

// ── PP-FM-05: Mapa de Relaciones / Involucrados ──────────────────────────────
export function drawInvolucrados(doc, datos) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'ANÁLISIS DE INVOLUCRADOS', 'PP-FM-05-00', subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)

  const categorias = ['BENEFICIARIO', 'EJECUTOR', 'OPOSITOR', 'INDIFERENTE']
  const colW = (W - ML * 2 - 9) / 2
  const rowH = 55
  const CABECERA_H = 13 // título de categoría + línea divisoria
  const PAD_INF = 4
  categorias.forEach((cat, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = ML + col * (colW + 3), yBox = y + row * (rowH + 3)
    setDraw(doc, GUINDA); doc.setLineWidth(0.3)
    setFill(doc, [250, 248, 245]); doc.roundedRect(x, yBox, colW, rowH, 1.5, 1.5, 'FD')

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(CATEGORIA_INVOLUCRADOS_LABEL[cat], x + colW / 2, yBox + 8, { align: 'center' })
    setDraw(doc, [210, 190, 180]); doc.setLineWidth(0.25)
    doc.line(x + 8, yBox + 10.5, x + colW - 8, yBox + 10.5)

    const actores = (datos.involucrados || []).filter(a => a.categoria === cat).map(a => `• ${a.actor}`)
    const hDisponible = rowH - CABECERA_H - PAD_INF
    const { fontSize, lineas, lineHeight } = textoAutoFit(doc, actores.join('\n') || '—', colW - 12, hDisponible)
    setColor(doc, [30, 30, 30])
    // Bloque de texto centrado verticalmente en el espacio disponible, para
    // que quede armonioso aunque una categoría tenga pocos o muchos actores.
    const bloqueAlto = lineas.length * lineHeight
    const yInicio = yBox + CABECERA_H + Math.max(0, (hDisponible - bloqueAlto) / 2) + fontSize * 0.35
    doc.setFontSize(fontSize)
    doc.text(lineas, x + 6, yInicio, { align: 'left', lineHeightFactor: 1.15 })
  })

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── PP-FM-04 / PP-FM-07: Árbol del Problema / de Objetivos (diagrama de cajas) ──
const BOX_W_MAX = 40, BOX_H = 16, GAP_X = 2.5
const RATIO_LINEA = 2.5 / 6 // interlineado de las cajas a fontSize=6

// Ancho de caja que le tocaría a una fila con `n` cajas, para que quepan en
// el ancho útil de página (antes del ajuste, causas y efectos calculaban su
// ancho cada quien por su lado y quedaban de tamaños distintos entre sí).
// Sin piso mínimo: con muchos elementos (ej. 17 actividades en Alternativas)
// un mínimo fijo hacía que la fila completa se saliera del ancho de página —
// el ancho se deja encoger todo lo que haga falta para no desbordar.
function anchoCajaParaFila(n, W) {
  const usable = W - ML * 2
  return Math.min(BOX_W_MAX, (usable - GAP_X * (Math.max(n, 1) - 1)) / Math.max(n, 1))
}

function layoutRow(nodos, W, boxW, margen = ML) {
  const usable = W - margen * 2
  const n = Math.max(nodos.length, 1)
  const totalW = boxW * n + GAP_X * (n - 1)
  const startX = margen + Math.max(0, (usable - totalW) / 2)
  return nodos.map((nodo, i) => ({ nodo, x: startX + i * (boxW + GAP_X), w: boxW }))
}

function drawCaja(doc, x, y, w, h, texto, { destacado, fontSize } = {}) {
  setDraw(doc, GUINDA); doc.setLineWidth(destacado ? 0.5 : 0.3)
  setFill(doc, destacado ? [230, 210, 200] : BLANCO)
  doc.roundedRect(x, y, w, h, 1.2, 1.2, 'FD')
  const fs = fontSize ?? (destacado ? 6.6 : 6)
  doc.setFontSize(fs)
  doc.setFont('helvetica', destacado ? 'bold' : 'normal'); setColor(doc, [25, 25, 25])
  const lineHeight = fs * RATIO_LINEA
  const maxLineas = Math.max(1, Math.floor((h - 2) / lineHeight))
  const lines = doc.splitTextToSize(texto || '—', w - 3).slice(0, maxLineas)
  doc.text(lines, x + w / 2, y + h / 2 - (lines.length - 1) * (lineHeight / 2) + fs / 6, { align: 'center' })
}

// Fuente más grande posible (hasta fontMax) para que `texto` quepa en una
// caja de ancho `w` y alto `hMax` sin truncarse, encogiendo hasta fontMin si
// hace falta — usado en filas con muchos elementos (sub-causas/sub-medios,
// actividades) donde el ancho de columna puede quedar muy angosto y
// preferimos letra chica pero completa antes que truncar el texto.
function fontAjustadaCaja(doc, texto, w, hMax, { fontMax = 6, fontMin = 4.2, destacado } = {}) {
  let fontSize = fontMax
  doc.setFont('helvetica', destacado ? 'bold' : 'normal')
  while (fontSize > fontMin) {
    const maxLineas = Math.max(1, Math.floor((hMax - 2) / (fontSize * RATIO_LINEA)))
    doc.setFontSize(fontSize)
    const lineas = doc.splitTextToSize(texto || '—', w - 3)
    if (lineas.length <= maxLineas) return fontSize
    fontSize -= 0.3
  }
  return fontMin
}

function drawConector(doc, xDesde, yDesde, xHasta, yHasta) {
  setDraw(doc, GRIS); doc.setLineWidth(0.25)
  const yMedio = (yDesde + yHasta) / 2
  doc.line(xDesde, yDesde, xDesde, yMedio)
  doc.line(xDesde, yMedio, xHasta, yMedio)
  doc.line(xHasta, yMedio, xHasta, yHasta)
}

// Etiqueta de fila (EFECTOS/CAUSAS/FINES/MEDIOS/etc.) girada 90°, oscura y
// legible, centrada a mano sobre `yCentro` (el centro vertical de su fila de
// cajas) — ver nota en drawArbolDiagrama sobre por qué no se usa align:'center'.
// `alturaDisponible` (opcional) es el espacio vertical que le toca a esta fila
// frente a la fila vecina; si el texto rotado (cuyo "alto" en pantalla es el
// ancho de la cadena) no cabe ahí, se reduce la fuente hasta que quepa, para
// que las etiquetas de niveles distintos no se empalmen entre sí.
function etiquetaFilaVertical(doc, texto, x, yCentro, alturaDisponible) {
  let fontSize = 8.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fontSize)
  let w = doc.getTextWidth(texto)
  const maxW = (alturaDisponible ?? Infinity) - 4
  while (w > maxW && fontSize > 5) {
    fontSize -= 0.5
    doc.setFontSize(fontSize)
    w = doc.getTextWidth(texto)
  }
  setColor(doc, [35, 35, 35])
  doc.text(texto, x, yCentro + w / 2, { angle: 90 })
}

// tipoConfig: { tipoRaiz, tipoSuperior, tipoPrimario, labelRaiz, labelSuperior, labelPrimario, labelSecundario }
export function drawArbolDiagrama(doc, datos, arbolTipo, tipoConfig, folio) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, tipoConfig.titulo, folio, subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)

  const nodos = arbolTipo === 'PROBLEMA' ? (datos.arbolProblema || []) : (datos.arbolObjetivos || [])
  const raiz = nodos.find(n => n.tipo === tipoConfig.tipoRaiz && !n.padre_id)
  if (!raiz) {
    doc.setFontSize(8); setColor(doc, GRIS)
    doc.text('Sin árbol capturado todavía para este programa/año.', ML, y + 10)
    drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
    return
  }

  const superiores = nodos.filter(n => n.tipo === tipoConfig.tipoSuperior && n.padre_id === raiz.id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const primarios = nodos.filter(n => n.tipo === tipoConfig.tipoPrimario && n.padre_id === raiz.id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const hijosDe = primario => nodos.filter(n => n.padre_id === primario.id).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  // Margen propio de esta hoja, más angosto que el ML general del resto del
  // documento (a pedido de Hugo) — más ancho útil para que se aprecien mejor
  // todas las cajas del árbol. El encabezado y los datos del programa arriba
  // siguen usando el margen general (ML) para verse igual que las demás páginas.
  const MARGEN_ARBOL = 6
  const usableArbol = W - MARGEN_ARBOL * 2

  // Fila superior (Efectos/Fines): ancho uniforme entre sí, como antes.
  const nSup = Math.max(superiores.length, 1)
  const boxWSuperior = Math.min(BOX_W_MAX, (usableArbol - GAP_X * (nSup - 1)) / nSup)
  const filaSup = layoutRow(superiores, W, boxWSuperior, MARGEN_ARBOL)
  const ySup = y + 6
  filaSup.forEach(({ nodo, x, w }) => drawCaja(doc, x, ySup, w, BOX_H, nodo.texto))

  // Fila primaria (Causas/Medios de primer nivel): el ancho de cada caja es
  // proporcional a cuántos hijos (sub-causas/sub-medios) tiene — antes todas
  // medían lo mismo y el grupo con más hijos quedaba con cajas diminutas
  // mientras el que tenía menos hijos desperdiciaba espacio de sobra.
  const pesos = primarios.map(p => Math.max(1, hijosDe(p).length))
  const pesoTotal = pesos.reduce((a, b) => a + b, 0) || 1
  const gapsPrim = GAP_X * (Math.max(primarios.length, 1) - 1)
  const anchoDisponiblePrim = usableArbol - gapsPrim
  const CAJA_PRIM_MAX = 70 // techo para que un solo grupo no acapare toda la fila
  const anchosPrim = pesos.map(p => Math.min(CAJA_PRIM_MAX, anchoDisponiblePrim * p / pesoTotal))
  const anchoTotalPrim = anchosPrim.reduce((a, b) => a + b, 0) + gapsPrim
  let cursorX = MARGEN_ARBOL + Math.max(0, (usableArbol - anchoTotalPrim) / 2)
  const filaPrim = primarios.map((nodo, i) => {
    const item = { nodo, x: cursorX, w: anchosPrim[i] }
    cursorX += anchosPrim[i] + GAP_X
    return item
  })

  // Nodo raíz (Problema central / Objetivo central) — no una caja del mismo
  // tamaño que las demás, sino una barra que cubre el ANCHO TOTAL que ocupan
  // las filas de Efectos/Causas (o Fines/Medios), la más ancha de las dos.
  const totalSuperior = boxWSuperior * nSup + GAP_X * (nSup - 1)
  const raizW = Math.max(totalSuperior, anchoTotalPrim)
  const raizX = (W - raizW) / 2, yRaiz = ySup + BOX_H + 14
  drawCaja(doc, raizX, yRaiz, raizW, BOX_H, raiz.texto, { destacado: true })
  filaSup.forEach(({ x, w }) => drawConector(doc, x + w / 2, ySup + BOX_H, raizX + raizW / 2, yRaiz))

  const yPrim = yRaiz + BOX_H + 14
  filaPrim.forEach(({ nodo, x, w }) => {
    drawCaja(doc, x, yPrim, w, BOX_H, nodo.texto)
    drawConector(doc, raizX + raizW / 2, yRaiz + BOX_H, x + w / 2, yPrim)
  })

  // Fila secundaria (sub-causas/sub-medios), agrupada bajo su padre primario.
  // Cada Causa/Medio tiene un "carril" exclusivo (su propio ancho, ya
  // proporcional a su número de hijos, + medio GAP_X a cada lado) para que
  // sus hijos NUNCA invadan el carril de al lado — y como el carril ahora es
  // más ancho para el grupo con más hijos, esas cajas también salen más
  // grandes en vez de todas iguales. La fuente se encoge de forma uniforme
  // en toda la fila (no caja por caja) hasta que el grupo más apretado deje
  // de truncarse, para que se vea consistente.
  const ySec = yPrim + BOX_H + 12
  const gruposSecundarios = filaPrim.map(({ nodo: primario, x: xPrim, w: wPrim }) => {
    const hijos = hijosDe(primario)
    if (!hijos.length) return null
    const carrilW = wPrim + GAP_X
    const hijoW = Math.max(2, (carrilW - GAP_X * (hijos.length - 1)) / hijos.length)
    const anchoGrupo = hijoW * hijos.length + GAP_X * (hijos.length - 1)
    const inicioX = xPrim + wPrim / 2 - anchoGrupo / 2
    return {
      xPrim, wPrim,
      cajas: hijos.map((hijo, i) => ({ hijo, x: inicioX + i * (hijoW + GAP_X), w: hijoW })),
    }
  }).filter(Boolean)

  if (gruposSecundarios.length) {
    const fontSec = Math.min(6, Math.max(4.2, Math.min(
      ...gruposSecundarios.flatMap(g => g.cajas.map(({ hijo, w }) => fontAjustadaCaja(doc, hijo.texto, w, BOX_H)))
    )))
    gruposSecundarios.forEach(({ xPrim, wPrim, cajas }) => {
      cajas.forEach(({ hijo, x, w }) => {
        drawCaja(doc, x, ySec, w, BOX_H, hijo.texto, { fontSize: fontSec })
        drawConector(doc, xPrim + wPrim / 2, yPrim + BOX_H, x + w / 2, ySec)
      })
    })
  }

  // Etiquetas de fila (Efectos/Problema/Causas o Fines/Objetivo/Medios), muy
  // cerca del borde de página dado el margen angosto de esta hoja — centradas
  // a mano sobre el nivel que les corresponde: no se usa el align:'center' de
  // jsPDF combinado con angle porque su interacción no es confiable; se
  // calcula el ancho real del texto y se desplaza el punto de anclaje esa
  // misma cantidad antes de rotar, así el centro del texto cae exactamente
  // sobre el centro vertical de su fila de cajas.
  const xEtiqueta = MARGEN_ARBOL / 2
  etiquetaFilaVertical(doc, tipoConfig.labelSuperior, xEtiqueta, ySup + BOX_H / 2)
  etiquetaFilaVertical(doc, tipoConfig.labelRaiz, xEtiqueta, yRaiz + BOX_H / 2)
  etiquetaFilaVertical(doc, tipoConfig.labelPrimario, xEtiqueta, yPrim + BOX_H / 2)

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// Alto que necesita una caja de contenido variable (lista de actividades, o
// la alternativa combinada) para no truncar texto — replica la misma
// relación fuente/interlineado que usa drawCaja internamente, para que el
// número de líneas medido aquí coincida con el que drawCaja va a dibujar.
function alturaCajaDinamica(doc, texto, w, { destacado, fontSize } = {}) {
  const fs = fontSize ?? (destacado ? 6.6 : 6)
  doc.setFont('helvetica', destacado ? 'bold' : 'normal')
  doc.setFontSize(fs)
  const lineas = doc.splitTextToSize(texto || '—', w - 3)
  return Math.max(BOX_H, lineas.length * fs * RATIO_LINEA + 3)
}

// Numeración consecutiva de Medios (Componentes) y sus Actividades — 1, 2,
// 3... para los Medios de primer nivel; 1.1, 1.2... para las actividades que
// cuelgan del Medio 1, 2.1, 2.2... para las del Medio 2, etc. Compartido
// entre Acciones y Alternativas para que la numeración sea consistente.
function numerarComponentesActividades(datos) {
  const medios = datos.medios || []
  return medios.map((medio, i) => {
    const numero = i + 1
    const actividades = (datos.arbolObjetivos || [])
      .filter(n => n.padre_id === medio.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((actividad, j) => ({ actividad, numero: `${numero}.${j + 1}` }))
    return { medio, numero, actividades }
  })
}

// ── PP-FM-08: Acciones — árbol Objetivo → Medios/Componentes → Actividades ──
// Cada Medio de primer nivel del Árbol de Objetivos es un cuadro; debajo, un
// único cuadro agrupa TODAS las actividades que cuelgan de ese Medio (no un
// cuadro por actividad). Un Medio sin actividades capturadas igual dibuja su
// cuadro (vacío/placeholder) para que quede visible que falta capturarlas —
// todo Medio debe tener al menos una actividad según el lineamiento.
export function drawAcciones(doc, datos) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'ACCIONES', 'PP-FM-08-00', subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)

  const grupos = numerarComponentesActividades(datos)
  if (!grupos.length) {
    doc.setFontSize(8); setColor(doc, GRIS)
    doc.text('Sin Árbol de Objetivos capturado todavía para este programa/año.', ML, y + 10)
    drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
    return
  }
  const objetivo = (datos.arbolObjetivos || []).find(n => n.tipo === 'OBJETIVO' && !n.padre_id)

  const boxW = anchoCajaParaFila(grupos.length, W)
  const anchoTotal = n => n * boxW + GAP_X * (n - 1)
  const objW = anchoTotal(grupos.length)
  const filaMedios = layoutRow(grupos, W, boxW)
  const textosMedio = filaMedios.map(({ nodo: g }) => `${g.numero}. ${g.medio.texto}`)

  // Alto de cada nivel según su propio contenido (antes fijo a BOX_H) — así
  // el tamaño de cada cuadro es proporcional a lo que contiene, en vez de
  // cajas todas iguales con texto apretado o con hueco de sobra.
  const hObj = alturaCajaDinamica(doc, objetivo?.texto, objW, { destacado: true })
  const hMedios = Math.max(...filaMedios.map(({ w }, i) => alturaCajaDinamica(doc, textosMedio[i], w)))
  const cajasAct = filaMedios.map(({ nodo: g, x, w }) => {
    const texto = g.actividades.length
      ? g.actividades.map(a => `${a.numero} ${a.actividad.texto}`).join('\n')
      : '— sin actividades capturadas —'
    return { x, w, texto, h: alturaCajaDinamica(doc, texto, w) }
  })
  const hAct = Math.max(...cajasAct.map(c => c.h))

  // Reparto vertical proporcional del espacio disponible entre los datos del
  // programa y las firmas — antes los 3 niveles quedaban pegados arriba con
  // separación fija (14mm) sin importar cuánto espacio sobraba abajo, lo que
  // dejaba el diagrama descentrado y a veces las etiquetas rotadas de un
  // nivel se empalmaban con las del vecino.
  const yTopDiagrama = y + 4
  const yBottomLimite = H - FIRMAS_MARGEN_INF - 6
  const disponible = Math.max(0, yBottomLimite - yTopDiagrama)
  const GAP_BASE = 14
  const extra = Math.max(0, disponible - (hObj + hMedios + hAct) - GAP_BASE * 2)
  const topPad = extra * 0.3
  const gap = GAP_BASE + extra * 0.35

  const yObj = yTopDiagrama + topPad
  const yMedios = yObj + hObj + gap
  const yAct = yMedios + hMedios + gap

  const objX = (W - objW) / 2
  drawCaja(doc, objX, yObj, objW, hObj, objetivo?.texto, { destacado: true })

  filaMedios.forEach(({ x, w }, i) => {
    drawCaja(doc, x, yMedios, w, hMedios, textosMedio[i])
    drawConector(doc, objX + objW / 2, yObj + hObj, x + w / 2, yMedios)
  })

  cajasAct.forEach(({ x, w, texto }, i) => {
    drawCaja(doc, x, yAct, w, hAct, texto)
    drawConector(doc, filaMedios[i].x + filaMedios[i].w / 2, yMedios + hMedios, x + w / 2, yAct)
  })

  etiquetaFilaVertical(doc, 'OBJETIVO', 6, yObj + hObj / 2, hObj + gap)
  etiquetaFilaVertical(doc, 'MEDIOS / ENTREGABLES', 6, yMedios + hMedios / 2, hMedios + gap)
  etiquetaFilaVertical(doc, 'ACTIVIDADES', 6, yAct + hAct / 2, hAct + gap)

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── PP-FM-09: Alternativas — cada Actividad arriba, todas conectadas a un ──
// único cuadro abajo que las concatena separadas por "+ " (la alternativa
// combinada), igual patrón que Efectos/Fines → Problema/Objetivo central del
// Árbol, solo que aquí la agrupación queda abajo en vez de arriba.
export function drawAlternativas(doc, datos) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'ALTERNATIVAS', 'PP-FM-09-00', subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)

  const grupos = numerarComponentesActividades(datos)
  const actividades = grupos.flatMap(g => g.actividades) // [{ actividad, numero: "N.M" }]

  if (!actividades.length) {
    doc.setFontSize(8); setColor(doc, GRIS)
    doc.text('Sin actividades capturadas todavía en el Árbol de Objetivos.', ML, y + 10)
    drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
    return
  }

  const boxW = anchoCajaParaFila(actividades.length, W)
  const filaAct = layoutRow(actividades, W, boxW)
  const textosAct = filaAct.map(({ nodo: a }) => `${a.numero} ${a.actividad.texto}`)
  // Con muchas actividades (hasta 17) el ancho de columna puede quedar muy
  // angosto — se encoge la fuente de forma uniforme en toda la fila (hasta
  // un tope razonable de alto) en vez de dejar que las cajas crezcan sin
  // límite o que el texto se desborde del cuadro.
  const fontAct = Math.min(6, Math.max(4.2, Math.min(
    ...filaAct.map(({ w }, i) => fontAjustadaCaja(doc, textosAct[i], w, 45))
  )))
  const hAct = Math.max(...filaAct.map(({ w }, i) => alturaCajaDinamica(doc, textosAct[i], w, { fontSize: fontAct })))

  const anchoTotal = n => n * boxW + GAP_X * (n - 1)
  const altW = anchoTotal(actividades.length)
  // Cada actividad en su propio renglón; entre una y la siguiente, un
  // renglón aparte solo con "+" (no pegado al texto de la actividad).
  const textoAlt = actividades.map(a => `${a.numero} ${a.actividad.texto}`).join('\n+\n')

  const yTopDiagrama = y + 4
  const yBottomLimite = H - FIRMAS_MARGEN_INF - 6
  const disponible = Math.max(0, yBottomLimite - yTopDiagrama)
  const GAP_BASE = 14

  // El cuadro combinado se ajusta al espacio que en verdad queda debajo de
  // la fila de actividades — antes se medía a fuente fija (6.6pt) sin tope,
  // así que con muchas actividades (hasta 17, cada una en su propio
  // renglón) el cuadro creía necesitar más alto del que quedaba disponible
  // y terminaba invadiendo el área de firmas. Se encoge la fuente hasta que
  // quepa en el espacio real; si ni así cabe todo, se limita estrictamente a
  // `maxAltH` (drawCaja trunca antes de desbordar, nunca choca con firmas).
  const maxAltH = Math.max(BOX_H, disponible - hAct - GAP_BASE)
  const fontAlt = fontAjustadaCaja(doc, textoAlt, altW, maxAltH, { fontMax: 6.6, fontMin: 4.2, destacado: true })
  const altH = Math.min(maxAltH, alturaCajaDinamica(doc, textoAlt, altW, { fontSize: fontAlt }))

  const extra = Math.max(0, disponible - (hAct + altH) - GAP_BASE)
  const topPad = extra * 0.3
  const gap = GAP_BASE + extra * 0.5

  const yAct = yTopDiagrama + topPad
  const yAlt = yAct + hAct + gap
  const altX = (W - altW) / 2

  filaAct.forEach(({ x, w }, i) => drawCaja(doc, x, yAct, w, hAct, textosAct[i], { fontSize: fontAct }))
  drawCaja(doc, altX, yAlt, altW, altH, textoAlt, { destacado: true, fontSize: fontAlt })
  filaAct.forEach(({ x, w }) => drawConector(doc, x + w / 2, yAct + hAct, altX + altW / 2, yAlt))

  etiquetaFilaVertical(doc, 'ACTIVIDADES', 6, yAct + hAct / 2, hAct + gap)
  etiquetaFilaVertical(doc, 'ALTERNATIVAS', 6, yAlt + altH / 2, altH + gap)

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── PP-FM-0E: Matriz de Riesgos y MIR ─────────────────────────────────────────
export function drawMatrizMIR(doc, datos) {
  const H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'MATRIZ DE INDICADORES Y RIESGOS (MIR)', 'PP-FM-0E-01', subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)

  const niveles = datos.mirNiveles || []
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML, bottom: FIRMAS_MARGEN_INF },
    head: [['Nivel', 'Resumen narrativo (Objetivo)', 'Indicador', 'Tipo/Dim./Sentido', 'Supuestos / Riesgo', 'Medios de verificación']],
    body: niveles.map(n => [
      NIVEL_MIR_LABEL[n.tipo] || n.tipo,
      n.resumen_narrativo || '—',
      n.indicador?.nombre || '— sin vincular —',
      [n.indicador?.tipo_indicador, n.indicador?.dimension, n.indicador?.sentido].filter(Boolean).join(' / ') || '—',
      n.supuestos || '—',
      n.medios_verificacion || '—',
    ]),
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 7, halign: 'center' },
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center' },
    },
  })

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── PP-FM-0F: Cronograma de Metas (POA) ──────────────────────────────────────
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function drawCronogramaMetas(doc, datos) {
  const H = doc.internal.pageSize.height
  let y = drawEncabezado(doc, 'CRONOGRAMA DE METAS (POA)', 'PP-FM-0F-01', subtituloAnteproyecto(datos.anio))
  y = drawDatosPrograma(doc, datos, y)

  const niveles = (datos.mirNiveles || []).filter(n => n.indicador_id)
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML, bottom: FIRMAS_MARGEN_INF },
    head: [['Nivel', 'Meta (verbos en infinitivo)', ...MESES, 'Anual']],
    body: niveles.map(n => [
      NIVEL_MIR_LABEL[n.tipo] || n.tipo,
      n.indicador?.nombre || '—',
      ...MESES.map((_, i) => n.metas?.[i + 1] ?? '0'),
      n.metas?.[0] ?? '0',
    ]),
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 6.5, halign: 'center' },
    styles: { fontSize: 6, cellPadding: 1, halign: 'center' },
    columnStyles: { 0: { cellWidth: 16, halign: 'left' }, 1: { cellWidth: 34, halign: 'left' } },
  })

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}

// ── Fichas de indicador (una por nivel MIR vinculado a un indicador) ─────────
export function drawFichaIndicador(doc, datos, nivel, anio) {
  const H = doc.internal.pageSize.height
  const ind = nivel.indicador
  let y = drawEncabezado(doc, 'FICHA DE INDICADOR DE RESULTADOS', null, subtituloAnteproyecto(anio))
  const p = datos.programa || {}

  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    body: [
      ['Programa', `${p.clave || ''} ${p.nombre || ''}`],
      ['Nivel MIR', NIVEL_MIR_LABEL[nivel.tipo] || nivel.tipo],
      ['Nombre del indicador', ind?.nombre || '—'],
      ['Definición', ind?.definicion || '—'],
      ['Tipo de indicador', ind?.tipo_indicador || '—'],
      ['Dimensión', ind?.dimension || '—'],
      ['Sentido', ind?.sentido || '—'],
      ['Año línea base', ind?.linea_base_anio || '—'],
      ['Supuestos / Riesgo', nivel.supuestos || '—'],
      ['Medios de verificación', nivel.medios_verificacion || '—'],
      ['Interpretación', ind?.interpretacion || '—'],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: GUINDA, cellWidth: 45 } },
  })
  y = doc.lastAutoTable.finalY + 5

  const variables = nivel.variables || []
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Variables de la fórmula', ML, y)
  y += 3
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Variable', 'Símbolo', 'Unidad de medida', 'Fuente', `Alcanzada`, `Meta ${anio}`]],
    body: variables.length ? variables.map(v => [
      v.nombre, v.simbolo || '—', v.unidad_medida, v.fuente || '—',
      v.valor?.valor_alcanzado ?? '—', v.valor?.valor_meta ?? '—',
    ]) : [['—', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 7.5, halign: 'center' },
    styles: { fontSize: 7 },
  })

  drawFirmasMML(doc, datos, H - FIRMAS_MARGEN_INF)
}
