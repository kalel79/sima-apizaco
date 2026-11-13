// ── Diagramas vectoriales de las acciones del Informe ────────────────────────
// Cada plantilla arma un SVG (lienzo 870 × 630, ≈ 10 unidades por mm en la
// celda del bloque destacado) que svg2pdf dibuja dentro del PDF como gráfico
// vectorial: nítido a cualquier zoom e impresión, con las mismas tipografías
// registradas en jsPDF (Sans, SansLight y Cormorant). Los datos vienen de
// DIAGRAMAS_ACCIONES (informeGobiernoContenido.js) o de `accion.diagrama`.
import { svg2pdf } from 'svg2pdf.js'
import { F_SVG_SERIF } from './recursos.js'

export const DIAGRAMA_W = 870, DIAGRAMA_H = 630
export const DIAGRAMA_RATIO = DIAGRAMA_W / DIAGRAMA_H

const C = {
  g: '#7B1F2C', gd: '#51141D', gm: '#A52A3A', d: '#C8A96E', dd: '#9C7A3C', dl: '#E2C998',
  t: '#241A1C', s: '#6B5E60', l: '#E4DCDA', p: '#FBF8F5', b: '#FFFFFF', anillo: '#EDE5E2',
  sem: { optimo: '#046205', adecuado: '#00A04A', riesgo: '#E8A800', critico: '#C00000' },
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const num = n => typeof n === 'number' ? n.toLocaleString('es-MX') : esc(n)
const pct = v => `${Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 })}%`

// Texto: varias líneas separadas por \n, con interlineado `lh` (en unidades).
function tx(x, y, txt, { s = 20, w = 'normal', f = 'Sans', c = C.t, a = 'start', lh = 1.22 } = {}) {
  return String(txt ?? '').split('\n').map((l, i) =>
    `<text x="${x}" y="${y + i * s * lh}" font-family="${f}" font-weight="${w}" font-size="${s}" fill="${c}" text-anchor="${a}">${esc(l)}</text>`).join('')
}
const caja = (x, y, w, h, { fill = C.b, stroke = C.l, sw = 2, r = 14 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`

// Arco de anillo desde las 12 en sentido horario (0 < p < 100).
function arco(cx, cy, r, p) {
  const a = (-90 + 360 * p / 100) * Math.PI / 180
  const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a)
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${p > 50 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`
}
function anillo(cx, cy, r, valor, etiqueta) {
  const p = Math.max(0, Math.min(100, Number(valor)))
  const prog = p >= 100
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.g}" stroke-width="26"/>`
    : `<path d="${arco(cx, cy, r, p)}" fill="none" stroke="${C.g}" stroke-width="26" stroke-linecap="round"/>`
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.anillo}" stroke-width="26"/>${prog}
    <circle cx="${cx}" cy="${cy}" r="${r - 30}" fill="none" stroke="${C.d}" stroke-width="1.5" stroke-dasharray="2 7"/>
    ${tx(cx, cy + 12, pct(valor), { s: 44, w: 'bold', c: C.g, a: 'middle' })}
    ${tx(cx, cy + 42, String(etiqueta).toUpperCase(), { s: 14, w: 'bold', c: C.s, a: 'middle' })}`
}
const flecha = (x, y, w = 30) =>
  `<path d="M ${x} ${y} L ${x + w - 6} ${y} M ${x + w - 16} ${y - 10} L ${x + w - 4} ${y} L ${x + w - 16} ${y + 10}" fill="none" stroke="${C.d}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
const marcaSem = (k, x, y) => ({
  optimo: `<circle cx="${x}" cy="${y}" r="8" fill="${C.sem.optimo}"/>`,
  adecuado: `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="2" fill="${C.sem.adecuado}"/>`,
  riesgo: `<path d="M ${x} ${y - 9} L ${x + 9} ${y + 7} L ${x - 9} ${y + 7} Z" fill="${C.sem.riesgo}"/>`,
  critico: `<path d="M ${x} ${y - 9} L ${x + 9} ${y} L ${x} ${y + 9} L ${x - 9} ${y} Z" fill="${C.sem.critico}"/>`,
}[k])
const NOM_SEM = { optimo: 'Óptimo', adecuado: 'Adecuado', riesgo: 'Riesgo', critico: 'Crítico' }

// Marco común: fondo papel, filete guinda, encabezado y pie.
function marco(d, cuerpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DIAGRAMA_W}" height="${DIAGRAMA_H}" viewBox="0 0 ${DIAGRAMA_W} ${DIAGRAMA_H}">
  <defs>
    <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93283A"/><stop offset="1" stop-color="#4A111A"/></linearGradient>
    <linearGradient id="gGuinda" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#93283A"/><stop offset="1" stop-color="#5A1622"/></linearGradient>
    <radialGradient id="gHub" cx="0.38" cy="0.32" r="0.78"><stop offset="0" stop-color="#B3323F"/><stop offset="1" stop-color="#4A111A"/></radialGradient>
  </defs>
  <rect x="0" y="0" width="${DIAGRAMA_W}" height="${DIAGRAMA_H}" fill="${C.p}"/>
  <path d="M ${DIAGRAMA_W} 0 L ${DIAGRAMA_W - 250} 0 A 250 250 0 0 0 ${DIAGRAMA_W} 250 Z" fill="${C.d}" fill-opacity="0.10"/>
  <rect x="0" y="0" width="10" height="${DIAGRAMA_H}" fill="url(#gBar)"/>
  ${tx(44, 54, String(d.etiqueta || '').toUpperCase(), { s: 19, w: 'bold', c: C.dd })}
  ${tx(44, 100, d.titulo, { s: 40, f: F_SVG_SERIF, c: C.g })}
  <rect x="44" y="116" width="56" height="4" fill="${C.d}"/>
  ${cuerpo}
  <line x1="44" y1="584" x2="826" y2="584" stroke="${C.l}" stroke-width="1.5"/>
  ${tx(44, 611, String(d.pie || '').toUpperCase(), { s: 16, w: 'bold', c: C.s })}
  ${tx(826, 611, String(d.pie_der || '').toUpperCase(), { s: 16, w: 'bold', c: C.g, a: 'end' })}
</svg>`
}

// ── Plantillas ───────────────────────────────────────────────────────────────

// Índice de cumplimiento: anillo, tres cifras, semáforo y flujo de uso.
function indice(d) {
  const k = d.kpis.slice(0, 3)
  const cw = (516 - 24) / 3
  const kpis = k.map(([v, l], i) => {
    const x = 310 + i * (cw + 12), lleno = i === 0
    return caja(x, 146, cw, 116, lleno ? { fill: 'url(#gGuinda)', stroke: null } : {}) +
      tx(x + cw / 2, 210, num(v), { s: 52, w: 'bold', c: lleno ? C.b : C.g, a: 'middle' }) +
      tx(x + cw / 2, 240, l, { s: 16, w: 'bold', c: lleno ? C.dl : C.s, a: 'middle' })
  }).join('')
  const s = d.semaforo, tot = Object.values(s).reduce((a, b) => a + b, 0) || 1
  let bx = 334
  const barra = Object.entries(s).map(([key, v]) => {
    const w = 468 * v / tot, r = `<rect x="${bx.toFixed(2)}" y="314" width="${w.toFixed(2)}" height="24" fill="${C.sem[key]}"/>`
    bx += w; return r
  }).join('')
  const cols = Object.entries(s).map(([key, v], i) => {
    const x = 334 + i * 117
    return tx(x, 386, num(v), { s: 34, w: 'bold', c: C.sem[key] }) + marcaSem(key, x + 8, 410) + tx(x + 24, 416, NOM_SEM[key], { s: 16, w: 'bold' })
  }).join('')
  const f = d.flujo || []
  const pills = f.map((p, i) => {
    const x = 44 + i * 276, ult = i === f.length - 1
    return caja(x, 478, 236, 56, { fill: ult ? 'url(#gGuinda)' : C.b, stroke: ult ? null : C.g, sw: 2.5, r: 28 }) +
      tx(x + 118, 513, p, { s: 19, w: 'bold', c: ult ? C.b : C.g, a: 'middle' }) + (ult ? '' : flecha(x + 242, 506, 30))
  }).join('')
  return marco(d, `${anillo(165, 300, 98, d.valor, d.valor_etiqueta)}${kpis}
    ${caja(310, 276, 516, 172)}
    ${tx(334, 302, String(d.semaforo_titulo || 'Semáforo').toUpperCase(), { s: 14, w: 'bold', c: C.s })}
    ${barra}${cols}${pills}`)
}

// Plataforma: núcleo con cuatro cifras en las esquinas.
function plataforma(d) {
  const cx = 435, cy = 352
  const pos = [[44, 146], [596, 146], [44, 452], [596, 452]]
  const esq = [[274, 266], [596, 266], [274, 452], [596, 452]]
  const lineas = esq.map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.d}" stroke-width="3"/>`).join('')
  const nodos = d.nodos.slice(0, 4).map(([v, l], i) => {
    const [x, y] = pos[i], lleno = i >= 2
    return caja(x, y, 230, 120, lleno ? { fill: 'url(#gGuinda)', stroke: null } : {}) +
      tx(x + 115, y + 68, num(v), { s: 56, w: 'bold', c: lleno ? C.b : C.g, a: 'middle' }) +
      tx(x + 115, y + 100, l, { s: 18, w: 'bold', c: lleno ? C.dl : C.t, a: 'middle' })
  }).join('')
  return marco(d, `<circle cx="${cx}" cy="${cy}" r="168" fill="none" stroke="${C.d}" stroke-width="2.5" stroke-dasharray="3 10" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="124" fill="none" stroke="${C.l}" stroke-width="2"/>
    ${lineas}
    <circle cx="${cx}" cy="${cy}" r="98" fill="none" stroke="${C.d}" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="90" fill="url(#gHub)"/>
    ${tx(cx, cy + 12, d.centro, { s: 54, w: 'bold', c: C.b, a: 'middle' })}
    ${tx(cx, cy + 44, String(d.centro_sub || '').toUpperCase(), { s: 15, w: 'bold', c: C.dl, a: 'middle' })}
    ${nodos}`)
}

