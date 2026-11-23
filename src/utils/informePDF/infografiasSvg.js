// ── Infografías de logro del Informe (familia editorial) ─────────────────────
// Cada tipo responde a la forma de los datos del logro:
//   proporcion     parte de un total (matriz de unidades o anillo)
//   barras         desglose por categoría, ordenado de mayor a menor
//   serie_mensual  serie en el tiempo con el pico anotado y tabla de importes
//   composicion    un total repartido en partes (barra apilada)
//   flujo          secuencia o proceso en pasos
//   nodos          componentes alrededor de un núcleo
//   fichas         conteo de cosas concretas, numeradas y con ícono lineal
//   ficha          una cifra y sus datos de apoyo, solo tipografía
// El color principal es el del eje; el guinda y el dorado institucionales son
// constantes de marca. El lienzo mide 295 × 213.6 unidades = puntos tipográficos
// en la celda de 104 mm del bloque destacado: ningún texto baja de 7 pt.
import { F_SVG_SERIF } from './recursos.js'

const crudos = import.meta.glob([
  '/node_modules/@material-symbols/svg-400/rounded/{text_fields,wc,stadium,map,celebration,flag,skull,forest,festival,school,account_balance,local_shipping,airport_shuttle,medication,vaccines,dentistry,psychology,nutrition,favorite,monitor_heart,stethoscope,sentiment_satisfied,receipt_long,pets,coronavirus,agriculture,grass,science,inventory_2,campaign,payments,health_and_safety,military_tech,sell,water_drop,view_in_ar,videocam,smart_display,touch_app,apartment,router,shield,key,search,sports_volleyball,sports_martial_arts,sports_score,directions_run,accessible_forward,emoji_events,target,swap_horiz}.svg',
], { query: '?raw', import: 'default', eager: true })
const ICONOS = Object.fromEntries(Object.entries(crudos).map(([k, v]) => [k.split('/').pop().replace('.svg', ''), v]))

const W = 295, H = 213.62, MX = 14, AN = W - MX * 2
const T = '#241A1C', S = '#6B5E60', L = '#DDD5D2', GUINDA = '#7B1F2C', ORO = '#B8955A', B = '#FFFFFF'
const SEM = { optimo: '#046205', adecuado: '#00A04A', riesgo: '#E8A800', critico: '#C00000' }

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const n2 = v => Number(v).toFixed(2)
const miles = n => Number(n).toLocaleString('es-MX')
const pesos2 = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Mezcla el color con blanco (f de 0 a 1): tintes del color del eje.
function tinte(hex, f) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return '#' + c.map(v => Math.round(v + (255 - v) * f).toString(16).padStart(2, '0')).join('')
}

// Ancho real del texto: el PDF registra un medidor con sus tipografías; en la
// vista previa de SIMA se estima.
let medidor = null
export const usarMedidor = fn => { medidor = fn }
function ancho(txt, s, { w = 'normal', f = 'Sans', ls = 0 } = {}) {
  const t = String(txt ?? '')
  const em = medidor ? medidor(t, f, w === 'bold') : t.length * (f === F_SVG_SERIF ? 0.43 : w === 'bold' ? 0.52 : 0.49)
  return em * s + ls * Math.max(0, t.length - 1)
}
// Mayor cuerpo (entre min y max) con el que `txt` cabe en `an`.
const cabe = (txt, an, max, min = 7, o = {}) => Math.max(min, Math.min(max, max * an / (ancho(txt, max, o) || 1)))
// Parte un texto en renglones que quepan en `an`.
function partir(txt, an, s, o = {}) {
  const out = []
  let cur = ''
  String(txt ?? '').split(/\s+/).filter(Boolean).forEach(p => {
    const prueba = cur ? cur + ' ' + p : p
    if (cur && ancho(prueba, s, o) > an) { out.push(cur); cur = p } else cur = prueba
  })
  if (cur) out.push(cur)
  return out
}

