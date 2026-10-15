// ── Arte de fondo de las portadas del Informe (canvas → JPEG) ────────────────
// jsPDF no dibuja degradados, mezclas de color ni SVG: el fondo de cada
// portada (degradado, foto en duotono, diagrama de pictogramas) se pinta en
// canvas y se pega como imagen. Los textos, el escudo y el logo van encima en
// vector. Las coordenadas del diagrama vienen en mm de la página carta.

const W_MM = 215.9, H_MM = 279.4
const ANCHO_PX = 1700                    // ~200 dpi en carta
const ALTO_PX = Math.round(ANCHO_PX * H_MM / W_MM)

export function hexARgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

// f < 0 oscurece hacia negro, f > 0 aclara hacia blanco.
export function matiz(hex, f) {
  const [r, g, b] = hexARgb(hex)
  const t = f < 0 ? 0 : 255, a = Math.abs(f)
  const m = c => Math.round((t - c) * a + c)
  return '#' + [m(r), m(g), m(b)].map(c => c.toString(16).padStart(2, '0')).join('')
}

function lienzo() {
  const c = document.createElement('canvas')
  c.width = ANCHO_PX; c.height = ALTO_PX
  return [c, c.getContext('2d')]
}

function dibujarCubriendo(ctx, img) {
  const s = Math.max(ANCHO_PX / img.width, ALTO_PX / img.height)
  const dw = img.width * s, dh = img.height * s
  ctx.drawImage(img, (ANCHO_PX - dw) / 2, (ALTO_PX - dh) / 2, dw, dh)
}

// Capa SVG en mm del tamaño de la página, rasterizada al lienzo.
function capaSvg(inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W_MM} ${H_MM}" width="${ANCHO_PX}" height="${ALTO_PX}">${inner}</svg>`
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = () => rej(new Error('No se pudo dibujar el diagrama de una portada.'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}

// Un ícono de Material Symbols colocado en (x, y) con lado `t` mm. Su
// ancho/alto propios se quitan para que mande el del diagrama.
function icono(svg, x, y, t, color, opacidad = 1) {
  return svg
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace('<svg ', `<svg x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${t.toFixed(2)}" height="${t.toFixed(2)}" fill="${color}" opacity="${opacidad}" `)
}

// Diagrama conceptual del eje: medalla central y satélites (los programas
// del PMD del eje) repartidos en una órbita elíptica, unidos por filetes.
// Acabado de medalla institucional: disco con volumen, bisel dorado y filete
// interior blanco; ícono central en dorado y los de los satélites en blanco.
// Una sola órbita dorada muy fina; sin marcas ni punteados.
const ORO = '#E2C998', ORO_OSCURO = '#B8955A'

function medalla(id, x, y, r, colorFondo, oro = 1) {
  const f = n => n.toFixed(2)
  let o = ''
  // Sombra suave debajo (desplazada hacia abajo) para separar del fondo.
  o += `<ellipse cx="${f(x)}" cy="${f(y + r * .16)}" rx="${f(r * 1.32)}" ry="${f(r * 1.26)}" fill="url(#sombra)"/>`
  // Bisel dorado: aro con degradado de claro (arriba) a oscuro (abajo).
  o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + .55 * oro)}" fill="url(#bisel)"/>`
  // Disco con volumen.
  o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${id})"/>`
  // Filete interior blanco.
  o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .86)}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".16"/>`
  return o
}

function diagramaSvg(d, colorFondo) {
  const { cx, cy, rx, ry, rC, rS, centro, satelites } = d
  const f = n => n.toFixed(2)
  let o = `<defs>
    <radialGradient id="luz"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset=".6" stop-color="#fff" stop-opacity=".035"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="sombra"><stop offset=".6" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="bisel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E3C0"/><stop offset=".5" stop-color="${ORO}"/><stop offset="1" stop-color="${ORO_OSCURO}"/></linearGradient>
    <radialGradient id="discoC" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="${matiz(colorFondo, .2)}"/><stop offset=".65" stop-color="${matiz(colorFondo, -.12)}"/><stop offset="1" stop-color="${matiz(colorFondo, -.3)}"/></radialGradient>
    <radialGradient id="discoS" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="${matiz(colorFondo, .16)}"/><stop offset=".7" stop-color="${matiz(colorFondo, -.1)}"/><stop offset="1" stop-color="${matiz(colorFondo, -.26)}"/></radialGradient>
  </defs>`
  // Luz detrás del conjunto y órbita dorada.
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${f(rx * 1.05)}" ry="${f(ry * 1.25)}" fill="url(#luz)"/>`
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ORO}" stroke-opacity=".5" stroke-width=".2"/>`
  // Filetes del centro a cada satélite, con un rombo dorado a media distancia.
  satelites.forEach(s => {
    const dx = s.x - cx, dy = s.y - cy, L = Math.hypot(dx, dy) || 1
    const ux = dx / L, uy = dy / L
    const x1 = cx + ux * (rC + 2.6), y1 = cy + uy * (rC + 2.6)
    const x2 = s.x - ux * (rS + 1.6), y2 = s.y - uy * (rS + 1.6)
    o += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${ORO}" stroke-opacity=".55" stroke-width=".18"/>`
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, k = .7
    o += `<path d="M${f(mx)} ${f(my - k)} L${f(mx + k)} ${f(my)} L${f(mx)} ${f(my + k)} L${f(mx - k)} ${f(my)} Z" fill="${ORO}" fill-opacity=".85"/>`
  })
  // Centro: aro fino exterior, medalla y pictograma en dorado.
  o += `<circle cx="${cx}" cy="${cy}" r="${f(rC + 2.6)}" fill="none" stroke="${ORO}" stroke-opacity=".55" stroke-width=".16"/>`
  o += medalla('discoC', cx, cy, rC, colorFondo, 1.3)
  const tC = rC * 1.08
  o += icono(centro, cx - tC / 2, cy - tC / 2, tC, ORO)
  // Satélites: medalla con bisel dorado e ícono blanco.
  satelites.forEach(s => {
    o += medalla('discoS', s.x, s.y, rS, colorFondo)
    const t = rS * 1.06
    o += icono(s.svg, s.x - t / 2, s.y - t / 2, t, '#fff')
  })
  return o
}