// Proceso: pasos numerados en vertical y dos cifras de resultado.
function proceso(d) {
  const n = d.pasos.length, h = 86, gap = (392 - n * h) / Math.max(1, n - 1)
  const pasos = d.pasos.map(([tit, sub], i) => {
    const y = 146 + i * (h + gap), ult = i === n - 1
    return caja(44, y, 512, h) +
      `<circle cx="92" cy="${y + h / 2}" r="26" fill="${ult ? C.d : C.g}"/>` +
      tx(92, y + h / 2 + 9, i + 1, { s: 26, w: 'bold', c: ult ? C.gd : C.b, a: 'middle' }) +
      tx(140, y + h / 2 - 4, tit, { s: 23, w: 'bold' }) + tx(140, y + h / 2 + 22, sub, { s: 16, c: C.s })
  }).join('')
  const [k1, k2] = d.kpis
  return marco(d, `<line x1="92" y1="${146 + h / 2}" x2="92" y2="${538 - h / 2}" stroke="${C.d}" stroke-width="3" stroke-dasharray="5 6"/>
    ${pasos}
    ${caja(586, 146, 240, 186, { fill: 'url(#gGuinda)', stroke: null, r: 16 })}
    ${tx(706, 252, num(k1[0]), { s: 72, w: 'bold', c: C.b, a: 'middle' })}
    ${tx(706, 292, k1[1], { s: 19, w: 'bold', c: C.dl, a: 'middle' })}
    ${caja(586, 352, 240, 186, { stroke: C.g, sw: 3, r: 16 })}
    ${tx(706, 458, num(k2[0]), { s: 72, w: 'bold', c: C.g, a: 'middle' })}
    ${tx(706, 498, k2[1], { s: 19, w: 'bold', c: C.s, a: 'middle' })}`)
}

