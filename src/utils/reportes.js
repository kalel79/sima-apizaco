import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { LOGO_BASE64 } from '../logo.js'

// ── Paleta PDF (RGB) ──────────────────────────────────────────────────────────
const GUINDA = [123, 31, 44]
const DORADO = [201, 169, 97]
const GRIS   = [89,  89,  89]
const BLANCO = [255, 255, 255]

// Paleta oficial de semáforo (RGB) — usada en todo el PDF
const SEM_COLORS = {
  'ÓPTIMO':   { txt: [4,   98,   5], bg: [209, 235, 209] },
  'ADECUADO': { txt: [0,  176,  80], bg: [200, 243, 220] },
  'RIESGO':   { txt: [180, 135,  0], bg: [255, 248, 200] },
  'CRÍTICO':  { txt: [192,   0,  0], bg: [255, 215, 215] },
}
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

// ── Catálogo de programa presupuestario por eje (encabezado del reporte) ──────
const PROGRAMA_EJE = {
  E1: { programa: '005 Seguridad Pública y Transito Vial', responsable: 'Dirección de Seguridad Pública, Juzgado Municipal, Protección Civil', elaboro: 'Cap. José Ramón Jacques Mena - Director de Seguridad Pública' },
  E2: { programa: '018 Fortalecimiento a la calidad educativa, cultural y deportiva', responsable: 'Desarrollo Social, Salud, DIF, Deporte, Rastro, Educación, Juventud', elaboro: 'Lic. Fernando Águila Sánchez' },
  E3: { programa: '024 Infraestructura y Equipamiento para el Desarrollo Urbano', responsable: 'Dirección de Obras Públicas', elaboro: 'Ing. Jesús Martinez Vázquez - Director de Obras Públicas' },
  E4: { programa: '012 Fomento a la Producción y Comercialización', responsable: 'Desarrollo Económico, Comercio en vía pública, Turismo, Agropecuario, Cultura, Parquímetros', elaboro: 'Lic. David Velazquez Rugerio - Director de Desarrollo Económico' },
  E5: { programa: '037 Fiscalizar, Controlar y Evaluar la Gestión Municipal', responsable: 'Tesorería, Control Interno, TICS, Transparencia, Planeación', elaboro: 'C.p. David Hernandez Montiel' },
  TA: { programa: '032 Protección al ambiente', responsable: 'Dirección de Ecología y Desarrollo Ambiental, Servicios Municipales', elaboro: 'Lic. Edgar Torres López' },
  TB: { programa: '021 Desarrollo Integral para la Familia', responsable: 'Dirección del Instituto Municipal de la Mujer, SIPINNA', elaboro: 'C. Anabel Alducin Lima' },
  MS: { programa: '033 Apoyo a las Políticas Gubernamentales', responsable: 'Presidencia, Secretaría del Ayuntamiento, Regidurías, Presidencias de Comunidad, Comunicación Social y Gobernación', elaboro: 'Lic. Juan Pablo Morales Rico' },
  AJ: { programa: '003 Procuración y Defensa de los Intereses Municipales', responsable: 'Sindicatura Municipal y Dirección Jurídica', elaboro: 'Lic. Omar Muñoz Torres - Director Jurídico' },
}
const ENTIDAD_NOMBRE = 'Ayuntamiento de Apizaco'

const MESES_NOMBRES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

// ── Helpers ───────────────────────────────────────────────────────────────────
function semLabel(sem) { return sem || 'SIN DATO' }

// Semáforo derivado del % de avance del eje (pct_promedio)
function semaforoEje(eje) {
  const p = eje.pct_promedio || 0
  if (p >= 1.10) return 'ÓPTIMO'
  if (p >= 0.90) return 'ADECUADO'
  if (p >= 0.70) return 'RIESGO'
  return 'CRÍTICO'
}

// MIR sort: Fin=0 · Propósito/Proposito=1 · Componente N=2 · Actividad N.M=3
function mirSortKey(nivel) {
  const n = (nivel || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n === 'FIN' || n.startsWith('FIN ')) return [0, 0, 0]
  if (n.startsWith('PROPOSITO') || n.startsWith('PROP')) return [1, 0, 0]
  if (n.startsWith('COMPONENTE')) {
    const m = n.match(/(\d+)/); return [2, m ? +m[1] : 99, 0]
  }
  if (n.startsWith('ACTIVIDAD')) {
    const m = n.match(/(\d+)[.,](\d+)/)
    if (m) return [3, +m[1], +m[2]]
    const m2 = n.match(/(\d+)/); return [3, m2 ? +m2[1] : 99, 0]
  }
  return [4, 0, 0]
}

function sortByMIR(inds) {
  return [...inds].sort((a, b) => {
    const ka = mirSortKey(a.nivel_mir), kb = mirSortKey(b.nivel_mir)
    for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]
    return 0
  })
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

