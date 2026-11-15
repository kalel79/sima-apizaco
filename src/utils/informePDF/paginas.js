// ── Páginas del PDF del Informe de Gobierno ──────────────────────────────────
// Diseño editorial: Cormorant Garamond (títulos), Source Sans 3 (texto y
// cifras), guinda y dorado institucionales, y el color de cada eje en su
// capítulo. Carta vertical, medidas en mm.
import autoTable from 'jspdf-autotable'
import { F, RATIO } from './recursos.js'
import { artePortadaPrincipal, artePortadaEje, recortarFoto, hexARgb, matiz } from './arte.js'
import { CENTRO } from './pictogramasSvg.js'
import { dibujarDiagrama, diagramaValido, DIAGRAMA_RATIO } from './diagramas.js'
import {
  CABILDO, GABINETE, PRESENTACION_PARRAFOS, PRESENTACION_EJES, MENSAJE_PRESIDENTE, NOTA_METODOLOGICA, GLOSARIO,
  PRESENTACION_ADICIONALES_TEXTO, PRESENTACION_ADICIONALES,
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
  // En columnas angostas una palabra larga deja renglones abiertos; se
  // justifican igual (hasta ~7 espacios) para que el bloque se vea parejo.
  if (gap > doc.getTextWidth(' ') * 7) { doc.text(l, x, y); return }
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

// Datos de presentación de un eje a partir de v_resumen_ejes + catálogo.
export function datosEje(eje, catalogo) {
  const cod = eje.codigo
  // E1-E5 y transversales A/B son del PMD; los demás (MS, AJ) son ejes
  // adicionales de la administración: sin numeral y rotulados por su nombre.
  const pmd = /^(E\d+|T[A-Z])$/.test(cod)
  const n = pmd ? cod.slice(1) : ''
  const kick = cod.startsWith('E') && pmd ? `Eje ${n}` : pmd ? `Eje transversal ${n}` : 'Eje adicional'
  const nombre = String(eje.eje || '').replace(/^Transversal [AB]\s*[–-]\s*/, '')
  const sem = [eje.optimo || 0, eje.adecuado || 0, eje.riesgo || 0, eje.critico || 0]
  const total = eje.total_indicadores || 0, sinMeta = eje.sin_meta || 0
  return {
    sinMeta, sinDato: eje.sin_dato ?? Math.max(0, total - sem.reduce((t, v) => t + v, 0) - sinMeta),
    cod, n, kick, corto: pmd ? kick : nombre, nombre, color: eje.color_hex || catalogo?.color_hex || '#7B1F2C',
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
    doc.link(ML, y - 5, CW, 7, { pageNumber: e.page })
    trazo(doc, [200, 190, 188]); doc.setLineWidth(0.25); doc.setLineDashPattern([0.3, 1.2], 0)
    doc.line(x + tw + 3, y - 0.6, W - ML - doc.getTextWidth(pn) - 3, y - 0.6)
    doc.setLineDashPattern([], 0)
    y += 9.2
  }
  entradas.filter(e => !e.cod && !e.anexo).forEach(e => fila(e, false))
  y += 4
  versalitas(doc, 'Ejes del Plan Municipal de Desarrollo y ejes adicionales', ML, y, { tam: 7.5, color: GUINDA, cs: 0.6 })
  y += 9
  entradas.filter(e => e.cod).forEach(e => fila(e, true))
  const anexos = entradas.filter(e => e.anexo)
  if (anexos.length) {
    y += 4
    versalitas(doc, 'Anexo', ML, y, { tam: 7.5, color: GUINDA, cs: 0.6 })
    y += 9
    anexos.forEach(e => fila(e, false))
  }
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
  y += 3
  fuente(doc, F.SANS, 'normal', 10.5, [58, 46, 48])
  doc.text(PRESENTACION_ADICIONALES_TEXTO, ML, y)
  y += 9
  PRESENTACION_ADICIONALES.forEach((l, i) => {
    const e = ejes[PRESENTACION_EJES.length + i]
    const col = e ? hexARgb(e.color_hex || '#7B1F2C') : GUINDA
    relleno(doc, col); doc.rect(ML, y - 3.4, 1.4, 4.6, 'F')
    fuente(doc, F.SERIF, 'normal', 13, TINTA)
    doc.text(l, ML + 5, y)
    versalitas(doc, 'Eje adicional', W - ML, y, { tam: 6.5, color: col, cs: 0.8, align: 'right' })
    y += 8.5
  })
  return page
}

// ── Mensaje del Presidente ───────────────────────────────────────────────────
export function mensajePresidente(doc, ctx) {
  let y = nuevaPagina(doc, ctx, 'Mensaje del Presidente Municipal')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'Mensaje del', 'Presidente Municipal')

  // Cita de apertura a lo ancho; la firma va una sola vez, al final.
  const tw = 150, lhQ = altoLinea(14.5, 1.3)
  fuente(doc, F.SERIF, 'normal', 40, DORADO)
  doc.text('“', ML - 1, y + 10)
  const primero = lineas(doc, MENSAJE_PRESIDENTE[0], tw, F.SERIF, 'italic', 14.5)
  fuente(doc, F.SERIF, 'italic', 14.5, GUINDA)
  primero.forEach((l, i) => renglon(doc, l, ML + 12, y + 8 + i * lhQ, tw, i < primero.length - 1))
  y += 8 + primero.length * lhQ + 8
  const cuerpo = MENSAJE_PRESIDENTE.slice(1, -1)
  y = parrafos(doc, ctx, cuerpo, y, { seccion: 'Mensaje del Presidente Municipal' })
  if (y > PIE - 24) y = nuevaPagina(doc, ctx, 'Mensaje del Presidente Municipal')
  y += 4
  trazo(doc, DORADO); doc.setLineWidth(0.3); doc.line(W - ML - 70, y, W - ML, y)
  fuente(doc, F.SERIF, 'normal', 14, TINTA)
  doc.text('Javier Rivera Bonilla', W - ML, y + 7, { align: 'right' })
  versalitas(doc, 'Presidente Municipal de Apizaco', W - ML, y + 12, { tam: 6.8, color: SUB, cs: 0.55, align: 'right' })
  fuente(doc, F.SANS, 'normal', 8.5, SUB)
  doc.text(MENSAJE_PRESIDENTE[MENSAJE_PRESIDENTE.length - 1], W - ML, y + 17, { align: 'right' })
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

// ── Portada de eje ───────────────────────────────────────────────────────────
// Arriba, el diagrama conceptual del eje (pictograma central y sus programas
// del PMD); abajo, numeral, nombre, descripción y cifras.
// `cifras`: hasta dos pares [valor, rótulo] del pie de la portada (logros e
// inversión del eje); sin cifras, el pie queda solo con su filete.
export async function portadaEje(doc, ctx, d, foto, satelites = [], cifras = []) {
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
  const tamN = d.n.length > 1 ? 100 : 136
  const yKick = d.n ? yRegla - 5 - tamN * 0.3528 * 0.68 - 6 : yRegla - 6

  // 2) Diagrama en el espacio libre entre el encabezado y el numeral: los
  // satélites se reparten parejo en una órbita elíptica alrededor del centro.
  // Con número par se gira medio paso para que ninguno quede justo arriba o
  // abajo (con 2 quedan a izquierda y derecha); con impar, uno va arriba.
  const top = 48, bottom = yKick - 8
  const rS = 7.2, cx = W / 2, cy = (top + bottom) / 2, mitad = (bottom - top) / 2
  const n = satelites.length
  const paso = 360 / Math.max(n, 1)
  const inicio = n % 2 === 0 ? -90 + paso / 2 : -90
  const ry = Math.max(17, Math.min(33, mitad - rS - 7))
  const rx = Math.min(60, ry * 1.85)
  const rC = Math.max(9.5, Math.min(14.5, ry - rS - 4))
  const sats = satelites.map((st, i) => {
    const a = (inicio + i * paso) * Math.PI / 180
    return { ...st, a, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  })
  const arte = await artePortadaEje(d.color, foto, { cx, cy, rx, ry, rC, rS, centro: CENTRO[d.cod] || CENTRO.E5, satelites: sats })
  doc.addImage(arte, 'JPEG', 0, 0, W, H, `arteEje${d.cod}`, 'FAST')
  marco(doc, DORADO_CLARO, 9, 0.25)
  // Rótulos hacia afuera de la órbita: arriba o abajo de los satélites cercanos
  // al eje vertical, al costado en los demás (sin salirse del marco).
  const TAM_R = 6, CS_R = 0.32, LH_R = 2.75, ROTULO = [250, 244, 236]
  sats.forEach(st => {
    const cos = Math.cos(st.a), sin = Math.sin(st.a)
    const vertical = Math.abs(cos) < 0.34
    const derecha = cos > 0
    const xLado = derecha ? st.x + rS + 3.2 : st.x - rS - 3.2
    const ancho = vertical ? 38 : Math.max(20, Math.min(34, derecha ? W - 13 - xLado : xLado - 13))
    const ls = lineasVersalitas(doc, st.rotulo, ancho, TAM_R, CS_R).slice(0, 2)
    const op = { tam: TAM_R, color: ROTULO, cs: CS_R }
    ls.forEach((l, k) => {
      if (vertical) {
        const y = sin < 0 ? st.y - rS - 3.4 - (ls.length - 1 - k) * LH_R : st.y + rS + 5.2 + k * LH_R
        versalitas(doc, l, st.x, y, { ...op, align: 'center' })
      } else {
        versalitas(doc, l, xLado, st.y + 0.8 - (ls.length - 1) * LH_R / 2 + k * LH_R, { ...op, align: derecha ? 'left' : 'right' })
      }
    })
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
  opacidad(doc, 0.5, () => { relleno(doc, DORADO_CLARO); doc.rect(X, yb + 0.6, W - X * 2, 0.5, 'F') })
  cifras.slice(0, 2).forEach(([v, l], i) => {
    const xx = i ? W / 2 : X
    fuente(doc, F.LIGHT, 'normal', 30, BLANCO)
    doc.text(String(v), xx, yn)
    opacidad(doc, 0.78, () => versalitas(doc, l, xx, yn + 4.6, { tam: 6.2, color: BLANCO, cs: 0.55 }))
  })
  opacidad(doc, 0.35, () => { trazo(doc, BLANCO); doc.setLineWidth(0.2); doc.line(X, ysep, W - X, ysep) })

  fuente(doc, F.SERIF, 'italic', 13.5, [247, 236, 238])
  desc.forEach((l, i) => renglon(doc, l, X, yDescIni + i * lhd, anchoDesc, i < desc.length - 1))
  fuente(doc, F.SERIF, 'normal', 36, BLANCO)
  nom.forEach((l, i) => doc.text(l, X, yNomIni + i * lhn))
  relleno(doc, DORADO); doc.rect(X, yRegla, 34, 1.1, 'F')
  if (d.n) { fuente(doc, F.LIGHT, 'normal', tamN, BLANCO); doc.text(d.n, X - 2, yRegla - 5) }
  versalitas(doc, d.kick, X, yKick, { tam: 9, color: DORADO_CLARO, cs: 1.3 })
  return page
}

// ── Anexo estadístico ────────────────────────────────────────────────────────
// Indicadores del ejercicio acumulados al corte del Informe. El semáforo se
// lee por color y por forma; los indicadores sin captura ("sin dato") y los
// que no tienen meta programada ("sin meta") se muestran, no se omiten.
const SIN_META = 'SIN META'
const GRIS_META = [176, 164, 162], GRIS_DATO = [232, 225, 223]
const ESTADOS = [
  ...SEM.map(s => ({ k: s.k, l: s.l, c: s.c })),
  { k: SIN_META, l: 'Sin meta', c: GRIS_META },
  { k: null, l: 'Sin dato', c: GRIS_DATO },
]
const numDec = v => v == null ? '—' : Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 })

// Marca del semáforo centrada en (x, y): círculo, cuadro, triángulo, rombo;
// cuadro hueco para "sin meta" y círculo hueco para "sin dato".
function marcaSem(doc, k, x, y, t = 2.6) {
  const h = t / 2
  if (k === 'ÓPTIMO') { relleno(doc, SEM[0].c); doc.circle(x, y, h, 'F') }
  else if (k === 'ADECUADO') { relleno(doc, SEM[1].c); doc.rect(x - h, y - h, t, t, 'F') }
  else if (k === 'RIESGO') { relleno(doc, SEM[2].c); doc.triangle(x, y - h, x + h * 1.1, y + h, x - h * 1.1, y + h, 'F') }
  else if (k === 'CRÍTICO') {
    relleno(doc, SEM[3].c)
    doc.triangle(x, y - h * 1.15, x + h * 1.15, y, x - h * 1.15, y, 'F'); doc.triangle(x, y + h * 1.15, x + h * 1.15, y, x - h * 1.15, y, 'F')
  } else {
    trazo(doc, [140, 128, 128]); doc.setLineWidth(0.35)
    if (k === SIN_META) doc.rect(x - h * 0.85, y - h * 0.85, t * 0.85, t * 0.85, 'S')
    else doc.circle(x, y, h * 0.85, 'S')
  }
}

// Conteos en el orden de ESTADOS.
const conteosDe = d => [...d.sem, d.sinMeta, d.sinDato]

// Barra apilada del semáforo; con `numeros`, la cifra dentro de cada tramo.
function barraSem(doc, x, y, w, h, conteos, numeros = false) {
  const total = conteos.reduce((s, v) => s + v, 0)
  if (!total) { relleno(doc, GRIS_DATO); doc.rect(x, y, w, h, 'F'); return }
  let xx = x
  conteos.forEach((v, i) => {
    if (!v) return
    const ww = w * v / total
    relleno(doc, ESTADOS[i].c); doc.rect(xx, y, ww, h, 'F')
    if (xx > x) { relleno(doc, BLANCO); doc.rect(xx - 0.2, y, 0.4, h, 'F') }
    if (numeros && ww > 5) {
      fuente(doc, F.SANS, 'bold', 8.5, i < 4 ? BLANCO : TINTA)
      doc.text(String(v), xx + ww / 2, y + h / 2 + 1.1, { align: 'center' })
    }
    xx += ww
  })
}

function leyendaSem(doc, x, y, ancho, conteos) {
  const visibles = ESTADOS.map((e, i) => ({ ...e, v: conteos[i] })).filter((e, i) => i < 4 || e.v > 0)
  const cw = ancho / visibles.length
  visibles.forEach((e, i) => {
    const xx = x + i * cw
    marcaSem(doc, e.k, xx + 1.4, y - 1, 2.8)
    fuente(doc, F.SANS, 'normal', 8.5, TINTA); doc.text(e.l, xx + 4.6, y)
    const wl = doc.getTextWidth(e.l)
    fuente(doc, F.SANS, 'bold', 8.5, TINTA); doc.text(String(e.v), xx + 4.6 + wl + 1.6, y)
  })
}

const verdeDe = d => {
  const con = d.sem.reduce((s, v) => s + v, 0)
  return { con, verde: d.sem[0] + d.sem[1], txt: con ? `${Math.round((d.sem[0] + d.sem[1]) / con * 100)}%` : '—' }
}
const NOTA_ANEXO = '«En verde» es la suma de óptimo y adecuado entre los indicadores con resultado. «Sin meta» son indicadores que no tienen meta programada al corte, aunque reporten resultado: no se califican ni entran en los promedios. «Sin dato» son los que el área no ha reportado. El avance promedio es el resultado acumulado entre la meta acumulada.'

export function resumenEjecutivo(doc, ctx, { ejes, catalogo, pmdTotal, pmdConAvance, corteTexto }) {
  let y = nuevaPagina(doc, ctx, 'Anexo estadístico')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'Anexo estadístico', 'Indicadores de desempeño')
  fuente(doc, F.SANS, 'normal', 9.5, SUB)
  doc.text(`Indicadores del ejercicio ${corteTexto.anio}, con corte al ${corteTexto.largo}. Fuente: SIMA.`, ML, y - 3)
  y += 4

  const ds = ejes.map(e => datosEje(e, catalogo.find(c => c.codigo === e.codigo)))
  const tot = ds.reduce((t, d) => t.map((v, i) => v + conteosDe(d)[i]), [0, 0, 0, 0, 0, 0])
  const total = tot.reduce((s, v) => s + v, 0), con = tot[0] + tot[1] + tot[2] + tot[3], verde = tot[0] + tot[1]
  y = franjaCifras(doc, y, [
    [num(total), 'Indicadores de desempeño'],
    [`${con} de ${total}`, 'Con resultado al corte'],
    [con ? `${Math.round(verde / con * 100)}%` : '—', `En verde (${verde} de ${con})`],
    [`${pmdConAvance} de ${pmdTotal}`, 'Programas del Plan con avance'],
  ])

  fuente(doc, F.SERIF, 'normal', 15, TINTA)
  doc.text(`¿Cómo van los ${total} indicadores?`, ML, y)
  barraSem(doc, ML, y + 4, CW, 7, tot, true)
  leyendaSem(doc, ML, y + 17, CW, tot)
  y += 29

  fuente(doc, F.SERIF, 'normal', 15, TINTA)
  doc.text('Resultados por eje', ML, y)
  y += 6.5
  const xb = ML + 84, wb = 40, x1 = ML + 147, x2 = ML + 162, x3 = W - ML
  versalitas(doc, 'Eje', ML, y, { tam: 6.5, cs: 0.5 })
  versalitas(doc, 'Semáforo', xb, y, { tam: 6.5, cs: 0.5 })
  versalitas(doc, 'Con resultado', x1, y, { tam: 6.5, cs: 0.5, align: 'right' })
  versalitas(doc, 'En verde', x2, y, { tam: 6.5, cs: 0.5, align: 'right' })
  versalitas(doc, 'Avance', x3, y, { tam: 6.5, cs: 0.5, align: 'right' })
  trazo(doc, TINTA); doc.setLineWidth(0.4); doc.line(ML, y + 2, W - ML, y + 2)
  y += 2
  const filaH = 10.6
  ds.forEach(d => {
    const col = hexARgb(d.color), v = verdeDe(d)
    relleno(doc, col); doc.rect(ML, y + 3, 9, 4.6, 'F')
    versalitas(doc, d.cod, ML + 4.5, y + 6.2, { tam: 6, color: BLANCO, cs: 0.2, align: 'center' })
    const nl = lineas(doc, d.nombre, 70, F.SANS, 'normal', 8.5).slice(0, 2)
    fuente(doc, F.SANS, 'normal', 8.5, TINTA)
    nl.forEach((l, i) => doc.text(l, ML + 12, y + (nl.length > 1 ? 4.6 : 6.4) + i * 3.6))
    barraSem(doc, xb, y + 3.4, wb, 3.8, conteosDe(d))
    fuente(doc, F.SANS, 'normal', 8.5, TINTA)
    doc.text(`${v.con} de ${d.total}`, x1, y + 6.4, { align: 'right' })
    fuente(doc, F.SANS, 'bold', 8.5, TINTA)
    doc.text(v.txt, x2, y + 6.4, { align: 'right' })
    doc.text(pct(d.pct), x3, y + 6.4, { align: 'right' })
    y += filaH
    trazo(doc, LINEA); doc.setLineWidth(0.15); doc.line(ML, y, W - ML, y)
  })
  y += 5
  fuente(doc, F.SANS, 'normal', 7.5, SUB)
  doc.text(doc.splitTextToSize(NOTA_ANEXO, CW), ML, y)
  return page
}

// Tablas del semáforo: la marca va por forma y color, el rótulo en tinta.
const celdaSem = {
  didParseCell: (data, col) => {
    if (data.section === 'body' && data.column.index === col) { data.cell.styles.fontSize = 7; data.cell.styles.textColor = TINTA }
  },
  didDrawCell: (doc, data, col, claves) => {
    if (data.section === 'body' && data.column.index === col) marcaSem(doc, claves[data.row.index], data.cell.x + 3, data.cell.y + data.cell.height / 2, 2.4)
  },
}
const rotuloSem = k => ESTADOS.find(e => e.k === (k ?? null))?.l || 'Sin dato'

export function resultadosEje(doc, ctx, d, indicadores, pmdList) {
  const col = hexARgb(d.color)
  const seccion = `Anexo · ${d.corto}`
  let y = nuevaPagina(doc, ctx, seccion, col)
  y = apertura(doc, y + 4, `Anexo estadístico · ${d.kick}`, d.nombre, col, 24)
  const v = verdeDe(d)
  y = franjaCifras(doc, y, [
    [num(d.total), 'Indicadores'],
    [`${v.con} de ${d.total}`, 'Con resultado al corte'],
    [v.txt, `En verde (${v.verde} de ${v.con})`],
    [pct(d.pct), 'Avance promedio'],
  ], col)

  versalitas(doc, 'Semáforo', ML, y, { tam: 7, color: col, cs: 0.55 })
  barraSem(doc, ML, y + 3, CW, 6.5, conteosDe(d), true)
  leyendaSem(doc, ML, y + 15, CW, conteosDe(d))
  y += 26

  // Avance por área: todas las áreas del eje, en escala de 0 a 150 %. El
  // promedio solo cuenta indicadores con meta; la barra que rebasa la escala
  // lleva una marca de corte.
  const porArea = new Map()
  indicadores.forEach(i => {
    const r = porArea.get(i.area) || { res: 0, meta: 0, n: 0 }
    r.n++
    if (i.pct_cumplimiento != null) { r.res += i.resultado; r.meta += i.meta_evaluable }
    porArea.set(i.area, r)
  })
  const areas = [...porArea.entries()].map(([a, r]) => ({ a, v: r.meta > 0 ? r.res / r.meta : null }))
    .sort((p, q) => (q.v ?? -1) - (p.v ?? -1))
  if (areas.length) {
    versalitas(doc, 'Avance promedio por área', ML, y, { tam: 7, color: col, cs: 0.55 })
    const bx0 = ML + 62, bx1 = W - ML - 20, bmax = 1.5
    const bv = val => bx0 + Math.min(val, bmax) / bmax * (bx1 - bx0)
    fuente(doc, F.SANS, 'normal', 6.5, SUB); doc.text('100%', bv(1), y, { align: 'center' })
    y += 3
    const y0 = y
    areas.forEach(r => {
      fuente(doc, F.SANS, 'normal', 8, TINTA)
      const t = doc.splitTextToSize(r.a || '—', 58)
      doc.text(t[0] + (t.length > 1 ? '…' : ''), ML, y + 3.6)
      relleno(doc, [240, 234, 233]); doc.rect(bx0, y + 1, bx1 - bx0, 3.6, 'F')
      if (r.v != null) {
        relleno(doc, col); doc.rect(bx0, y + 1, Math.max(0.4, bv(r.v) - bx0), 3.6, 'F')
        if (r.v > bmax) { relleno(doc, BLANCO); [3.2, 1.8].forEach(k => doc.rect(bx1 - k, y + 0.6, 0.6, 4.4, 'F')) }
      }
      fuente(doc, F.SANS, 'bold', 8, r.v == null ? SUB : TINTA)
      doc.text(r.v == null ? 'sin meta o dato' : pct(r.v), bx1 + 1.8, y + 3.8)
      y += 6.6
    })
    trazo(doc, TINTA); doc.setLineWidth(0.25); doc.setLineDashPattern([0.8, 0.7], 0)
    doc.line(bv(1), y0 - 1, bv(1), y); doc.setLineDashPattern([], 0)
    y += 7
  }

  if (y + 40 > PIE) y = nuevaPagina(doc, ctx, seccion, col)
  fuente(doc, F.SERIF, 'normal', 15, TINTA)
  doc.text('Indicadores, metas y resultados', ML, y)
  const estilos = { font: F.SANS, fontSize: 7.3, cellPadding: { top: 1.7, bottom: 1.7, left: 1.8, right: 1.8 }, textColor: TINTA, lineColor: LINEA, lineWidth: { bottom: 0.15 }, valign: 'middle', overflow: 'linebreak' }
  const semInd = indicadores.map(i => i.semaforo ?? null)
  tabla(doc, ctx, seccion, col, {
    startY: y + 3.5,
    head: [['Clave', 'Indicador', 'Área', 'Meta', 'Resultado', 'Avance', 'Semáforo']],
    body: indicadores.map(i => [i.clave || '—', i.indicador || '—', i.area || '—', numDec(i.meta_evaluable), numDec(i.resultado), pct(i.pct_cumplimiento), rotuloSem(i.semaforo)]),
    styles: estilos,
    columnStyles: {
      0: { cellWidth: 23, textColor: SUB, fontSize: 6.5 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 27, textColor: SUB },
      3: { cellWidth: 14, halign: 'right' }, 4: { cellWidth: 16, halign: 'right' }, 5: { cellWidth: 15, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 21, cellPadding: { left: 6, right: 1.5, top: 1.7, bottom: 1.7 } },
    },
    didParseCell: data => {
      celdaSem.didParseCell(data, 6)
      if (data.section === 'body' && indicadores[data.row.index]?.pct_cumplimiento == null && data.column.index !== 6) data.cell.styles.textColor = SUB
    },
    didDrawCell: data => celdaSem.didDrawCell(doc, data, 6, semInd),
  })

  if (pmdList?.length) {
    let yy = doc.lastAutoTable.finalY + 11
    if (yy + 30 > PIE) yy = nuevaPagina(doc, ctx, seccion, col) + 4
    fuente(doc, F.SERIF, 'normal', 15, TINTA)
    doc.text('Programas del Plan Municipal de Desarrollo', ML, yy)
    const semPmd = pmdList.map(p => {
      const val = p.pct_promedio
      return val == null ? null : val >= 110 ? 'ÓPTIMO' : val >= 90 ? 'ADECUADO' : val >= 70 ? 'RIESGO' : 'CRÍTICO'
    })
    tabla(doc, ctx, seccion, col, {
      startY: yy + 3.5,
      head: [['#', 'Programa', 'Indicadores', 'Con resultado', 'Avance', 'Semáforo']],
      body: pmdList.map((p, i) => [i + 1, p.programa_nombre || '—', p.total_indicadores || 0, p.indicadores_con_avance || 0, pctPMD(p.pct_promedio), rotuloSem(semPmd[i])]),
      styles: { ...estilos, fontSize: 7.8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', textColor: SUB }, 1: { cellWidth: 'auto' },
        2: { cellWidth: 19, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 17, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 21, cellPadding: { left: 6, right: 1.5, top: 1.7, bottom: 1.7 } },
      },
      didParseCell: data => celdaSem.didParseCell(data, 5),
      didDrawCell: data => celdaSem.didDrawCell(doc, data, 5, semPmd),
    })
  }
}

// ── Logros del eje ───────────────────────────────────────────────────────────
// El Informe destaca logros: cada acción se publica con su cifra principal,
// lugar y pie de foto (fase_informe_05). Se agrupan por tema; las que aún no
// lo tienen, por programa del PMD. Las claves y niveles de la MIR no se
// imprimen aquí: van en el anexo estadístico.
const fechaLarga = f => f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const sinPunto = t => String(t || '').trim().replace(/\.$/, '')

// Reduce el cuerpo hasta que el texto quepa en `ancho`. Deja la fuente puesta.
function ajustar(doc, txt, fam, estilo, tam, ancho, min = 9) {
  let t = tam
  doc.setFont(fam, estilo); doc.setFontSize(t)
  while (t > min && doc.getTextWidth(String(txt)) > ancho) { t -= 0.5; doc.setFontSize(t) }
  return t
}

// Cifra principal del logro; si no se capturó, los beneficiarios (nunca cero).
function cifraDe(a) {
  if (a.cifra_valor) return { v: String(a.cifra_valor).trim(), l: a.cifra_etiqueta || '' }
  if (a.beneficiarios > 0) return { v: num(a.beneficiarios), l: 'personas beneficiadas' }
  return null
}
const inversionDe = a => a.monto != null && Number(a.monto) > 0 ? { v: pesos(a.monto), l: 'Inversión' } : null
const cifrasDe = a => [cifraDe(a), inversionDe(a)].filter(Boolean)
const metaAccion = a => [fechaLarga(a.fecha), a.lugar || a.area].filter(Boolean).join('  ·  ')
const pieDe = a => a.pie_foto || [a.area, fechaCorta(a.fecha)].filter(Boolean).join(' · ')

// `primero`: tema que va antes que los demás (el del logro que abre el eje).
function grupos(acciones, primero) {
  const m = new Map()
  acciones.forEach(a => {
    const k = a.tema ? `t:${a.tema}` : a.programa_pmd ? `p:${a.programa_pmd}` : ''
    if (!m.has(k)) {
      m.set(k, {
        nombre: a.tema || a.programa_pmd || 'Otros logros',
        etiqueta: a.tema ? null : a.programa_pmd ? 'Programa del Plan Municipal de Desarrollo' : null,
        orden: a.tema ? (a.tema === primero ? -1 : 0) : a.programa_pmd ? 1000 + (a.programa_pmd_numero ?? 0) : 9999, filas: [],
      })
    }
    m.get(k).filas.push(a)
  })
  const lista = [...m.values()].map(g => ({ ...g, filas: g.filas.sort((x, y) => (x.fecha || '').localeCompare(y.fecha || '')) }))
  return lista.sort((x, y) => x.orden - y.orden || (x.filas[0].fecha || '').localeCompare(y.filas[0].fecha || ''))
}

// Máximo de fotos que el Informe publica por acción: con dos se ven grandes.
export const FOTOS_INFORME = 2

// Diagrama vectorial de la acción (columna informe_acciones.diagrama).
const diagramaDe = a => diagramaValido(a.diagrama) ? a.diagrama : null

// Renglones de cifras (valor grande + etiqueta) repartidos en `ancho`.
function dibujarCifras(doc, cifras, x, y, ancho, col, tam = 18) {
  const cw = ancho / Math.max(2, cifras.length)
  cifras.forEach((c, i) => {
    const xx = x + i * cw
    ajustar(doc, c.v, F.LIGHT, 'normal', tam, cw - 4)
    doc.setTextColor(col[0], col[1], col[2]); doc.text(c.v, xx, y + 8)
    lineasVersalitas(doc, c.l, cw - 4, 5.8, 0.6).slice(0, 2)
      .forEach((t, k) => versalitas(doc, t, xx, y + 12 + k * 2.7, { tam: 5.8, cs: 0.6 }))
  })
}
const ALTO_CIFRAS = 18

// Medidas del bloque destacado; las usa también el salto de página del grupo.
// Con diagrama: texto a lo ancho y debajo el diagrama grande con las fotos al
// costado (a media columna sus rótulos no se leían impresos). Sin diagrama:
// fotos a un lado y texto al otro.
function medidasBloque(doc, a, fotos) {
  const cifras = cifrasDe(a)
  const dg = diagramaDe(a)
  const lhT = altoLinea(11.5, 1.2), lhM = altoLinea(7.5, 1.35), lhD = altoLinea(9, 1.42)
  if (dg) {
    // Título a lo ancho; debajo, el diagrama a la izquierda y el texto, las
    // cifras y las fotos (en miniatura) en una columna a su derecha. Así caben
    // dos logros con diagrama por página.
    const dw = 104, dh = dw / DIAGRAMA_RATIO, cw = CW - dw - 6
    // Una sola foto va al ancho de la columna de texto; dos, en miniatura.
    const lhC = altoLinea(8.8, 1.4), fhF = fotos.length === 1 ? cw * 0.45 : fotos.length ? 22.5 : 0
    const tTit = lineas(doc, sinPunto(a.accion), CW, F.SANS, 'bold', 11.5)
    const tDesc = lineas(doc, a.descripcion, cw, F.SANS, 'normal', 8.8)
    const tPie = lineas(doc, pieDe(a), dw, F.SERIF, 'italic', 8.5).slice(0, 1)
    const altoTit = tTit.length * lhT + 1.5
    const altoCol = lhM + 2 + tDesc.length * lhC + (cifras.length ? ALTO_CIFRAS + 2 : 0) + (fhF ? fhF + 2.5 : 0)
    return { ancho: true, tTit, tDesc, tPie, lhT, lhM, lhC, cifras, dw, dh, cw, fhF, altoTit, alto: altoTit + Math.max(dh + 5, altoCol) }
  }
  // Con una sola foto, la foto y el párrafo tienen el mismo ancho.
  const pw = fotos.length === 1 ? (CW - 7) / 2 : CW * 0.44, tw = CW - pw - 7
  const fh = fotos.length >= 2 ? pw * 0.47 : pw * 0.66
  const mh = fotos.length * fh + (fotos.length - 1) * 2.5
  const tTit = lineas(doc, sinPunto(a.accion), tw, F.SANS, 'bold', 11.5)
  const tDesc = lineas(doc, a.descripcion, tw, F.SANS, 'normal', 9)
  const tPie = lineas(doc, pieDe(a), pw, F.SERIF, 'italic', 8.5).slice(0, 3)
  const altoTexto = tTit.length * lhT + 0.5 + lhM + 2.5 + tDesc.length * lhD + (cifras.length ? ALTO_CIFRAS + 2 : 0)
  return { ancho: false, pw, tw, fh, mh, tTit, tDesc, tPie, lhT, lhM, lhD, cifras, alto: Math.max(mh + 2 + tPie.length * 3.6, altoTexto) }
}

function textoBloque(doc, a, m, x, y, col) {
  let yt = y + m.lhT * 0.8
  fuente(doc, F.SANS, 'bold', 11.5, TINTA)
  m.tTit.forEach(l => { doc.text(l, x, yt); yt += m.lhT })
  yt += 0.5
  fuente(doc, F.SANS, 'normal', 7.5, col)
  doc.text(doc.splitTextToSize(metaAccion(a), m.tw)[0] || '', x, yt); yt += m.lhM
  yt += 2.5
  fuente(doc, F.SANS, 'normal', 9, [58, 46, 48])
  m.tDesc.forEach((l, i) => { renglon(doc, l, x, yt, m.tw, i < m.tDesc.length - 1); yt += m.lhD })
  if (m.cifras.length) {
    yt += 1
    trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(x, yt, x + m.tw, yt)
    dibujarCifras(doc, m.cifras, x, yt, m.tw, col)
  }
}

function pieFoto(doc, lineasPie, x, y) {
  fuente(doc, F.SERIF, 'italic', 8.5, SUB)
  lineasPie.forEach((l, i) => doc.text(l, x, y + i * 3.6))
}

async function bloqueDestacado(doc, ctx, a, fotos, y, lado, col, seccion) {
  const m = medidasBloque(doc, a, fotos)
  if (y + m.alto > PIE) y = nuevaPagina(doc, ctx, seccion, col)

  if (m.ancho) {
    let yt = y + m.lhT * 0.8
    fuente(doc, F.SANS, 'bold', 11.5, TINTA)
    m.tTit.forEach(l => { doc.text(l, ML, yt); yt += m.lhT })
    const yc = y + m.altoTit
    await dibujarDiagrama(doc, diagramaDe(a), ML, yc, m.dw, m.dh)
    pieFoto(doc, m.tPie, ML, yc + m.dh + 4)
    const cx = ML + m.dw + 6
    yt = yc + m.lhM * 0.8
    fuente(doc, F.SANS, 'normal', 7.5, col)
    doc.text(doc.splitTextToSize(metaAccion(a), m.cw)[0] || '', cx, yt)
    yt += m.lhM * 0.2 + 2 + m.lhC * 0.8
    fuente(doc, F.SANS, 'normal', 8.8, [58, 46, 48])
    m.tDesc.forEach((l, i) => { renglon(doc, l, cx, yt, m.cw, i < m.tDesc.length - 1); yt += m.lhC })
    yt -= m.lhC * 0.8
    if (m.cifras.length) {
      yt += 1
      trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(cx, yt, cx + m.cw, yt)
      dibujarCifras(doc, m.cifras, cx, yt, m.cw, col, 16)
      yt += ALTO_CIFRAS + 1
    }
    if (m.fhF) {
      const fw = fotos.length >= 2 ? (m.cw - 2.5) / 2 : m.cw
      fotos.forEach((f, i) => doc.addImage(recortarFoto(f.bmp, fw / m.fhF), 'JPEG', cx + i * (fw + 2.5), yt + 2.5, fw, m.fhF, undefined, 'FAST'))
    }
    return y + m.alto + 9
  }

  const px = lado === 'izq' ? ML : ML + m.tw + 7
  const tx = lado === 'izq' ? ML + m.pw + 7 : ML
  fotos.forEach((f, i) => {
    doc.addImage(recortarFoto(f.bmp, m.pw / m.fh), 'JPEG', px, y + i * (m.fh + 2.5), m.pw, m.fh, undefined, 'FAST')
  })
  pieFoto(doc, m.tPie, px, y + m.mh + 4.2)
  textoBloque(doc, a, m, tx, y, col)
  return y + m.alto + 9
}

function renglonAccion(doc, ctx, a, y, col, seccion) {
  const cx = ML + 30, cw = CW - 30
  const tTit = lineas(doc, sinPunto(a.accion), cw, F.SANS, 'bold', 9.5)
  const tDesc = lineas(doc, a.descripcion, cw, F.SANS, 'normal', 8.5)
  const inv = inversionDe(a), ci = cifraDe(a)
  const extras = [a.lugar || a.area, ci && `${ci.v} ${ci.l}`.trim(), inv && `Inversión: ${inv.v}`].filter(Boolean).join('  ·  ')
  const tMeta = lineas(doc, extras, cw, F.SANS, 'normal', 7.5)
  const lhT = altoLinea(9.5, 1.25), lhD = altoLinea(8.5, 1.4), lhM = altoLinea(7.5, 1.35)
  const alto = tTit.length * lhT + 1 + tDesc.length * lhD + 1.5 + tMeta.length * lhM + 4
  if (y + alto > PIE) y = nuevaPagina(doc, ctx, seccion, col)
  fuente(doc, F.SANS, 'bold', 7.5, SUB)
  doc.text(fechaCorta(a.fecha), ML, y + lhT * 0.8)
  let yy = y + lhT * 0.8
  fuente(doc, F.SANS, 'bold', 9.5, TINTA); tTit.forEach(l => { doc.text(l, cx, yy); yy += lhT })
  yy += 0.6
  fuente(doc, F.SANS, 'normal', 8.5, [70, 58, 60]); tDesc.forEach((l, i) => { renglon(doc, l, cx, yy, cw, i < tDesc.length - 1); yy += lhD })
  yy += 1
  fuente(doc, F.SANS, 'normal', 7.5, col); tMeta.forEach(l => { doc.text(l, cx, yy); yy += lhM })
  trazo(doc, LINEA); doc.setLineWidth(0.2); doc.setLineDashPattern([0.4, 0.9], 0)
  doc.line(ML, y + alto - 1.5, W - ML, y + alto - 1.5); doc.setLineDashPattern([], 0)
  return y + alto + 2
}

// Apertura del capítulo: el logro que Planeación marcó para abrir el eje, con
// su foto o diagrama, y al costado las cifras de resultado del eje.
async function aperturaLogros(doc, ctx, d, a, fotos, acciones) {
  const col = hexARgb(d.color), seccion = `${d.corto} · Logros`
  let y = nuevaPagina(doc, ctx, seccion, col)
  y = apertura(doc, y + 4, `${d.kick} · ${d.nombre}`, sinPunto(a.accion), col, 25)
  const mw = 118, sx = ML + mw + 8, sw = W - ML - sx
  const invA = inversionDe(a)
  fuente(doc, F.SANS, 'normal', 8, col)
  doc.text([metaAccion(a), invA && `Inversión: ${invA.v}`].filter(Boolean).join('  ·  '), ML, y - 3.5)
  const yTop = y

  const dg = diagramaDe(a)
  if (dg) {
    const h = mw / DIAGRAMA_RATIO
    await dibujarDiagrama(doc, dg, ML, y, mw, h); y += h
  } else if (fotos[0]) {
    const h = mw * 0.56
    doc.addImage(recortarFoto(fotos[0].bmp, mw / h), 'JPEG', ML, y, mw, h, undefined, 'FAST'); y += h
  }
  if (dg || fotos[0]) {
    const tPie = lineas(doc, pieDe(a), mw, F.SERIF, 'italic', 8.5).slice(0, 2)
    pieFoto(doc, tPie, ML, y + 4.2); y += 4 + tPie.length * 3.6 + 4
  }
  const lh = altoLinea(10.5, 1.45)
  String(a.descripcion || '').split(/\n+/).filter(p => p.trim()).forEach(p => {
    const ls = lineas(doc, p.trim(), mw, F.SANS, 'normal', 10.5)
    ls.forEach((l, i) => {
      if (y > PIE - 4) y = nuevaPagina(doc, ctx, seccion, col)
      fuente(doc, F.SANS, 'normal', 10.5, [58, 46, 48])
      renglon(doc, l, ML, y, mw, i < ls.length - 1); y += lh
    })
    y += 3
  })

  // Columna lateral: cifras de los logros del eje (primero la de este logro).
  const otras = acciones.filter(x => x !== a && x.cifra_valor)
    .sort((p, q) => (q.destacado_informe ? 1 : 0) - (p.destacado_informe ? 1 : 0))
  const cifras = [a, ...otras].map(cifraDe).filter(Boolean).slice(0, 4)
  const montoEje = acciones.reduce((t, x) => t + (Number(x.monto) || 0), 0)
  if (montoEje > 0) cifras.push({ v: pesos(montoEje), l: 'Inversión reportada en el eje' })
  let ys = yTop
  if (cifras.length) {
    versalitas(doc, 'Resultados del eje', sx, ys + 2.5, { tam: 7, color: col, cs: 0.55 })
    ys += 6
    cifras.forEach((c, i) => {
      if (i) { trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(sx, ys, sx + sw, ys) }
      ajustar(doc, c.v, F.LIGHT, 'normal', 22, sw)
      doc.setTextColor(col[0], col[1], col[2]); doc.text(c.v, sx, ys + 10)
      const et = lineasVersalitas(doc, c.l, sw, 6.2, 0.5).slice(0, 3)
      et.forEach((t, k) => versalitas(doc, t, sx, ys + 14.5 + k * 3, { tam: 6.2, cs: 0.5 }))
      ys += 15 + et.length * 3 + 3
    })
  }
  if (!dg && fotos[1] && ys + sw * 0.75 < PIE) {
    doc.addImage(recortarFoto(fotos[1].bmp, 4 / 3), 'JPEG', sx, ys + 2, sw, sw * 0.75, undefined, 'FAST'); ys += sw * 0.75 + 4
  }
  if (cifras.length) { trazo(doc, LINEA); doc.setLineWidth(0.25); doc.line(sx - 4, yTop, sx - 4, Math.max(ys, yTop + 40)) }
  return Math.max(y, ys) + 6
}

// Capítulo de logros de un eje. Devuelve la página donde empieza.
export async function logrosEje(doc, ctx, d, acciones, fotosPorAccion) {
  const col = hexARgb(d.color)
  const seccion = `${d.corto} · Logros`
  const fotosDe = a => (fotosPorAccion.get(a.id) || []).slice(0, FOTOS_INFORME)
  const destacada = a => fotosDe(a).length > 0 || !!diagramaDe(a)
  const principal = acciones.find(a => a.destacado_eje)
  const resto = acciones.filter(a => a !== principal)
  let y

  if (principal) {
    y = await aperturaLogros(doc, ctx, d, principal, fotosDe(principal), acciones)
    if (resto.length && y + 60 > PIE) y = nuevaPagina(doc, ctx, seccion, col)
  } else {
    y = nuevaPagina(doc, ctx, seccion, col)
    y = apertura(doc, y + 4, `${d.kick} · ${d.nombre}`, 'Logros', col, 26)
    const monto = acciones.reduce((s, a) => s + (Number(a.monto) || 0), 0)
    const areas = new Set(acciones.map(a => a.area_id ?? a.area)).size
    const conFoto = acciones.filter(a => fotosPorAccion.get(a.id)?.length).length
    y = franjaCifras(doc, y, [
      [num(acciones.length), acciones.length === 1 ? 'Logro del periodo' : 'Logros del periodo'],
      [num(areas), areas === 1 ? 'Área participante' : 'Áreas participantes'],
      monto > 0 && [pesos(monto), 'Inversión reportada'],
      conFoto > 0 && [num(conFoto), 'Con evidencia fotográfica'],
    ].filter(Boolean), col)
  }

  let lado = 'izq'
  for (const g of grupos(resto, principal?.tema)) {
    // El título del grupo no se queda solo al pie: debe caber con su primer logro.
    const a0 = g.filas[0]
    const minimo = destacada(a0) ? medidasBloque(doc, a0, fotosDe(a0)).alto + 18 : 34
    if (y + minimo > PIE) y = nuevaPagina(doc, ctx, seccion, col)
    if (g.etiqueta) { versalitas(doc, g.etiqueta, ML, y, { tam: 6.8, color: col, cs: 0.55 }); y += 6.5 } else y += 4.5
    const tt = lineas(doc, g.nombre, CW, F.SERIF, 'normal', 15)
    fuente(doc, F.SERIF, 'normal', 15, TINTA)
    tt.forEach((l, i) => doc.text(l, ML, y + i * altoLinea(15, 1.1)))
    y += (tt.length - 1) * altoLinea(15, 1.1) + 2.5
    trazo(doc, col); doc.setLineWidth(0.35); doc.line(ML, y, W - ML, y)
    y += 7
    for (const a of g.filas) {
      if (destacada(a)) {
        y = await bloqueDestacado(doc, ctx, a, fotosDe(a), y, lado, col, seccion)
        if (!diagramaDe(a)) lado = lado === 'izq' ? 'der' : 'izq'
      } else {
        y = renglonAccion(doc, ctx, a, y, col, seccion)
      }
    }
    y += 4
  }
}

// ── Los logros del año ───────────────────────────────────────────────────────
// Página inicial con los logros que Planeación marcó ("Va en los logros del
// año"): uno principal a todo el ancho y hasta nueve en mosaico. El principal
// es el primero que además abre su eje; si ninguno, el primero por eje y fecha.
export const MAX_LOGROS_INFORME = 10
const NUM_LETRA = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']

export function logrosDelAnio(acciones, ordenEje = {}) {
  const ord = a => ordenEje[a.eje_codigo] ?? 99
  const sel = acciones.filter(a => a.destacado_informe)
    .sort((x, y) => ord(x) - ord(y) || (x.fecha || '').localeCompare(y.fecha || ''))
  const principal = sel.find(a => a.destacado_eje && cifraDe(a)) || sel.find(a => cifraDe(a)) || sel[0]
  return principal ? [principal, ...sel.filter(a => a !== principal)].slice(0, MAX_LOGROS_INFORME) : []
}

export function diezLogros(doc, ctx, logros, ejesDatos) {
  const titulo = logros.length >= 2 ? `El segundo año en ${NUM_LETRA[logros.length]} logros` : 'El logro del año'
  let y = nuevaPagina(doc, ctx, titulo)
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, PERIODO_LARGO, titulo) - 3
  const [h, ...resto] = logros

  const hh = 34, c = cifraDe(h)
  relleno(doc, GUINDA); doc.rect(ML, y, CW, hh, 'F')
  relleno(doc, DORADO); doc.rect(ML, y, 1.6, hh, 'F')
  let tx = ML + 9
  if (c) {
    ajustar(doc, c.v, F.SERIF, 'normal', 34, 64, 16)
    doc.setTextColor(255, 255, 255); doc.text(c.v, ML + 9, y + 18)
    lineasVersalitas(doc, c.l, 64, 6.5, 0.5).slice(0, 2)
      .forEach((t, k) => versalitas(doc, t, ML + 9, y + 24 + k * 3, { tam: 6.5, color: DORADO_CLARO, cs: 0.5 }))
    tx = ML + 82
  }
  const tw = W - ML - 8 - tx, lhH = altoLinea(11, 1.4)
  const tl = lineas(doc, sinPunto(h.accion), tw, F.SANS, 'normal', 11).slice(0, 4)
  fuente(doc, F.SANS, 'normal', 11, BLANCO)
  const invH = inversionDe(h), altoT = tl.length * lhH + (invH ? 4.5 : 0)
  const y0 = y + (hh - altoT) / 2 + lhH * 0.72
  tl.forEach((l, i) => doc.text(l, tx, y0 + i * lhH))
  if (invH) versalitas(doc, `Inversión: ${invH.v}`, tx, y0 + tl.length * lhH + 0.6, { tam: 6.5, color: DORADO_CLARO, cs: 0.5 })
  y += hh + 5

  const gap = 4, cw = (CW - gap * 2) / 3, th = 46, pad = 4.5
  resto.forEach((a, i) => {
    const x = ML + (i % 3) * (cw + gap), yy = y + Math.floor(i / 3) * (th + gap)
    const e = ejesDatos[a.eje_codigo], col = hexARgb(e?.color || '#7B1F2C')
    relleno(doc, ALT); doc.rect(x, yy, cw, th, 'F')
    relleno(doc, col); doc.rect(x, yy, cw, 0.9, 'F')
    const ci = cifraDe(a)
    let ty = yy + 13.5
    if (ci) {
      ajustar(doc, ci.v, F.LIGHT, 'normal', 26, cw - pad * 2, 12)
      doc.setTextColor(col[0], col[1], col[2]); doc.text(ci.v, x + pad, ty)
      ty += 5.5
      const et = lineas(doc, ci.l, cw - pad * 2, F.SANS, 'bold', 9.5).slice(0, 2)
      fuente(doc, F.SANS, 'bold', 9.5, TINTA)
      et.forEach(l => { doc.text(l, x + pad, ty); ty += altoLinea(9.5, 1.2) })
      ty += 1
      const ds = lineas(doc, sinPunto(a.accion), cw - pad * 2, F.SANS, 'normal', 8.3)
      const max = 4 - et.length
      fuente(doc, F.SANS, 'normal', 8.3, SUB)
      ds.slice(0, max).forEach((l, k) => { doc.text(k === max - 1 && ds.length > max ? l.replace(/[\s,;:.]*$/, '…') : l, x + pad, ty); ty += altoLinea(8.3, 1.3) })
    } else {
      const ds = lineas(doc, sinPunto(a.accion), cw - pad * 2, F.SANS, 'bold', 10.5)
      fuente(doc, F.SANS, 'bold', 10.5, TINTA)
      ds.slice(0, 5).forEach((l, k) => doc.text(k === 4 && ds.length > 5 ? l.replace(/[\s,;:.]*$/, '…') : l, x + pad, yy + 9.5 + k * altoLinea(10.5, 1.25)))
    }
    const inv = inversionDe(a)
    let wInv = 0
    if (inv) {
      fuente(doc, F.SANS, 'bold', 7, SUB)
      wInv = doc.getTextWidth(inv.v) + 3
      doc.text(inv.v, x + cw - pad, yy + th - 4, { align: 'right' })
    }
    if (e) {
      const ne = lineasVersalitas(doc, e.nombre, cw - pad * 2 - 2 - wInv, 5.8, 0.5)
      versalitas(doc, ne.length > 1 ? e.kick : ne[0] || '', x + pad, yy + th - 4, { tam: 5.8, color: col, cs: 0.5 })
    }
  })
  return page
}

