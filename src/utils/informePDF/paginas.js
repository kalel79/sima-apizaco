// ── Páginas del PDF del Informe de Gobierno ──────────────────────────────────
// Diseño editorial: Cormorant Garamond (títulos), Source Sans 3 (texto y
// cifras), guinda y dorado institucionales, y el color de cada eje en su
// capítulo. Carta vertical, medidas en mm.
import autoTable from 'jspdf-autotable'
import { F, RATIO } from './recursos.js'
import { artePortadaPrincipal, artePortadaEje, recortarFoto, hexARgb, matiz } from './arte.js'
import { CENTRO } from './pictogramasSvg.js'
import {
  CABILDO, GABINETE, PRESENTACION_PARRAFOS, PRESENTACION_EJES, MENSAJE_PRESIDENTE,
} from '../informeGobiernoContenido.js'

export const W = 215.9, H = 279.4, ML = 18, CW = W - ML * 2
const PIE = H - 16               // última línea útil antes del pie

export const GUINDA = [123, 31, 44]
const DORADO = [200, 169, 110], DORADO_CLARO = [226, 201, 152]
const TINTA = [36, 26, 28], SUB = [107, 94, 96], LINEA = [228, 220, 218], ALT = [249, 245, 244]
const BLANCO = [255, 255, 255]
export const SEM = [
  { k: 'ÓPTIMO', l: 'Óptimo', c: [4, 98, 5] },
  { k: 'ADECUADO', l: 'Adecuado', c: [0, 176, 80] },
  { k: 'RIESGO', l: 'Riesgo', c: [235, 175, 0] },
  { k: 'CRÍTICO', l: 'Crítico', c: [192, 0, 0] },
]
const SEM_SIN = [190, 180, 180]
const semColor = k => SEM.find(s => s.k === k)?.c || SEM_SIN

export const PERIODO_CORTO = 'Sep 2025 – Ago 2026'
export const PERIODO_LARGO = '1 de septiembre de 2025 – 31 de agosto de 2026'

// ── Utilidades ───────────────────────────────────────────────────────────────
const pct = v => v == null ? '—' : `${(+v * 100).toFixed(1)}%`
const pctPMD = v => v == null ? '—' : `${(+v).toFixed(1)}%`
const num = v => Number(v || 0).toLocaleString('es-MX')
const pesos = v => Number(v).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const fechaCorta = f => f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '') : ''

function fuente(doc, fam, estilo, tam, color) {
  doc.setFont(fam, estilo)
  doc.setFontSize(tam)
  if (color) doc.setTextColor(color[0], color[1], color[2])
}
const relleno = (doc, c) => doc.setFillColor(c[0], c[1], c[2])
const trazo = (doc, c) => doc.setDrawColor(c[0], c[1], c[2])
const altoLinea = (tam, f = 1.25) => tam * 0.3528 * f

function opacidad(doc, a, fn) {
  doc.setGState(new doc.GState({ opacity: a, 'stroke-opacity': a }))
  fn()
  doc.setGState(new doc.GState({ opacity: 1, 'stroke-opacity': 1 }))
}

// Texto en mayúsculas espaciadas (etiquetas). jsPDF no centra bien con
// charSpace, así que el ancho se calcula aquí.
function versalitas(doc, txt, x, y, { tam = 7, color = SUB, cs = 0.45, align = 'left', fam = F.SANS, estilo = 'bold' } = {}) {
  const s = String(txt).toUpperCase()
  fuente(doc, fam, estilo, tam, color)
  const w = doc.getTextWidth(s) + cs * (s.length - 1)
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  doc.text(s, x0, y, { charSpace: cs })
  return w
}

// Parte una etiqueta en versalitas en renglones que quepan con su tracking.
function lineasVersalitas(doc, txt, ancho, tam, cs) {
  fuente(doc, F.SANS, 'bold', tam)
  const mide = t => doc.getTextWidth(t) + cs * (t.length - 1)
  const out = []
  let cur = ''
  String(txt).toUpperCase().split(/\s+/).forEach(p => {
    const prueba = cur ? cur + ' ' + p : p
    if (cur && mide(prueba) > ancho) { out.push(cur); cur = p } else cur = prueba
  })
  if (cur) out.push(cur)
  return out
}

function lineas(doc, txt, ancho, fam, estilo, tam) {
  fuente(doc, fam, estilo, tam)
  return doc.splitTextToSize(String(txt || ''), ancho)
}

// Renglón justificado: reparte el espacio sobrante entre las palabras. El
// último renglón de cada párrafo, y uno que quedaría demasiado abierto, va
// alineado a la izquierda. La fuente ya debe estar puesta.
function renglon(doc, l, x, y, ancho, justificar) {
  const p = String(l).trim().split(/\s+/)
  if (!justificar || p.length < 2) { doc.text(l, x, y); return }
  const anchos = p.map(w => doc.getTextWidth(w))
  const gap = (ancho - anchos.reduce((t, w) => t + w, 0)) / (p.length - 1)
  if (gap > doc.getTextWidth(' ') * 4) { doc.text(l, x, y); return }
  let xx = x
  p.forEach((w, i) => { doc.text(w, xx, y); xx += anchos[i] + gap })
}

function marco(doc, color, inset, lw) {
  trazo(doc, color); doc.setLineWidth(lw)
  doc.rect(inset, inset, W - inset * 2, H - inset * 2, 'S')
}

// Encabezado de las páginas interiores.
function encabezado(doc, ctx, seccion, color = GUINDA) {
  const lh = 8.2
  doc.addImage(ctx.imgs.logoGuinda.data, 'PNG', ML, 9, lh * RATIO.logo, lh, 'logoGuinda', 'FAST')
  versalitas(doc, 'Segundo Informe de Gobierno · Apizaco', ML + lh * RATIO.logo + 3, 14.2, { tam: 6.5, color: GUINDA, cs: 0.4 })
  versalitas(doc, seccion, W - ML, 14.2, { tam: 6.5, color, cs: 0.4, align: 'right' })
  trazo(doc, LINEA); doc.setLineWidth(0.25); doc.line(ML, 19.5, W - ML, 19.5)
}

function nuevaPagina(doc, ctx, seccion, color) {
  doc.addPage('letter', 'portrait')
  encabezado(doc, ctx, seccion, color)
  return 30
}