function formatFecha(d) {
  d = d || new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

// ── Canvas: barra de avance ──────────────────────────────────────────────────
function barraDataURL(pct, width = 250, height = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')

  const bX = 6, bY = Math.round(height * 0.44), bH = Math.round(height * 0.30), bW = width - 12
  const fill = Math.min(pct || 0, 1.0)
  const barColor = '#7B1F2C'

  ctx.font = `bold ${Math.round(height * 0.26)}px Arial`
  ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(pctStr(pct), width / 2, Math.round(height * 0.33))

  ctx.fillStyle = '#E0E0E0'; ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(bX, bY, bW, bH, 5)
  else ctx.rect(bX, bY, bW, bH)
  ctx.fill()

  const fillW = fill * bW
  if (fillW > 0) {
    ctx.fillStyle = barColor; ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(bX, bY, fillW, bH, 5)
    else ctx.rect(bX, bY, fillW, bH)
    ctx.fill()
  }

  ctx.font = `${Math.round(height * 0.16)}px Arial`
  ctx.fillStyle = '#888'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('avance acumulado del eje', width / 2, height - 4)

  return canvas.toDataURL('image/png')
}

// ── Canvas: línea acumulada meta vs resultado ─────────────────────────────────
// lineData: [{ mesLabel, metaAcum, resAcum }]
function lineaDataURL(lineData, width = 460, height = 175) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height)

  if (!lineData || lineData.length === 0) return canvas.toDataURL('image/png')

  const PAD_L = 52, PAD_R = 14, PAD_T = 26, PAD_B = 30
  const W = width - PAD_L - PAD_R, H = height - PAD_T - PAD_B
  const n = lineData.length

  const maxVal = Math.max(...lineData.map(d => Math.max(d.metaAcum || 0, d.resAcum || 0))) * 1.12 || 1
  const toY = v => PAD_T + H - ((Math.min(v, maxVal) / maxVal) * H)
  const toX = i => n === 1 ? PAD_L + W / 2 : PAD_L + (i / (n - 1)) * W

  // Grid lines + Y labels
  for (let g = 0; g <= 4; g++) {
    const y = PAD_T + (g / 4) * H
    ctx.strokeStyle = '#EBEBEB'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(PAD_L + W, y); ctx.stroke()
    const val = maxVal * (1 - g / 4)
    ctx.fillStyle = '#999'; ctx.font = '10px Arial'; ctx.textAlign = 'right'
    ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 10 ? 1 : 0), PAD_L - 4, y + 4)
  }

  // X labels
  lineData.forEach((d, i) => {
    ctx.fillStyle = '#555'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'
    ctx.fillText(d.mesLabel, toX(i), height - 7)
  })

  // Series: meta (guinda dashed) y resultado (verde sólido)
  const series = [
    { key: 'metaAcum', color: '#7B1F2C', dash: [5, 4], label: 'Meta acum.' },
    { key: 'resAcum',  color: '#046205', dash: [],      label: 'Resultado acum.' },
  ]
  series.forEach(s => {
    ctx.save()
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.2
    ctx.setLineDash(s.dash)
    ctx.beginPath()
    lineData.forEach((d, i) => {
      const x = toX(i), y = toY(d[s.key] || 0)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke(); ctx.restore()
    // Markers
    lineData.forEach((d, i) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(d[s.key] || 0), 4.5, 0, 2 * Math.PI)
      ctx.fillStyle = s.color; ctx.fill()
      ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(toX(i), toY(d[s.key] || 0), 2, 0, 2 * Math.PI)
      ctx.stroke()
    })
  })

  // Legend (top)
  series.forEach((s, i) => {
    const lx = PAD_L + i * 155, ly = 13
    ctx.save(); ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.setLineDash(s.dash)
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke(); ctx.restore()
    ctx.beginPath(); ctx.arc(lx + 9, ly, 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = s.color; ctx.fill()
    ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'left'
    ctx.fillText(s.label, lx + 22, ly + 4)
  })

  return canvas.toDataURL('image/png')
}

// ── Encabezado de página corrido ─────────────────────────────────────────────
function drawRunningHeader(doc, ejeNombre) {
  const W = doc.internal.pageSize.width
  try { doc.addImage(LOGO_BASE64, 'PNG', 14, 6, 8, 8) } catch (_) {}
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(ejeNombre, 24, 12, { maxWidth: W - 42 })
  setDraw(doc, GUINDA); doc.setLineWidth(0.3); doc.line(14, 16, W - 14, 16)
  setDraw(doc, DORADO); doc.setLineWidth(0.2); doc.line(14, 16.5, W - 14, 16.5)
}

