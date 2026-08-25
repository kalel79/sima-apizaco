// ── Diagrama de árbol (Problema/Objetivos) dibujado a canvas — versión Excel ──
// Excel no tiene forma nativa de dibujar el diagrama de cajas+conectores que
// drawArbolDiagrama() pinta en el PDF (expedienteMMLSecciones.js), así que se
// vuelve a dibujar aquí sobre un <canvas> y se exporta como PNG para
// insertarse como imagen en la hoja — mismo patrón que ya usan barraDataURL/
// lineaDataURL (reporteMensualGraficas.js) para las gráficas del Excel
// mensual. No es una réplica pixel-por-pixel del PDF (esa lógica ajusta con
// mucho detalle fuente/alto por caja); aquí se preserva la jerarquía visual
// (General → Superior → Raíz → Primario → Secundario, con conectores) que es
// lo que se pierde si el árbol se vuelca solo como tabla plana. A diferencia
// del PDF (fuente fija por caja, texto que se trunca si no cabe), aquí CADA
// FILA crece de alto hasta lo que su caja con más texto necesite — evita que
// un nodo con narrativa larga se desborde fuera de su caja.
// numerarComponentesActividades: mismo agrupamiento Medio→Actividades que
// usa el PDF (drawAcciones/drawAlternativas) — fuente única, no se recalcula.
import { numerarComponentesActividades } from './expedienteMMLSecciones.js'

const GUINDA = '#7B1F2C'
const DORADO = '#C9A961'
const GRIS = '#595959'
const BOX_W_MAX = 210, BOX_H_MIN = 74, GAP_X = 14, GAP_TIER = 56
const AREA_TAG_H = 18
const MARGEN = 30
const ALTO_CAJA_TOPE = 280 // techo antes de forzar una fuente más chica

// Respeta los saltos de línea explícitos (\n) como cortes de párrafo antes
// de hacer el word-wrap normal — un split(/\s+/) simple los trata igual que
// cualquier espacio y pega todo en un solo párrafo (bug real: las
// actividades de un Medio, unidas con \n, salían corridas en una sola caja).
function wrapText(ctx, texto, maxWidth) {
  const parrafos = String(texto ?? '—').split('\n')
  const lineas = []
  parrafos.forEach(parrafo => {
    const palabras = parrafo.split(/\s+/).filter(Boolean)
    if (!palabras.length) { lineas.push(''); return }
    let linea = ''
    palabras.forEach(w => {
      const prueba = linea ? `${linea} ${w}` : w
      if (ctx.measureText(prueba).width > maxWidth && linea) {
        lineas.push(linea); linea = w
      } else {
        linea = prueba
      }
    })
    if (linea) lineas.push(linea)
  })
  return lineas
}

// Fuente base según el ancho de la caja — cajas angostas (muchos hermanos)
// usan letra más chica para no desperdiciar tanto en wrap.
function fontBaseParaAncho(w) {
  if (w >= 170) return 16
  if (w >= 120) return 14
  if (w >= 80) return 12
  return 10
}