// Apertura de sección: etiqueta, título y filete dorado. Devuelve la Y libre.
function apertura(doc, y, etiqueta, titulo, color = GUINDA, tamTitulo = 30) {
  versalitas(doc, etiqueta, ML, y, { tam: 7.5, color, cs: 0.6 })
  const ls = lineas(doc, titulo, CW, F.SERIF, 'normal', tamTitulo)
  const lh = altoLinea(tamTitulo, 1.05)
  doc.setTextColor(TINTA[0], TINTA[1], TINTA[2])
  ls.forEach((l, i) => doc.text(l, ML, y + 4 + lh * (i + 0.78)))
  const yr = y + 4 + lh * ls.length + 3
  relleno(doc, DORADO); doc.rect(ML, yr, 22, 0.9, 'F')
  return yr + 10
}

function parrafos(doc, ctx, textos, y, { tam = 10.5, color = [58, 46, 48], seccion, gap = 4 } = {}) {
  const lh = altoLinea(tam, 1.45)
  textos.forEach(p => {
    const ls = lineas(doc, p, CW, F.SANS, 'normal', tam)
    ls.forEach((l, i) => {
      if (y > PIE - 4) y = nuevaPagina(doc, ctx, seccion)
      fuente(doc, F.SANS, 'normal', tam, color)
      renglon(doc, l, ML, y, CW, i < ls.length - 1)
      y += lh
    })
    y += gap
  })
  return y
}

// Franja de cifras clave: filete superior grueso, divisiones finas.
function franjaCifras(doc, y, cifras, color = GUINDA) {
  const cw = CW / cifras.length
  trazo(doc, TINTA); doc.setLineWidth(0.6); doc.line(ML, y, W - ML, y)
  cifras.forEach(([v, l], i) => {
    const x = ML + i * cw
    if (i) { trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(x, y + 3, x, y + 19) }
    fuente(doc, F.LIGHT, 'normal', 24, color)
    doc.text(String(v), x + (i ? 4 : 0), y + 11.5)
    lineasVersalitas(doc, l, cw - 7, 6.3, 0.35).slice(0, 2)
      .forEach((t, k) => versalitas(doc, t, x + (i ? 4 : 0), y + 16 + k * 2.9, { tam: 6.3, cs: 0.35 }))
  })
  trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(ML, y + 23, W - ML, y + 23)
  return y + 31
}

function dona(doc, cx, cy, r, grosor, valores, colores) {
  const total = valores.reduce((s, v) => s + v, 0)
  if (!total) {
    trazo(doc, LINEA); doc.setLineWidth(grosor); doc.circle(cx, cy, r - grosor / 2, 'S')
    return
  }
  let a0 = -Math.PI / 2
  valores.forEach((v, i) => {
    if (!v) return
    const a1 = a0 + (v / total) * Math.PI * 2
    const pasos = Math.max(6, Math.ceil((a1 - a0) / 0.05))
    const pts = []
    for (let k = 0; k <= pasos; k++) { const a = a0 + (a1 - a0) * k / pasos; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
    for (let k = pasos; k >= 0; k--) { const a = a0 + (a1 - a0) * k / pasos; pts.push([cx + (r - grosor) * Math.cos(a), cy + (r - grosor) * Math.sin(a)]) }
    relleno(doc, colores[i])
    doc.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(p => doc.lineTo(p[0], p[1]))
    doc.close(); doc.fill()
    a0 = a1
  })
  // separaciones blancas entre segmentos
  let a = -Math.PI / 2
  trazo(doc, BLANCO); doc.setLineWidth(0.6)
  valores.forEach(v => {
    if (!v) return
    doc.line(cx + (r - grosor - 0.3) * Math.cos(a), cy + (r - grosor - 0.3) * Math.sin(a), cx + (r + 0.3) * Math.cos(a), cy + (r + 0.3) * Math.sin(a))
    a += (v / total) * Math.PI * 2
  })
}

// Datos de presentación de un eje a partir de v_resumen_ejes + catálogo.
export function datosEje(eje, catalogo) {
  const cod = eje.codigo
  const n = cod.startsWith('E') ? cod.slice(1) : cod.startsWith('T') ? cod.slice(1) : cod
  const kick = cod.startsWith('E') ? `Eje ${n}` : cod.startsWith('T') ? 'Eje transversal' : `Eje ${cod}`
  const nombre = String(eje.eje || '').replace(/^Transversal [AB]\s*[–-]\s*/, '')
  const sem = [eje.optimo || 0, eje.adecuado || 0, eje.riesgo || 0, eje.critico || 0]
  return {
    cod, n, kick, nombre, color: eje.color_hex || catalogo?.color_hex || '#7B1F2C',
    descripcion: catalogo?.descripcion || '', total: eje.total_indicadores || 0, pct: eje.pct_promedio, sem,
  }
}

// ── Portada principal ────────────────────────────────────────────────────────
export async function portadaPrincipal(doc, ctx) {
  doc.addImage(await artePortadaPrincipal(), 'JPEG', 0, 0, W, H, 'artePortada', 'FAST')
  ctx.portadas.add(doc.getNumberOfPages())
  marco(doc, DORADO, 10, 0.3)

  const eh = 74, ew = eh * RATIO.escudo
  doc.addImage(ctx.imgs.escudoDorado.data, 'PNG', (W - ew) / 2, 34, ew, eh, 'escudoDorado', 'SLOW')

  versalitas(doc, 'H. Ayuntamiento de Apizaco, Tlaxcala', W / 2, 124, { tam: 8.5, color: DORADO_CLARO, cs: 0.55, align: 'center' })
  versalitas(doc, 'Administración 2024 – 2027', W / 2, 129.5, { tam: 7, color: [226, 196, 202], cs: 0.8, align: 'center', estilo: 'normal' })

  relleno(doc, DORADO); doc.rect(W / 2 - 8, 147, 16, 0.4, 'F')
  versalitas(doc, 'Segundo', W / 2, 160, { tam: 15, color: DORADO, cs: 2.4, align: 'center' })
  fuente(doc, F.SERIF, 'normal', 62, BLANCO)
  doc.text('Informe de', W / 2, 184, { align: 'center' })
  doc.text('Gobierno', W / 2, 205.5, { align: 'center' })
  relleno(doc, DORADO); doc.rect(W / 2 - 20, 213, 40, 0.6, 'F')
  fuente(doc, F.SANS, 'normal', 10.5, [238, 222, 225])
  doc.text(PERIODO_LARGO, W / 2, 223, { align: 'center' })

  trazo(doc, DORADO); doc.setLineWidth(0.2); doc.line(26, 241, W - 26, 241)
  const lh = 17
  doc.addImage(ctx.imgs.logoBlanco.data, 'PNG', 26, 246, lh * RATIO.logo, lh, 'logoBlanco', 'FAST')
  fuente(doc, F.SERIF, 'normal', 16, BLANCO)
  doc.text('Javier Rivera Bonilla', W - 26, 254, { align: 'right' })
  versalitas(doc, 'Presidente Municipal', W - 26, 259.5, { tam: 7, color: DORADO_CLARO, cs: 0.6, align: 'right' })
}

// ── Índice (página 2, se llena al final) ─────────────────────────────────────
export function indice(doc, ctx, entradas) {
  doc.setPage(2)
  encabezado(doc, ctx, 'Contenido')
  let y = apertura(doc, 34, 'Segundo Informe de Gobierno', 'Contenido')
  const fila = (e, conEje) => {
    const x = ML + (conEje ? 14 : 0)
    if (conEje) {
      relleno(doc, hexARgb(e.color)); doc.rect(ML, y - 3.6, 9, 4.6, 'F')
      versalitas(doc, e.cod, ML + 4.5, y - 0.4, { tam: 6, color: BLANCO, cs: 0.2, align: 'center' })
    }
    fuente(doc, F.SERIF, 'normal', 13, TINTA)
    const t = doc.splitTextToSize(e.label, CW - 40 - (conEje ? 14 : 0))[0]
    doc.text(t, x, y)
    const tw = doc.getTextWidth(t)
    fuente(doc, F.SANS, 'bold', 10, GUINDA)
    const pn = String(e.page)
    doc.text(pn, W - ML, y, { align: 'right' })
    trazo(doc, [200, 190, 188]); doc.setLineWidth(0.25); doc.setLineDashPattern([0.3, 1.2], 0)
    doc.line(x + tw + 3, y - 0.6, W - ML - doc.getTextWidth(pn) - 3, y - 0.6)
    doc.setLineDashPattern([], 0)
    y += 9.2
  }
  entradas.filter(e => !e.cod).forEach(e => fila(e, false))
  y += 4
  versalitas(doc, 'Ejes del Plan Municipal de Desarrollo 2024 – 2027', ML, y, { tam: 7.5, color: GUINDA, cs: 0.6 })
  y += 9
  entradas.filter(e => e.cod).forEach(e => fila(e, true))
}

// ── Presentación ─────────────────────────────────────────────────────────────
export function presentacion(doc, ctx, ejes) {
  let y = nuevaPagina(doc, ctx, 'Presentación')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'Segundo Informe de Gobierno', 'Presentación')
  y = parrafos(doc, ctx, PRESENTACION_PARRAFOS, y, { seccion: 'Presentación' })
  y += 2
  PRESENTACION_EJES.forEach((l, i) => {
    const e = ejes[i]
    const col = e ? hexARgb(e.color_hex || '#7B1F2C') : GUINDA
    relleno(doc, col); doc.rect(ML, y - 3.4, 1.4, 4.6, 'F')
    fuente(doc, F.SERIF, 'normal', 13, TINTA)
    doc.text(l.replace(/^(\d+|Transversal [AB])\.\s*/, ''), ML + 5, y)
    versalitas(doc, (l.match(/^(\d+|Transversal [AB])/)?.[0] || '').replace(/^(\d+)$/, 'Eje $1').replace('Transversal', 'Eje transversal'), W - ML, y, { tam: 6.5, color: col, cs: 0.8, align: 'right' })
    y += 8.5
  })
  return page
}