// ── Nota metodológica y glosario (anexo) ─────────────────────────────────────
export function notaMetodologica(doc, ctx, corteLargo) {
  let y = nuevaPagina(doc, ctx, 'Anexo estadístico')
  const page = doc.getNumberOfPages()
  y = apertura(doc, y + 4, 'Anexo estadístico', 'Cómo se midieron los resultados')
  const cw = (CW - 10) / 2, x2 = ML + cw + 10, lh = altoLinea(9.5, 1.45)
  fuente(doc, F.SERIF, 'normal', 15, TINTA)
  doc.text('Nota metodológica', ML, y); doc.text('Glosario', x2, y)
  let y1 = y + 7
  NOTA_METODOLOGICA.forEach(p => {
    const ls = lineas(doc, p.replace('{corte}', corteLargo), cw, F.SANS, 'normal', 9.5)
    fuente(doc, F.SANS, 'normal', 9.5, [58, 46, 48])
    ls.forEach((l, i) => { renglon(doc, l, ML, y1, cw, i < ls.length - 1); y1 += lh })
    y1 += 3
  })
  let y2 = y + 7
  GLOSARIO.forEach(([t, d]) => {
    const tt = lineas(doc, t, cw, F.SANS, 'bold', 9.5)
    fuente(doc, F.SANS, 'bold', 9.5, TINTA)
    tt.forEach(l => { doc.text(l, x2, y2); y2 += lh })
    const ls = lineas(doc, d, cw, F.SANS, 'normal', 9.5)
    fuente(doc, F.SANS, 'normal', 9.5, [70, 58, 60])
    ls.forEach(l => { doc.text(l, x2, y2); y2 += lh })
    y2 += 3
  })
  return page
}