// Mide cuánto alto necesita `texto` para no desbordar su caja de ancho `w` a
// un fontSize dado; si ni al fontSize mínimo cabe dentro de ALTO_CAJA_TOPE,
// se acepta el desborde (texto muy largo en caja muy angosta, caso extremo).
function medirCaja(ctx, texto, w, { bold = false, areaTag = false } = {}) {
  let fontSize = fontBaseParaAncho(w)
  const areaH = areaTag ? AREA_TAG_H : 0
  for (; fontSize >= 9; fontSize--) {
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Arial`
    const lineas = wrapText(ctx, texto, w - 14)
    const lineH = fontSize * 1.25
    const h = lineas.length * lineH + 16 + areaH
    if (h <= ALTO_CAJA_TOPE || fontSize === 9) return { fontSize, lineas, lineH, h }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawBox(ctx, x, y, w, h, texto, { destacado, areaTag, medida } = {}) {
  ctx.strokeStyle = GUINDA
  ctx.lineWidth = destacado ? 3 : 1.5
  ctx.fillStyle = destacado ? '#E6D2C8' : '#FFFFFF'
  roundRect(ctx, x, y, w, h, 6)
  ctx.fill(); ctx.stroke()

  const areaH = areaTag ? AREA_TAG_H : 0
  const hTexto = h - areaH
  const { fontSize, lineas, lineH } = medida || medirCaja(ctx, texto, w, { bold: destacado, areaTag: !!areaTag })
  ctx.font = `${destacado ? 'bold ' : ''}${fontSize}px Arial`
  ctx.fillStyle = '#191919'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const inicioY = y + hTexto / 2 - ((lineas.length - 1) * lineH) / 2 + fontSize * 0.32
  lineas.forEach((l, i) => ctx.fillText(l, x + w / 2, inicioY + i * lineH))

  if (areaTag) {
    ctx.strokeStyle = DORADO; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x + 4, y + hTexto); ctx.lineTo(x + w - 4, y + hTexto); ctx.stroke()
    ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#82641E'
    const etiqueta = areaTag.length > 42 ? `${areaTag.slice(0, 42)}…` : areaTag
    ctx.fillText(etiqueta, x + w / 2, y + h - 6)
  }
}

function drawConector(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = GRIS; ctx.lineWidth = 1
  const yMid = (y1 + y2) / 2
  ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x1, yMid); ctx.lineTo(x2, yMid); ctx.lineTo(x2, y2)
  ctx.stroke()
}

function layoutFila(nodos, usable, boxW, margen) {
  const n = Math.max(nodos.length, 1)
  const totalW = boxW * n + GAP_X * (n - 1)
  const startX = margen + Math.max(0, (usable - totalW) / 2)
  return nodos.map((nodo, i) => ({ nodo, x: startX + i * (boxW + GAP_X), w: boxW }))
}

// Alto que necesita una fila completa: el máximo entre todas sus cajas, para
// que todas las cajas de esa fila compartan el mismo alto (visualmente
// parejo, igual que el PDF).
function alturaFila(ctx, fila, { destacado, areaTag } = () => false) {
  let maxH = BOX_H_MIN
  const medidas = fila.map(({ nodo, w }) => {
    const tag = areaTag ? areaTag(nodo) : null
    const m = medirCaja(ctx, nodo.texto, w, { bold: !!destacado, areaTag: !!tag })
    maxH = Math.max(maxH, m.h)
    return { nodo, medida: m, tag }
  })
  return { h: maxH, medidas }
}

// Como el alto de cada fila ahora crece según su contenido (a diferencia del
// PDF, que usa BOX_H fijo y por eso nunca tiene este problema), el espacio
// entre etiquetas vecinas puede quedar angosto — se encoge la fuente hasta
// que el texto rotado (cuyo "alto" en pantalla es su ancho sin rotar) quepa
// en `alturaDisponible`, mismo criterio que etiquetaFilaVertical() en
// expedienteMMLSecciones.js.
function etiquetaVertical(ctx, texto, x, yCentro, alturaDisponible = Infinity) {
  let fontSize = 16
  ctx.font = `bold ${fontSize}px Arial`
  let w = ctx.measureText(texto).width
  const maxW = alturaDisponible - 10
  while (w > maxW && fontSize > 8) {
    fontSize -= 1
    ctx.font = `bold ${fontSize}px Arial`
    w = ctx.measureText(texto).width
  }
  ctx.save()
  ctx.fillStyle = '#232323'; ctx.textAlign = 'center'
  ctx.translate(x, yCentro); ctx.rotate(-Math.PI / 2)
  ctx.fillText(texto, 0, 0)
  ctx.restore()
}

// tipoConfig: { tipoRaiz, tipoSuperior, tipoPrimario, tipoSuperiorGeneral,
//   labelRaiz, labelSuperior, labelPrimario, labelSuperiorGeneral }
// Devuelve { dataUrl, width, height } — ancho fijo (WIDTH), alto calculado
// según cuántos niveles trae este árbol y cuánto alto necesita cada fila.
export function arbolDiagramaDataURL(datos, arbolTipo, tipoConfig) {
  const WIDTH = 1900
  const nodos = arbolTipo === 'PROBLEMA' ? (datos.arbolProblema || []) : (datos.arbolObjetivos || [])
  const raiz = nodos.find(n => n.tipo === tipoConfig.tipoRaiz && !n.padre_id)

  if (!raiz) {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH; canvas.height = 200
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WIDTH, 200)
    ctx.fillStyle = GRIS; ctx.font = '20px Arial'; ctx.textAlign = 'center'
    ctx.fillText('Sin árbol capturado todavía para este programa/año.', WIDTH / 2, 100)
    return { dataUrl: canvas.toDataURL('image/png'), width: WIDTH, height: 200 }
  }

  const general = tipoConfig.tipoSuperiorGeneral
    ? nodos.find(n => n.tipo === tipoConfig.tipoSuperiorGeneral && n.padre_id === raiz.id)
    : null
  const superioresPadreId = general ? general.id : raiz.id
  const superiores = nodos.filter(n => n.tipo === tipoConfig.tipoSuperior && n.padre_id === superioresPadreId)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const primarios = nodos.filter(n => n.tipo === tipoConfig.tipoPrimario && n.padre_id === raiz.id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const hijosDe = p => nodos.filter(n => n.padre_id === p.id).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const hayFilaSecundaria = primarios.some(p => hijosDe(p).length)

  const mostrarArea = arbolTipo === 'OBJETIVOS'
  const areaTag = nodo => (mostrarArea && nodo.indicador?.areas?.nombre) || null

  const usable = WIDTH - MARGEN * 2

  // Canvas de medición (mismo font metrics que el final, tamaño mínimo) —
  // se usa solo para calcular anchos/altos antes de saber el alto total.
  const medCanvas = document.createElement('canvas')
  medCanvas.width = WIDTH; medCanvas.height = 10
  const medCtx = medCanvas.getContext('2d')

  const nSup = Math.max(superiores.length, 1)
  const boxWSuperior = Math.min(BOX_W_MAX, (usable - GAP_X * (nSup - 1)) / nSup)
  const filaSup = layoutFila(superiores, usable, boxWSuperior, MARGEN)
  const { h: hSup, medidas: medidasSup } = alturaFila(medCtx, filaSup, { areaTag })

  const hGeneral = general ? medirCaja(medCtx, general.texto, boxWSuperior * nSup + GAP_X * (nSup - 1), { bold: true }).h : 0

  const pesos = primarios.map(p => Math.max(1, hijosDe(p).length))
  const pesoTotal = pesos.reduce((a, b) => a + b, 0) || 1
  const gapsPrim = GAP_X * (Math.max(primarios.length, 1) - 1)
  const anchoDisponiblePrim = usable - gapsPrim
  const CAJA_PRIM_MAX = 360
  const anchosPrim = pesos.map(p => Math.min(CAJA_PRIM_MAX, anchoDisponiblePrim * p / pesoTotal))
  const anchoTotalPrim = anchosPrim.reduce((a, b) => a + b, 0) + gapsPrim
  let cursorX = MARGEN + Math.max(0, (usable - anchoTotalPrim) / 2)
  const filaPrim = primarios.map((nodo, i) => {
    const item = { nodo, x: cursorX, w: anchosPrim[i] }
    cursorX += anchosPrim[i] + GAP_X
    return item
  })
  const { h: hPrim, medidas: medidasPrim } = alturaFila(medCtx, filaPrim, { areaTag })

  const totalSuperior = boxWSuperior * nSup + GAP_X * (nSup - 1)
  const raizW = Math.max(totalSuperior, anchoTotalPrim, BOX_W_MAX)
  const hRaiz = medirCaja(medCtx, raiz.texto, raizW, { bold: true, areaTag: !!areaTag(raiz) }).h

  // Grupos de la fila secundaria (sub-causas/sub-medios) con su propio
  // carril bajo cada primario — se calculan ahora (posiciones x) para poder
  // medir su altura antes de fijar el alto total del canvas.
  const gruposSec = filaPrim.map(({ nodo: primario, x: xPrim, w: wPrim }) => {
    const hijos = hijosDe(primario)
    if (!hijos.length) return null
    const carrilW = wPrim + GAP_X
    const hijoW = Math.max(24, (carrilW - GAP_X * (hijos.length - 1)) / hijos.length)
    const anchoGrupo = hijoW * hijos.length + GAP_X * (hijos.length - 1)
    const inicioX = xPrim + wPrim / 2 - anchoGrupo / 2
    return { xPrim, wPrim, cajas: hijos.map((hijo, i) => ({ nodo: hijo, x: inicioX + i * (hijoW + GAP_X), w: hijoW })) }
  }).filter(Boolean)
  const todasCajasSec = gruposSec.flatMap(g => g.cajas)
  const { h: hSec, medidas: medidasSec } = hayFilaSecundaria
    ? alturaFila(medCtx, todasCajasSec, { areaTag })
    : { h: 0, medidas: [] }

  let y = 24
  const yGeneral = y
  if (general) y += hGeneral + 30
  const ySup = y
  y += hSup + GAP_TIER
  const yRaiz = y
  y += hRaiz + GAP_TIER
  const yPrim = y
  let ySec = null
  if (hayFilaSecundaria) { y += hPrim + GAP_TIER; ySec = y }
  y += (hayFilaSecundaria ? hSec : hPrim) + 40 // margen inferior
  const HEIGHT = Math.round(y)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  medidasSup.forEach(({ nodo, medida, tag }, i) => {
    const { x, w } = filaSup[i]
    drawBox(ctx, x, ySup, w, hSup, nodo.texto, { areaTag: tag, medida })
  })

  if (general) {
    const generalX = (WIDTH - totalSuperior) / 2
    drawBox(ctx, generalX, yGeneral, totalSuperior, hGeneral, general.texto, { destacado: true })
    filaSup.forEach(({ x, w }) => drawConector(ctx, x + w / 2, ySup, generalX + totalSuperior / 2, yGeneral + hGeneral))
  }

  const raizX = (WIDTH - raizW) / 2
  drawBox(ctx, raizX, yRaiz, raizW, hRaiz, raiz.texto, { destacado: true, areaTag: areaTag(raiz) })
  filaSup.forEach(({ x, w }) => drawConector(ctx, x + w / 2, ySup + hSup, raizX + raizW / 2, yRaiz))

  medidasPrim.forEach(({ nodo, medida, tag }, i) => {
    const { x, w } = filaPrim[i]
    drawBox(ctx, x, yPrim, w, hPrim, nodo.texto, { areaTag: tag, medida })
    drawConector(ctx, raizX + raizW / 2, yRaiz + hRaiz, x + w / 2, yPrim)
  })

  if (ySec != null) {
    let idx = 0
    gruposSec.forEach(({ xPrim, wPrim, cajas }) => {
      cajas.forEach(({ x, w }) => {
        const { nodo, medida, tag } = medidasSec[idx++]
        drawBox(ctx, x, ySec, w, hSec, nodo.texto, { areaTag: tag, medida })
        drawConector(ctx, xPrim + wPrim / 2, yPrim + hPrim, x + w / 2, ySec)
      })
    })
  }

  // Cada etiqueta recibe como "espacio disponible" la banda completa que le
  // toca (desde el inicio de su fila hasta el inicio de la siguiente) — así
  // nunca se encima con la etiqueta vecina sin importar qué tan angosta haya
  // quedado una fila.
  const xEtiqueta = MARGEN / 2
  const bordes = [...(general ? [yGeneral] : []), ySup, yRaiz, yPrim, ...(ySec != null ? [ySec] : []), HEIGHT - 40]
  let bi = 0
  if (general) { etiquetaVertical(ctx, tipoConfig.labelSuperiorGeneral, xEtiqueta, yGeneral + hGeneral / 2, bordes[bi + 1] - bordes[bi]); bi++ }
  etiquetaVertical(ctx, tipoConfig.labelSuperior, xEtiqueta, ySup + hSup / 2, bordes[bi + 1] - bordes[bi]); bi++
  etiquetaVertical(ctx, tipoConfig.labelRaiz, xEtiqueta, yRaiz + hRaiz / 2, bordes[bi + 1] - bordes[bi]); bi++
  etiquetaVertical(ctx, tipoConfig.labelPrimario, xEtiqueta, yPrim + hPrim / 2, bordes[bi + 1] - bordes[bi])

  return { dataUrl: canvas.toDataURL('image/png'), width: WIDTH, height: HEIGHT }
}

function canvasVacio(width, mensaje) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = 200
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, 200)
  ctx.fillStyle = GRIS; ctx.font = '20px Arial'; ctx.textAlign = 'center'
  ctx.fillText(mensaje, width / 2, 100)
  return { dataUrl: canvas.toDataURL('image/png'), width, height: 200 }
}

function canvasMedicion(width) {
  const c = document.createElement('canvas')
  c.width = width; c.height = 10
  return c.getContext('2d')
}

// ── PP-FM-08: Acciones — Objetivo central → Medios/Componentes → Actividades ──
// Mismo patrón que drawAcciones() en el PDF (un cuadro por Medio, un único
// cuadro debajo que agrupa TODAS las actividades de ese Medio), pero con alto
// de fila dinámico en vez de fuente fija truncada.
export function accionesDiagramaDataURL(datos) {
  const WIDTH = 1900
  const grupos = numerarComponentesActividades(datos)
  if (!grupos.length) return canvasVacio(WIDTH, 'Sin Árbol de Objetivos capturado todavía para este programa/año.')

  const objetivo = (datos.arbolObjetivos || []).find(n => n.tipo === 'OBJETIVO' && !n.padre_id)
  const medCtx = canvasMedicion(WIDTH)
  const MARGEN_L = 30
  const usable = WIDTH - MARGEN_L * 2

  const n = grupos.length
  const boxW = Math.min(260, (usable - GAP_X * (n - 1)) / n)
  const filaMedios = layoutFila(grupos.map(g => ({ texto: `${g.numero}. ${g.medio.texto}`, _g: g })), usable, boxW, MARGEN_L)
  const { h: hMedios, medidas: medidasMedios } = alturaFila(medCtx, filaMedios, {})

  const objW = Math.max(boxW * n + GAP_X * (n - 1), BOX_W_MAX)
  const hObj = medirCaja(medCtx, objetivo?.texto || '—', objW, { bold: true }).h

  const cajasAct = filaMedios.map(({ nodo, x, w }) => {
    const g = nodo._g
    const texto = g.actividades.length ? g.actividades.map(a => `${a.numero} ${a.actividad.texto}`).join('\n') : '— sin actividades capturadas —'
    return { texto, x, w }
  })
  const { h: hAct, medidas: medidasAct } = alturaFila(medCtx, cajasAct.map(c => ({ nodo: { texto: c.texto }, w: c.w })), {})

  let y = 24
  const yObj = y; y += hObj + GAP_TIER
  const yMedios = y; y += hMedios + GAP_TIER
  const yAct = y; y += hAct + 40
  const HEIGHT = Math.round(y)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const objX = (WIDTH - objW) / 2
  drawBox(ctx, objX, yObj, objW, hObj, objetivo?.texto || '—', { destacado: true })

  medidasMedios.forEach(({ nodo, medida }, i) => {
    const { x, w } = filaMedios[i]
    drawBox(ctx, x, yMedios, w, hMedios, nodo.texto, { medida })
    drawConector(ctx, objX + objW / 2, yObj + hObj, x + w / 2, yMedios)
  })

  cajasAct.forEach(({ x, w, texto }, i) => {
    drawBox(ctx, x, yAct, w, hAct, texto, { medida: medidasAct[i].medida })
    drawConector(ctx, filaMedios[i].x + filaMedios[i].w / 2, yMedios + hMedios, x + w / 2, yAct)
  })

  const xEtiqueta = MARGEN_L / 2
  etiquetaVertical(ctx, 'OBJETIVO', xEtiqueta, yObj + hObj / 2, GAP_TIER + Math.min(hObj, hMedios))
  etiquetaVertical(ctx, 'MEDIOS / ENTREGABLES', xEtiqueta, yMedios + hMedios / 2, GAP_TIER + Math.min(hMedios, hAct))
  etiquetaVertical(ctx, 'ACTIVIDADES', xEtiqueta, yAct + hAct / 2, GAP_TIER)

  return { dataUrl: canvas.toDataURL('image/png'), width: WIDTH, height: HEIGHT }
}

// ── PP-FM-09: Alternativas — cada Actividad arriba, todas conectadas a un ──
// único cuadro combinado abajo — mismo patrón que drawAlternativas() en el
// PDF (2 filas si hay más de 9 actividades).
export function alternativasDiagramaDataURL(datos) {
  const WIDTH = 1900
  const grupos = numerarComponentesActividades(datos)
  const actividades = grupos.flatMap(g => g.actividades)
  if (!actividades.length) return canvasVacio(WIDTH, 'Sin actividades capturadas todavía en el Árbol de Objetivos.')

  const medCtx = canvasMedicion(WIDTH)
  const MARGEN_L = 30
  const usable = WIDTH - MARGEN_L * 2

  const FILA_MAX_ACT = 9
  const filas = actividades.length > FILA_MAX_ACT
    ? [actividades.slice(0, Math.ceil(actividades.length / 2)), actividades.slice(Math.ceil(actividades.length / 2))]
    : [actividades]
  const nMax = Math.max(...filas.map(f => f.length))
  const boxW = Math.min(260, (usable - GAP_X * (nMax - 1)) / nMax)
  const filasLayout = filas.map(f => layoutFila(f.map(a => ({ texto: `${a.numero} ${a.actividad.texto}` })), usable, boxW, MARGEN_L))
  const alturasFilas = filasLayout.map(fl => alturaFila(medCtx, fl, {}))
  const hAct = Math.max(...alturasFilas.map(a => a.h))
  const ROW_GAP_ACT = 20
  const hActTotal = filas.length * hAct + (filas.length - 1) * ROW_GAP_ACT

  const textoAlt = actividades.map(a => `${a.numero} ${a.actividad.texto}`).join('\n+\n')
  const altW = Math.max(nMax * boxW + GAP_X * (nMax - 1), BOX_W_MAX)
  const hAlt = medirCaja(medCtx, textoAlt, altW, { bold: true }).h

  let y = 24
  const yActBase = y; y += hActTotal + GAP_TIER
  const yAlt = y; y += hAlt + 40
  const HEIGHT = Math.round(y)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const altX = (WIDTH - altW) / 2
  filasLayout.forEach((fl, fi) => {
    const yF = yActBase + fi * (hAct + ROW_GAP_ACT)
    const { medidas } = alturasFilas[fi]
    medidas.forEach(({ nodo, medida }, i) => {
      const { x, w } = fl[i]
      drawBox(ctx, x, yF, w, hAct, nodo.texto, { medida })
      drawConector(ctx, x + w / 2, yF + hAct, altX + altW / 2, yAlt)
    })
  })
  drawBox(ctx, altX, yAlt, altW, hAlt, textoAlt, { destacado: true })

  const xEtiqueta = MARGEN_L / 2
  etiquetaVertical(ctx, 'ACTIVIDADES', xEtiqueta, yActBase + hActTotal / 2, hActTotal)
  etiquetaVertical(ctx, 'ALTERNATIVAS', xEtiqueta, yAlt + hAlt / 2, GAP_TIER)

  return { dataUrl: canvas.toDataURL('image/png'), width: WIDTH, height: HEIGHT }
}

// ── PP-FM-05: Mapa de Relaciones / Involucrados — 4 paneles (Beneficiarios/ ──
// Ejecutores/Opositores/Indiferentes) con lista de actores en viñetas, mismo
// patrón que drawInvolucrados() en el PDF pero con alto de panel dinámico.
function alturaPanelInvolucrado(ctx, actores, w) {
  ctx.font = '15px Arial'
  const maxW = w - 40
  const items = actores.length ? actores.map(a => `•  ${a}`) : ['— sin registrar —']
  let totalLineas = 0
  items.forEach(item => { totalLineas += wrapText(ctx, item, maxW).length })
  return Math.max(140, 68 + totalLineas * 20.25 + 20)
}

function drawPanelInvolucrado(ctx, x, y, w, h, titulo, actores) {
  ctx.strokeStyle = GUINDA; ctx.lineWidth = 2
  ctx.fillStyle = '#FAF8F5'
  roundRect(ctx, x, y, w, h, 8); ctx.fill(); ctx.stroke()

  ctx.fillStyle = GUINDA; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(titulo, x + w / 2, y + 30)
  ctx.strokeStyle = '#D2BEB4'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(x + 16, y + 42); ctx.lineTo(x + w - 16, y + 42); ctx.stroke()

  const listaX = x + 20
  let listaY = y + 68
  const maxW = w - 40
  ctx.textAlign = 'left'; ctx.fillStyle = '#232323'; ctx.font = '15px Arial'
  const lineH = 20.25
  const items = actores.length ? actores.map(a => `•  ${a}`) : ['— sin registrar —']
  items.forEach(item => {
    wrapText(ctx, item, maxW).forEach(l => { ctx.fillText(l, listaX, listaY); listaY += lineH })
  })
}

export function involucradosDiagramaDataURL(datos) {
  const WIDTH = 1900
  const categorias = [
    { key: 'BENEFICIARIO', label: 'Beneficiarios' },
    { key: 'EJECUTOR', label: 'Ejecutores' },
    { key: 'OPOSITOR', label: 'Opositores' },
    { key: 'INDIFERENTE', label: 'Indiferentes' },
  ]
  const porCategoria = categorias.map(c => ({ ...c, actores: (datos.involucrados || []).filter(a => a.categoria === c.key).map(a => a.actor) }))

  const MARGEN_L = 30, GAP = 24
  const colW = (WIDTH - MARGEN_L * 2 - GAP) / 2
  const medCtx = canvasMedicion(WIDTH)
  const alturas = porCategoria.map(c => alturaPanelInvolucrado(medCtx, c.actores, colW))
  const rowH1 = Math.max(alturas[0], alturas[1])
  const rowH2 = Math.max(alturas[2], alturas[3])
  const HEIGHT = Math.round(MARGEN_L + rowH1 + GAP + rowH2 + MARGEN_L)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const posiciones = [
    [MARGEN_L, MARGEN_L, rowH1], [MARGEN_L + colW + GAP, MARGEN_L, rowH1],
    [MARGEN_L, MARGEN_L + rowH1 + GAP, rowH2], [MARGEN_L + colW + GAP, MARGEN_L + rowH1 + GAP, rowH2],
  ]
  porCategoria.forEach((c, i) => {
    const [x, y, h] = posiciones[i]
    drawPanelInvolucrado(ctx, x, y, colW, h, c.label, c.actores)
  })

  return { dataUrl: canvas.toDataURL('image/png'), width: WIDTH, height: HEIGHT }
}