// ── Mensaje del Presidente ───────────────────────────────────────────────────
export function mensajePresidente(doc, ctx) {
  let y = nuevaPagina(doc, ctx, 'Mensaje del Presidente Municipal')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'Mensaje del', 'Presidente Municipal')

  // Espacio para la fotografía oficial (la integra Comunicación Social).
  const fx = ML, fy = y, fw = 84, fh = 108
  relleno(doc, ALT); doc.rect(fx, fy, fw, fh, 'F')
  opacidad(doc, 0.07, () => {
    const eh = 62, ew = eh * RATIO.escudo
    doc.addImage(ctx.imgs.escudoGuinda.data, 'PNG', fx + (fw - ew) / 2, fy + (fh - eh) / 2, ew, eh, 'escudoGuinda', 'SLOW')
  })
  relleno(doc, DORADO); doc.rect(fx, fy + fh, fw, 0.9, 'F')
  versalitas(doc, 'Fotografía oficial', fx + fw / 2, fy + fh / 2 + 40, { tam: 6.5, color: SUB, cs: 1, align: 'center' })

  const tx = fx + fw + 10, tw = W - ML - tx
  fuente(doc, F.SERIF, 'normal', 40, DORADO)
  doc.text('“', tx - 1, y + 14)
  const primero = lineas(doc, MENSAJE_PRESIDENTE[0], tw, F.SERIF, 'italic', 14.5)
  fuente(doc, F.SERIF, 'italic', 14.5, GUINDA)
  primero.forEach((l, i) => renglon(doc, l, tx, y + 20 + i * altoLinea(14.5, 1.3), tw, i < primero.length - 1))
  let yt = y + 20 + primero.length * altoLinea(14.5, 1.3) + 6
  fuente(doc, F.SERIF, 'normal', 17, TINTA)
  doc.text('Javier Rivera Bonilla', tx, Math.max(yt, fy + fh - 9))
  versalitas(doc, 'Presidente Municipal de Apizaco', tx, Math.max(yt, fy + fh - 9) + 5.5, { tam: 6.8, color: SUB, cs: 0.55 })

  y = fy + fh + 14
  const cuerpo = MENSAJE_PRESIDENTE.slice(1, -1)
  y = parrafos(doc, ctx, cuerpo, y, { seccion: 'Mensaje del Presidente Municipal' })
  if (y > PIE - 24) y = nuevaPagina(doc, ctx, 'Mensaje del Presidente Municipal')
  y += 4
  trazo(doc, DORADO); doc.setLineWidth(0.3); doc.line(W - ML - 70, y, W - ML, y)
  fuente(doc, F.SERIF, 'normal', 14, TINTA)
  doc.text('Javier Rivera Bonilla', W - ML, y + 7, { align: 'right' })
  fuente(doc, F.SANS, 'normal', 8.5, SUB)
  doc.text(MENSAJE_PRESIDENTE[MENSAJE_PRESIDENTE.length - 1], W - ML, y + 12, { align: 'right' })
  return page
}