function tx(x, y, txt, { s = 7.5, w = 'normal', f = 'Sans', c = T, a = 'start', lh = 1.25, ls = 0 } = {}) {
  return String(txt ?? '').split('\n').map((l, i) =>
    `<text x="${n2(x)}" y="${n2(y + i * s * lh)}" font-family="${f}" font-weight="${w}" font-size="${n2(s)}" fill="${c}" text-anchor="${a}"${ls ? ` letter-spacing="${ls}"` : ''}>${esc(l)}</text>`).join('')
}
// Etiqueta en mayúsculas espaciadas (7 pt).
const ROT = { s: 7, w: 'bold', ls: 0.5 }
function rot(x, y, txt, o = {}) {
  const t = String(txt ?? '').toUpperCase(), op = { ...ROT, c: S, ...o }
  // svg2pdf no descuenta el espaciado al alinear: se alinea a mano.
  if (op.a === 'end' || op.a === 'middle') { x -= ancho(t, op.s, op) * (op.a === 'end' ? 1 : 0.5); op.a = 'start' }
  return tx(x, y, t, op)
}
const partirRot = (txt, an) => partir(String(txt ?? '').toUpperCase(), an, 7, ROT)

// Ícono lineal (Material Symbols, caja 0 -960 960 960).
function icono(clave, x, y, t, color) {
  const d = (ICONOS[clave] || '').match(/ d="([^"]+)"/)?.[1]
  return d ? `<path d="${d}" fill="${color}" transform="translate(${n2(x)} ${n2(y + t)}) scale(${(t / 960).toFixed(5)})"/>` : ''
}

