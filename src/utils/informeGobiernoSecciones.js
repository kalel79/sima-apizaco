// ── Secciones fijas y helpers de dibujo del Informe de Gobierno ───────────────
import autoTable from 'jspdf-autotable'
import { LOGO_BASE64 } from '../logo.js'
import {
  PERIODO_INFORME, CABILDO, GABINETE,
  PRESENTACION_PARRAFOS, PRESENTACION_EJES, MENSAJE_PRESIDENTE,
} from './informeGobiernoContenido.js'

// ── Paleta institucional (idéntica a reportes.js) ────────────────────────────
export const GUINDA = [123, 31, 44]
export const DORADO = [201, 169, 97]
export const BLANCO = [255, 255, 255]
export const GRIS   = [89, 89, 89]
export const NEGRO  = [30, 30, 30]

export const SEM_COLORS = {
  'ÓPTIMO':   { txt: [4,   98,   5], bg: [209, 235, 209] },
  'ADECUADO': { txt: [0,  176,  80], bg: [200, 243, 220] },
  'RIESGO':   { txt: [180, 135,  0], bg: [255, 248, 200] },
  'CRÍTICO':  { txt: [192,   0,  0], bg: [255, 215, 215] },
  'SIN DATO': { txt: GRIS,           bg: [240, 240, 240] },
}

// ── Helpers ───────────────────────────────────────────────────────────────
export function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
export function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
export function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

// fracción 0-1 (v_resumen_ejes.pct_promedio) → "88.8%"
export function pctStr(val) {
  if (val == null) return '-'
  return ((+val) * 100).toFixed(1) + '%'
}
// v_comparativo_pmd.pct_promedio ya viene en escala 0-100 → "120.2%"
export function pctPMDStr(val) {
  if (val == null) return '-'
  return (+val).toFixed(1) + '%'
}
export function semaforoFromPct(pct) {
  if (pct == null) return 'SIN DATO'
  const p = +pct
  if (p >= 1.10) return 'ÓPTIMO'
  if (p >= 0.90) return 'ADECUADO'
  if (p >= 0.70) return 'RIESGO'
  return 'CRÍTICO'
}
// Mismos umbrales que semaforoFromPct pero en escala 0-100 (v_comparativo_pmd)
export function semaforoPMD(pct) {
  if (pct == null) return 'SIN DATO'
  const p = +pct
  if (p >= 110) return 'ÓPTIMO'
  if (p >= 90) return 'ADECUADO'
  if (p >= 70) return 'RIESGO'
  return 'CRÍTICO'
}
export function formatFechaLarga(d) {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}
export function generarFolioInforme() {
  const d = new Date()
  const mesStr = String(d.getMonth() + 1).padStart(2, '0')
  const ts = Date.now().toString(36).toUpperCase()
  return `IG2-${d.getFullYear()}-${mesStr}-${ts}`
}

export function placeholderBox(doc, x, y, w, h, text, fontSize = 11) {
  setFill(doc, GUINDA); doc.rect(x, y, w, h, 'F')
  doc.setFontSize(fontSize); doc.setFont('helvetica', 'bold'); setColor(doc, DORADO)
  doc.text(text, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' })
}

// Banner de encabezado de sección: fondo guinda, texto dorado.
// Devuelve la coordenada Y donde debe iniciar el contenido de la sección.
export function sectionBanner(doc, title, subtitle) {
  const W = doc.internal.pageSize.width
  setFill(doc, GUINDA); doc.rect(0, 0, W, 26, 'F')
  setDraw(doc, DORADO); doc.setLineWidth(0.8); doc.line(0, 26, W, 26)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); setColor(doc, DORADO)
  doc.text(title, 15, 16, { maxWidth: W - 30 })
  if (subtitle) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setColor(doc, BLANCO)
    doc.text(subtitle, 15, 22)
  }
  return 38
}

// Encabezado ligero para páginas de continuación (tablas que se desbordan)
export function drawRunningHeaderSimple(doc, title) {
  const W = doc.internal.pageSize.width, ML = 15
  try { doc.addImage(LOGO_BASE64, 'PNG', ML, 6, 8, 8) } catch (_) {}
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(title, ML + 11, 11, { maxWidth: W - ML * 2 - 11 })
  setDraw(doc, GUINDA); doc.setLineWidth(0.3); doc.line(ML, 17, W - ML, 17)
  setDraw(doc, DORADO); doc.setLineWidth(0.2); doc.line(ML, 17.5, W - ML, 17.5)
}