// Tablas con el estilo del Informe.
function tabla(doc, ctx, seccion, color, opciones) {
  const { didParseCell, ...resto } = opciones
  autoTable(doc, {
    margin: { left: ML, right: ML, top: 28, bottom: 22 },
    styles: { font: F.SANS, fontSize: 8.5, cellPadding: { top: 2.4, bottom: 2.4, left: 2.5, right: 2.5 }, textColor: TINTA, lineColor: LINEA, lineWidth: { bottom: 0.15 }, valign: 'middle', overflow: 'linebreak' },
    headStyles: { font: F.SANS, fontStyle: 'bold', fillColor: color, textColor: BLANCO, fontSize: 7.5, lineWidth: 0, halign: 'center' },
    alternateRowStyles: { fillColor: ALT },
    didDrawPage: data => { if (data.pageNumber > 1) encabezado(doc, ctx, seccion, color) },
    ...resto,
    // Los encabezados de columna van centrados aunque la columna se alinee distinto.
    didParseCell: data => {
      if (data.section === 'head') data.cell.styles.halign = 'center'
      didParseCell?.(data)
    },
  })
  return doc.lastAutoTable.finalY
}

export function cabildo(doc, ctx) {
  let y = nuevaPagina(doc, ctx, 'Integrantes del H. Cabildo')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'H. Ayuntamiento de Apizaco · 2024 – 2027', 'Integrantes del H. Cabildo')
  tabla(doc, ctx, 'Integrantes del H. Cabildo', GUINDA, {
    startY: y, head: [['Cargo', 'Nombre']], body: CABILDO,
    columnStyles: { 0: { cellWidth: 92, textColor: SUB }, 1: { fontStyle: 'bold' } },
  })
  return page
}

export function gabinete(doc, ctx) {
  let y = nuevaPagina(doc, ctx, 'Gabinete Municipal')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'H. Ayuntamiento de Apizaco · 2024 – 2027', 'Gabinete Municipal')
  tabla(doc, ctx, 'Gabinete Municipal', GUINDA, {
    startY: y, head: [['Cargo / Dependencia', 'Titular']], body: GABINETE,
    styles: { font: F.SANS, fontSize: 7.4, cellPadding: { top: 1, bottom: 1, left: 2.5, right: 2.5 }, textColor: TINTA, lineColor: LINEA, lineWidth: { bottom: 0.15 }, valign: 'middle' },
    columnStyles: { 0: { cellWidth: 98, textColor: SUB }, 1: { fontStyle: 'bold' } },
  })
  return page
}

// Secciones cuyo contenido aún no se captura en SIMA.
export function seccionPendiente(doc, ctx, titulo, texto) {
  let y = nuevaPagina(doc, ctx, titulo)
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'Segundo Informe de Gobierno', titulo)
  trazo(doc, DORADO); doc.setLineWidth(0.3); doc.setLineDashPattern([1.5, 1.2], 0)
  doc.rect(ML, y + 6, CW, 44, 'S')
  doc.setLineDashPattern([], 0)
  versalitas(doc, 'Sección por integrar', W / 2, y + 24, { tam: 8, color: DORADO, cs: 0.9, align: 'center' })
  fuente(doc, F.SANS, 'normal', 9, SUB)
  doc.text(doc.splitTextToSize(texto, CW - 30), W / 2, y + 32, { align: 'center' })
  return page
}

// ── Resumen ejecutivo ────────────────────────────────────────────────────────
export function resumenEjecutivo(doc, ctx, { ejes, catalogo, totales, pmdTotal, pmdConAvance, nAcciones }) {
  let y = nuevaPagina(doc, ctx, 'Resumen ejecutivo')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, PERIODO_LARGO, 'Resumen ejecutivo')
  y = franjaCifras(doc, y, [
    [num(totales.total), 'Indicadores MIR evaluados'],
    [pct(totales.pctGlobal), 'Avance global promedio'],
    [`${pmdConAvance}/${pmdTotal}`, 'Programas del PMD con avance'],
    [num(nAcciones), 'Acciones relevantes publicadas'],
  ])

  fuente(doc, F.SERIF, 'normal', 16, TINTA)
  doc.text('Avance promedio por eje', ML, y + 2)
  fuente(doc, F.SANS, 'normal', 8, SUB)
  doc.text('Promedio del cumplimiento de los indicadores MIR de cada eje. La línea marca el 100% de la meta.', ML, y + 7)
  y += 15
  const x0 = ML + 82, x1 = W - ML - 16, max = 1.4
  const xv = v => x0 + Math.min(v, max) / max * (x1 - x0)
  const filaH = 10.5, top = y
  ejes.forEach((e, i) => {
    const d = datosEje(e, catalogo.find(c => c.codigo === e.codigo))
    const yy = top + i * filaH
    const col = hexARgb(d.color)
    versalitas(doc, d.cod, ML, yy + 4.6, { tam: 7.5, color: col, cs: 0.3 })
    fuente(doc, F.SANS, 'normal', 8.5, TINTA)
    doc.text(doc.splitTextToSize(d.nombre, 68)[0] + (doc.splitTextToSize(d.nombre, 68).length > 1 ? '…' : ''), ML + 11, yy + 4.6)
    relleno(doc, col); doc.rect(x0, yy + 1.2, Math.max(0.4, xv(+d.pct || 0) - x0), 5, 'F')
    fuente(doc, F.SANS, 'bold', 8, TINTA)
    doc.text(pct(d.pct), Math.max(xv(+d.pct || 0), xv(1)) + 2, yy + 4.8)
  })
  const yb = top + ejes.length * filaH
  ;[0, 0.5, 1, 1.25].forEach(v => {
    fuente(doc, F.SANS, 'normal', 6.5, SUB)
    doc.text(`${v * 100}%`, xv(v), yb + 3.5, { align: 'center' })
  })
  trazo(doc, TINTA); doc.setLineWidth(0.3); doc.setLineDashPattern([1, 0.8], 0)
  doc.line(xv(1), top - 2, xv(1), yb); doc.setLineDashPattern([], 0)
  y = yb + 16

  fuente(doc, F.SERIF, 'normal', 16, TINTA)
  doc.text('Semáforo de los indicadores', ML, y)
  y += 6
  const vals = [totales.optimo, totales.adecuado, totales.riesgo, totales.critico]
  const conDato = vals.reduce((s, v) => s + v, 0) || 1
  let x = ML
  vals.forEach((v, i) => { const w = CW * v / conDato; relleno(doc, SEM[i].c); doc.rect(x, y, w, 6, 'F'); x += w })
  y += 12
  SEM.forEach((s, i) => {
    const xx = ML + i * (CW / 4)
    relleno(doc, s.c); doc.rect(xx, y - 2.8, 3, 3, 'F')
    fuente(doc, F.SANS, 'normal', 8.5, TINTA); doc.text(s.l, xx + 5, y)
    fuente(doc, F.SANS, 'bold', 8.5, TINTA); doc.text(`${vals[i]} · ${((vals[i] / conDato) * 100).toFixed(0)}%`, xx + 5, y + 4.5)
  })
  return page
}