// ── Colofón y contraportada ──────────────────────────────────────────────────
export function colofon(doc, ctx, { corteLargo, nLogros }) {
  nuevaPagina(doc, ctx, 'Colofón')
  const cx = W / 2, eh = 26, ew = eh * RATIO.escudo
  let y = 150
  doc.addImage(ctx.imgs.escudoGuinda.data, 'PNG', cx - ew / 2, y, ew, eh, 'escudoGuinda', 'SLOW')
  y += eh + 9
  fuente(doc, F.SERIF, 'normal', 15, TINTA)
  doc.text('Segundo Informe de Gobierno', cx, y, { align: 'center' })
  versalitas(doc, 'H. Ayuntamiento de Apizaco, Tlaxcala · Administración 2024 – 2027', cx, y + 6, { tam: 6.8, color: GUINDA, cs: 0.55, align: 'center' })
  relleno(doc, DORADO); doc.rect(cx - 11, y + 11, 22, 0.6, 'F')
  y += 19
  const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  const texto = [
    nLogros > 0 && `Este documento reúne ${nLogros === 1 ? 'un logro' : `${nLogros} logros`} del periodo comprendido entre el ${PERIODO_LARGO.replace(' – ', ' y el ')}, reportados por las áreas municipales con su evidencia.`,
    `Los indicadores de desempeño corresponden al ejercicio y tienen corte al ${corteLargo}.`,
    'Integración: Dirección de Planeación y Evaluación, con información registrada en el Sistema de Información Municipal de Avance (SIMA).',
    `Apizaco, Tlaxcala. Generado el ${hoy}.`,
  ].filter(Boolean)
  fuente(doc, F.SANS, 'normal', 9, SUB)
  texto.forEach(t => {
    const ls = doc.splitTextToSize(t, 120)
    doc.text(ls, cx, y, { align: 'center' }); y += ls.length * altoLinea(9, 1.45) + 2.5
  })
}