// ── Bloque de encabezado de programa (Entidad/Programa/Unidad Responsable/Elaboró) ──
// Tabla de 2 columnas (etiqueta en guinda, valor en negro) sobre fondo blanco,
// antes de la tabla de indicadores. Devuelve la Y donde debe iniciar la tabla.
function drawProgramaHeader(doc, eje, startY) {
  const W = doc.internal.pageSize.width, ML = 14
  const info = PROGRAMA_EJE[eje.codigo] || {}
  const rows = [
    ['Entidad:',             ENTIDAD_NOMBRE],
    ['Programa:',            info.programa   || '-'],
    ['Unidad Responsable:',  info.responsable || '-'],
    ['Elaboró:',             info.elaboro     || '-'],
  ]
  const LABEL_W = 40
  const VALUE_W = W - ML * 2 - LABEL_W - 4
  const FONT_SZ = 8, LINE_H = 3.6, PAD_V = 2

  doc.setFontSize(FONT_SZ)
  const wrapped = rows.map(([label, val]) => doc.splitTextToSize(val, VALUE_W))
  const rowH = wrapped.map(lines => Math.max(LINE_H + PAD_V * 2, lines.length * LINE_H + PAD_V * 2))
  const totalH = rowH.reduce((a, b) => a + b, 0)

  setDraw(doc, [210, 205, 195]); doc.setLineWidth(0.25)
  setFill(doc, BLANCO); doc.rect(ML, startY, W - ML * 2, totalH, 'FD')
  doc.line(ML + LABEL_W, startY, ML + LABEL_W, startY + totalH)

  let ry = startY
  rows.forEach(([label], i) => {
    const h = rowH[i]
    if (i > 0) doc.line(ML, ry, W - ML, ry)
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(label, ML + 2, ry + PAD_V + LINE_H - 1)
    doc.setFont('helvetica', 'normal'); setColor(doc, [20, 20, 20])
    doc.text(wrapped[i], ML + LABEL_W + 2, ry + PAD_V + LINE_H - 1)
    ry += h
  })

  return startY + totalH + 4
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
  const W = doc.internal.pageSize.width, ML = 14
  const colW = (W - ML * 2 - 9) / 4

  doc.setFontSize(6.5)
  firmantes.forEach((f, i) => {
    const xL = ML + i * (colW + 3), xC = xL + colW / 2, lineY = y + 17
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(f.rol, xC, y + 4, { align: 'center' })
    setDraw(doc, [150, 150, 150]); doc.setLineWidth(0.3)
    doc.line(xL + 2, lineY, xL + colW - 2, lineY)
    doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30])
    const nLines = doc.splitTextToSize(f.nombre, colW - 4)
    doc.text(nLines, xC, lineY + 4, { align: 'center' })
    doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    const cLines = doc.splitTextToSize(f.cargo, colW - 4)
    doc.text(cLines, xC, lineY + 4 + nLines.length * 3.5, { align: 'center' })
  })
}