// ── Portada de eje ───────────────────────────────────────────────────────────
// Arriba, el diagrama conceptual del eje (pictograma central y sus programas
// del PMD); abajo, numeral, nombre, descripción y cifras.
export async function portadaEje(doc, ctx, d, foto, satelites = []) {
  doc.addPage('letter', 'portrait')
  const page = doc.getNumberOfPages()
  ctx.portadas.add(page)

  // 1) Medidas del bloque de texto, de abajo hacia arriba.
  const X = 21
  const pie = H - 15, yb = pie - 9, yn = yb - 9, ysep = yn - 15
  const anchoDesc = W - X * 2 - 24
  const desc = lineas(doc, d.descripcion, anchoDesc, F.SERIF, 'italic', 13.5)
  const lhd = altoLinea(13.5, 1.3)
  const yDescFin = ysep - 9
  const yDescIni = yDescFin - (desc.length - 1) * lhd
  const nom = lineas(doc, d.nombre, W - X * 2 - 12, F.SERIF, 'normal', 36)
  const lhn = altoLinea(36, 1.02)
  const yNomFin = yDescIni - (desc.length ? 10 : 2)
  const yNomIni = yNomFin - (nom.length - 1) * lhn
  const yRegla = yNomIni - altoLinea(36, 0.78) - 5
  const tamN = d.n.length > 1 ? 118 : 170
  const yKick = yRegla - 5 - tamN * 0.3528 * 0.68 - 6

  // 2) Diagrama en el espacio libre entre el encabezado y el numeral.
  // Los satélites van en dos arcos laterales (±60° de la horizontal), nunca
  // arriba o abajo del centro, para no encimarse con el pictograma central.
  const top = 52, bottom = yKick - 9
  const rS = 7, cx = W / 2, cy = (top + bottom) / 2, mitad = (bottom - top) / 2
  const der = Math.ceil(satelites.length / 2), izq = satelites.length - der
  const angulo = (j, m) => -60 + 120 * (j + 0.5) / m
  const senMax = Math.max(0.01, ...[der, izq].filter(Boolean).map(m => Math.abs(Math.sin(angulo(0, m) * Math.PI / 180))))
  const ry = Math.max(10, Math.min(40, (mitad - rS - 6) / senMax))
  const rx = 58, rC = Math.max(9, Math.min(15.5, mitad - 6))
  const sats = satelites.map((st, i) => {
    const deg = i < der ? angulo(i, der) : 180 - angulo(i - der, izq)
    const a = deg * Math.PI / 180
    return { ...st, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  })
  const arte = await artePortadaEje(d.color, foto, { cx, cy, rx, ry, rC, rS, centro: CENTRO[d.cod] || CENTRO.E5, satelites: sats })
  doc.addImage(arte, 'JPEG', 0, 0, W, H, `arteEje${d.cod}`, 'FAST')
  marco(doc, DORADO_CLARO, 9, 0.25)
  // Rótulos de los satélites al costado exterior de cada círculo, centrados
  // en su altura: así no chocan entre sí ni con el pictograma central.
  sats.forEach(st => {
    const ls = lineas(doc, st.rotulo, 25, F.SANS, 'bold', 6.3).slice(0, 2)
    fuente(doc, F.SANS, 'bold', 6.3, BLANCO)
    const derecha = st.x > cx
    const x = derecha ? st.x + rS + 2.2 : st.x - rS - 2.2
    const y0 = st.y + 0.8 - (ls.length - 1) * 1.35
    ls.forEach((l, k) => doc.text(l, x, y0 + k * 2.7, { align: derecha ? 'left' : 'right' }))
  })

  // 3) Encabezado: escudo, leyenda y logo.
  const eh = 25, ew = eh * RATIO.escudo
  doc.addImage(ctx.imgs.escudoBlanco.data, 'PNG', X, 18, ew, eh, 'escudoBlanco', 'SLOW')
  versalitas(doc, 'H. Ayuntamiento de Apizaco', X + ew + 5, 26.5, { tam: 6.8, color: DORADO_CLARO, cs: 0.55 })
  fuente(doc, F.SERIF, 'normal', 14, BLANCO)
  doc.text('Segundo Informe de Gobierno', X + ew + 5, 33)
  opacidad(doc, 0.75, () => versalitas(doc, PERIODO_CORTO, X + ew + 5, 38, { tam: 6.5, color: BLANCO, cs: 0.55, estilo: 'normal' }))
  const lh = 17
  doc.addImage(ctx.imgs.logoBlanco.data, 'PNG', W - X - lh * RATIO.logo, 20, lh * RATIO.logo, lh, 'logoBlanco', 'FAST')

  // 4) Bloque inferior.
  opacidad(doc, 0.7, () => {
    versalitas(doc, PERIODO_CORTO, X, pie, { tam: 6.3, color: BLANCO, cs: 0.55, estilo: 'normal' })
    versalitas(doc, d.cod, W - X, pie, { tam: 6.3, color: BLANCO, cs: 0.55, align: 'right', estilo: 'normal' })
  })
  opacidad(doc, 0.22, () => { relleno(doc, BLANCO); doc.rect(X, yb, W - X * 2, 1.7, 'F') })
  let xs = X
  d.sem.forEach((v, i) => { if (!v || !d.total) return; const w = (W - X * 2) * v / d.total; relleno(doc, SEM[i].c); doc.rect(xs, yb, w, 1.7, 'F'); xs += w })
  fuente(doc, F.LIGHT, 'normal', 30, BLANCO)
  doc.text(String(d.total), X, yn)
  doc.text(pct(d.pct), W / 2, yn)
  opacidad(doc, 0.78, () => {
    versalitas(doc, 'Indicadores MIR', X, yn + 4.6, { tam: 6.2, color: BLANCO, cs: 0.55 })
    versalitas(doc, 'Avance promedio', W / 2, yn + 4.6, { tam: 6.2, color: BLANCO, cs: 0.55 })
  })
  opacidad(doc, 0.35, () => { trazo(doc, BLANCO); doc.setLineWidth(0.2); doc.line(X, ysep, W - X, ysep) })

  fuente(doc, F.SERIF, 'italic', 13.5, [247, 236, 238])
  desc.forEach((l, i) => renglon(doc, l, X, yDescIni + i * lhd, anchoDesc, i < desc.length - 1))
  fuente(doc, F.SERIF, 'normal', 36, BLANCO)
  nom.forEach((l, i) => doc.text(l, X, yNomIni + i * lhn))
  relleno(doc, DORADO); doc.rect(X, yRegla, 34, 1.1, 'F')
  fuente(doc, F.LIGHT, 'normal', tamN, BLANCO)
  doc.text(d.n, X - 2, yRegla - 5)
  versalitas(doc, d.kick, X, yKick, { tam: 9, color: DORADO_CLARO, cs: 1.3 })
  return page
}

// ── Resultados del eje ───────────────────────────────────────────────────────
export function resultadosEje(doc, ctx, d, indicadores, pmdList, nAcciones) {
  const col = hexARgb(d.color)
  const seccion = `${d.kick} · Resultados`
  let y = nuevaPagina(doc, ctx, seccion, col)
  y = apertura(doc, y + 4, `${d.kick} · Resultados del eje`, d.nombre, col, 26)
  const conDato = d.sem.reduce((s, v) => s + v, 0)
  y = franjaCifras(doc, y, [
    [num(d.total), 'Indicadores MIR'],
    [pct(d.pct), 'Avance promedio'],
    [conDato ? `${Math.round((d.sem[0] + d.sem[1]) / conDato * 100)}%` : '—', 'Indicadores en verde'],
    [num(nAcciones), 'Acciones publicadas'],
  ], col)

  // Semáforo (dona) a la izquierda, avance por área a la derecha.
  const yTop = y
  versalitas(doc, 'Semáforo', ML, yTop, { tam: 7, color: col, cs: 0.55 })
  const cx = ML + 22, cy = yTop + 26
  dona(doc, cx, cy, 20, 7.5, d.sem, SEM.map(s => s.c))
  fuente(doc, F.LIGHT, 'normal', 17, TINTA)
  doc.text(conDato ? `${Math.round((d.sem[0] + d.sem[1]) / conDato * 100)}%` : '—', cx, cy + 1.5, { align: 'center' })
  versalitas(doc, 'en verde', cx, cy + 5.6, { tam: 5.5, cs: 0.6, align: 'center' })
  SEM.forEach((s, i) => {
    const yy = yTop + 54 + i * 5.4
    relleno(doc, s.c); doc.rect(ML, yy - 2.6, 2.8, 2.8, 'F')
    fuente(doc, F.SANS, 'normal', 8, TINTA); doc.text(s.l, ML + 5, yy)
    fuente(doc, F.SANS, 'bold', 8, TINTA); doc.text(String(d.sem[i]), ML + 48, yy, { align: 'right' })
  })
  const sinDato = d.total - conDato
  if (sinDato > 0) { fuente(doc, F.SANS, 'normal', 7, SUB); doc.text(`${sinDato} sin dato al corte`, ML, yTop + 54 + 4 * 5.4) }

  const ax = ML + 64, aw = W - ML - ax
  versalitas(doc, 'Avance por área', ax, yTop, { tam: 7, color: col, cs: 0.55 })
  const porArea = new Map()
  indicadores.forEach(i => {
    if (i.pct_cumplimiento == null) return
    const r = porArea.get(i.area) || { s: 0, n: 0 }
    r.s += +i.pct_cumplimiento; r.n++
    porArea.set(i.area, r)
  })
  const areas = [...porArea.entries()].map(([a, r]) => ({ a, v: r.s / r.n })).sort((p, q) => q.v - p.v).slice(0, 9)
  const bx0 = ax + 50, bx1 = W - ML - 14, bmax = 1.5
  const bv = v => bx0 + Math.min(v, bmax) / bmax * (bx1 - bx0)
  areas.forEach((r, i) => {
    const yy = yTop + 7 + i * 8
    fuente(doc, F.SANS, 'normal', 7.8, TINTA)
    const t = doc.splitTextToSize(r.a || '—', 47)
    doc.text(t[0] + (t.length > 1 ? '…' : ''), ax, yy + 3.4)
    relleno(doc, [240, 234, 233]); doc.rect(bx0, yy + 0.8, bx1 - bx0, 3.6, 'F')
    relleno(doc, col); doc.rect(bx0, yy + 0.8, Math.max(0.4, bv(r.v) - bx0), 3.6, 'F')
    fuente(doc, F.SANS, 'bold', 7.5, TINTA)
    doc.text(pct(r.v), bx1 + 1.5, yy + 3.6)
  })
  if (areas.length) {
    trazo(doc, TINTA); doc.setLineWidth(0.25); doc.setLineDashPattern([0.8, 0.7], 0)
    doc.line(bv(1), yTop + 5, bv(1), yTop + 7 + areas.length * 8)
    doc.setLineDashPattern([], 0)
    fuente(doc, F.SANS, 'normal', 6, SUB); doc.text('100%', bv(1), yTop + 3.6, { align: 'center' })
  }
  y = Math.max(yTop + 96, yTop + 16 + areas.length * 8)

  fuente(doc, F.SERIF, 'normal', 16, TINTA)
  doc.text('Indicadores MIR del eje', W / 2, y, { align: 'center' })
  y += 4
  const filas = indicadores.map(i => [i.clave || '—', i.indicador || '—', i.area || '—', pct(i.pct_cumplimiento), i.semaforo || 'SIN DATO'])
  tabla(doc, ctx, seccion, col, {
    startY: y,
    head: [['Clave', 'Indicador', 'Área', 'Avance', 'Semáforo']],
    body: filas,
    styles: { font: F.SANS, fontSize: 7.4, cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 }, textColor: TINTA, lineColor: LINEA, lineWidth: { bottom: 0.15 }, valign: 'middle', overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 25, textColor: SUB, fontSize: 6.6 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 32, textColor: SUB },
      3: { cellWidth: 16, halign: 'right', fontStyle: 'bold' }, 4: { cellWidth: 23, cellPadding: { left: 6, right: 2, top: 1.8, bottom: 1.8 } },
    },
    didParseCell: data => {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.textColor = semColor(data.cell.raw)
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 6.6
      }
    },
    didDrawCell: data => {
      if (data.section === 'body' && data.column.index === 4) {
        relleno(doc, semColor(data.cell.raw))
        doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 1.1, 'F')
      }
    },
  })

  if (pmdList?.length) {
    let yy = doc.lastAutoTable.finalY + 12
    if (yy + 30 > PIE) yy = nuevaPagina(doc, ctx, seccion, col) + 4
    fuente(doc, F.SERIF, 'normal', 16, TINTA)
    doc.text('Programas del Plan Municipal de Desarrollo', W / 2, yy, { align: 'center' })
    tabla(doc, ctx, seccion, col, {
      startY: yy + 4,
      head: [['#', 'Programa PMD', 'Indicadores', 'Avance', 'Semáforo']],
      body: pmdList.map((p, i) => {
        const v = p.pct_promedio
        const s = v == null ? 'SIN DATO' : v >= 110 ? 'ÓPTIMO' : v >= 90 ? 'ADECUADO' : v >= 70 ? 'RIESGO' : 'CRÍTICO'
        return [i + 1, p.programa_nombre || '—', p.total_indicadores || 0, pctPMD(v), s]
      }),
      styles: { font: F.SANS, fontSize: 7.8, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }, textColor: TINTA, lineColor: LINEA, lineWidth: { bottom: 0.15 }, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', textColor: SUB }, 1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 18, halign: 'right', fontStyle: 'bold' }, 4: { cellWidth: 23, cellPadding: { left: 6, right: 2, top: 2, bottom: 2 } },
      },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = semColor(data.cell.raw); data.cell.styles.fontStyle = 'bold'; data.cell.styles.fontSize = 6.6
        }
      },
      didDrawCell: data => {
        if (data.section === 'body' && data.column.index === 4) {
          relleno(doc, semColor(data.cell.raw)); doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 1.1, 'F')
        }
      },
    })
  }
}

