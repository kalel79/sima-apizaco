// ── Base compartida de los reportes (paletas, catálogos y helpers) ────────────

// ── Paleta PDF (RGB) ──────────────────────────────────────────────────────────
export const GUINDA = [123, 31, 44]
export const DORADO = [201, 169, 97]
export const GRIS   = [89,  89,  89]
export const BLANCO = [255, 255, 255]

// Paleta oficial de semáforo (RGB) — usada en todo el PDF
export const SEM_COLORS = {
  'ÓPTIMO':   { txt: [4,   98,   5], bg: [209, 235, 209] },
  'ADECUADO': { txt: [0,  176,  80], bg: [200, 243, 220] },
  'RIESGO':   { txt: [180, 135,  0], bg: [255, 248, 200] },
  'CRÍTICO':  { txt: [192,   0,  0], bg: [255, 215, 215] },
}
// ── Paleta Excel (ARGB) ───────────────────────────────────────────────────────
export const XL = {
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

// ── Helpers de estilo Excel (ExcelJS) — compartidos entre generarExcel() y
// generarExcelEjecutivo() ──────────────────────────────────────────────────────
const XL_THIN_BORDER = { style: 'thin', color: { argb: 'FFD0D0D0' } }
const XL_BORDERS = { top: XL_THIN_BORDER, left: XL_THIN_BORDER, bottom: XL_THIN_BORDER, right: XL_THIN_BORDER }

export function semArgb(sem) {
  return { 'ÓPTIMO': XL.optimo, 'ADECUADO': XL.adecuado, 'RIESGO': XL.riesgo, 'CRÍTICO': XL.critico }[sem] || XL.gris
}
export function semBgArgb(sem) {
  return { 'ÓPTIMO': XL.optBg, 'ADECUADO': XL.adeBg, 'RIESGO': XL.riesBg, 'CRÍTICO': XL.critBg }[sem] || XL.grisClaro
}

export function styleHeader(cell) {
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
  cell.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border    = XL_BORDERS
}

export function styleData(cell, isAlt, semVal) {
  cell.fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: semVal ? semBgArgb(semVal) : (isAlt ? XL.crema : XL.blanco) },
  }
  cell.font = semVal
    ? { bold: true, color: { argb: semArgb(semVal) }, size: 9.5 }
    : { size: 9.5 }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border    = XL_BORDERS
}

export function styleTotal(cell) {
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.dorado } }
  cell.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border    = XL_BORDERS
}

// logoId: id devuelto por wb.addImage(...) · periodoLabel: texto de la fila 3
// totalCols: ancho real de la tabla de esa hoja — el banner cubre desde la
// columna 1 hasta totalCols, sin dejar columnas sin colorear.
export function addSheetHeader(ws, title, logoId, periodoLabel, totalCols, isEje = false) {
  ws.getRow(1).height = 30
  ws.getRow(2).height = 24
  ws.getRow(3).height = 20
  ws.getRow(4).height = 8
  for (let row = 1; row <= 3; row++) {
    for (let col = 1; col <= totalCols; col++) {
      ws.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    }
  }
  ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 64, height: 64 } })
  ws.mergeCells(1, 2, 2, totalCols)
  const titleCell     = ws.getCell(1, 2)
  titleCell.value     = title
  titleCell.font      = { bold: true, size: isEje ? 16 : 15, color: { argb: XL.blanco } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  ws.mergeCells(3, 2, 3, totalCols)
  const perCell     = ws.getCell(3, 2)
  perCell.value     = `Periodo: ${periodoLabel}`
  perCell.font      = { size: isEje ? 12 : 11, color: { argb: XL.blanco } }
  perCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.addRow([])
}

// Estima la altura (en puntos) que necesita una fila para que ninguno de sus
// textos se corte al hacer wrap dentro del ancho de su columna (en "unidades
// de ancho" de ExcelJS). Conservador a propósito: prefiere fila más alta de
// lo necesario a que el texto se desborde o se corte.
export function alturaAjustada(textos, anchos, lineaPt = 12.5, minPt = 14.4) {
  let maxLineas = 1
  textos.forEach((t, i) => {
    const ancho = Math.max(6, anchos[i] || 20)
    const lineas = Math.max(1, Math.ceil(String(t ?? '').length / ancho))
    if (lineas > maxLineas) maxLineas = lineas
  })
  return Math.max(minPt, maxLineas * lineaPt + 4)
}

// ── Catálogo de firmas ────────────────────────────────────────────────────────
export const FIRMAS_RESP = {
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
export const PROGRAMA_EJE = {
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
export const ENTIDAD_NOMBRE = 'Ayuntamiento de Apizaco'

export const MESES_NOMBRES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

// ── Helpers ───────────────────────────────────────────────────────────────────
export function semLabel(sem) { return sem || 'SIN DATO' }

// Semáforo derivado del % de avance del eje (pct_promedio)
export function semaforoEje(eje) {
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

export function sortByMIR(inds) {
  return [...inds].sort((a, b) => {
    const ka = mirSortKey(a.nivel_mir), kb = mirSortKey(b.nivel_mir)
    for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]
    return 0
  })
}

export function pctStr(val) {
  if (val == null) return '-'
  return ((+val) * 100).toFixed(1) + '%'
}

export function numStr(val) {
  if (val == null) return '-'
  const n = +val
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export function formatFecha(d) {
  d = d || new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
export function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
export function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

// Descarga un workbook de ExcelJS como archivo .xlsx en el navegador
export async function descargarExcel(wb, fileName) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = fileName
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
