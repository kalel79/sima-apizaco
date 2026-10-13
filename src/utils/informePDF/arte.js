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

// Diagrama conceptual del eje: ícono central, órbita y satélites (los
// programas del PMD del eje), unidos con filetes finos. Íconos en blanco
// dentro de aros blancos; el relleno del aro es el tono del fondo, para que
// los filetes no crucen por detrás del ícono.
function diagramaSvg(d, colorFondo) {
  const { cx, cy, rx, ry, rC, rS, centro, satelites } = d
  let o = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".2" stroke-dasharray=".7 1.1"/>`
  satelites.forEach(s => {
    const dx = s.x - cx, dy = s.y - cy, L = Math.hypot(dx, dy) || 1
    const x1 = cx + dx / L * (rC + 2.6), y1 = cy + dy / L * (rC + 2.6)
    const x2 = s.x - dx / L * rS, y2 = s.y - dy / L * rS
    o += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#fff" stroke-opacity=".45" stroke-width=".22"/>`
  })
  o += `<circle cx="${cx}" cy="${cy}" r="${rC + 2.6}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".15"/>`
  o += `<circle cx="${cx}" cy="${cy}" r="${rC}" fill="${colorFondo}" stroke="#fff" stroke-opacity=".85" stroke-width=".35"/>`
  const tC = rC * 1.15
  o += icono(centro, cx - tC / 2, cy - tC / 2, tC, '#fff')
  satelites.forEach(s => {
    o += `<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${rS}" fill="${colorFondo}" stroke="#fff" stroke-opacity=".9" stroke-width=".3"/>`
    const t = rS * 1.05
    o += icono(s.svg, s.x - t / 2, s.y - t / 2, t, '#fff')
  })
  return o
}

// Portada de un eje: degradado en su color, foto en duotono (si el eje tiene
// fotos en sus acciones) o, sin foto, su pictograma en gran formato como
// textura; encima, el diagrama conceptual.
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

  let capa = ''
  if (!foto) capa += icono(diagrama.centro, W_MM - 120, 110, 170, '#fff', 0.04)
  capa += diagramaSvg(diagrama, matiz(colorHex, -.32))
  ctx.drawImage(await capaSvg(capa), 0, 0)
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