// ── Acciones relevantes del eje ──────────────────────────────────────────────
// Agrupadas por programa PMD (las no vinculadas a la MIR al final). Una acción
// con fotos se publica como bloque destacado; sin fotos, como renglón.
function grupos(acciones) {
  const m = new Map()
  acciones.forEach(a => {
    const k = a.programa_pmd || ''
    if (!m.has(k)) m.set(k, { nombre: a.programa_pmd, orden: a.programa_pmd ? (a.programa_pmd_numero ?? 0) : 9999, filas: [] })
    m.get(k).filas.push(a)
  })
  return [...m.values()].sort((x, y) => x.orden - y.orden)
    .map(g => ({ ...g, filas: g.filas.sort((x, y) => (x.fecha || '').localeCompare(y.fecha || '')) }))
}

function metaAccion(a) {
  return [fechaCorta(a.fecha), a.area, a.indicador_clave, a.nivel_mir].filter(Boolean).join('  ·  ')
}

// Medidas del mosaico de fotos según cuántas haya (1 a 3).
function mosaico(n, pw) {
  if (n >= 3) {
    const w1 = pw * 0.57, w2 = pw - w1 - 2, h2 = w2 * 0.76, ht = h2 * 2 + 2
    return { h: ht, celdas: [[0, 0, w1, ht], [w1 + 2, 0, w2, h2], [w1 + 2, h2 + 2, w2, h2]] }
  }
  if (n === 2) {
    const w = (pw - 2) / 2, h = w * 1.22
    return { h, celdas: [[0, 0, w, h], [w + 2, 0, w, h]] }
  }
  const h = pw * 0.7
  return { h, celdas: [[0, 0, pw, h]] }
}

