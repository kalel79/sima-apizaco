import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { LOGO_BASE64 } from '../logo.js'

// ── Paleta PDF (RGB) ──────────────────────────────────────────────────────────
const GUINDA = [123, 31, 44]
const DORADO = [201, 169, 97]
const GRIS   = [89,  89,  89]
const BLANCO = [255, 255, 255]

// ── Paleta Excel (ARGB) ───────────────────────────────────────────────────────
const XL = {
  guinda:   'FF7B1F2C',
  dorado:   'FFC9A961',
  crema:    'FFF9F4E8',
  blanco:   'FFFFFFFF',
  gris:     'FF595959',
  grisClaro:'FFF5F5F5',
  optimo:   'FF2E7D32',
  adecuado: 'FF007830',
  riesgo:   'FFEF6C00',
  critico:  'FFC62828',
  optBg:    'FFE8F5E9',
  adeBg:    'FFFFF9E6',
  riesBg:   'FFFFF3E0',
  critBg:   'FFFFEBEE',
}

// ── Catálogo de firmas ────────────────────────────────────────────────────────
const FIRMAS_RESP = {
  E1: { nombre: 'Cap. José Ramón Jacques Mena',     cargo: 'Director de Seguridad Pública' },
  E2: { nombre: 'Lic. Fernando Águila Sánchez',     cargo: 'Director de Desarrollo Social' },
  E3: { nombre: 'Ing. Jesús Martinez Vázquez',      cargo: 'Director de Obras Públicas' },
  E4: { nombre: 'Lic. David Velazquez Rugerio',     cargo: 'Director de Desarrollo Económico' },
  E5: { nombre: 'C.p. David Hernandez Montiel',     cargo: 'Tesorero' },
  TA: { nombre: 'Lic. Edgar Torres López',          cargo: 'Director de Ecología y Desarrollo Ambiental' },
  TB: { nombre: 'C. Anabel Alducin Lima',           cargo: 'Directora del Instituto Municipal de Apizaco' },
  MS: { nombre: 'Lic. Juan Pablo Morales Rico',     cargo: 'Secretario del Ayuntamiento' },
  AJ: { nombre: 'Lic. Omar Muñoz Torres',           cargo: 'Director Jurídico' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function semLabel(sem) { return sem || 'SIN DATO' }

function semaforoEje(eje) {
  const vals = [
    { sem: 'CRÍTICO',  n: eje.critico  || 0 },
    { sem: 'RIESGO',   n: eje.riesgo   || 0 },
    { sem: 'ADECUADO', n: eje.adecuado || 0 },
    { sem: 'ÓPTIMO',   n: eje.optimo   || 0 },
  ]
  return vals.reduce((best, cur) => cur.n > best.n ? cur : best).sem
}

function pctStr(val) {
  if (val == null) return '-'
  return ((+val) * 100).toFixed(1) + '%'
}

function numStr(val) {
  if (val == null) return '-'
  const n = +val
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function formatFecha() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

// ── Canvas: dona de semáforo ─────────────────────────────────────────────────
// totalLabel = eje.total_indicadores (se muestra en el centro)
// size = dimensión del canvas en px (160 para inline, 280 para página exclusiva)
function donaDataURL(optimo, adecuado, riesgo, critico, totalLabel, size = 160) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2, cy = size / 2
  const r  = size * 0.44
  const ri = size * 0.27

  const slices = [
    { n: optimo,   color: '#2E7D32' },
    { n: adecuado, color: '#C9A961' },
    { n: riesgo,   color: '#EF6C00' },
    { n: critico,  color: '#C62828' },
  ]
  const segTotal = slices.reduce((s, sl) => s + sl.n, 0)

  if (segTotal === 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.fillStyle = '#DDD'
    ctx.fill()
  } else {
    let a = -Math.PI / 2
    slices.forEach(sl => {
      if (!sl.n) return
      const sw = (sl.n / segTotal) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(cx + ri * Math.cos(a), cy + ri * Math.sin(a))
      ctx.arc(cx, cy, r, a, a + sw)
      ctx.arc(cx, cy, ri, a + sw, a, true)
      ctx.closePath()
      ctx.fillStyle = sl.color
      ctx.fill()
      a += sw
    })
  }

  // Agujero blanco
  ctx.beginPath()
  ctx.arc(cx, cy, ri - 1, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  // Texto central: total del eje (no la suma de segmentos)
  const fs  = Math.round(size * 0.13)
  const sfs = Math.round(size * 0.07)
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#222'
  ctx.font = `bold ${fs}px Arial`
  ctx.fillText(String(totalLabel), cx, cy - fs * 0.4)
  ctx.font = `${sfs}px Arial`
  ctx.fillStyle = '#777'
  ctx.fillText('indicadores', cx, cy + fs * 0.65)

  return canvas.toDataURL('image/png')
}

// ── Canvas: barra de avance ──────────────────────────────────────────────────
function barraDataURL(pct, width = 250, height = 64) {
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const bX = 6, bY = Math.round(height * 0.44), bH = Math.round(height * 0.30), bW = width - 12
  const fill  = Math.min(pct || 0, 1.0)
  const isOpt = (pct || 0) > 1.10

  // Porcentaje encima
  ctx.font = `bold ${Math.round(height * 0.26)}px Arial`
  ctx.fillStyle  = '#222'
  ctx.textAlign  = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(pctStr(pct), width / 2, Math.round(height * 0.33))

  // Fondo gris
  ctx.fillStyle = '#E0E0E0'
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(bX, bY, bW, bH, 5)
  else ctx.rect(bX, bY, bW, bH)
  ctx.fill()

  // Barra de progreso
  const fillW = fill * bW
  if (fillW > 0) {
    ctx.fillStyle = isOpt ? '#2E7D32' : '#7B1F2C'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(bX, bY, fillW, bH, 5)
    else ctx.rect(bX, bY, fillW, bH)
    ctx.fill()
  }

  // Sub-etiqueta
  ctx.font = `${Math.round(height * 0.16)}px Arial`
  ctx.fillStyle = '#888'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('avance acumulado del eje', width / 2, height - 4)

  return canvas.toDataURL('image/png')
}

// ── Encabezado de página corrido ─────────────────────────────────────────────
function drawRunningHeader(doc, ejeNombre) {
  const W = doc.internal.pageSize.width
  try { doc.addImage(LOGO_BASE64, 'PNG', 14, 6, 8, 8) } catch (_) {}
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text(ejeNombre, 24, 12, { maxWidth: W - 42 })
  setDraw(doc, GUINDA)
  doc.setLineWidth(0.3)
  doc.line(14, 16, W - 14, 16)
  setDraw(doc, DORADO)
  doc.setLineWidth(0.2)
  doc.line(14, 16.5, W - 14, 16.5)
}

// ── Bloque de firmas ─────────────────────────────────────────────────────────
function drawFirmas(doc, ejeCodigo, y) {
  const resp = FIRMAS_RESP[ejeCodigo] || { nombre: '___________________', cargo: 'Responsable del Eje' }
  const firmantes = [
    { rol: 'AUTORIZÓ',    nombre: 'C. Javier Rivera Bonilla',           cargo: 'Presidente Municipal de Apizaco' },
    { rol: 'VO.BO.',      nombre: 'C. María de la Paz Flores Hernández', cargo: 'Síndico Municipal' },
    { rol: 'ELABORÓ',     nombre: 'C.p. David Hernandez Montiel',        cargo: 'Tesorero' },
    { rol: 'RESPONSABLE', nombre: resp.nombre,                           cargo: resp.cargo },
  ]
  const W    = doc.internal.pageSize.width
  const ML   = 14
  const colW = (W - ML * 2 - 9) / 4   // 3 separaciones de 3mm entre 4 columnas

  doc.setFontSize(6.5)
  firmantes.forEach((f, i) => {
    const xL   = ML + i * (colW + 3)
    const xC   = xL + colW / 2
    const lineY = y + 17

    doc.setFont('helvetica', 'bold')
    setColor(doc, GUINDA)
    doc.text(f.rol, xC, y + 4, { align: 'center' })

    setDraw(doc, [150, 150, 150])
    doc.setLineWidth(0.3)
    doc.line(xL + 2, lineY, xL + colW - 2, lineY)

    doc.setFont('helvetica', 'bold')
    setColor(doc, [30, 30, 30])
    const nLines = doc.splitTextToSize(f.nombre, colW - 4)
    doc.text(nLines, xC, lineY + 4, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    setColor(doc, GRIS)
    const cLines = doc.splitTextToSize(f.cargo, colW - 4)
    doc.text(cLines, xC, lineY + 4 + nLines.length * 3.5, { align: 'center' })
  })
}

// ── Gráficas por eje (página dedicada) ───────────────────────────────────────
function drawGraficasPage(doc, eje, periodoLabel) {
  const W = doc.internal.pageSize.width  // 279.4 landscape

  // Título de sección
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text('Distribución de Indicadores por Semáforo  ·  Avance del Eje', W / 2, 21, { align: 'center' })
  setDraw(doc, DORADO)
  doc.setLineWidth(0.5)
  doc.line(14, 24.5, W - 14, 24.5)

  // ── LADO IZQUIERDO: dona (x=14 a x=136) ─────────────────────────────────
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text('Semáforo del Eje', 75, 29, { align: 'center' })

  try {
    const donaURL = donaDataURL(
      eje.optimo  || 0,
      eje.adecuado || 0,
      eje.riesgo  || 0,
      eje.critico  || 0,
      eje.total_indicadores || 0,  // total real del eje en el centro
      300
    )
    // Centrado en x=14-136: x = (14+136-80)/2 = 35, ancho 80mm, alto 80mm
    doc.addImage(donaURL, 'PNG', 26, 31, 80, 80)
  } catch (_) {}

  // Leyenda dona
  const legItems = [
    { label: `Óptimo: ${eje.optimo||0}`,    color: [46, 125, 50] },
    { label: `Adecuado: ${eje.adecuado||0}`, color: [152, 101, 0] },
    { label: `Riesgo: ${eje.riesgo||0}`,     color: [239, 108, 0] },
    { label: `Crítico: ${eje.critico||0}`,   color: [198,  40, 40] },
  ]
  const sinDato = Math.max(0, (eje.total_indicadores||0) - (eje.optimo||0) - (eje.adecuado||0) - (eje.riesgo||0) - (eje.critico||0))
  if (sinDato > 0) legItems.push({ label: `Sin dato: ${sinDato}`, color: [150, 150, 150] })

  doc.setFontSize(8.5)
  legItems.forEach((item, i) => {
    const lx = 109
    const ly = 39 + i * 11
    setFill(doc, item.color)
    doc.rect(lx, ly - 3, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    setColor(doc, item.color)
    doc.text(item.label, lx + 6, ly)
  })

  // Divisor vertical
  setDraw(doc, [220, 220, 220])
  doc.setLineWidth(0.2)
  doc.line(137, 26, 137, 118)

  // ── LADO DERECHO: barra (x=140 a x=265) ──────────────────────────────────
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text('Avance Acumulado del Eje', 202, 29, { align: 'center' })

  try {
    const barURL = barraDataURL(eje.pct_promedio || 0, 460, 130)
    // Centrado en x=140-265: width=125, bar=115mm → x=(140+265-115)/2=145
    doc.addImage(barURL, 'PNG', 147, 33, 115, 32)
  } catch (_) {}

  // Stats bajo la barra
  const statsItems = [
    { label: `Total indicadores: ${eje.total_indicadores||0}`, color: GRIS },
    { label: `Período: ${periodoLabel}`, color: GRIS },
    { label: `Semáforo del eje: ${semaforoEje(eje)}`, color: GUINDA },
  ]
  doc.setFontSize(8)
  statsItems.forEach((s, i) => {
    doc.setFont('helvetica', i === 2 ? 'bold' : 'normal')
    setColor(doc, s.color)
    doc.text(s.label, 202, 73 + i * 8, { align: 'center' })
  })

  // Semáforo badge grande
  const sem     = semaforoEje(eje)
  const semColors = {
    'ÓPTIMO':   { bg: [232,245,233], txt: [46,125,50] },
    'ADECUADO': { bg: [255,249,230], txt: [152,101,0] },
    'RIESGO':   { bg: [255,243,224], txt: [239,108,0] },
    'CRÍTICO':  { bg: [255,235,238], txt: [198,40,40] },
  }
  const sc = semColors[sem] || { bg: [245,245,245], txt: GRIS }
  setFill(doc, sc.bg)
  doc.roundedRect(168, 97, 68, 10, 2.5, 2.5, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  setColor(doc, sc.txt)
  doc.text(sem, 202, 104, { align: 'center' })
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR PDF
// ══════════════════════════════════════════════════════════════════════════════
export function generarPDF({ global: g, ejes, indicadoresPorEje, periodoLabel, piloto = false }) {
  const ejesToRender = piloto ? ejes.slice(0, 1) : ejes
  const ML = 14

  // ── PORTADA (portrait) ─────────────────────────────────────────────────────
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W_P  = doc.internal.pageSize.width   // 215.9
  const H_P  = doc.internal.pageSize.height  // 279.4

  setFill(doc, GUINDA)
  doc.rect(0, 0, W_P, 78, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W_P - 50) / 2, 13, 50, 50) } catch (_) {}

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text('H. AYUNTAMIENTO DE APIZACO 2024-2027', W_P / 2, 92, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRIS)
  doc.text('Sistema de Información Municipal de Avance', W_P / 2, 101, { align: 'center' })

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text('INFORME DE AVANCE MIR', W_P / 2, 123, { align: 'center' })

  setDraw(doc, DORADO)
  doc.setLineWidth(0.9)
  doc.line(ML + 22, 128, W_P - ML - 22, 128)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text(`Periodo: ${periodoLabel}`, W_P / 2, 140, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRIS)
  doc.text('Generado por: Dirección de Planeación y Evaluación', W_P / 2, 151, { align: 'center' })
  doc.text(`Fecha de generación: ${formatFecha()}`, W_P / 2, 159, { align: 'center' })

  const kpis = [
    { label: 'Cumplimiento Global', value: pctStr(g?.pct_global) },
    { label: 'Con Avance',          value: `${(g?.optimo||0)+(g?.adecuado||0)} ind.` },
    { label: 'Ejes Estratégicos',   value: `${ejes.length}` },
    { label: 'Riesgo / Crítico',    value: `${(g?.riesgo||0)+(g?.critico||0)}` },
  ]
  const kpiW = (W_P - ML * 2 - 9) / 4
  kpis.forEach((k, i) => {
    const x = ML + i * (kpiW + 3)
    setFill(doc, [250, 248, 244])
    setDraw(doc, DORADO)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, 172, kpiW, 25, 2, 2, 'FD')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    setColor(doc, GUINDA)
    doc.text(k.value, x + kpiW / 2, 185, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    setColor(doc, GRIS)
    doc.text(k.label, x + kpiW / 2, 192, { align: 'center' })
  })

  setDraw(doc, DORADO)
  doc.setLineWidth(1)
  doc.line(ML, H_P - 18, W_P - ML, H_P - 18)
  doc.setFontSize(7)
  setColor(doc, GRIS)
  doc.text(
    'H. Ayuntamiento de Apizaco · Dirección de Planeación y Evaluación · SIMA 2026',
    W_P / 2, H_P - 10, { align: 'center' }
  )

  // ── RESUMEN EJECUTIVO (landscape, tabla centrada) ──────────────────────────
  doc.addPage('letter', 'landscape')
  const W_L = doc.internal.pageSize.width   // 279.4

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GUINDA)
  doc.text('Resumen Ejecutivo', ML, 22)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRIS)
  doc.text(periodoLabel, W_L - ML, 22, { align: 'right' })
  setDraw(doc, DORADO)
  doc.setLineWidth(0.6)
  doc.line(ML, 25, W_L - ML, 25)

  // Centrar tabla: sum col widths = 78+18+22+18+20+16+16+28 = 216mm → margin = (279.4-216)/2 = 31.7
  const resMargin = (W_L - 216) / 2
  autoTable(doc, {
    head: [['Eje', 'Total Ind.', '% Avance', 'Óptimo', 'Adecuado', 'Riesgo', 'Crítico', 'Semáforo']],
    body: ejes.map(e => {
      const sem = semaforoEje(e)
      return [e.eje, e.total_indicadores||0, pctStr(e.pct_promedio),
        e.optimo||0, e.adecuado||0, e.riesgo||0, e.critico||0, sem]
    }),
    startY: 30,
    margin: { left: resMargin, right: resMargin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 78, halign: 'left' },
      1: { cellWidth: 18 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16 },
      6: { cellWidth: 16 },
      7: { cellWidth: 28 },
    },
    alternateRowStyles: { fillColor: [249, 244, 232] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const sem = data.cell.raw
        const semTxt = {
          'ÓPTIMO': [46,125,50], 'ADECUADO': [152,101,0],
          'RIESGO': [239,108,0], 'CRÍTICO':  [198,40,40],
        }
        data.cell.styles.textColor = semTxt[sem] || GRIS
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ── PÁGINAS POR EJE ────────────────────────────────────────────────────────
  // Anchos columna indicadores: 8+26+114+45+18+18+20 = 249mm → margin = (279.4-249)/2 = 15.2
  const indColWidths = { 0:8, 1:26, 2:114, 3:45, 4:18, 5:18, 6:20 }
  const indTableW    = 249
  const indMargin    = (W_L - indTableW) / 2

  ejesToRender.forEach(eje => {
    const inds = indicadoresPorEje[eje.codigo] || []
    const H_L  = 215.9  // altura landscape

    // ── PASO A: Tabla de indicadores + firmas ──────────────────────────────
    doc.addPage('letter', 'landscape')
    drawRunningHeader(doc, eje.eje)

    const indCols = ['#', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance']
    const indRows = inds.map((ind, i) => [
      i + 1,
      ind.nivel_mir || '-',
      ind.indicador || '-',
      ind.area      || '-',
      numStr(ind.meta_evaluable),
      numStr(ind.resultado),
      pctStr(ind.pct_cumplimiento),
    ])

    let firstPage = true
    autoTable(doc, {
      head: [indCols],
      body: indRows,
      startY: 20,
      margin: { left: indMargin, right: indMargin, bottom: 58 },
      styles: {
        fontSize: 7.5,
        cellPadding: [2.5, 2.5, 2.5, 2.5],
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        overflow: 'linebreak',
        textColor: [40, 40, 40],
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: GUINDA,
        textColor: BLANCO,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        valign: 'middle',
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: indColWidths,
      didDrawPage: () => {
        if (!firstPage) drawRunningHeader(doc, eje.eje)
        firstPage = false
      },
    })

    // Firmas al pie de la última página de tabla
    const finalY = doc.lastAutoTable.finalY
    if (finalY + 56 > H_L - 8) {
      doc.addPage('letter', 'landscape')
      drawRunningHeader(doc, eje.eje)
      drawFirmas(doc, eje.codigo, 26)
    } else {
      drawFirmas(doc, eje.codigo, finalY + 8)
    }

    // ── PASO B: Página de gráficas + firmas ────────────────────────────────
    doc.addPage('letter', 'landscape')
    drawRunningHeader(doc, eje.eje)
    drawGraficasPage(doc, eje, periodoLabel)
    drawFirmas(doc, eje.codigo, 148)
  })

  // Pie de página en todas las páginas
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const W = doc.internal.pageSize.width
    const H = doc.internal.pageSize.height
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    setColor(doc, [150, 150, 150])
    doc.text(
      `Página ${p} de ${totalPages}  ·  SIMA · H. Ayuntamiento de Apizaco · ${periodoLabel}`,
      W / 2, H - 6, { align: 'center' }
    )
  }

  doc.save(`SIMA_InformeAvance${piloto ? '_PILOTO' : ''}_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.pdf`)
}

export function generarPDFPiloto(datos) {
  return generarPDF({ ...datos, piloto: true })
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR EXCEL  (ExcelJS — estilos completos)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcel({ global: g, ejes, indicadoresPorEje, periodoLabel, piloto = false }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const logoB64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '')
  const logoId  = wb.addImage({ base64: logoB64, extension: 'png' })

  const ejesToRender = piloto ? ejes.slice(0, 1) : ejes

  // ── Bordes finos ──────────────────────────────────────────────────────────
  const thinB  = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

  // ── Helpers de estilo ─────────────────────────────────────────────────────
  function semArgb(sem) {
    return { 'ÓPTIMO': XL.optimo, 'ADECUADO': XL.adecuado, 'RIESGO': XL.riesgo, 'CRÍTICO': XL.critico }[sem] || XL.gris
  }
  function semBgArgb(sem) {
    return { 'ÓPTIMO': XL.optBg, 'ADECUADO': XL.adeBg, 'RIESGO': XL.riesBg, 'CRÍTICO': XL.critBg }[sem] || XL.grisClaro
  }

  function styleHeader(cell) {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    cell.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = borders
  }

  function styleData(cell, isAlt, semVal) {
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: semVal ? semBgArgb(semVal) : (isAlt ? XL.crema : XL.blanco) },
    }
    cell.font = semVal
      ? { bold: true, color: { argb: semArgb(semVal) }, size: 9.5 }
      : { size: 9.5 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = borders
  }

  function styleTotal(cell) {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.dorado } }
    cell.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  }

  // ── Encabezado de hoja (logo + título guinda + subtítulo guinda) ──────────
  function addSheetHeader(ws, title, isEje = false) {
    // Filas de encabezado
    ws.getRow(1).height = 30
    ws.getRow(2).height = 24
    ws.getRow(3).height = 20
    ws.getRow(4).height = 8   // spacer

    // Logo
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 58, height: 58 } })

    // Fondo guinda en B1:I3 (antes de mergear para que se aplique a todo)
    for (let row = 1; row <= 3; row++) {
      for (let col = 2; col <= 9; col++) {  // columnas B-I (1-indexed)
        ws.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      }
    }

    // Fusionar B1:I2 para el título
    ws.mergeCells('B1:I2')
    const titleCell     = ws.getCell('B1')
    titleCell.value     = title
    titleCell.font      = { bold: true, size: isEje ? 16 : 15, color: { argb: XL.blanco } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // B3: Periodo
    ws.mergeCells('B3:I3')
    const perCell     = ws.getCell('B3')
    perCell.value     = `Periodo: ${periodoLabel}`
    perCell.font      = { size: isEje ? 12 : 11, color: { argb: XL.blanco } }
    perCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Spacer row 4
    ws.addRow([])
  }

  // ── HOJA RESUMEN ──────────────────────────────────────────────────────────
  const wsR = wb.addWorksheet('Resumen')
  wsR.properties.defaultRowHeight = 14.4

  addSheetHeader(wsR, 'SIMA – Resumen por Eje Estratégico', false)

  const resHdr = ['Eje Estratégico', 'Total Ind.', '% Avance', 'Óptimo', 'Adecuado', 'Riesgo', 'Crítico', 'Semáforo']
  const rhRow  = wsR.addRow(resHdr)         // row 5
  rhRow.eachCell(c => styleHeader(c))
  wsR.getRow(rhRow.number).height = 20

  ejes.forEach((e, i) => {
    const sem = semaforoEje(e)
    const row = wsR.addRow([
      e.eje, e.total_indicadores||0, pctStr(e.pct_promedio),
      e.optimo||0, e.adecuado||0, e.riesgo||0, e.critico||0, sem,
    ])
    const isAlt = i % 2 === 1
    row.eachCell((c, col) => styleData(c, isAlt, col === 8 ? sem : null))
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    for (let c = 2; c <= 7; c++) row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // Fila totales
  const totR = wsR.addRow([
    'TOTAL MUNICIPIO',
    ejes.reduce((s, e) => s + (e.total_indicadores||0), 0),
    pctStr(g?.pct_global),
    ejes.reduce((s, e) => s + (e.optimo||0), 0),
    ejes.reduce((s, e) => s + (e.adecuado||0), 0),
    ejes.reduce((s, e) => s + (e.riesgo||0), 0),
    ejes.reduce((s, e) => s + (e.critico||0), 0),
    '',
  ])
  totR.eachCell(c => styleTotal(c))
  totR.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

  wsR.columns = [
    {width:52},{width:12},{width:13},{width:10},{width:10},{width:10},{width:10},{width:14},
  ]
  wsR.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }]

  // ── HOJAS POR EJE ─────────────────────────────────────────────────────────
  const IND_HDR = ['#', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance', 'Semáforo', 'Observaciones']
  // Anchos: A=19.2, B=16, C=55, D=30, E=12, F=12, G=12, H=14, I=28
  const IND_W   = [19.2, 16, 55, 30, 12, 12, 12, 14, 28]

  ejesToRender.forEach(eje => {
    const inds  = indicadoresPorEje[eje.codigo] || []
    const sem   = semaforoEje(eje)
    const wsName = `${eje.codigo} ${eje.eje}`.substring(0, 31)
    const ws    = wb.addWorksheet(wsName)
    ws.properties.defaultRowHeight = 14.4

    addSheetHeader(ws, eje.eje, true)

    // Fila de resumen del eje (row 5 / fila 6 en display 1-indexed)
    const statRow = ws.addRow([
      `Semáforo eje: ${sem}`,
      `Total: ${eje.total_indicadores||0}`,
      pctStr(eje.pct_promedio),
      `Óptimo: ${eje.optimo||0}`,
      `Adecuado: ${eje.adecuado||0}`,
      `Riesgo: ${eje.riesgo||0}`,
      `Crítico: ${eje.critico||0}`,
      '', '',
    ])
    statRow.eachCell(c => {
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E8' } }
      c.font      = { size: 10, color: { argb: XL.guinda } }
      c.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    statRow.getCell(1).font = { bold: true, size: 10, color: { argb: semArgb(sem) } }
    ws.getRow(statRow.number).height = 16

    // Encabezado de tabla (row 6)
    const hRow = ws.addRow(IND_HDR)
    hRow.eachCell(c => styleHeader(c))
    ws.getRow(hRow.number).height = 20

    // Datos
    inds.forEach((ind, i) => {
      const semInd = semLabel(ind.semaforo)
      const isAlt  = i % 2 === 1
      const row    = ws.addRow([
        i + 1,
        ind.nivel_mir || '',
        ind.indicador || '',
        ind.area      || '',
        ind.meta_evaluable != null ? +ind.meta_evaluable : '',
        ind.resultado      != null ? +ind.resultado      : '',
        pctStr(ind.pct_cumplimiento),
        semInd,
        '',
      ])
      row.eachCell((c, col) => styleData(c, isAlt, col === 8 ? semInd : null))
      row.height = 14.4
    })

    // Fila total (dorada)
    const totRow2 = ws.addRow([
      'Total indicadores:', inds.length, pctStr(eje.pct_promedio),
      '', '', '', '', '', '',
    ])
    totRow2.eachCell(c => styleTotal(c))
    totRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

    ws.columns = IND_W.map(w => ({ width: w }))
    // Freeze: congelar encabezado de tabla (fila 6 = ySplit 6)
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
  })

  // ── HOJA "TODOS LOS INDICADORES" ─────────────────────────────────────────
  if (!piloto) {
    const wsA  = wb.addWorksheet('Todos los Indicadores')
    wsA.properties.defaultRowHeight = 14.4

    addSheetHeader(wsA, 'Todos los Indicadores – Vista Global', false)

    const allHdr = ['#', 'Eje', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance', 'Semáforo']
    const hRowA  = wsA.addRow(allHdr)   // row 5
    hRowA.eachCell(c => styleHeader(c))
    wsA.getRow(hRowA.number).height = 20

    let idx = 1
    ejes.forEach(eje => {
      ;(indicadoresPorEje[eje.codigo] || []).forEach(ind => {
        const semInd = semLabel(ind.semaforo)
        const isAlt  = idx % 2 === 1
        const row    = wsA.addRow([
          idx++, eje.eje,
          ind.nivel_mir || '', ind.indicador || '', ind.area || '',
          ind.meta_evaluable != null ? +ind.meta_evaluable : '',
          ind.resultado      != null ? +ind.resultado      : '',
          pctStr(ind.pct_cumplimiento), semInd,
        ])
        row.eachCell((c, col) => styleData(c, isAlt, col === 9 ? semInd : null))
        row.height = 14.4
      })
    })

    wsA.columns = [
      {width:6},{width:35},{width:15},{width:55},{width:28},{width:12},{width:12},{width:12},{width:14},
    ]
    wsA.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }]
  }

  // Descargar
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `SIMA_Detalle${piloto ? '_PILOTO' : ''}_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generarExcelPiloto(datos) {
  return generarExcel({ ...datos, piloto: true })
}