// Marco común: filete superior en el color del eje con arranque dorado,
// antetítulo, título en serif y pie con filete fino.
function marco(d, col, cuerpo) {
  const st = cabe(d.titulo, AN, 14, 10, { f: F_SVG_SERIF })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="870" height="630" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${B}"/>
  <rect x="0.2" y="0.2" width="${W - 0.4}" height="${n2(H - 0.4)}" fill="none" stroke="${L}" stroke-width="0.4"/>
  <rect x="0" y="0" width="${W}" height="2.4" fill="${col}"/>
  <rect x="0" y="0" width="34" height="2.4" fill="${ORO}"/>
  ${rot(MX, 17, d.etiqueta, { c: col })}
  ${tx(MX, 32.5, d.titulo, { s: st, f: F_SVG_SERIF, c: T })}
  ${cuerpo}
  <line x1="${MX}" y1="197" x2="${W - MX}" y2="197" stroke="${L}" stroke-width="0.4"/>
  ${rot(MX, 206.8, d.pie)}
  ${rot(W - MX, 206.8, d.pie_der, { c: GUINDA, a: 'end' })}
</svg>`
}

// Cabecera del cuerpo: rótulo a la izquierda y la cifra protagonista a la
// derecha. Devuelve el SVG y la Y donde empieza el contenido.
function cabecera(d, col) {
  const sc = d.cifra ? cabe(d.cifra, 112, 21, 12, { f: 'SansLight' }) : 0
  const libre = d.cifra ? AN - Math.max(ancho(d.cifra, sc, { f: 'SansLight' }), 60) - 10 : AN
  const sub = d.sub ? partirRot(d.sub, libre).slice(0, 2) : []
  let o = sub.map((l, i) => rot(MX, 58 + i * 9, l)).join('')
  if (d.cifra) {
    o += tx(W - MX, 63, d.cifra, { s: sc, f: 'SansLight', c: col, a: 'end' })
    o += partirRot(d.cifra_etiqueta, 150).slice(0, 2).map((l, i) => rot(W - MX, 72 + i * 8.6, l, { a: 'end' })).join('')
  }
  const etq = d.cifra ? partirRot(d.cifra_etiqueta, 150).slice(0, 2).length : 0
  return { svg: o, y: d.cifra ? 72 + etq * 8.6 + 1 : sub.length ? 60 + sub.length * 9 : 52 }
}

// Lista de conceptos con guion dorado, en `cols` columnas. Devuelve [svg, alto].
function lista(items, x, y, an, cols = 1, s = 7.5) {
  const cw = (an - (cols - 1) * 10) / cols, filas = Math.ceil(items.length / cols)
  const altos = Array(filas).fill(0), celdas = items.map(t => partir(t, cw - 9, s).slice(0, 3))
  celdas.forEach((ls, i) => { const f = Math.floor(i / cols); altos[f] = Math.max(altos[f], ls.length * s * 1.25 + 2.6) })
  let o = ''
  celdas.forEach((ls, i) => {
    const f = Math.floor(i / cols), yy = y + altos.slice(0, f).reduce((a, b) => a + b, 0), xx = x + (i % cols) * (cw + 10)
    o += `<rect x="${n2(xx)}" y="${n2(yy - 3.1)}" width="4.5" height="0.9" fill="${ORO}"/>` + tx(xx + 9, yy, ls.join('\n'), { s })
  })
  return [o, altos.reduce((a, b) => a + b, 0)]
}

// ── Parte de un total ────────────────────────────────────────────────────────
//   { parte, total, unidad, parte_etiqueta, resto_etiqueta } → matriz de unidades
//   { valor (0–100), valor_etiqueta }                        → anillo
//   + { pct, pct_etiqueta, lista: { titulo, items, columnas } }
function proporcion(d, col) {
  const anillo = d.total == null
  let izq = ''
  const xr = anillo ? 122 : 166, wr = W - MX - xr
  if (anillo) {
    const cx = 62, cy = 120, r = 37, p = Math.max(0, Math.min(100, Number(d.valor)))
    const a = (-90 + 360 * p / 100) * Math.PI / 180
    const v = `${Number(d.valor).toLocaleString('es-MX', { maximumFractionDigits: 2 })}%`
    izq = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tinte(col, 0.82)}" stroke-width="9"/>` +
      (p >= 100 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="9"/>`
        : `<path d="M ${cx} ${cy - r} A ${r} ${r} 0 ${p > 50 ? 1 : 0} 1 ${n2(cx + r * Math.cos(a))} ${n2(cy + r * Math.sin(a))}" fill="none" stroke="${col}" stroke-width="9"/>`) +
      tx(cx, cy + 3, v, { s: cabe(v, 54, 15, 9, { w: 'bold' }), w: 'bold', c: col, a: 'middle' }) +
      partirRot(d.valor_etiqueta, 58).slice(0, 2).map((l, i) => rot(cx, cy + 12.5 + i * 8.4, l, { a: 'middle' })).join('')
  } else {
    const denso = d.total > 60
    const cols = d.total <= 9 ? d.total : d.total <= 16 ? Math.ceil(d.total / 2) : d.total <= 40 ? 9 : d.total <= 60 ? 12 : 22, filas = Math.ceil(d.total / cols), hueco = denso ? 1.5 : 2.4
    const lado = Math.min(12.4, (130 - (cols - 1) * hueco) / cols, (84 - (filas - 1) * hueco) / filas), paso = lado + hueco
    const rt = partirRot(`${miles(d.total)} ${d.unidad}`, 130).slice(0, 2)
    const altoIzq = rt.length * 9 + 2 + filas * paso + 24, yr = 50 + (140 - altoIzq) / 2 + 7, y0 = yr + (rt.length - 1) * 9 + 8
    izq = rt.map((l, i) => rot(MX, yr + i * 9, l)).join('')
    for (let i = 0; i < d.total; i++) {
      const x = MX + (i % cols) * paso, y = y0 + Math.floor(i / cols) * paso, lleno = i < d.parte, rr = denso ? 0.5 : 1.2
      izq += `<rect x="${n2(x + 0.3)}" y="${n2(y + 0.3)}" width="${n2(lado - 0.6)}" height="${n2(lado - 0.6)}" rx="${rr}" ry="${rr}" fill="${lleno ? col : B}" stroke="${lleno ? col : S}" stroke-width="${denso ? 0.45 : 0.6}"/>`
    }
    const yl = y0 + filas * paso + 9
    izq += `<rect x="${MX}" y="${n2(yl - 6)}" width="7" height="7" rx="1" ry="1" fill="${col}"/>` + tx(MX + 11, yl, d.parte_etiqueta, { s: 7.5 })
    if (d.resto_etiqueta && d.parte < d.total) {
      izq += `<rect x="${MX + 0.3}" y="${n2(yl + 5.3)}" width="6.4" height="6.4" rx="1" ry="1" fill="${B}" stroke="${S}" stroke-width="0.6"/>` + tx(MX + 11, yl + 11, d.resto_etiqueta, { s: 7.5, c: S })
    }
  }

  // Bloque derecho: cifra, su leyenda y la lista, centrado en la altura.
  const sp = cabe(d.pct, wr, 38, 16, { f: 'SansLight' })
  const et = partir(d.pct_etiqueta, wr, 8).slice(0, 3)
  const li = d.lista?.items?.length ? d.lista : null
  const cols = li?.columnas || 1
  const [svgL, altoL] = li ? lista(li.items.slice(0, 8), xr, 0, wr, cols, cols > 1 ? 7 : 7.5) : ['', 0]
  const bajo = Math.max(12, sp * 0.24 + 9)
  const altoDer = sp * 0.78 + bajo - 8 + et.length * 10 + (li ? 18 + altoL : 0)
  let y = 50 + Math.max(0, (140 - altoDer) / 2) + sp * 0.78
  let der = tx(xr, y, d.pct, { s: sp, f: 'SansLight', c: col })
  y += bajo
  der += tx(xr, y, et.join('\n'), { s: 8, c: T })
  y += (et.length - 1) * 10 + 8
  if (li) {
    der += `<line x1="${xr}" y1="${n2(y)}" x2="${W - MX}" y2="${n2(y)}" stroke="${L}" stroke-width="0.4"/>` + rot(xr, y + 10, li.titulo)
    y += 21
    der += `<g transform="translate(0 ${n2(y)})">${svgL}</g>`
  }
  return marco(d, col, `${izq}
    <line x1="${xr - 14}" y1="52" x2="${xr - 14}" y2="188" stroke="${L}" stroke-width="0.4"/>
    ${der}`)
}

// ── Desglose por categoría: barras horizontales de mayor a menor ─────────────
//   { cifra, cifra_etiqueta, sub, desglose: [[rótulo, n]] }
function barras(d, col) {
  const c = cabecera(d, col)
  const it = [...d.desglose].sort((a, b) => b[1] - a[1]).slice(0, 7)
  const max = it[0][1] || 1
  const wl = Math.min(118, Math.max(...it.map(([l]) => ancho(l, 7.5)))) + 1, xb = MX + wl + 6
  const wv = Math.max(...it.map(([, n]) => ancho(miles(n), 8, { w: 'bold' }))) + 5, wb = W - MX - xb - wv
  const paso = Math.min(24, (190 - c.y - 6) / it.length), hb = Math.min(11, paso * 0.5)
  const y0 = c.y + 6 + (190 - c.y - 6 - paso * it.length) / 2
  const filas = it.map(([l, n], i) => {
    const y = y0 + i * paso + (paso - hb) / 2, w = Math.max(1.2, wb * n / max)
    return tx(MX + wl, y + hb / 2 + 2.6, partir(l, wl, 7.5)[0], { s: 7.5, a: 'end' }) +
      `<rect x="${n2(xb)}" y="${n2(y)}" width="${n2(w)}" height="${n2(hb)}" fill="${i === 0 ? col : tinte(col, 0.42)}"/>` +
      tx(xb + w + 4, y + hb / 2 + 2.8, miles(n), { s: 8, w: 'bold', c: i === 0 ? col : T })
  }).join('')
  return marco(d, col, `${c.svg}
    <line x1="${n2(xb)}" y1="${n2(y0)}" x2="${n2(xb)}" y2="${n2(y0 + it.length * paso)}" stroke="${S}" stroke-width="0.5"/>
    ${filas}`)
}

// ── Serie en el tiempo: columnas mensuales con el pico anotado y la tabla ────
//   { total, total_etiqueta, serie: [[mes, año, valor]] }
function serieMensual(d, col) {
  const s = d.serie.slice(0, 12), vals = s.map(r => Number(r[2]) || 0), max = Math.max(...vals), imax = vals.indexOf(max)
  const tope = Math.ceil(max / 1e6 / 5) * 5 || 5
  const x0 = MX + 17, x1 = 156, y0 = 74, y1 = 168, bw = (x1 - x0) / s.length
  let g = ''
  for (let t = 0; t <= tope; t += 5) {
    const y = y1 - (y1 - y0) * t / tope
    g += `<line x1="${x0}" y1="${n2(y)}" x2="${x1}" y2="${n2(y)}" stroke="${t ? L : S}" stroke-width="${t ? 0.35 : 0.5}"/>` +
      tx(x0 - 3, y + 2.4, `${t} M`, { s: 7, c: S, a: 'end' })
  }
  const cols = s.map(([m], i) => {
    const h = (y1 - y0) * vals[i] / 1e6 / tope, x = x0 + i * bw + bw * 0.16, w = bw * 0.68
    return `<rect x="${n2(x)}" y="${n2(y1 - h)}" width="${n2(w)}" height="${n2(h)}" fill="${i === imax ? col : tinte(col, 0.5)}"/>` +
      tx(x + w / 2, y1 + 8.5, String(m)[0].toUpperCase(), { s: 7, w: i === imax ? 'bold' : 'normal', c: i === imax ? col : S, a: 'middle' })
  }).join('')
  const anios = []
  s.forEach(([, a], i) => { const u = anios[anios.length - 1]; if (u && u.a === a) u.f = i; else anios.push({ a, i, f: i }) })
  const llaves = anios.map(({ a, i, f }) => {
    const xa = x0 + i * bw + 1.5, xb = x0 + (f + 1) * bw - 1.5
    return `<line x1="${n2(xa)}" y1="181" x2="${n2(xb)}" y2="181" stroke="${ORO}" stroke-width="0.6"/>` + tx((xa + xb) / 2, 189.5, a, { s: 7, w: 'bold', c: S, a: 'middle' })
  }).join('')
  const xp = x0 + imax * bw + bw / 2, yp = y1 - (y1 - y0) * max / 1e6 / tope
  const mes = `${s[imax][0]} ${s[imax][1]}`
  const nota = rot(x0 + 2, 55, 'Mes de mayor recaudación') +
    tx(x0 + 2, 64.5, mes, { s: 8, w: 'bold', c: col }) +
    `<path d="M ${n2(x0 + 6 + ancho(mes, 8, { w: 'bold' }))} 62 L ${n2(xp)} 62 L ${n2(xp)} ${n2(yp - 2)}" fill="none" stroke="${col}" stroke-width="0.5"/>` +
    `<circle cx="${n2(xp)}" cy="${n2(yp - 2)}" r="1.3" fill="${col}"/>`
  const tx0 = 170, tw = W - MX - tx0, rh = 8.7, ty = 86
  const filas = s.map(([m, a], i) => {
    const y = ty + i * rh, top = i === imax
    return (i % 2 ? '' : `<rect x="${tx0}" y="${n2(y - 6.3)}" width="${tw}" height="${rh}" fill="${tinte(col, 0.93)}"/>`) +
      tx(tx0 + 3, y, `${String(m).slice(0, 3)} ${a}`, { s: 7, w: top ? 'bold' : 'normal', c: top ? col : T }) +
      tx(tx0 + tw - 3, y, pesos2(vals[i]), { s: 7, w: top ? 'bold' : 'normal', c: top ? col : T, a: 'end' })
  }).join('')
  const yf = ty + s.length * rh - 6.3
  return marco(d, col, `${g}${cols}${llaves}${nota}
    ${rot(tx0 + 3, 55, d.total_etiqueta)}
    ${tx(tx0 + 3, 70, d.total, { s: cabe(d.total, tw - 6, 13.5, 9, { w: 'bold' }), w: 'bold', c: col })}
    <line x1="${tx0}" y1="76" x2="${tx0 + tw}" y2="76" stroke="${col}" stroke-width="0.8"/>
    ${filas}
    <line x1="${tx0}" y1="${n2(yf)}" x2="${tx0 + tw}" y2="${n2(yf)}" stroke="${S}" stroke-width="0.4"/>`)
}

// ── Un total repartido en partes: barra apilada con su leyenda ───────────────
//   { cifra, cifra_etiqueta, sub, partes: [[rótulo, n, texto?]], lista: { titulo, items } }
function composicion(d, col) {
  const c = cabecera(d, col)
  const p = d.partes.slice(0, 4), tot = p.reduce((t, x) => t + Number(x[1]), 0) || 1
  const tonos = [col, tinte(col, 0.45), tinte(col, 0.68), tinte(col, 0.82)]
  const li = d.lista?.items?.length ? d.lista : null
  const [svgL, altoL] = li ? lista(li.items.slice(0, 8), MX, 0, AN, li.items.length > 3 ? 2 : 1, 7) : ['', 0]
  const alto = 15 + 9 + p.length * 12.5 + (li ? 18 + altoL : 0)
  let y = c.y + 6 + Math.max(0, (190 - c.y - 6 - alto) / 2), x = MX
  let o = ''
  p.forEach(([, n], i) => {
    const w = AN * Number(n) / tot
    o += `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="15" fill="${tonos[i]}"/>` + (i ? `<rect x="${n2(x - 0.5)}" y="${n2(y)}" width="1" height="15" fill="${B}"/>` : '')
    x += w
  })
  y += 26
  p.forEach(([l, n, t], i) => {
    o += `<rect x="${MX}" y="${n2(y - 6.2)}" width="7" height="7" fill="${tonos[i]}"${i ? ` stroke="${S}" stroke-width="0.3"` : ''}/>` +
      tx(MX + 12, y, l, { s: 8 }) + tx(W - MX, y, t ?? miles(n), { s: 8.5, w: 'bold', c: i === 0 ? col : T, a: 'end' }) +
      `<line x1="${MX}" y1="${n2(y + 4)}" x2="${W - MX}" y2="${n2(y + 4)}" stroke="${L}" stroke-width="0.35"/>`
    y += 12.5
  })
  if (li) {
    o += rot(MX, y + 8, li.titulo)
    o += `<g transform="translate(0 ${n2(y + 19)})">${svgL}</g>`
  }
  return marco(d, col, c.svg + o)
}

// ── Secuencia o proceso: pasos numerados unidos por flechas ──────────────────
//   { cifra, cifra_etiqueta, sub, pasos: [texto | { t, s }], nota,
//     distribucion: { titulo, items: [[rótulo, n, clave de semáforo]] } }
function flujo(d, col) {
  const c = cabecera(d, col)
  let y = c.y + 4, o = ''
  const dis = d.distribucion
  if (dis) {
    const tot = dis.items.reduce((t, x) => t + Number(x[1]), 0) || 1
    o += rot(MX, y + 5, dis.titulo)
    y += 10
    let x = MX
    dis.items.forEach(([, n, k], i) => {
      const w = AN * Number(n) / tot
      o += `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="9" fill="${SEM[k] || col}"/>` + (i ? `<rect x="${n2(x - 0.4)}" y="${n2(y)}" width="0.8" height="9" fill="${B}"/>` : '')
      x += w
    })
    y += 19
    const cw = AN / dis.items.length
    dis.items.forEach(([l, n, k], i) => {
      const xx = MX + i * cw
      o += `<rect x="${n2(xx)}" y="${n2(y - 6.2)}" width="7" height="7" fill="${SEM[k] || col}"/>` +
        tx(xx + 11, y, miles(n), { s: 8.5, w: 'bold' }) + tx(xx + 13 + ancho(miles(n), 8.5, { w: 'bold' }), y, l, { s: 7.5, c: S })
    })
    y += 8
  }
  if (d.nota) { o += partir(d.nota, AN, 7.5).slice(0, 2).map((l, i) => tx(MX, y + 6 + i * 9.4, l, { s: 7.5, c: S })).join(''); y += 6 + partir(d.nota, AN, 7.5).slice(0, 2).length * 9.4 }

  const ps = d.pasos.slice(0, 6).map(p => typeof p === 'string' ? { t: p } : p)
  const porFila = ps.length <= 4 ? ps.length : 3, filas = Math.ceil(ps.length / porFila)
  const sw = (AN - (porFila - 1) * 8) / porFila
  const cel = ps.map(p => ({ t: partir(p.t, sw - 2, 8, { w: 'bold' }).slice(0, 3), s: p.s ? partir(p.s, sw - 2, 7).slice(0, 2) : [] }))
  const altoF = Array(filas).fill(0)
  cel.forEach((x, i) => { const f = Math.floor(i / porFila); altoF[f] = Math.max(altoF[f], 20 + x.t.length * 9.6 + x.s.length * 8.6) })
  const total = altoF.reduce((a, b) => a + b, 0) + (filas - 1) * 8
  let yf = y + 4 + Math.max(0, (190 - y - 4 - total) / 2)
  cel.forEach((x, i) => {
    const f = Math.floor(i / porFila), k = i % porFila
    if (k === 0 && i) yf += altoF[f - 1] + 8
    const xx = MX + k * (sw + 8), cy = yf + 7, ult = i === ps.length - 1
    o += `<circle cx="${n2(xx + 7)}" cy="${n2(cy)}" r="6.6" fill="${ult ? col : B}" stroke="${col}" stroke-width="0.8"/>` +
      tx(xx + 7, cy + 2.8, i + 1, { s: 8, w: 'bold', c: ult ? B : col, a: 'middle' })
    if (!ult && k < porFila - 1) {
      const xa = xx + 17, xb = xx + sw + 6
      o += `<line x1="${n2(xa)}" y1="${n2(cy)}" x2="${n2(xb)}" y2="${n2(cy)}" stroke="${ORO}" stroke-width="0.7"/>` +
        `<path d="M ${n2(xb - 3)} ${n2(cy - 2.4)} L ${n2(xb)} ${n2(cy)} L ${n2(xb - 3)} ${n2(cy + 2.4)}" fill="none" stroke="${ORO}" stroke-width="0.7"/>`
    }
    o += tx(xx, yf + 26, x.t.join('\n'), { s: 8, w: 'bold', lh: 1.2 })
    if (x.s.length) o += tx(xx, yf + 26 + x.t.length * 9.6 + 0.5, x.s.join('\n'), { s: 7, c: S, lh: 1.22 })
  })
  return marco(d, col, c.svg + o)
}

// ── Componentes alrededor de un núcleo ───────────────────────────────────────
//   { centro, centro_sub, sub, nodos: [{ v, t } | { t, s }] }
function nodos(d, col) {
  const c = cabecera({ sub: d.sub }, col)
  const ns = d.nodos.slice(0, 8), n = ns.length
  const cx = W / 2, cy = (c.y + 192) / 2 + 1, rC = 25
  const bw = n <= 4 ? 84 : 64, bh = 25
  const pos = n <= 4
    ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].slice(0, n).map(([a, b]) => [cx + a * (AN / 2 - bw / 2), cy + b * Math.min(40, (192 - c.y) / 2 - bh / 2 - 2)])
    : ns.map((_, i) => { const a = (-90 + i * 360 / n) * Math.PI / 180; return [cx + (AN / 2 - bw / 2) * Math.cos(a), cy + ((192 - c.y) / 2 - bh / 2 - 1) * Math.sin(a)] })
  const lineas = pos.map(([x, y]) => `<line x1="${n2(cx)}" y1="${n2(cy)}" x2="${n2(x)}" y2="${n2(y)}" stroke="${ORO}" stroke-width="0.6"/>`).join('')
  const cajas = ns.map((nd, i) => {
    const [x, y] = pos[i], x0 = x - bw / 2, y0 = y - bh / 2
    let t = `<rect x="${n2(x0)}" y="${n2(y0)}" width="${bw}" height="${bh}" fill="${B}" stroke="${L}" stroke-width="0.5"/>` +
      `<rect x="${n2(x0)}" y="${n2(y0)}" width="${bw}" height="1.4" fill="${col}"/>`
    if (nd.v != null) {
      const v = typeof nd.v === 'number' ? miles(nd.v) : nd.v
      t += tx(x, y0 + 12.6, v, { s: cabe(v, bw - 8, 11, 8, { w: 'bold' }), w: 'bold', c: col, a: 'middle' }) +
        tx(x, y0 + 21, partir(nd.t, bw - 6, 7)[0], { s: 7, c: T, a: 'middle' })
    } else {
      const ls = partir(nd.t, bw - 6, 7.5, { w: 'bold' }).slice(0, nd.s ? 1 : 2)
      t += tx(x, y0 + (nd.s || ls.length > 1 ? 11 : 15.5), ls.join('\n'), { s: 7.5, w: 'bold', a: 'middle', lh: 1.18 })
      if (nd.s) t += tx(x, y0 + 20, partir(nd.s, bw - 6, 7)[0], { s: 7, c: S, a: 'middle' })
    }
    return t
  }).join('')
  const sC = cabe(d.centro, rC * 1.6, 15, 8, { w: 'bold' })
  const subC = partirRot(d.centro_sub, rC * 1.7)
  return marco(d, col, `${c.svg}${lineas}
    <circle cx="${n2(cx)}" cy="${n2(cy)}" r="${rC + 3}" fill="${B}" stroke="${ORO}" stroke-width="0.6"/>
    <circle cx="${n2(cx)}" cy="${n2(cy)}" r="${rC}" fill="${col}"/>
    ${tx(cx, cy + (subC.length ? -1 - (subC.length - 1) * 4 : sC * 0.34), d.centro, { s: sC, w: 'bold', c: B, a: 'middle' })}
    ${subC.map((l, i) => rot(cx, cy + 8.5 - (subC.length - 1) * 4 + i * 8, l, { c: B, a: 'middle', ls: 0.3 })).join('')}
    ${cajas}`)
}

// ── Conteo de cosas concretas: fichas numeradas con ícono lineal ─────────────
//   { cifra, cifra_etiqueta, sub, fichas: [{ t, i }] }
function fichas(d, col) {
  const c = cabecera(d, col)
  const it = d.fichas.slice(0, 8), cols = it.length <= 3 ? it.length : it.length <= 4 ? 2 : it.length <= 6 ? 3 : 4, filas = Math.ceil(it.length / cols)
  const gap = 7, y0 = c.y + 6, cw = (AN - gap * (cols - 1)) / cols, chMax = (190 - y0 - gap * (filas - 1)) / filas
  const renglones = Math.max(...it.map(f => partir(f.t, cw - 15, 8, { w: 'bold' }).length))
  const compacto = cw < 80 || 33.5 + renglones * 9.6 + 2 > chMax
  const ch = Math.min(compacto ? 56 : 62, chMax)
  const yi = y0 + (190 - y0 - (filas * ch + (filas - 1) * gap)) / 2
  const sn = compacto ? 11 : 17, st = compacto ? 7.5 : 8, ti = compacto ? 13 : 18
  const cajas = it.map((f, i) => {
    const x = MX + (i % cols) * (cw + gap), y = yi + Math.floor(i / cols) * (ch + gap)
    const ls = partir(f.t, cw - 15, st, { w: 'bold' }).slice(0, 3)
    const yn = y + (compacto ? 13 : 17.5), yt = yn + (compacto ? 13 : 16)
    return `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(cw)}" height="${n2(ch)}" fill="${B}" stroke="${L}" stroke-width="0.5"/>` +
      `<rect x="${n2(x)}" y="${n2(y)}" width="2" height="${n2(ch)}" fill="${col}"/>` +
      tx(x + 9, yn, String(i + 1).padStart(2, '0'), { s: sn, f: 'SansLight', c: col }) +
      `<rect x="${n2(x + 9)}" y="${n2(yn + 3.5)}" width="10" height="0.8" fill="${ORO}"/>` +
      icono(f.i, x + cw - ti - 6, y + 4.5, ti, tinte(col, 0.25)) +
      tx(x + 9, yt, ls.join('\n'), { s: st, w: 'bold', lh: 1.2 })
  }).join('')
  return marco(d, col, c.svg + cajas)
}