function bloqueDestacado(doc, ctx, a, fotos, y, lado, col, seccion) {
  const pw = CW * 0.5 - 3, tw = CW - pw - 7
  const m = mosaico(fotos.length, pw)
  const tTit = lineas(doc, a.accion, tw, F.SANS, 'bold', 11.5)
  const tMeta = lineas(doc, metaAccion(a), tw, F.SANS, 'normal', 7)
  const tDesc = lineas(doc, a.descripcion, tw, F.SANS, 'normal', 9)
  const lhT = altoLinea(11.5, 1.2), lhM = altoLinea(7, 1.35), lhD = altoLinea(9, 1.42)
  const cifras = [a.beneficiarios != null && [num(a.beneficiarios), 'Beneficiarios'], a.monto != null && Number(a.monto) > 0 && [pesos(a.monto), 'Inversión']].filter(Boolean)
  const altoTexto = tTit.length * lhT + 2 + tMeta.length * lhM + 3 + tDesc.length * lhD + (cifras.length ? 15 : 0)
  const alto = Math.max(m.h + 7, altoTexto)
  if (y + alto > PIE) y = nuevaPagina(doc, ctx, seccion, col)

  const px = lado === 'izq' ? ML : ML + tw + 7
  const tx = lado === 'izq' ? ML + pw + 7 : ML
  m.celdas.forEach(([cx, cy, cw, ch], i) => {
    doc.addImage(recortarFoto(fotos[i].bmp, cw / ch), 'JPEG', px + cx, y + cy, cw, ch, undefined, 'FAST')
  })
  fuente(doc, F.SERIF, 'italic', 8, SUB)
  doc.text(doc.splitTextToSize(`${a.area} · ${fechaCorta(a.fecha)}`, pw)[0], px, y + m.h + 4.2)

  let yt = y + lhT * 0.8
  fuente(doc, F.SANS, 'bold', 11.5, TINTA)
  tTit.forEach(l => { doc.text(l, tx, yt); yt += lhT })
  yt += 0.5
  fuente(doc, F.SANS, 'normal', 7, col)
  tMeta.forEach(l => { doc.text(l, tx, yt); yt += lhM })
  yt += 2.5
  fuente(doc, F.SANS, 'normal', 9, [58, 46, 48])
  tDesc.forEach((l, i) => { renglon(doc, l, tx, yt, tw, i < tDesc.length - 1); yt += lhD })
  if (cifras.length) {
    yt += 2
    trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(tx, yt, tx + tw, yt)
    cifras.forEach(([v, l], i) => {
      const xx = tx + i * (tw / 2)
      fuente(doc, F.LIGHT, 'normal', 18, col); doc.text(v, xx, yt + 8)
      versalitas(doc, l, xx, yt + 12, { tam: 5.8, cs: 0.7 })
    })
  }
  return y + alto + 9
}