export async function contraportada(doc, ctx) {
  doc.addPage('letter', 'portrait')
  ctx.portadas.add(doc.getNumberOfPages())
  doc.addImage(await artePortadaPrincipal(), 'JPEG', 0, 0, W, H, 'artePortada', 'FAST')
  marco(doc, DORADO, 10, 0.3)
  const eh = 58, ew = eh * RATIO.escudo
  doc.addImage(ctx.imgs.escudoDorado.data, 'PNG', (W - ew) / 2, 92, ew, eh, 'escudoDorado', 'SLOW')
  versalitas(doc, 'H. Ayuntamiento de Apizaco, Tlaxcala', W / 2, 166, { tam: 8.5, color: DORADO_CLARO, cs: 0.55, align: 'center' })
  versalitas(doc, 'Administración 2024 – 2027', W / 2, 171.5, { tam: 7, color: [226, 196, 202], cs: 0.8, align: 'center', estilo: 'normal' })
  const lh = 17
  doc.addImage(ctx.imgs.logoBlanco.data, 'PNG', (W - lh * RATIO.logo) / 2, 236, lh * RATIO.logo, lh, 'logoBlanco', 'FAST')
}

// ── Pie de página (todas menos las portadas) ─────────────────────────────────
export function pies(doc, ctx, textoCentro) {
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    if (ctx.portadas.has(p)) continue
    doc.setPage(p)
    trazo(doc, LINEA); doc.setLineWidth(0.2); doc.line(ML, H - 13, W - ML, H - 13)
    versalitas(doc, 'H. Ayuntamiento de Apizaco · 2024 – 2027', ML, H - 8.5, { tam: 5.8, cs: 0.6, estilo: 'normal' })
    fuente(doc, F.SANS, 'normal', 5.8, [160, 150, 150])
    doc.text(textoCentro, W / 2, H - 8.5, { align: 'center' })
    fuente(doc, F.SANS, 'bold', 8.5, GUINDA)
    doc.text(String(p), W - ML, H - 8.3, { align: 'right' })
  }
}

export { matiz }