// ── Gráficas por eje (página dedicada) ───────────────────────────────────────
function drawGraficasPage(doc, eje, periodoLabel, indsEje, avancesMensuales, mesActual) {
  const W = doc.internal.pageSize.width, ML = 14

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Avance del Eje', W / 2, 21, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.5); doc.line(ML, 24.5, W - ML, 24.5)

  // ── Barra de avance acumulado del eje (color institucional uniforme) ────────
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Avance Acumulado del Eje', W / 2, 32, { align: 'center' })
  const BAR_W = 220, BAR_X = (W - BAR_W) / 2
  try {
    const barURL = barraDataURL(eje.pct_promedio || 0, 460, 95)
    doc.addImage(barURL, 'PNG', BAR_X, 36, BAR_W, 30)
  } catch (_) {}

  // Stats
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Total indicadores: ${eje.total_indicadores||0}`, W / 2, 75, { align: 'center' })
  doc.text(`Período: ${periodoLabel}`, W / 2, 81, { align: 'center' })

  setDraw(doc, [220, 220, 220]); doc.setLineWidth(0.2); doc.line(ML, 88, W - ML, 88)

  // ── Gráfica de línea acumulada meta vs resultado ────────────────────────────
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Tendencia Acumulada Mensual', W / 2, 97, { align: 'center' })

  try {
    const mesAct = mesActual || 5
    const avMap  = avancesMensuales || {}
    const inds   = indsEje || []

    const lineData = Array.from({ length: mesAct }, (_, mi) => {
      const targetMes = mi + 1
      let metaAcum = 0, resAcum = 0
      inds.forEach(ind => {
        const avInd = avMap[ind.id] || {}
        for (let m = 1; m <= targetMes; m++) {
          metaAcum += avInd[m]?.meta || 0
          resAcum  += avInd[m]?.res  || 0
        }
      })
      return { mesLabel: MESES_NOMBRES[mi], metaAcum, resAcum }
    })

    const LINE_W = 240, LINE_X = (W - LINE_W) / 2
    const lineURL = lineaDataURL(lineData, 460, 175)
    doc.addImage(lineURL, 'PNG', LINE_X, 101, LINE_W, 46)
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR PDF
// ══════════════════════════════════════════════════════════════════════════════
export function generarPDF({
  global: g, ejes, indicadoresPorEje,
  avancesMensuales, mesActual, anioActual,
  periodoLabel, piloto = false
}) {
  const ejesToRender = piloto ? ejes.slice(0, 1) : ejes
  const mesAct = mesActual || 5
  const ML = 14

  // ── PORTADA (portrait) ─────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W_P = doc.internal.pageSize.width
  const H_P = doc.internal.pageSize.height

  setFill(doc, GUINDA); doc.rect(0, 0, W_P, 78, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W_P - 50) / 2, 13, 50, 50) } catch (_) {}

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('H. AYUNTAMIENTO DE APIZACO 2024-2027', W_P / 2, 92, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('Sistema de Información Municipal de Avance', W_P / 2, 101, { align: 'center' })
  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('INFORME DE AVANCE MIR', W_P / 2, 123, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.9); doc.line(ML + 22, 128, W_P - ML - 22, 128)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(`Periodo: ${periodoLabel}`, W_P / 2, 140, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
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
    setFill(doc, [250, 248, 244]); setDraw(doc, DORADO); doc.setLineWidth(0.3)
    doc.roundedRect(x, 172, kpiW, 25, 2, 2, 'FD')
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(k.value, x + kpiW / 2, 185, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(k.label, x + kpiW / 2, 192, { align: 'center' })
  })
  setDraw(doc, DORADO); doc.setLineWidth(1); doc.line(ML, H_P - 18, W_P - ML, H_P - 18)
  doc.setFontSize(7); setColor(doc, GRIS)
  doc.text('H. Ayuntamiento de Apizaco · Dirección de Planeación y Evaluación · SIMA 2026', W_P / 2, H_P - 10, { align: 'center' })

  // ── RESUMEN EJECUTIVO (landscape) ──────────────────────────────────────────
  doc.addPage('letter', 'landscape')
  const W_L = doc.internal.pageSize.width

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Resumen Ejecutivo', ML, 22)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(periodoLabel, W_L - ML, 22, { align: 'right' })
  setDraw(doc, DORADO); doc.setLineWidth(0.6); doc.line(ML, 25, W_L - ML, 25)

  // Anchos: Eje=88 + TotalInd=14 + %Avance=18 + Óptimo=14 + Adecuado=16 + Riesgo=14 + Crítico=14 = 178mm
  const RES_TOTAL_W = 178
  const resMargin = (W_L - RES_TOTAL_W) / 2

  autoTable(doc, {
    head: [['Eje Estratégico', 'Total\nInd.', '% Avance', 'Óptimo', 'Adecuado', 'Riesgo', 'Crítico']],
    body: ejes.map(e => [e.eje, e.total_indicadores||0, pctStr(e.pct_promedio),
      e.optimo||0, e.adecuado||0, e.riesgo||0, e.critico||0]),
    startY: 30,
    margin: { left: resMargin, right: resMargin },
    styles: {
      fontSize: 8.5, cellPadding: [2.5, 2, 2.5, 2],
      lineColor: [220, 220, 220], lineWidth: 0.1,
      halign: 'center', valign: 'middle', overflow: 'linebreak',
    },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', halign: 'center', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 88, halign: 'left' },
      1: { cellWidth: 14 },
      2: { cellWidth: 18 },
      3: { cellWidth: 14 },
      4: { cellWidth: 16 },
      5: { cellWidth: 14 },
      6: { cellWidth: 14 },
    },
    alternateRowStyles: { fillColor: [249, 244, 232] },
  })

  // ── PÁGINAS POR EJE ────────────────────────────────────────────────────────
  const H_L  = 215.9
  const avMap = avancesMensuales || {}

  // Cálculo dinámico de columnas para tabla mensual
  const NUM_MESES   = mesAct
  const CW_NUM      = 5
  const CW_NIVEL    = 22
  const CW_AREA     = 22
  const CW_ACUM_MET = 12
  const CW_ACUM_RES = 12
  const CW_ACUM_PCT = 17
  const ACUM_FIXED  = CW_ACUM_MET + CW_ACUM_RES + CW_ACUM_PCT
  const USABLE_W    = 249
  const AVAIL_IND   = USABLE_W - CW_NUM - CW_NIVEL - CW_AREA - ACUM_FIXED
  // Distribuir entre indicador y columnas de mes
  const CW_MES      = Math.max(5, Math.floor((AVAIL_IND - 55) / (NUM_MESES * 2)))
  const CW_IND      = Math.max(40, AVAIL_IND - NUM_MESES * 2 * CW_MES)
  const TABLE_W     = CW_NUM + CW_NIVEL + CW_IND + CW_AREA + NUM_MESES * 2 * CW_MES + ACUM_FIXED
  const indMargin   = (W_L - TABLE_W) / 2
  const FONT_SZ     = NUM_MESES <= 5 ? 7 : NUM_MESES <= 8 ? 6.5 : 6
  const ACUM_START  = 4 + NUM_MESES * 2

  ejesToRender.forEach(eje => {
    const indsRaw = indicadoresPorEje[eje.codigo] || []
    const inds    = sortByMIR(indsRaw)

    // ── PASO A: Encabezado de programa + tabla mensual + firmas ───────────
    doc.addPage('letter', 'landscape')
    const tablaStartY = drawProgramaHeader(doc, eje, 20)

    // Encabezados dobles
    const headRow1 = [
      { content: '#',        rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Nivel\nMIR', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Indicador',rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Área',     rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      ...MESES_NOMBRES.slice(0, NUM_MESES).map(m => ({
        content: m, colSpan: 2,
        styles: { halign: 'center', valign: 'middle', fillColor: [100, 20, 32] },
      })),
      { content: 'ACUMULADO', colSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [70, 14, 22] } },
    ]
    const subStyle = { halign: 'center', valign: 'middle', fontSize: FONT_SZ - 0.5, fontStyle: 'normal' }
    const headRow2 = [
      ...MESES_NOMBRES.slice(0, NUM_MESES).flatMap(() => [
        { content: 'Meta', styles: { ...subStyle, fillColor: [140, 50, 65] } },
        { content: 'Res',  styles: { ...subStyle, fillColor: [110, 35, 48] } },
      ]),
      { content: 'Meta',   styles: { ...subStyle, fillColor: [60, 10, 18] } },
      { content: 'Res',    styles: { ...subStyle, fillColor: [60, 10, 18] } },
      { content: '% Av.',  styles: { ...subStyle, fillColor: [60, 10, 18] } },
    ]

    // Filas de datos
    const bodyRows = inds.map((ind, idx) => {
      const avInd = avMap[ind.id] || {}
      const monthCells = Array.from({ length: NUM_MESES }, (_, mi) => {
        const m  = mi + 1
        const av = avInd[m]
        return [av ? numStr(av.meta) : '', av ? numStr(av.res) : '']
      }).flat()
      const metaAcum = Array.from({ length: NUM_MESES }, (_, mi) => avInd[mi+1]?.meta || 0).reduce((a,b) => a+b, 0)
      const resAcum  = Array.from({ length: NUM_MESES }, (_, mi) => avInd[mi+1]?.res  || 0).reduce((a,b) => a+b, 0)
      const pctAcum  = metaAcum > 0 ? resAcum / metaAcum : resAcum > 0 ? resAcum / 1.0 : null
      return [
        idx + 1,
        ind.nivel_mir || '-',
        ind.indicador || '-',
        ind.area      || '-',
        ...monthCells,
        metaAcum > 0 ? numStr(metaAcum) : (resAcum > 0 ? '1' : '-'),
        numStr(resAcum),
        pctAcum,  // raw number → formateado en didParseCell
      ]
    })

    // Column styles
    const colStyles = {
      0: { cellWidth: CW_NUM,   halign: 'center', valign: 'middle' },
      1: { cellWidth: CW_NIVEL, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      2: { cellWidth: CW_IND,   halign: 'center', valign: 'middle', overflow: 'linebreak' },
      3: { cellWidth: CW_AREA,  halign: 'center', valign: 'middle', overflow: 'linebreak' },
    }
    for (let m = 0; m < NUM_MESES * 2; m++) {
      colStyles[4 + m] = { cellWidth: CW_MES, halign: 'center' }
    }
    colStyles[ACUM_START]   = { cellWidth: CW_ACUM_MET, halign: 'center' }
    colStyles[ACUM_START+1] = { cellWidth: CW_ACUM_RES, halign: 'center' }
    colStyles[ACUM_START+2] = { cellWidth: CW_ACUM_PCT, halign: 'center' }

    autoTable(doc, {
      head: [headRow1, headRow2],
      body: bodyRows,
      startY: tablaStartY,
      margin: { left: indMargin, right: indMargin, bottom: 60, top: 20 },
      styles: {
        fontSize: FONT_SZ, cellPadding: [1.5, 1.2, 1.5, 1.2],
        lineColor: [220, 220, 220], lineWidth: 0.1,
        overflow: 'linebreak', textColor: [40, 40, 40],
        halign: 'center', valign: 'middle',
        minCellHeight: 0,
      },
      headStyles: {
        fillColor: GUINDA, textColor: BLANCO,
        fontStyle: 'bold', fontSize: FONT_SZ,
        halign: 'center', valign: 'middle',
        minCellHeight: 0,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Asegurar wrapping en todas las celdas de texto
          data.cell.styles.overflow = 'linebreak'
          data.cell.styles.valign   = 'middle'
          if (data.column.index === ACUM_START + 2) {
            const pct = data.cell.raw
            if (typeof pct === 'number') {
              data.cell.text = [pctStr(pct)]
              const sem = pct >= 1.10 ? 'ÓPTIMO' : pct >= 0.90 ? 'ADECUADO' : pct >= 0.70 ? 'RIESGO' : 'CRÍTICO'
              const sc  = SEM_COLORS[sem]
              data.cell.styles.textColor = sc.txt
              data.cell.styles.fillColor = sc.bg
              data.cell.styles.fontStyle = 'bold'
            } else {
              data.cell.text = ['-']
            }
          }
        }
      },
      didDrawPage: (data) => {
        // Siempre redibujar el encabezado en cada página (incluyendo la primera)
        drawRunningHeader(doc, eje.eje)
      },
    })

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
    drawGraficasPage(doc, eje, periodoLabel, indsRaw, avMap, mesAct)
    drawFirmas(doc, eje.codigo, 150)
  })

  // Pie de página en todas las páginas
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, [150, 150, 150])
    doc.text(`Página ${p} de ${totalPages}  ·  SIMA · H. Ayuntamiento de Apizaco · ${periodoLabel}`,
      W / 2, H - 6, { align: 'center' })
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

  const thinB  = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

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

  function addSheetHeader(ws, title, isEje = false) {
    ws.getRow(1).height = 30
    ws.getRow(2).height = 24
    ws.getRow(3).height = 20
    ws.getRow(4).height = 8
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 58, height: 58 } })
    for (let row = 1; row <= 3; row++) {
      for (let col = 2; col <= 9; col++) {
        ws.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      }
    }
    ws.mergeCells('B1:I2')
    const titleCell     = ws.getCell('B1')
    titleCell.value     = title
    titleCell.font      = { bold: true, size: isEje ? 16 : 15, color: { argb: XL.blanco } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.mergeCells('B3:I3')
    const perCell     = ws.getCell('B3')
    perCell.value     = `Periodo: ${periodoLabel}`
    perCell.font      = { size: isEje ? 12 : 11, color: { argb: XL.blanco } }
    perCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.addRow([])
  }

  const wsR = wb.addWorksheet('Resumen')
  wsR.properties.defaultRowHeight = 14.4
  addSheetHeader(wsR, 'SIMA – Resumen por Eje Estratégico', false)

  const resHdr = ['Eje Estratégico', 'Total Ind.', '% Avance', 'Óptimo', 'Adecuado', 'Riesgo', 'Crítico', 'Semáforo']
  const rhRow  = wsR.addRow(resHdr)
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

  const IND_HDR = ['#', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance', 'Semáforo', 'Observaciones']
  const IND_W   = [19.2, 16, 55, 30, 12, 12, 12, 14, 28]

  ejesToRender.forEach(eje => {
    const inds  = indicadoresPorEje[eje.codigo] || []
    const sem   = semaforoEje(eje)
    const wsName = `${eje.codigo} ${eje.eje}`.substring(0, 31)
    const ws    = wb.addWorksheet(wsName)
    ws.properties.defaultRowHeight = 14.4
    addSheetHeader(ws, eje.eje, true)

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
    const semArgbVal = { 'ÓPTIMO': XL.optimo, 'ADECUADO': XL.adecuado, 'RIESGO': XL.riesgo, 'CRÍTICO': XL.critico }[sem] || XL.gris
    statRow.getCell(1).font = { bold: true, size: 10, color: { argb: semArgbVal } }
    ws.getRow(statRow.number).height = 16

    const hRow = ws.addRow(IND_HDR)
    hRow.eachCell(c => styleHeader(c))
    ws.getRow(hRow.number).height = 20

    inds.forEach((ind, i) => {
      const semInd = semLabel(ind.semaforo)
      const isAlt  = i % 2 === 1
      const row    = ws.addRow([
        i + 1, ind.nivel_mir || '', ind.indicador || '', ind.area || '',
        ind.meta_evaluable != null ? +ind.meta_evaluable : '',
        ind.resultado      != null ? +ind.resultado      : '',
        pctStr(ind.pct_cumplimiento), semInd, '',
      ])
      row.eachCell((c, col) => styleData(c, isAlt, col === 8 ? semInd : null))
      row.height = 14.4
    })

    const totRow2 = ws.addRow([
      'Total indicadores:', inds.length, pctStr(eje.pct_promedio),
      '', '', '', '', '', '',
    ])
    totRow2.eachCell(c => styleTotal(c))
    totRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    ws.columns = IND_W.map(w => ({ width: w }))
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
  })

  if (!piloto) {
    const wsA  = wb.addWorksheet('Todos los Indicadores')
    wsA.properties.defaultRowHeight = 14.4
    addSheetHeader(wsA, 'Todos los Indicadores – Vista Global', false)
    const allHdr = ['#', 'Eje', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance', 'Semáforo']
    const hRowA  = wsA.addRow(allHdr)
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

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `SIMA_Detalle${piloto ? '_PILOTO' : ''}_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function generarExcelPiloto(datos) {
  return generarExcel({ ...datos, piloto: true })
}

// ══════════════════════════════════════════════════════════════════════════════
// AVANCE DE CAPTURA DEL MES POR ÁREA (panel Admin)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcelAvanceCaptura({ areas, periodoLabel }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const ws = wb.addWorksheet('Avance de Captura')
  ws.properties.defaultRowHeight = 14.4

  const thinB   = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }
  const ESTADO_BG = {
    COMPLETO:          'FFE8F5E9',
    'EN PROGRESO':     'FFFFF3E0',
    PENDIENTE:         'FFFFEBEE',
    'SIN INDICADORES': 'FFF5F5F5',
  }
  const ESTADO_FG = {
    COMPLETO:          'FF007830',
    'EN PROGRESO':     'FFEF6C00',
    PENDIENTE:         'FFC62828',
    'SIN INDICADORES': XL.gris,
  }

  ws.mergeCells('A1:G1')
  const title = ws.getCell('A1')
  title.value     = `SIMA – Avance de Captura del Mes por Área · ${periodoLabel}`
  title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
  title.font      = { bold: true, size: 12, color: { argb: XL.blanco } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 24

  const HDR = ['Área', 'Total Indicadores', 'Capturados', 'Validados', '% Captura', '% Validación', 'Estado']
  const hRow = ws.addRow(HDR)
  hRow.eachCell(c => {
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    c.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border    = borders
  })
  ws.getRow(hRow.number).height = 22

  areas.forEach((a, i) => {
    const isAlt = i % 2 === 1
    const row = ws.addRow([
      a.area, a.total_indicadores, a.capturados, a.validados,
      a.pct_captura   != null ? `${a.pct_captura}%`   : '-',
      a.pct_validacion != null ? `${a.pct_validacion}%` : '-',
      a.estado_captura,
    ])
    row.eachCell((c, col) => {
      c.border    = borders
      c.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' }
      if (col === 7) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ESTADO_BG[a.estado_captura] || 'FFFFFFFF' } }
        c.font = { bold: true, size: 9.5, color: { argb: ESTADO_FG[a.estado_captura] || XL.gris } }
      } else {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? XL.crema : XL.blanco } }
        c.font = { size: 9.5 }
      }
    })
  })

  ws.columns = [{ width: 34 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 13 }, { width: 16 }]
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }]

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `SIMA_AvanceCaptura_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLA COMPLETA: METAS MES A MES + RESULTADOS (todos los indicadores)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcelMetas({ indicadores, periodoLabel }) {
  const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  const META_KEYS = ['meta_ene','meta_feb','meta_mar','meta_abr','meta_may','meta_jun',
                     'meta_jul','meta_ago','meta_sep','meta_oct','meta_nov','meta_dic']

  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const ws = wb.addWorksheet('Metas y Resultados 2026')
  ws.properties.defaultRowHeight = 14.4

  const thinB  = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

  const HDR_INFO = ['#', 'Eje', 'Área', 'Indicador', 'Nivel MIR']
  ws.addRow([...HDR_INFO, ...MESES.flatMap(m => [m, ''])])

  MESES.forEach((m, i) => {
    const c1 = 6 + i * 2, c2 = c1 + 1
    ws.mergeCells(1, c1, 1, c2)
    const cell = ws.getCell(1, c1)
    cell.value = m
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3A3A3A' } }
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  })
  HDR_INFO.forEach((_, i) => {
    const cell = ws.getCell(1, i + 1)
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    cell.font      = { bold: true, color: { argb: XL.blanco }, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  })
  ws.getRow(1).height = 18

  const hdrRow2 = ws.addRow(['', '', '', '', '', ...MESES.flatMap(() => ['Meta', 'Real'])])
  hdrRow2.eachCell((cell, col) => {
    if (col <= 5) {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      cell.font   = { bold: true, color: { argb: XL.blanco }, size: 9 }
    } else {
      const isMeta = (col - 6) % 2 === 0
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isMeta ? 'FFFFF8E8' : 'FFF0F0F0' } }
      cell.font   = { bold: true, color: { argb: isMeta ? XL.guinda : XL.gris }, size: 8.5 }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  })
  ws.getRow(2).height = 16

  indicadores.forEach((ind, idx) => {
    const isAlt = idx % 2 === 1
    const rowVals = [
      idx + 1, ind.eje_codigo, ind.area_nombre, ind.nombre, ind.nivel_mir || '',
      ...MESES.flatMap((_, mi) => {
        const meta = parseFloat(ind[META_KEYS[mi]] || 0)
        const av   = ind.avances?.[mi + 1]
        const real = av ? parseFloat(av.resultado) : null
        return [meta === 0 ? '' : meta, real ?? '']
      }),
    ]
    const row = ws.addRow(rowVals)
    row.height = 14.4
    const infoBg = isAlt ? XL.crema : XL.blanco
    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c)
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: infoBg } }
      cell.font      = { size: 9 }
      cell.alignment = { horizontal: c <= 2 ? 'center' : (c === 4 ? 'left' : 'center'), vertical: 'middle', wrapText: c === 4 }
      cell.border    = borders
    }
    MESES.forEach((_, mi) => {
      const colMeta = 6 + mi * 2, colReal = colMeta + 1
      const meta = parseFloat(ind[META_KEYS[mi]] || 0)
      const av   = ind.avances?.[mi + 1]
      const real = av ? parseFloat(av.resultado) : null
      const sem  = av?.semaforo || null
      const cMeta = row.getCell(colMeta)
      cMeta.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: meta > 0 ? 'FFFFF8E8' : (isAlt ? 'FFFAFAFA' : XL.blanco) } }
      cMeta.font      = { size: 9, color: { argb: meta > 0 ? XL.guinda : 'FFCCCCCC' } }
      cMeta.alignment = { horizontal: 'center', vertical: 'middle' }
      cMeta.border    = borders
      const cReal = row.getCell(colReal)
      if (real !== null) {
        const semBgs = { 'ÓPTIMO': 'FFE8F5E9', 'ADECUADO': 'FFFFF9E6', 'RIESGO': 'FFFFF3E0', 'CRÍTICO': 'FFFFEBEE' }
        const semFgs = { 'ÓPTIMO': XL.optimo,  'ADECUADO': XL.adecuado,'RIESGO': XL.riesgo,  'CRÍTICO': XL.critico }
        cReal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: semBgs[sem] || (isAlt ? XL.crema : XL.blanco) } }
        cReal.font = { size: 9, bold: !!sem, color: { argb: semFgs[sem] || XL.gris } }
      } else {
        cReal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? 'FFF5F5F5' : XL.blanco } }
        cReal.font = { size: 9, color: { argb: 'FFCCCCCC' } }
      }
      cReal.alignment = { horizontal: 'center', vertical: 'middle' }
      cReal.border    = borders
    })
  })

  ws.getColumn(1).width = 4; ws.getColumn(2).width = 5
  ws.getColumn(3).width = 22; ws.getColumn(4).width = 52; ws.getColumn(5).width = 14
  MESES.forEach((_, i) => {
    ws.getColumn(6 + i * 2).width     = 7
    ws.getColumn(6 + i * 2 + 1).width = 7
  })
  ws.views = [{ state: 'frozen', xSplit: 5, ySplit: 2 }]

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href = url
  a.download = `SIMA_MetasResultados_2026_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ══════════════════════════════════════════════════════════════════════════════