function renglonAccion(doc, ctx, a, y, col, seccion) {
  const cx = ML + 27, cw = CW - 27
  const tTit = lineas(doc, a.accion, cw, F.SANS, 'bold', 9.5)
  const tDesc = lineas(doc, a.descripcion, cw, F.SANS, 'normal', 8.5)
  const extras = [a.area, a.indicador_clave || (a.justificacion ? `Sin vínculo MIR: ${a.justificacion}` : null),
    a.beneficiarios != null ? `${num(a.beneficiarios)} beneficiarios` : null,
    a.monto != null && Number(a.monto) > 0 ? pesos(a.monto) : null].filter(Boolean).join('  ·  ')
  const tMeta = lineas(doc, extras, cw, F.SANS, 'normal', 7)
  const lhT = altoLinea(9.5, 1.25), lhD = altoLinea(8.5, 1.4), lhM = altoLinea(7, 1.35)
  const alto = tTit.length * lhT + 1 + tDesc.length * lhD + 1.5 + tMeta.length * lhM + 4
  if (y + alto > PIE) y = nuevaPagina(doc, ctx, seccion, col)
  fuente(doc, F.SANS, 'bold', 7.5, SUB)
  doc.text(fechaCorta(a.fecha), ML, y + lhT * 0.8)
  let yy = y + lhT * 0.8
  fuente(doc, F.SANS, 'bold', 9.5, TINTA); tTit.forEach(l => { doc.text(l, cx, yy); yy += lhT })
  yy += 0.6
  fuente(doc, F.SANS, 'normal', 8.5, [70, 58, 60]); tDesc.forEach((l, i) => { renglon(doc, l, cx, yy, cw, i < tDesc.length - 1); yy += lhD })
  yy += 1
  fuente(doc, F.SANS, 'normal', 7, col); tMeta.forEach(l => { doc.text(l, cx, yy); yy += lhM })
  trazo(doc, LINEA); doc.setLineWidth(0.2); doc.setLineDashPattern([0.4, 0.9], 0)
  doc.line(ML, y + alto - 1.5, W - ML, y + alto - 1.5); doc.setLineDashPattern([], 0)
  return y + alto + 2
}

export function accionesEje(doc, ctx, d, acciones, fotosPorAccion) {
  const col = hexARgb(d.color)
  const seccion = `${d.kick} · Acciones relevantes`
  let y = nuevaPagina(doc, ctx, seccion, col)
  y = apertura(doc, y + 4, `${d.kick} · ${d.nombre}`, 'Acciones relevantes', col, 26)
  const benef = acciones.reduce((s, a) => s + (a.beneficiarios || 0), 0)
  const monto = acciones.reduce((s, a) => s + (Number(a.monto) || 0), 0)
  const areas = new Set(acciones.map(a => a.area_id)).size
  y = franjaCifras(doc, y, [
    [num(acciones.length), acciones.length === 1 ? 'Acción publicada' : 'Acciones publicadas'],
    [num(benef), 'Beneficiarios'],
    monto > 0 ? [pesos(monto), 'Inversión reportada'] : [num(areas), areas === 1 ? 'Área participante' : 'Áreas participantes'],
    [num(acciones.filter(a => fotosPorAccion.get(a.id)?.length).length), 'Con evidencia fotográfica'],
  ], col)

  let lado = 'izq'
  grupos(acciones).forEach(g => {
    if (y + 34 > PIE) y = nuevaPagina(doc, ctx, seccion, col)
    versalitas(doc, g.nombre ? 'Programa PMD' : 'Sin vínculo a la MIR', ML, y, { tam: 6.8, color: col, cs: 0.55 })
    const tt = lineas(doc, g.nombre || 'Otras acciones relevantes', CW, F.SERIF, 'normal', 15)
    fuente(doc, F.SERIF, 'normal', 15, TINTA)
    tt.forEach((l, i) => doc.text(l, ML, y + 6.5 + i * altoLinea(15, 1.1)))
    y += 6.5 + (tt.length - 1) * altoLinea(15, 1.1) + 2.5
    trazo(doc, col); doc.setLineWidth(0.35); doc.line(ML, y, W - ML, y)
    y += 7
    g.filas.forEach(a => {
      const fotos = fotosPorAccion.get(a.id) || []
      if (fotos.length) {
        y = bloqueDestacado(doc, ctx, a, fotos.slice(0, 3), y, lado, col, seccion)
        lado = lado === 'izq' ? 'der' : 'izq'
      } else {
        y = renglonAccion(doc, ctx, a, y, col, seccion)
      }
    })
    y += 4
  })
}

// ── Pie de página (todas menos las portadas) ─────────────────────────────────
export function pies(doc, ctx, folio) {
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    if (ctx.portadas.has(p)) continue
    doc.setPage(p)
    trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(ML, H - 13, W - ML, H - 13)
    versalitas(doc, 'H. Ayuntamiento de Apizaco · 2024 – 2027', ML, H - 8.5, { tam: 5.8, cs: 0.6, estilo: 'normal' })
    fuente(doc, F.SANS, 'normal', 5.8, [160, 150, 150])
    doc.text(`Folio ${folio}`, W / 2, H - 8.5, { align: 'center' })
    fuente(doc, F.SANS, 'bold', 8.5, GUINDA)
    doc.text(String(p), W - ML, H - 8.3, { align: 'right' })
  }
}

export { matiz }