// ── Una cifra y sus datos de apoyo: ficha tipográfica ────────────────────────
//   { valor, valor_etiqueta, sub, datos: [[valor, rótulo]], lista: { titulo, items } }
function ficha(d, col) {
  const li = d.lista?.items?.length ? d.lista : null, dt = (d.datos || []).slice(0, 4)
  const sv = cabe(d.valor, AN, 40, 16, { f: 'SansLight' })
  const et = partir(d.valor_etiqueta, AN, 9).slice(0, 2)
  const cw = dt.length ? (AN - (dt.length - 1) * 12) / dt.length : 0
  const cel = dt.map(([v, l]) => ({ v, s: cabe(v, cw - 2, 12, 8, { w: 'bold' }), l: partir(l, cw - 2, 7.5).slice(0, 3) }))
  const altoD = dt.length ? 14 + Math.max(...cel.map(x => x.l.length)) * 9.4 + 6 : 0
  const [svgL, altoL] = li ? lista(li.items.slice(0, 8), MX, 0, AN, li.items.length > 2 ? 2 : 1) : ['', 0]
  const bajoV = Math.max(13, sv * 0.2 + 9)
  const alto = (d.sub ? 12 : 0) + sv * 0.78 + bajoV - 8 + et.length * 11 + 10 + altoD + (li ? 16 + altoL : 0)
  let y = 48 + Math.max(2, (144 - alto) / 2), o = ''
  if (d.sub) { o += rot(MX, y + 7, d.sub); y += 12 }
  y += sv * 0.78
  o += tx(MX, y, d.valor, { s: sv, f: 'SansLight', c: col })
  y += bajoV
  o += tx(MX, y, et.join('\n'), { s: 9, c: T, lh: 1.22 })
  y += (et.length - 1) * 11 + 8
  o += `<rect x="${MX}" y="${n2(y)}" width="18" height="0.9" fill="${ORO}"/><line x1="${MX + 18}" y1="${n2(y + 0.45)}" x2="${W - MX}" y2="${n2(y + 0.45)}" stroke="${L}" stroke-width="0.4"/>`
  y += 14
  cel.forEach((x, i) => {
    const xx = MX + i * (cw + 12)
    if (i) o += `<line x1="${n2(xx - 6)}" y1="${n2(y - 9)}" x2="${n2(xx - 6)}" y2="${n2(y + altoD - 18)}" stroke="${L}" stroke-width="0.4"/>`
    o += tx(xx, y, x.v, { s: x.s, w: 'bold', c: col }) + tx(xx, y + 10.5, x.l.join('\n'), { s: 7.5, c: S })
  })
  y += altoD - 6
  if (li) {
    o += rot(MX, y + 6, li.titulo)
    o += `<g transform="translate(0 ${n2(y + 17)})">${svgL}</g>`
  }
  return marco(d, col, o)
}

const TIPOS = { proporcion, barras, serie_mensual: serieMensual, composicion, flujo, nodos, fichas, ficha }

export const esInfografia = spec => !!(spec && TIPOS[spec.tipo])
// La cifra protagonista ya va en la infografía: la columna de texto no la repite.
export const ocultaCifra = esInfografia

export function svgInfografia(spec, color = GUINDA) {
  return esInfografia(spec) ? TIPOS[spec.tipo](spec, color) : null
}