// ACUSE DE CAPTURA (PDF individual por área, tras validación completa del mes)
// ══════════════════════════════════════════════════════════════════════════════

// Semáforo del acuse: colores exactos de especificación (fill sólido + texto legible)
const SEM_ACUSE = {
  'ÓPTIMO':   { fill: [4,   98,   5], txt: BLANCO },
  'ADECUADO': { fill: [0,  176,  80], txt: BLANCO },
  'RIESGO':   { fill: [255, 192,   0], txt: [122, 88, 0] },
  'CRÍTICO':  { fill: [192,   0,   0], txt: BLANCO },
}

function slugArea(nombre) {
  return (nombre || 'AREA')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'AREA'
}

export function generarFolioAcuse(areaId, mes, anio) {
  const mesStr = String(mes).padStart(2, '0')
  const ts = Date.now().toString(36).toUpperCase()
  return `SIMA-${anio}-${mesStr}-${areaId}-${ts}`
}

// datos: { area, enlaceNombre, mes, anio, periodoLabel, indicadores, folio, validadoAt }
export function generarAcusePDF({
  area, enlaceNombre, mes, anio, periodoLabel, indicadores, folio, validadoAt,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.width
  const ML = 14
  const fecha = validadoAt || new Date()
  const fechaStr = `${formatFecha(fecha)} ${String(fecha.getHours()).padStart(2,'0')}:${String(fecha.getMinutes()).padStart(2,'0')}`

  // ── Encabezado institucional (franja guinda) ────────────────────────────────
  setFill(doc, GUINDA); doc.rect(0, 0, W, 44, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', ML, 7, 20, 20) } catch (_) {}

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setColor(doc, DORADO)
  doc.text('ACUSE DE CAPTURA — SIMA', W / 2, 15, { align: 'center' })
  doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); setColor(doc, DORADO)
  doc.text('Sistema de Información Municipal de Avance', W / 2, 22, { align: 'center' })
  doc.setFontSize(8.5)
  doc.text('H. Ayuntamiento de Apizaco · 2024-2027', W / 2, 29, { align: 'center' })
  doc.text('Dirección de Planeación y Evaluación', W / 2, 35, { align: 'center' })

  // ── Datos del acuse ───────────────────────────────────────────────────────
  let y = 54
  doc.setFontSize(9); setColor(doc, [30, 30, 30])
  const campos = [
    ['Área:',                     area || '-'],
    ['Enlace responsable:',       enlaceNombre || '-'],
    ['Periodo capturado:',        periodoLabel || '-'],
    ['Fecha y hora de validación:', fechaStr],
    ['Folio de acuse:',           folio],
  ]
  campos.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(label, ML, y)
    doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
    doc.text(String(val), ML + 46, y)
    y += 6.5
  })

  setDraw(doc, DORADO); doc.setLineWidth(0.4); doc.line(ML, y + 2, W - ML, y + 2)
  y += 9

  // ── Tabla de indicadores capturados ──────────────────────────────────────
  const rows = (indicadores || []).map((ind, idx) => [
    idx + 1,
    ind.clave || '-',
    ind.nombre || '',
    ind.nivel_mir || '-',
    numStr(ind.meta_programada),
    numStr(ind.resultado),
    ind.pct_cumplimiento,
    ind.semaforo || 'SIN DATO',
  ])

  autoTable(doc, {
    head: [['#', 'Clave', 'Indicador', 'Nivel MIR', 'Meta del mes', 'Resultado', '% Avance', 'Semáforo']],
    body: rows,
    startY: y,
    margin: { left: ML, right: ML },
    styles: {
      fontSize: 8, cellPadding: [2.2, 2, 2.2, 2],
      lineColor: [220, 220, 220], lineWidth: 0.1,
      halign: 'center', valign: 'middle', overflow: 'linebreak', textColor: [20, 20, 20],
    },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 24 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
      7: { cellWidth: 22 },
    },
    alternateRowStyles: { fillColor: [245, 232, 234] },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 6) {
          data.cell.text = [pctStr(data.cell.raw)]
        }
        if (data.column.index === 7) {
          const sc = SEM_ACUSE[data.cell.raw] || { fill: [230, 230, 230], txt: [80, 80, 80] }
          data.cell.styles.fillColor  = sc.fill
          data.cell.styles.textColor  = sc.txt
          data.cell.styles.fontStyle  = 'bold'
        }
      }
    },
  })

  // ── Pie del documento ─────────────────────────────────────────────────────
  const H = doc.internal.pageSize.height
  const FOOTER_H = 50 // espacio total que ocupa el bloque de pie + firma
  let fy
  if (doc.lastAutoTable.finalY + FOOTER_H > H - 10) {
    doc.addPage('letter', 'portrait')
    fy = 25
  } else {
    fy = doc.lastAutoTable.finalY + 16
  }

  doc.setFontSize(8); doc.setFont('helvetica', 'italic'); setColor(doc, GRIS)
  doc.text('Este documento es el acuse oficial de captura de avances en SIMA.', W / 2, fy, { align: 'center' })
  fy += 5.5
  doc.text(`Generado el ${fechaStr} por ${enlaceNombre || '-'}`, W / 2, fy, { align: 'center' })
  fy += 16

  setDraw(doc, [120, 120, 120]); doc.setLineWidth(0.3)
  doc.line(W / 2 - 40, fy, W / 2 + 40, fy)
  fy += 5
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30])
  doc.text(`${enlaceNombre || '-'}  ·  Enlace de Área`, W / 2, fy, { align: 'center' })
  fy += 7
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Folio: ${folio}`, W / 2, fy, { align: 'center' })

  const MESES_ARCHIVO = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  const fileName = `ACUSE_SIMA_${slugArea(area)}_${MESES_ARCHIVO[(mes || 1) - 1]}_${anio}.pdf`
  doc.save(fileName)
  return fileName
}