// Productos: un origen de datos que alimenta varios entregables.
function productos(d) {
  const doc = (x, y) => `<path d="M ${x} ${y} L ${x + 24} ${y} L ${x + 34} ${y + 10} L ${x + 34} ${y + 42} L ${x} ${y + 42} Z" fill="${C.g}"/>
    <path d="M ${x + 24} ${y} L ${x + 24} ${y + 10} L ${x + 34} ${y + 10}" fill="${C.dl}"/>
    <rect x="${x + 7}" y="${y + 20}" width="20" height="3" fill="${C.b}"/><rect x="${x + 7}" y="${y + 28}" width="14" height="3" fill="${C.b}"/>`
  const items = d.productos.slice(0, 3).map(([tit, sub], i) => {
    const y = 146 + i * 104
    return caja(350, y, 476, 86) + doc(374, y + 22) + tx(432, y + 40, tit, { s: 23, w: 'bold' }) + tx(432, y + 66, sub, { s: 16, c: C.s })
  }).join('')
  const ley = Object.keys(NOM_SEM).map((k, i) => marcaSem(k, 60 + i * 150, 527) + tx(76 + i * 150, 533, NOM_SEM[k], { s: 18, w: 'bold' })).join('')
  const [v, l] = d.origen
  return marco(d, `${caja(44, 146, 236, 294, { fill: 'url(#gGuinda)', stroke: null, r: 16 })}
    ${tx(162, 290, num(v), { s: 96, w: 'bold', c: C.b, a: 'middle' })}
    ${tx(162, 340, l, { s: 20, w: 'bold', c: C.dl, a: 'middle' })}
    ${flecha(292, 293, 46)}
    ${items}
    ${tx(44, 488, String(d.leyenda || 'Semáforo de cumplimiento').toUpperCase(), { s: 14, w: 'bold', c: C.s })}
    ${ley}`)
}