// Portada de un eje: degradado en su color, foto en duotono (si el eje tiene
// fotos en sus acciones) y encima el diagrama conceptual.
export async function artePortadaEje(colorHex, foto, diagrama) {
  const [c, ctx] = lienzo()
  const g = ctx.createLinearGradient(0, 0, ANCHO_PX * .45, ALTO_PX)
  g.addColorStop(0, matiz(colorHex, -.05))
  g.addColorStop(.55, matiz(colorHex, -.3))
  g.addColorStop(1, matiz(colorHex, -.55))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ANCHO_PX, ALTO_PX)

  if (foto) {
    ctx.save()
    ctx.filter = 'grayscale(1) contrast(1.1)'
    ctx.globalAlpha = .5
    ctx.globalCompositeOperation = 'luminosity'
    dibujarCubriendo(ctx, foto)
    ctx.restore()
    const v = ctx.createLinearGradient(0, 0, 0, ALTO_PX)
    v.addColorStop(0, colorHex + 'd9')
    v.addColorStop(.45, colorHex + 'b3')
    v.addColorStop(.75, matiz(colorHex, -.55) + 'f2')
    v.addColorStop(1, matiz(colorHex, -.6))
    ctx.fillStyle = v
    ctx.fillRect(0, 0, ANCHO_PX, ALTO_PX)
  }

  ctx.drawImage(await capaSvg(diagramaSvg(diagrama, matiz(colorHex, -.32))), 0, 0)
  return c.toDataURL('image/jpeg', 0.9)
}

// Portada principal: guinda institucional profundo con una luz suave detrás
// del escudo. Todo lo demás (filetes, escudo, textos) va en vector.
export async function artePortadaPrincipal() {
  const [c, ctx] = lienzo()
  const g = ctx.createLinearGradient(0, 0, ANCHO_PX * .25, ALTO_PX)
  g.addColorStop(0, '#681925')
  g.addColorStop(.5, '#58141F')
  g.addColorStop(1, '#330B12')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ANCHO_PX, ALTO_PX)
  const luz = ctx.createRadialGradient(ANCHO_PX * .5, ALTO_PX * .25, 0, ANCHO_PX * .5, ALTO_PX * .25, ANCHO_PX * .62)
  luz.addColorStop(0, 'rgba(150,48,62,.45)')
  luz.addColorStop(1, 'rgba(150,48,62,0)')
  ctx.fillStyle = luz
  ctx.fillRect(0, 0, ANCHO_PX, ALTO_PX)
  return c.toDataURL('image/jpeg', 0.92)
}

// Recorta una foto al centro con la proporción ancho/alto pedida y la deja
// como JPEG para el PDF.
export function recortarFoto(bmp, ratio, maxAncho = 1400) {
  let sw = bmp.width, sh = bmp.width / ratio
  if (sh > bmp.height) { sh = bmp.height; sw = sh * ratio }
  const sx = (bmp.width - sw) / 2, sy = (bmp.height - sh) / 2
  const w = Math.min(maxAncho, Math.round(sw)), h = Math.round(w / ratio)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.84)
}