// ── Portada ──────────────────────────────────────────────────────────────
export function drawPortada(doc, fechaGenStr) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
  const bandH = H * 0.40

  setFill(doc, GUINDA); doc.rect(0, 0, W, bandH, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W - 46) / 2, bandH * 0.18, 46, 46) } catch (_) {}
  setFill(doc, DORADO); doc.rect(0, H - 10, W, 10, 'F')

  let y = bandH + 22
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('SEGUNDO INFORME DE', W / 2, y, { align: 'center' }); y += 9
  doc.text('GOBIERNO MUNICIPAL', W / 2, y, { align: 'center' }); y += 13

  doc.setFontSize(12); doc.setFont('helvetica', 'italic'); setColor(doc, DORADO)
  doc.text('"Por Un Mejor Futuro"', W / 2, y, { align: 'center' }); y += 13

  setDraw(doc, DORADO); doc.setLineWidth(0.8); doc.line(W / 2 - 40, y, W / 2 + 40, y); y += 10

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(PERIODO_INFORME, W / 2, y, { align: 'center' }); y += 12

  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('H. Ayuntamiento de Apizaco, Tlaxcala · 2024-2027', W / 2, y, { align: 'center' }); y += 8
  doc.text(`Fecha de generación: ${fechaGenStr}`, W / 2, y, { align: 'center' })
}

// ── Índice (se dibuja al final sobre la página 2, ya reservada) ─────────────
export function drawIndice(doc, entries) {
  doc.setPage(2)
  const W = doc.internal.pageSize.width, ML = 15
  let y = sectionBanner(doc, 'ÍNDICE')
  entries.forEach((e, i) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(`${i + 1}.`, ML, y)
    doc.setFont('helvetica', 'normal'); setColor(doc, NEGRO)
    const label = doc.splitTextToSize(e.label, W - ML * 2 - 30)
    doc.text(label, ML + 8, y)
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(String(e.page), W - ML, y, { align: 'right' })
    y += Math.max(7, label.length * 5)
  })
}

// ── Presentación ─────────────────────────────────────────────────────────
export function drawPresentacion(doc) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  const W = doc.internal.pageSize.width, ML = 15
  let y = sectionBanner(doc, 'PRESENTACIÓN')

  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setColor(doc, NEGRO)
  PRESENTACION_PARRAFOS.forEach(p => {
    const lines = doc.splitTextToSize(p, W - ML * 2)
    doc.text(lines, ML, y)
    y += lines.length * 5.2 + 5
  })
  y += 2
  PRESENTACION_EJES.forEach(l => {
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text('•', ML, y)
    doc.setFont('helvetica', 'normal'); setColor(doc, NEGRO)
    doc.text(l, ML + 5, y)
    y += 6.5
  })
  return page
}

// ── Mensaje del Presidente (2 páginas: foto+datos, luego mensaje) ──────────
export function drawMensajePresidente(doc) {
  doc.addPage('letter', 'portrait')
  const pageFoto = doc.internal.getNumberOfPages()
  const W = doc.internal.pageSize.width
  sectionBanner(doc, 'MENSAJE DEL PRESIDENTE MUNICIPAL')

  const boxW = 90, boxH = 100, boxX = (W - boxW) / 2, boxY = 45
  placeholderBox(doc, boxX, boxY, boxW, boxH, '[ FOTOGRAFÍA ]', 12)

  let y = boxY + boxH + 14
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Javier Rivera Bonilla', W / 2, y, { align: 'center' }); y += 7
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('Presidente Municipal de Apizaco, Tlaxcala', W / 2, y, { align: 'center' })

  doc.addPage('letter', 'portrait')
  drawRunningHeaderSimple(doc, 'Mensaje del Presidente Municipal')
  const ML = 15
  let y2 = 30
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); setColor(doc, NEGRO)
  MENSAJE_PRESIDENTE.forEach(p => {
    const lines = doc.splitTextToSize(p, W - ML * 2)
    doc.text(lines, ML, y2)
    y2 += lines.length * 5.2 + 6
  })
  return pageFoto
}

// ── Cabildo ──────────────────────────────────────────────────────────────
export function drawCabildo(doc) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  sectionBanner(doc, 'INTEGRANTES DEL H. CABILDO', 'H. Ayuntamiento de Apizaco · 2024-2027')
  autoTable(doc, {
    head: [['Cargo', 'Nombre']],
    body: CABILDO,
    startY: 40,
    margin: { left: 15, right: 15, bottom: 20 },
    styles: { fontSize: 8.5, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.1, valign: 'middle' },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 'auto' } },
    alternateRowStyles: { fillColor: [245, 232, 234] },
    didDrawPage: (data) => { if (data.pageNumber > 1) drawRunningHeaderSimple(doc, 'Integrantes del H. Cabildo') },
  })
  return page
}