// Cascada: niveles que se van concretando, de lo general a lo medible.
function cascada(d) {
  const fills = [C.gd, C.g, C.gm, C.d]
  const niveles = d.niveles.slice(0, 4).map(([v, l], i) => {
    const w = 782 * (1 - i * 0.1), x = 435 - w / 2, y = 146 + i * 92, oscuro = i < 3
    return caja(x, y, w, 64, { fill: fills[i], stroke: null, r: 12 }) +
      tx(x + 30, y + 46, num(v), { s: 42, w: 'bold', c: oscuro ? C.b : C.gd }) +
      tx(x + 150, y + 42, l, { s: 24, w: 'bold', c: oscuro ? C.b : C.gd }) +
      (i < 3 ? `<path d="M ${435 - 14} ${y + 72} L 435 ${y + 84} L ${435 + 14} ${y + 72}" fill="none" stroke="${C.d}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : '')
  }).join('')
  const ch = d.chips || [], cw = 150, gap = 14, x0 = 435 - (ch.length * cw + (ch.length - 1) * gap) / 2
  const chips = ch.map((c, i) => caja(x0 + i * (cw + gap), 524, cw, 40, { stroke: C.g, sw: 2, r: 20 }) +
    tx(x0 + i * (cw + gap) + cw / 2, 550, c, { s: 18, w: 'bold', c: C.g, a: 'middle' })).join('')
  return marco(d, niveles + chips)
}

// Ciclo: etapas alrededor de una cifra central.
function ciclo(d) {
  const cx = 435, cy = 352, r = 176, et = d.etapas.slice(0, 6), n = et.length
  const ang = i => (-90 + i * 360 / n) * Math.PI / 180
  const flechas = et.map((_, i) => {
    const a = ang(i + 0.5), x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), deg = (a * 180 / Math.PI) + 90
    return `<path d="M -11 -9 L 11 0 L -11 9 Z" fill="${C.d}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})"/>`
  }).join('')
  const pills = et.map((e, i) => {
    const x = cx + r * Math.cos(ang(i)), y = cy + r * Math.sin(ang(i)), w = 184
    const st = i === 0 ? { fill: C.gd, stroke: null } : i === n - 1 ? { fill: C.d, stroke: null } : { stroke: C.g, sw: 2.5 }
    const col = i === 0 ? C.b : i === n - 1 ? C.gd : C.g
    return caja(x - w / 2, y - 26, w, 52, { ...st, r: 26 }) + tx(x, y + 7, e, { s: 19, w: 'bold', c: col, a: 'middle' })
  }).join('')
  return marco(d, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.d}" stroke-width="5"/>${flechas}
    <circle cx="${cx}" cy="${cy}" r="72" fill="url(#gGuinda)"/>
    ${tx(cx, cy + 16, num(d.valor), { s: 70, w: 'bold', c: C.b, a: 'middle' })}
    ${tx(cx, cy + 44, d.valor_etiqueta, { s: 16, w: 'bold', c: C.dl, a: 'middle' })}
    ${pills}`)
}

// Metodología: pasos en rejilla y panel con el universo que cubre.
function metodologia(d) {
  const pasos = d.pasos.slice(0, 6).map((p, i) => {
    const x = 44 + (i % 2) * 262, y = 146 + Math.floor(i / 2) * 134, ult = i === 5
    return caja(x, y, 248, 120) +
      `<circle cx="${x + 38}" cy="${y + 38}" r="22" fill="${ult ? C.d : C.g}"/>` +
      tx(x + 38, y + 46, i + 1, { s: 22, w: 'bold', c: ult ? C.gd : C.b, a: 'middle' }) +
      tx(x + 20, y + 86, p, { s: 19, w: 'bold', lh: 1.18 })
  }).join('')
  const cl = d.claves || []
  const claves = cl.map((c, i) => {
    const x = 594 + (i % 3) * 72, y = 372 + Math.floor(i / 3) * 46
    return `<rect x="${x}" y="${y}" width="62" height="36" rx="8" ry="8" fill="${C.b}" fill-opacity="0.16"/>` +
      tx(x + 31, y + 25, c, { s: 18, w: 'bold', c: C.b, a: 'middle' })
  }).join('')
  return marco(d, `${pasos}
    ${caja(572, 146, 254, 388, { fill: 'url(#gGuinda)', stroke: null, r: 16 })}
    ${tx(699, 262, num(d.valor), { s: 104, w: 'bold', c: C.b, a: 'middle' })}
    ${tx(699, 300, d.valor_etiqueta, { s: 19, w: 'bold', c: C.dl, a: 'middle', lh: 1.25 })}
    ${claves}`)
}

// Reconocimiento: resultado, posición y lo evaluado.
function reconocimiento(d) {
  const m = d.lista || [], cw = (782 - 36) / 4
  const mods = m.slice(0, 8).map((t, i) => {
    const x = 44 + (i % 4) * (cw + 12), y = 470 + Math.floor(i / 4) * 54
    return caja(x, y, cw, 44, { r: 10 }) + tx(x + 16, y + 29, String(i + 1), { s: 16, w: 'bold', c: C.dd }) + tx(x + 38, y + 29, t, { s: 15.5, w: 'bold' })
  }).join('')
  const [b1, b2] = d.insignia
  return marco(d, `${anillo(165, 290, 98, d.valor, d.valor_etiqueta)}
    ${caja(310, 146, 516, 116, { fill: 'url(#gGuinda)', stroke: null, r: 16 })}
    ${tx(338, 222, b1, { s: 58, w: 'bold', c: C.b })}
    ${tx(802, 222, b2, { s: 21, w: 'bold', c: C.dl, a: 'end' })}
    ${caja(310, 278, 516, 112, { stroke: C.g, sw: 3, r: 16 })}
    ${tx(338, 330, d.organismo, { s: 40, w: 'bold', c: C.g })}
    ${tx(338, 364, d.organismo_sub, { s: 17, c: C.s })}
    ${tx(44, 454, String(d.lista_titulo || '').toUpperCase(), { s: 15, w: 'bold', c: C.s })}
    ${mods}`)
}

const PLANTILLAS = { indice, plataforma, proceso, productos, cascada, ciclo, metodologia, reconocimiento }

export const diagramaValido = spec => !!(spec && PLANTILLAS[spec.tipo])

export function svgDiagrama(spec) {
  return diagramaValido(spec) ? PLANTILLAS[spec.tipo](spec) : null
}

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
