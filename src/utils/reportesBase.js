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