// ── Acciones del H. Cabildo (placeholder) ──────────────────────────────────
export function drawAccionesCabildoPlaceholder(doc) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  const W = doc.internal.pageSize.width
  sectionBanner(doc, 'ACCIONES DEL H. CABILDO')
  placeholderBox(doc, 15, 100, W - 30, 40, '[ ACCIONES DEL H. CABILDO — PENDIENTE ]', 11)
  return page
}

// ── Gabinete ─────────────────────────────────────────────────────────────
export function drawGabinete(doc) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  sectionBanner(doc, 'GABINETE MUNICIPAL', 'H. Ayuntamiento de Apizaco · 2024-2027')
  autoTable(doc, {
    head: [['Cargo / Dependencia', 'Titular']],
    body: GABINETE,
    startY: 40,
    margin: { left: 15, right: 15, bottom: 20 },
    styles: { fontSize: 8, cellPadding: 2.6, lineColor: [220, 220, 220], lineWidth: 0.1, valign: 'middle' },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 'auto' } },
    alternateRowStyles: { fillColor: [245, 232, 234] },
    didDrawPage: (data) => { if (data.pageNumber > 1) drawRunningHeaderSimple(doc, 'Gabinete Municipal') },
  })
  return page
}

// ── Resumen Ejecutivo ────────────────────────────────────────────────────
export function drawResumenEjecutivo(doc, totales, pmdTotal, pmdConAvance) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  const W = doc.internal.pageSize.width, ML = 15
  let y = sectionBanner(doc, 'RESUMEN EJECUTIVO', PERIODO_INFORME)

  const kpis = [
    { label: 'Total de Indicadores', value: String(totales.total) },
    { label: '% Avance Global Acumulado', value: pctStr(totales.pctGlobal) },
    { label: 'Programas PMD con Avance', value: `${pmdConAvance} / ${pmdTotal}` },
  ]
  const kpiW = (W - ML * 2 - 6) / 3
  kpis.forEach((k, i) => {
    const x = ML + i * (kpiW + 3)
    setFill(doc, [250, 248, 244]); setDraw(doc, DORADO); doc.setLineWidth(0.3)
    doc.roundedRect(x, y, kpiW, 26, 2, 2, 'FD')
    doc.setFontSize(15); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(k.value, x + kpiW / 2, y + 14, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(k.label, x + kpiW / 2, y + 21, { align: 'center', maxWidth: kpiW - 4 })
  })
  y += 38

  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Distribución de Indicadores por Semáforo', ML, y); y += 8

  const badges = [
    ['ÓPTIMO', totales.optimo], ['ADECUADO', totales.adecuado],
    ['RIESGO', totales.riesgo], ['CRÍTICO', totales.critico],
  ]
  const bw = (W - ML * 2 - 9) / 4
  badges.forEach(([sem, n], i) => {
    const x = ML + i * (bw + 3)
    const sc = SEM_COLORS[sem]
    setFill(doc, sc.bg); doc.roundedRect(x, y, bw, 20, 2, 2, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); setColor(doc, sc.txt)
    doc.text(String(n), x + bw / 2, y + 9, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'bold')
    doc.text(sem, x + bw / 2, y + 16, { align: 'center' })
  })

  return page
}

// ── Datos Financieros (placeholder) ────────────────────────────────────────
export function drawDatosFinancierosPlaceholder(doc) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  const W = doc.internal.pageSize.width
  sectionBanner(doc, 'DATOS FINANCIEROS')
  setFill(doc, [250, 245, 230]); setDraw(doc, DORADO); doc.setLineWidth(0.5)
  doc.roundedRect(15, 100, W - 30, 40, 2, 2, 'FD')
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(168, 132, 40)
  doc.text('[ DATOS FINANCIEROS — PENDIENTE ]', W / 2, 122, { align: 'center' })
  return page
}

// ── Pie de página (todas las páginas) ───────────────────────────────────
export function drawFooters(doc, folio) {
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
    setDraw(doc, [220, 220, 220]); doc.setLineWidth(0.2); doc.line(15, H - 14, W - 15, H - 14)
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, [150, 150, 150])
    doc.text('SEGUNDO INFORME DE GOBIERNO · H. Ayuntamiento de Apizaco 2024-2027', 15, H - 9)
    doc.text(`Página ${p} de ${totalPages}`, W / 2, H - 9, { align: 'center' })
    doc.text(`Folio: ${folio}`, W - 15, H - 9, { align: 'right' })
  }
}
