// ── Excel del Expediente MML — espejo de generarExpedienteMML (PDF) ──────────
// Mismo patrón que reportesExcel.js: ExcelJS + estilos compartidos de
// reportesBase.js. Una hoja por cada página/sección del PDF, en el mismo
// orden, para que quien ya conoce el PDF encuentre todo en el mismo lugar
// pero en formato editable/filtrable. Los árboles del Problema y de
// Objetivos, y también Acciones/Alternativas/Involucrados, se insertan como
// imagen (arbolDiagramaCanvas.js) para no perder el formato de cajas +
// conectores — no hay forma nativa de dibujar eso en Excel.
import ExcelJS from 'exceljs'
import { LOGO_BASE64 } from '../logo.js'
import { supabase, resolverDatosMML } from '../lib/supabase.js'
import { XL, ENTIDAD_NOMBRE, styleHeader, styleData, styleTotal, descargarExcel } from './reportesBase.js'
import {
  INDICE_FORMATOS, etiquetaNivelMIR, resolverFicha, subtituloEjercicioFiscal, DESCRIPCION_HOJAS,
  unirOraciones, resolverFichaIndicador, resultadoTexto, subtituloAnteproyecto,
} from './expedienteMMLContenido.js'
import {
  arbolDiagramaDataURL, accionesDiagramaDataURL, alternativasDiagramaDataURL, involucradosDiagramaDataURL,
} from './arbolDiagramaCanvas.js'
import { alturaFilaPrecisa } from './excelCeldaAjustada.js'

// Mismos catálogos que TIPO_CONFIG_PROBLEMA/TIPO_CONFIG_OBJETIVOS en
// reporteExpedienteMML.js — duplicados aquí (en vez de importados) para que
// este módulo no arrastre jsPDF como dependencia solo por esas 2 constantes.
const TIPO_CONFIG_PROBLEMA = {
  tipoRaiz: 'CENTRAL', tipoSuperior: 'EFECTO', tipoPrimario: 'CAUSA',
  labelRaiz: 'PROBLEMA CENTRAL', labelSuperior: 'EFECTOS', labelPrimario: 'CAUSAS',
  tipoSuperiorGeneral: 'EFECTO_GENERAL', labelSuperiorGeneral: 'EFECTO',
}
const TIPO_CONFIG_OBJETIVOS = {
  tipoRaiz: 'OBJETIVO', tipoSuperior: 'FIN', tipoPrimario: 'MEDIO',
  labelRaiz: 'OBJETIVO CENTRAL', labelSuperior: 'FINES', labelPrimario: 'MEDIOS',
  tipoSuperiorGeneral: 'FIN_GENERAL', labelSuperiorGeneral: 'FIN',
}

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

// Anchos de columna compartidos entre encabezado/identificación/tabla/firmas
// de cada hoja — la MISMA lista de anchos se usa en las 4 partes para que el
// banner y el bloque de firmas midan exactamente lo mismo que la tabla de
// contenido de esa hoja (nunca más ancho ni más angosto).
// Regla de rejilla (auditoría 2026-08-25): TODA hoja declara al menos 4
// columnas y sus anchos se eligen para que los 4 cuartos midan casi lo mismo,
// porque el bloque de firmas se reparte en 4. Antes, las hojas de 2 columnas
// dejaban 2 firmas fuera de la tabla (en columnas huérfanas de ancho por
// defecto) y en las demás los bloques salían muy dispares (38/66/8/18).
// Hojas que solo llevan un diagrama: los 2 árboles, Involucrados, Acciones y
// Alternativas. Las cinco comparten rejilla para medir exactamente lo mismo.
const ANCHOS_DIAGRAMA = [35, 35, 35, 35]
// Hojas de etiqueta/valor (Descripciones, Transformación Deseada): 4 columnas
// parejas en vez de 2 desiguales. La etiqueta ocupa la 1ª y el valor combina
// las 3 restantes, así el ancho total y el reparto de firmas quedan iguales
// entre estas hojas.
const ANCHOS_TEXTO = [28, 28, 28, 28]

// Alto del banner (filas 1-3) en puntos, para dimensionar el logo con él.
const BANNER_FILAS = [30, 24, 20]
const BANNER_ALTO_PT = BANNER_FILAS.reduce((a, b) => a + b, 0)

// Encabezado propio del Expediente MML. No se usa addSheetHeader() de
// reportesBase.js porque ese centra el título sobre las columnas 2..N (deja la
// 1ª para el logo), lo que en estas hojas lo dejaba visiblemente cargado a la
// derecha, y con 2 columnas producía un merge de una sola celda. Aquí el
// título se combina sobre TODAS las columnas y el logo va flotando encima,
// que es lo que lo deja centrado de verdad. addSheetHeader() se deja intacta
// porque la comparten los otros 3 generadores de Excel del proyecto.
function addEncabezadoMML(ws, titulo, logoId, anio, anchos) {
  const cols = anchos.length
  // La rejilla se declara AQUÍ, antes de escribir nada. Asignar ws.columns al
  // final de la hoja no siempre prendía (las 26 fichas de indicador acababan
  // sin anchos y Excel las mostraba con el ancho por defecto); hacerlo de
  // entrada, una sola vez por hoja, lo deja fuera de duda.
  ws.columns = anchos.map(w => ({ width: w }))
  BANNER_FILAS.forEach((h, i) => { ws.getRow(i + 1).height = h })
  ws.getRow(4).height = 8
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= cols; c++) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    }
  }

  // Los 3 renglones del encabezado, cada uno a todo lo ancho de la hoja:
  // entidad, ejercicio fiscal y nombre de la hoja (antes el título ocupaba las
  // 2 primeras filas y la 3ª decía "Periodo: <clave programa> · <año>").
  const renglones = [
    { texto: ENTIDAD_NOMBRE, font: { bold: true, size: 13, color: { argb: XL.blanco } } },
    { texto: subtituloAnteproyecto(anio), font: { size: 11, color: { argb: XL.blanco } } },
    { texto: titulo, font: { bold: true, size: 12, color: { argb: XL.blanco } } },
  ]
  renglones.forEach((r, i) => {
    ws.mergeCells(i + 1, 1, i + 1, cols)
    const cell = ws.getCell(i + 1, 1)
    cell.value = r.texto
    cell.font = r.font
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })

  // El logo flota sobre el banner (no ocupa columna), con lado proporcional al
  // alto de las 3 filas: antes era 64x64 fijo, sin relación con el banner.
  const lado = Math.round(BANNER_ALTO_PT * (4 / 3) * 0.82) // pt -> px, con margen
  ws.addImage(logoId, { tl: { col: 0.15, row: 0.15 }, ext: { width: lado, height: lado } })
  ws.addRow([])
}

// Nombre de hoja válido para ExcelJS: sin caracteres prohibidos, máx 31
// caracteres, único dentro del libro (Excel no permite hojas duplicadas).
function nombreHoja(base, usados) {
  let limpio = String(base).replace(/[*?:\\/[\]]/g, '').trim().slice(0, 31) || 'Hoja'
  let nombre = limpio, i = 2
  while (usados.has(nombre)) {
    const sufijo = ` (${i++})`
    nombre = limpio.slice(0, 31 - sufijo.length) + sufijo
  }
  usados.add(nombre)
  return nombre
}

// Tabla simple: fila de encabezado + filas de datos. El alto de cada fila y
// el tamaño de fuente de cada celda se calculan con alturaFilaPrecisa()
// (medición real con canvas, no estimación por caracteres) para que ninguna
// celda quede más baja de lo que su texto necesita — si aun así el texto es
// demasiado largo para un alto razonable, la fuente se achica en vez de
// seguir agrandando la fila. Deja `ws.columns` fijado al terminar.
function tabla(ws, headers, rows, widths) {
  const hdr = ws.addRow(headers)
  const hdrFit = alturaFilaPrecisa(headers.map((h, i) => ({ texto: h, anchoUnidades: widths[i], fontMaxPt: 10, fontMinPt: 8, bold: true, altoTopePt: 60 })))
  hdr.eachCell((c, i) => { styleHeader(c); c.font = { ...c.font, size: hdrFit.celdas[i - 1].fontPt } })
  hdr.height = hdrFit.altoPt

  rows.forEach((r, i) => {
    const row = ws.addRow(r)
    const fit = alturaFilaPrecisa(r.map((v, ci) => ({ texto: v, anchoUnidades: widths[ci] })))
    row.eachCell((c, ci) => { styleData(c, i % 2 === 1); c.font = { ...c.font, size: fit.celdas[ci - 1].fontPt } })
    row.height = fit.altoPt
  })
  ws.columns = widths.map(w => ({ width: w }))
  return hdr
}

// Tabla cuyas columnas LÓGICAS abarcan varias columnas de la rejilla de la
// hoja. `spans` dice cuántas columnas de rejilla ocupa cada columna lógica y
// debe sumar anchos.length. Así todas las tablas de una hoja terminan en el
// mismo borde derecho —lo que pidió Hugo— y la rejilla puede tener el número
// de columnas que convenga para que las 4 firmas queden parejas.
// Los valores se escriben SIEMPRE en la celda maestra de cada merge: si se
// usara tabla() tal cual, el 2º valor caería en una celda absorbida y se
// perdería en silencio.
function tablaEnRejilla(ws, headers, rows, anchos, spans) {
  const total = spans.reduce((a, b) => a + b, 0)
  if (total !== anchos.length) throw new Error(`spans suma ${total} y la rejilla tiene ${anchos.length} columnas`)

  // Columna de rejilla donde arranca cada columna lógica, y su ancho real.
  const inicio = []
  const ancho = []
  let c = 1
  spans.forEach(sp => { inicio.push(c); ancho.push(anchos.slice(c - 1, c - 1 + sp).reduce((a, b) => a + b, 0)); c += sp })

  const fila = (valores, estilo, opciones) => {
    const celdas = new Array(anchos.length).fill(null)
    valores.forEach((v, i) => { celdas[inicio[i] - 1] = v })
    const row = ws.addRow(celdas)
    const fit = alturaFilaPrecisa(valores.map((v, i) => ({ texto: v, anchoUnidades: ancho[i], ...opciones })))
    valores.forEach((_, i) => {
      const sp = spans[i]
      if (sp > 1) ws.mergeCells(row.number, inicio[i], row.number, inicio[i] + sp - 1)
      const cell = row.getCell(inicio[i])
      estilo(cell)
      cell.font = { ...cell.font, size: fit.celdas[i].fontPt }
    })
    row.height = fit.altoPt
    return row
  }

  fila(headers, styleHeader, { fontMaxPt: 10, fontMinPt: 8, bold: true, altoTopePt: 60 })
  rows.forEach((r, i) => fila(r, cell => styleData(cell, i % 2 === 1)))
  ws.columns = anchos.map(w => ({ width: w }))
}

function bloqueTexto(ws, titulo, texto, cols, anchoUnidades) {
  const tRow = ws.addRow([titulo])
  ws.mergeCells(tRow.number, 1, tRow.number, cols)
  tRow.getCell(1).font = { bold: true, color: { argb: XL.guinda }, size: 11 }
  const cRow = ws.addRow([texto || '—'])
  ws.mergeCells(cRow.number, 1, cRow.number, cols)
  const fit = alturaFilaPrecisa([{ texto: texto || '—', anchoUnidades, fontMaxPt: 10, fontMinPt: 8.5, altoTopePt: 400 }])
  const cCell = cRow.getCell(1)
  cCell.alignment = { wrapText: true, vertical: 'top' }
  cCell.font = { size: fit.celdas[0].fontPt }
  cRow.height = fit.altoPt
  ws.addRow([])
}

// Bloque de identificación Eje/Programa/Entidad/Unidad Responsable — mismas
// 4 filas y mismo orden que trae el documento oficial (PROGRAMATICOS
// PRESUPUESTO TESORERIA) en cada uno de sus formatos PP-FM, justo debajo del
// encabezado institucional y antes de la tabla de contenido. `anchos` es la
// MISMA lista de anchos de columna que usará la tabla de esta hoja, para que
// el valor (columna 2 en adelante, fusionada) mida el ancho real de la tabla.
function addIdentificacion(ws, datos, anchos) {
  const cols = anchos.length
  // La etiqueta abarca las columnas que necesite para llegar a ANCHO_MIN: el
  // rótulo más largo es "Unidad Responsable:" (19 caracteres) y en rejillas de
  // columnas angostas —como la del Cronograma, de 12— no cabía en la primera.
  const ANCHO_MIN = 20
  let colLabel = 1, anchoLabel = anchos[0]
  while (anchoLabel < ANCHO_MIN && colLabel < cols - 1) { colLabel++; anchoLabel += anchos[colLabel - 1] }
  const anchoValor = anchos.slice(colLabel).reduce((a, b) => a + b, 0) || anchoLabel

  const p = datos.programa || {}
  const filas = [
    ['Eje:', `${p.eje_id ?? ''}. ${datos.ejeNombre || ''}`],
    ['Programa:', `${p.clave || ''}. ${p.nombre || ''}`],
    ['Entidad:', ENTIDAD_NOMBRE],
    ['Unidad Responsable:', p.unidad_resp || '—'],
  ]
  filas.forEach(([label, val]) => {
    const celdas = new Array(cols).fill(null)
    celdas[0] = label
    celdas[colLabel] = val
    const row = ws.addRow(celdas)
    if (colLabel > 1) ws.mergeCells(row.number, 1, row.number, colLabel)
    row.getCell(1).font = { bold: true, size: 9, color: { argb: XL.guinda } }
    row.getCell(1).alignment = { vertical: 'middle', wrapText: true }
    if (cols > colLabel + 1) ws.mergeCells(row.number, colLabel + 1, row.number, cols)
    const vc = row.getCell(colLabel + 1)
    const fit = alturaFilaPrecisa([{ texto: val, anchoUnidades: anchoValor, fontMaxPt: 9.5, fontMinPt: 8, altoTopePt: 60 }])
    vc.font = { size: fit.celdas[0].fontPt }
    vc.alignment = { wrapText: true, vertical: 'middle' }
    row.height = fit.altoPt
  })
  ws.addRow([])
}

// Divide el ancho TOTAL de columnas (en unidades Excel, no en cantidad de
// columnas) en `nBloques` tramos lo más parejos posible — necesario porque
// las columnas de cada hoja tienen anchos muy distintos entre sí (ej. una
// columna de "#" de 6 unidades junto a una de narrativa de 40); repartir por
// CANTIDAD de columnas en vez de por ancho real dejaba bloques de firma
// completamente desproporcionados entre sí.
function dividirEnBloques(anchos, nBloques) {
  const nCols = anchos.length
  // Con menos columnas que bloques no hay forma de partir: cada bloque tomaba
  // una columna, y las que sobraban caían FUERA de la tabla, con el ancho por
  // defecto de Excel — así se veían firmas colgando a la derecha del recuadro
  // (auditoría 2026-08-25). Ahora toda hoja declara >= nBloques columnas
  // (ANCHOS_TEXTO y compañía), así que esto solo protege de un descuido.
  if (nCols < nBloques) {
    throw new Error(`La hoja declara ${nCols} columnas y las firmas necesitan al menos ${nBloques}`)
  }

  // Búsqueda EXHAUSTIVA del reparto más parejo. El criterio anterior era
  // ávido —cada corte caía en la primera columna que cruzaba k/nBloques del
  // total— y con columnas de anchos muy dispares daba bloques como 38/66/8/18
  // (auditoría 2026-08-25). Aquí se prueban todas las combinaciones de cortes
  // y gana la de menor diferencia entre el bloque más ancho y el más angosto;
  // a igualdad, la de menor desviación respecto del ancho ideal. El espacio de
  // búsqueda es diminuto (C(nCols-1, nBloques-1), decenas o cientos de casos
  // con las tablas de este documento), así que la fuerza bruta sobra.
  const prefijo = [0]
  anchos.forEach(w => prefijo.push(prefijo[prefijo.length - 1] + w))
  const anchoDe = (desde, hasta) => prefijo[hasta] - prefijo[desde - 1]
  const ideal = prefijo[nCols] / nBloques

  let mejor = null
  const cortes = []
  const explorar = (bloque, inicio) => {
    if (bloque === nBloques) {
      const tramos = []
      let ini = 1
      cortes.forEach(c => { tramos.push([ini, c]); ini = c + 1 })
      tramos.push([ini, nCols])
      const medidas = tramos.map(([a, z]) => anchoDe(a, z))
      const rango = Math.max(...medidas) - Math.min(...medidas)
      const desvio = medidas.reduce((acc, m) => acc + Math.abs(m - ideal), 0)
      if (!mejor || rango < mejor.rango || (rango === mejor.rango && desvio < mejor.desvio)) {
        mejor = { rango, desvio, tramos }
      }
      return
    }
    // Deja al menos una columna para cada bloque que falte.
    for (let c = inicio; c <= nCols - (nBloques - bloque); c++) {
      cortes.push(c)
      explorar(bloque + 1, c + 1)
      cortes.pop()
    }
  }
  explorar(1, 1)
  return mejor.tramos
}

// Apartado de firmas (Autorizó / Vo.Bo. / Elaboró / Responsable del
// Proyecto) — mismos 4 roles y mismo origen de datos (datos.firmas, de
// firmas_programa) que drawFirmasMML() dibuja al pie de cada página del PDF;
// el documento oficial de referencia no trae este apartado en sus hojas de
// trabajo, se agrega aquí a pedido de Hugo. `anchos` es la misma lista de
// anchos de columna de la tabla de la hoja, repartida en 4 bloques
// proporcionales al ancho real (no a la cantidad de columnas) para que
// nombre/cargo de cada firmante ocupen un espacio parejo entre sí.
function addFirmas(ws, datos, anchos) {
  const p = datos.programa || {}
  const f = datos.firmas || {}
  const firmantes = [
    { rol: 'AUTORIZÓ', nombre: f.AUTORIZA?.nombre || '—', cargo: f.AUTORIZA?.cargo || '' },
    { rol: 'VO. BO.', nombre: f.VOBO?.nombre || '—', cargo: f.VOBO?.cargo || '' },
    { rol: 'ELABORÓ', nombre: f.ELABORO_PRESUPUESTAL?.nombre || '—', cargo: f.ELABORO_PRESUPUESTAL?.cargo || '' },
    { rol: 'RESPONSABLE DEL PROYECTO', nombre: f.ELABORO?.nombre || p.elaboro_nombre || '—', cargo: f.ELABORO?.cargo || p.elaboro_cargo || '' },
  ]
  const rangos = dividirEnBloques(anchos, 4)
  const anchoBloque = i => anchos.slice(rangos[i][0] - 1, rangos[i][1]).reduce((a, b) => a + b, 0)

  ws.addRow([])
  const rolRow = ws.addRow([])
  const lineaRow = ws.addRow([])
  const nombreRow = ws.addRow([])
  const cargoRow = ws.addRow([])
  lineaRow.height = 6

  const fitsNombre = firmantes.map((fm, i) => alturaFilaPrecisa([{ texto: fm.nombre, anchoUnidades: anchoBloque(i), fontMaxPt: 9.5, fontMinPt: 7.5, bold: true, altoTopePt: 60 }]).celdas[0])
  const fitsCargo = firmantes.map((fm, i) => alturaFilaPrecisa([{ texto: fm.cargo, anchoUnidades: anchoBloque(i), fontMaxPt: 8.5, fontMinPt: 7, altoTopePt: 50 }]).celdas[0])
  // El rótulo también se mide: "RESPONSABLE DEL PROYECTO" son 24 caracteres y
  // en un bloque angosto se salía de su celda por no llevar wrapText.
  const fitsRol = firmantes.map((fm, i) => alturaFilaPrecisa([{ texto: fm.rol, anchoUnidades: anchoBloque(i), fontMaxPt: 9, fontMinPt: 7, bold: true, altoTopePt: 40 }]).celdas[0])
  rolRow.height = Math.max(...fitsRol.map(f => f.altoPt))
  nombreRow.height = Math.max(...fitsNombre.map(f => f.altoPt))
  cargoRow.height = Math.max(...fitsCargo.map(f => f.altoPt))

  firmantes.forEach((fm, i) => {
    const [c1, c2] = rangos[i]
    if (c2 > c1) ws.mergeCells(rolRow.number, c1, rolRow.number, c2)
    const rc = rolRow.getCell(c1)
    rc.value = fm.rol
    rc.font = { bold: true, size: fitsRol[i].fontPt, color: { argb: XL.guinda } }
    rc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

    if (c2 > c1) ws.mergeCells(lineaRow.number, c1, lineaRow.number, c2)
    lineaRow.getCell(c1).border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } }

    if (c2 > c1) ws.mergeCells(nombreRow.number, c1, nombreRow.number, c2)
    const nc = nombreRow.getCell(c1)
    nc.value = fm.nombre; nc.font = { bold: true, size: fitsNombre[i].fontPt }; nc.alignment = { horizontal: 'center', wrapText: true, vertical: 'middle' }

    if (c2 > c1) ws.mergeCells(cargoRow.number, c1, cargoRow.number, c2)
    const cc = cargoRow.getCell(c1)
    cc.value = fm.cargo; cc.font = { italic: true, size: fitsCargo[i].fontPt, color: { argb: XL.gris } }; cc.alignment = { horizontal: 'center', wrapText: true, vertical: 'middle' }
  })
}

async function insertarImagenDiagrama(wb, ws, generar) {
  const { dataUrl, width, height } = generar()
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const imgId = wb.addImage({ base64, extension: 'png' })
  const embedW = 950
  const embedH = Math.round(embedW * height / width)
  ws.addImage(imgId, { tl: { col: 0, row: ws.rowCount }, ext: { width: embedW, height: embedH } })
  const filasOcupadas = Math.ceil(embedH / 20) + 1
  for (let i = 0; i < filasOcupadas; i++) ws.addRow([])
}

// ── Hoja 1: Ficha de Proyecto (los 9 apartados del formato oficial) ─────────
// Mismo contenido y mismo orden que drawFichaProyecto() del PDF — las dos
// salidas consumen resolverFicha(), así que no hay dos versiones del formato.
// Las 6 columnas están dimensionadas para el apartado 7, que es el único que
// lleva dos tablas lado a lado (capítulos | especificar fuente). Exportada
// para poder generarla aislada con datos de prueba.
export function addHojaFicha(wb, datos, anio, { logoId, periodoLabel, usados }) {
  // Rejilla uniforme de 12 columnas de 11: los 4 cuartos miden 33 exactos, así
  // el bloque de firmas queda parejo (antes [38,18,4,44,8,18] daba 38/22/44/26).
  // Cada tabla de la hoja combina las columnas de rejilla que necesita.
  const ANCHOS = Array(12).fill(11)
  const COLS = ANCHOS.length
  const COL_VALOR = 4                      // etiqueta 1-3 | valor 4-12
  const ANCHO_LABEL = 33
  const ANCHO_VALOR = 99
  const ws = wb.addWorksheet(nombreHoja('Ficha de Proyecto', usados))
  addEncabezadoMML(ws, 'FICHA DE PROYECTO', logoId, anio, ANCHOS)
  const f = resolverFicha(datos, anio)

  // Barra guinda de apartado, a todo el ancho de la hoja.
  const apartado = (numero, titulo) => {
    ws.addRow([])
    const row = ws.addRow([`${numero}. ${titulo.toUpperCase()}`])
    ws.mergeCells(row.number, 1, row.number, COLS)
    const c = row.getCell(1)
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    c.font = { bold: true, size: 10, color: { argb: XL.blanco } }
    c.alignment = { vertical: 'middle', indent: 1 }
    row.height = 18
  }

  // Renglón etiqueta (cols 1-3) / valor (cols 4-12). En Excel el espacio
  // vertical es libre, así que cada par va en su propio renglón en vez de
  // apretar dos por renglón como hace el PDF.
  const campo = (label, valor, i = 0) => {
    const celdas = new Array(COLS).fill(null)
    celdas[0] = label; celdas[COL_VALOR - 1] = valor
    const row = ws.addRow(celdas)
    ws.mergeCells(row.number, 1, row.number, COL_VALOR - 1)
    ws.mergeCells(row.number, COL_VALOR, row.number, COLS)
    const fit = alturaFilaPrecisa([
      { texto: label, anchoUnidades: ANCHO_LABEL, bold: true },
      { texto: String(valor ?? '—'), anchoUnidades: ANCHO_VALOR },
    ])
    const lc = row.getCell(1)
    styleData(lc, false)
    lc.font = { bold: true, size: fit.celdas[0].fontPt, color: { argb: XL.guinda } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    const vc = row.getCell(COL_VALOR)
    styleData(vc, i % 2 === 1)
    vc.font = { size: fit.celdas[1].fontPt }
    vc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    row.height = fit.altoPt
  }

  // Opciones marcables: etiqueta (cols 1 a COLS-1) + "X" en la última columna.
  const opcionMarcable = (label, marcado, i) => {
    const celdas = new Array(COLS).fill(null)
    celdas[0] = label; celdas[COLS - 1] = marcado ? 'X' : ''
    const row = ws.addRow(celdas)
    ws.mergeCells(row.number, 1, row.number, COLS - 1)
    const fit = alturaFilaPrecisa([{ texto: label, anchoUnidades: ANCHOS.slice(0, COLS - 1).reduce((a, b) => a + b, 0) }])
    const lc = row.getCell(1)
    styleData(lc, i % 2 === 1)
    lc.font = { size: fit.celdas[0].fontPt, bold: !!marcado }
    lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    const mc = row.getCell(COLS)
    styleData(mc, i % 2 === 1)
    mc.font = { bold: true, size: 10, color: { argb: XL.guinda } }
    row.height = fit.altoPt
  }

  // 1. Nombre
  apartado(1, 'Nombre')
  campo('Programa Presupuestal', f.nombre)

  // 2. Tipo de Proyecto
  apartado(2, 'Tipo de Proyecto')
  f.tiposProyecto.forEach((t, i) => opcionMarcable(t.label, t.marcado, i))

  // 3. Clasificación Administrativa
  apartado(3, 'Clasificación Administrativa')
  campo('Ramo', f.administrativa.ramo, 0)
  campo('Municipio', f.administrativa.municipio, 1)
  campo('Unidad Responsable', f.administrativa.unidadResp, 2)

  // 4. Clasificación Económica
  apartado(4, 'Clasificación Económica')
  f.economica.forEach(g => {
    const gRow = ws.addRow([g.grupo])
    ws.mergeCells(gRow.number, 1, gRow.number, COLS)
    gRow.getCell(1).font = { bold: true, size: 9.5, color: { argb: XL.dorado } }
    gRow.getCell(1).alignment = { vertical: 'middle', indent: 1 }
    g.opciones.forEach((o, i) => opcionMarcable(o.label, o.marcado, i))
  })

  // 5. Clasificación Funcional-Programática
  apartado(5, 'Clasificación Funcional-Programática')
  f.funcional.forEach((c, i) => campo(c.label, c.valor, i))

  // 6. Clasificación Regional
  apartado(6, 'Clasificación Regional')
  f.regional.forEach((c, i) => campo(c.label, c.valor, i))

  // 7. Fuente de Financiamiento — dos tablas lado a lado sobre la rejilla de
  // 12: capítulos en 1-3 / importe 4-5, una columna de aire (6), y a la
  // derecha la fuente en 7-9 / marca 10 / importe 11-12. Se escriben renglón
  // por renglón porque comparten las mismas filas.
  const C7 = { cap: [1, 3], capImp: [4, 5], aire: [6, 6], fte: [7, 9], marca: [10, 10], fteImp: [11, 12] }
  const anchoDeRango = ([a, z]) => ANCHOS.slice(a - 1, z).reduce((x, y) => x + y, 0)
  const combinar = (row, [a, z]) => { if (z > a) ws.mergeCells(row.number, a, row.number, z) }

  apartado(7, 'Fuente de Financiamiento')
  const cel7 = new Array(COLS).fill(null)
  cel7[C7.cap[0] - 1] = 'Capítulo'; cel7[C7.capImp[0] - 1] = 'Importe'
  cel7[C7.fte[0] - 1] = 'Especificar fuente de financiamiento'
  cel7[C7.marca[0] - 1] = ''; cel7[C7.fteImp[0] - 1] = 'Importe'
  const hdr7 = ws.addRow(cel7)
  ;[C7.cap, C7.capImp, C7.fte, C7.marca, C7.fteImp].forEach(r => { combinar(hdr7, r); styleHeader(hdr7.getCell(r[0])) })
  hdr7.height = 26

  const nFilas7 = Math.max(f.capitulos.length + 1, f.fuentes.length)
  for (let i = 0; i < nFilas7; i++) {
    const cap = f.capitulos[i]
    const esTotal = i === f.capitulos.length
    const fu = f.fuentes[i]
    const celdas = new Array(COLS).fill(null)
    const textoCap = esTotal ? 'Total' : (cap ? `${cap.capitulo} ${cap.label}` : null)
    celdas[C7.cap[0] - 1] = textoCap
    celdas[C7.capImp[0] - 1] = esTotal ? f.totalCapitulos : (cap ? cap.importe : null)
    if (fu) {
      celdas[C7.fte[0] - 1] = fu.label
      celdas[C7.marca[0] - 1] = fu.marcado ? 'X' : ''
      celdas[C7.fteImp[0] - 1] = fu.importe
    }
    const row = ws.addRow(celdas)
    ;[C7.cap, C7.capImp, C7.aire, C7.fte, C7.marca, C7.fteImp].forEach(r => combinar(row, r))

    if (cap || esTotal) {
      ;[C7.cap, C7.capImp].forEach(r => {
        const cell = row.getCell(r[0])
        if (esTotal) styleTotal(cell); else styleData(cell, i % 2 === 1)
      })
      row.getCell(C7.cap[0]).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      row.getCell(C7.capImp[0]).numFmt = '$#,##0.00'
    }
    if (fu) {
      ;[C7.fte, C7.marca, C7.fteImp].forEach(r => styleData(row.getCell(r[0]), i % 2 === 1))
      row.getCell(C7.fte[0]).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      row.getCell(C7.marca[0]).font = { bold: true, size: 10, color: { argb: XL.guinda } }
      row.getCell(C7.fteImp[0]).numFmt = '$#,##0.00'
    }
    row.height = alturaFilaPrecisa([
      { texto: textoCap || '', anchoUnidades: anchoDeRango(C7.cap) },
      { texto: fu ? fu.label : '', anchoUnidades: anchoDeRango(C7.fte) },
    ]).altoPt
  }

  // "Dejando dos filas de espacio" antes del Presupuesto Estimado.
  ws.addRow([]); ws.addRow([])
  const celPE = new Array(COLS).fill(null)
  celPE[0] = 'Presupuesto Estimado:'; celPE[C7.capImp[0] - 1] = f.presupuestoEstimado
  const peRow = ws.addRow(celPE)
  combinar(peRow, C7.cap)
  combinar(peRow, C7.capImp)
  peRow.getCell(1).font = { bold: true, size: 11, color: { argb: XL.guinda } }
  peRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  styleTotal(peRow.getCell(C7.capImp[0]))
  peRow.getCell(C7.capImp[0]).numFmt = '$#,##0.00'
  peRow.height = 18

  // 8. Periodo de Ejecución
  apartado(8, 'Periodo de Ejecución')
  campo('Fecha de inicio', f.periodo.inicio, 0)
  campo('Fecha de término', f.periodo.termino, 1)

  // 9. Datos del Líder/Responsable
  apartado(9, 'Datos del Líder/Responsable')
  campo('Nombre', f.lider.nombre, 0)
  campo('Cargo', f.lider.cargo, 1)
  campo('Tel. y Fax', f.lider.tel, 2)
  campo('Correo electrónico', f.lider.email, 3)

  ws.columns = ANCHOS.map(w => ({ width: w }))
  addFirmas(ws, datos, ANCHOS)
  return ws
}

// ── Hojas 2 y 3: Descripción de Programa / Descripción de Proyectos ─────────
// Mismo formato con distinto título, espejo de drawDescripcion() del PDF.
export function addHojaDescripcion(wb, datos, anio, { logoId, periodoLabel, usados, titulo, hoja }) {
  // Rejilla de 4 columnas parejas (ANCHOS_TEXTO): la etiqueta ocupa la 1ª y
  // el valor combina las 3 restantes. Antes eran 2 columnas [20, 90], lo que
  // dejaba 2 de las 4 firmas fuera de la tabla.
  const ANCHOS = ANCHOS_TEXTO
  const COLS = ANCHOS.length
  const anchoTotal = ANCHOS.reduce((a, b) => a + b, 0)
  const ANCHO_VALOR = ANCHOS.slice(1).reduce((a, b) => a + b, 0)
  const ws = wb.addWorksheet(nombreHoja(hoja, usados))
  addEncabezadoMML(ws, titulo, logoId, anio, ANCHOS)

  // La línea del ejercicio fiscal que el formato pide en el encabezado.
  // Va como renglón propio porque el banner solo imprime título + periodo.
  const ejRow = ws.addRow([subtituloEjercicioFiscal(anio)])
  ws.mergeCells(ejRow.number, 1, ejRow.number, ANCHOS.length)
  ejRow.getCell(1).font = { bold: true, size: 11, color: { argb: XL.guinda } }
  ejRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  ejRow.height = 18
  ws.addRow([])

  // Los 2 renglones de identificación que el formato pide antes de la prosa.
  const f = resolverFicha(datos, anio)
  ;[['Eje Rector o Programa del PMD', f.ejePmd], ['Programa Según Catálogo OFS', f.programaOfs]]
    .forEach(([label, valor]) => {
      const row = ws.addRow([label, valor])
      ws.mergeCells(row.number, 2, row.number, COLS)
      const fit = alturaFilaPrecisa([
        { texto: label, anchoUnidades: ANCHOS[0], bold: true },
        { texto: valor, anchoUnidades: ANCHO_VALOR },
      ])
      const lc = row.getCell(1)
      styleData(lc, false)
      lc.font = { bold: true, size: fit.celdas[0].fontPt, color: { argb: XL.guinda } }
      lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      const vc = row.getCell(2)
      styleData(vc, false)
      vc.font = { size: fit.celdas[1].fontPt }
      vc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      row.height = fit.altoPt
    })
  ws.addRow([])

  const diag = (datos.diagnostico || [])[0]
  const niveles = datos.mirNiveles || []
  const proposito = niveles.find(n => n.tipo === 'PROPOSITO')
  const fin = niveles.find(n => n.tipo === 'FIN')

  bloqueTexto(ws, 'DESCRIPCIÓN', diag?.transformacion_deseada, COLS, anchoTotal)
  bloqueTexto(ws, 'JUSTIFICACIÓN', diag?.situacion_actual, COLS, anchoTotal)
  bloqueTexto(ws, 'OBJETIVOS ESTRATÉGICOS',
    unirOraciones([proposito?.resumen_narrativo, fin?.resumen_narrativo]), COLS, anchoTotal)

  // METAS y PRINCIPALES INDICADORES: mismos niveles y mismo orden (Fin,
  // Propósito, C1..CN, C1A1..CNAN), que es el que ya trae derivarNivelesMIR().
  const tablaNiveles = (encabezado, valorDe) => {
    const hdr = ws.addRow([encabezado, ''])
    ws.mergeCells(hdr.number, 1, hdr.number, COLS)
    styleHeader(hdr.getCell(1))
    hdr.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    niveles.forEach((n, i) => {
      const etiqueta = etiquetaNivelMIR(n)
      const valor = valorDe(n)
      const row = ws.addRow([etiqueta, valor])
      ws.mergeCells(row.number, 2, row.number, COLS)
      const fit = alturaFilaPrecisa([
        { texto: etiqueta, anchoUnidades: ANCHOS[0], bold: true },
        { texto: valor, anchoUnidades: ANCHO_VALOR },
      ])
      ;[1, 2].forEach(ci => { styleData(row.getCell(ci), i % 2 === 1); row.getCell(ci).font = { ...row.getCell(ci).font, size: fit.celdas[ci - 1].fontPt } })
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      row.height = fit.altoPt
    })
    ws.addRow([])
  }
  tablaNiveles('METAS', n => n.resumen_narrativo || '—')
  tablaNiveles('PRINCIPALES INDICADORES', n => n.indicador?.nombre || '— sin vincular —')

  ws.columns = ANCHOS.map(w => ({ width: w }))
  addFirmas(ws, datos, ANCHOS)
  return ws
}

// ── Hojas 12+: Ficha de Indicador (4 apartados del formato oficial) ─────────
// Espejo de drawFichaIndicador() del PDF; ambas consumen resolverFichaIndicador().
export function addHojaFichaIndicador(wb, datos, nivel, anio, { logoId, periodoLabel, usados }) {
  // Rejilla uniforme de 12 columnas de 10: los 4 cuartos miden 30 exactos, así
  // el bloque de firmas queda parejo (antes [34,30,22,22] daba 34/30/22/22).
  // El apartado 4 reparte sus 4 columnas lógicas sobre esa rejilla.
  // OJO: 10 y no 9 a propósito — ExcelJS NO escribe el ancho cuando vale
  // exactamente 9 (coincide con su ancho de columna por defecto y omite el
  // elemento <col>), así que estas 26 hojas salían con el ancho por defecto.
  const ANCHOS = Array(12).fill(10)
  const COLS = ANCHOS.length
  const COL_VALOR = 5                       // etiqueta 1-4 | valor 5-12
  const ANCHO_VALOR = 80
  const SPANS_META = [4, 3, 2, 3]           // Variables | Unidad | Alcanzada | Meta
  const ws = wb.addWorksheet(nombreHoja(`Ficha ${etiquetaNivelMIR(nivel)}`, usados))
  addEncabezadoMML(ws, 'FICHA DE INDICADOR DE RESULTADOS', logoId, anio, ANCHOS)
  const f = resolverFichaIndicador(datos, nivel, anio)

  const apartado = (numero, titulo) => {
    ws.addRow([])
    const row = ws.addRow([`${numero}. ${titulo.toUpperCase()}`])
    ws.mergeCells(row.number, 1, row.number, COLS)
    const c = row.getCell(1)
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    c.font = { bold: true, size: 10, color: { argb: XL.blanco } }
    c.alignment = { vertical: 'middle', indent: 1 }
    row.height = 18
  }

  // Etiqueta en la columna 1, valor fusionado en el resto.
  const campo = (label, valor, i = 0) => {
    const celdas = new Array(COLS).fill(null)
    celdas[0] = label; celdas[COL_VALOR - 1] = valor
    const row = ws.addRow(celdas)
    ws.mergeCells(row.number, 1, row.number, COL_VALOR - 1)
    ws.mergeCells(row.number, COL_VALOR, row.number, COLS)
    const fit = alturaFilaPrecisa([
      { texto: label, anchoUnidades: 40, bold: true },
      { texto: String(valor ?? '—'), anchoUnidades: ANCHO_VALOR },
    ])
    const lc = row.getCell(1)
    styleData(lc, false)
    lc.font = { bold: true, size: fit.celdas[0].fontPt, color: { argb: XL.guinda } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    const vc = row.getCell(COL_VALOR)
    styleData(vc, i % 2 === 1)
    vc.font = { size: fit.celdas[1].fontPt }
    vc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    row.height = fit.altoPt
  }

  // Rótulo dorado + una fila por opción, con "X" en la marcada.
  const opciones = (titulo, lista) => {
    const tRow = ws.addRow([titulo])
    ws.mergeCells(tRow.number, 1, tRow.number, COLS)
    tRow.getCell(1).font = { bold: true, size: 9.5, color: { argb: XL.dorado } }
    tRow.getCell(1).alignment = { vertical: 'middle', indent: 1 }
    lista.forEach((o, i) => {
      const celdas = new Array(COLS).fill(null)
      celdas[0] = o.label; celdas[COLS - 1] = o.marcado ? 'X' : ''
      const row = ws.addRow(celdas)
      ws.mergeCells(row.number, 1, row.number, COLS - 1)
      const lc = row.getCell(1)
      styleData(lc, i % 2 === 1)
      lc.font = { size: 9.5, bold: !!o.marcado }
      lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      const mc = row.getCell(COLS)
      styleData(mc, i % 2 === 1)
      mc.font = { bold: true, size: 10, color: { argb: XL.guinda } }
    })
  }

  // 1. Tipo de Indicador
  apartado(1, 'Tipo de Indicador')
  f.tiposIndicador.forEach((t, i) => {
    const row = ws.addRow([t.label, null, null, t.marcado ? 'X' : ''])
    ws.mergeCells(row.number, 1, row.number, COLS - 1)
    styleData(row.getCell(1), i % 2 === 1)
    row.getCell(1).font = { size: 9.5, bold: !!t.marcado }
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    styleData(row.getCell(COLS), i % 2 === 1)
    row.getCell(COLS).font = { bold: true, size: 10, color: { argb: XL.guinda } }
  })

  // 2. Datos de Identificación
  apartado(2, 'Datos de Identificación')
  f.identificacion.forEach((r, i) => campo(r.label, r.valor, i))

  // 3. Estructura del Indicador
  apartado(3, 'Estructura del Indicador')
  campo('Nombre', f.estructura.nombre, 0)
  campo('Fórmula de cálculo', f.estructura.formula, 1)
  opciones('Nivel de Indicador (MIR)', f.estructura.nivelesMIR)
  opciones('Sentido o Comportamiento del Indicador', f.estructura.sentidos)

  // 4. Meta del Indicador
  apartado(4, 'Meta del Indicador')
  // Las 4 columnas lógicas se reparten sobre la rejilla de 12 (SPANS_META),
  // para que esta tabla termine en el mismo borde que las demás de la hoja.
  const iniMeta = []
  let cm = 1
  SPANS_META.forEach(sp => { iniMeta.push(cm); cm += sp })
  const anchoMeta = SPANS_META.map((sp, i) => ANCHOS.slice(iniMeta[i] - 1, iniMeta[i] - 1 + sp).reduce((a, b) => a + b, 0))
  const filaMeta = valores => {
    const celdas = new Array(COLS).fill(null)
    valores.forEach((v, i) => { celdas[iniMeta[i] - 1] = v })
    const row = ws.addRow(celdas)
    SPANS_META.forEach((sp, i) => { if (sp > 1) ws.mergeCells(row.number, iniMeta[i], row.number, iniMeta[i] + sp - 1) })
    return row
  }

  const hdr = filaMeta(['Variables', 'Unidad de Medida', 'Alcanzada', `Meta ${anio}`])
  iniMeta.forEach(c => styleHeader(hdr.getCell(c)))
  const filas = f.variables.length
    ? f.variables.map(v => [v.etiqueta, v.unidad, v.alcanzada, v.meta])
    : [['— sin variables capturadas —', '—', null, null]]
  filas.forEach((r, i) => {
    const row = filaMeta(r)
    const fit = alturaFilaPrecisa([
      { texto: r[0], anchoUnidades: anchoMeta[0] }, { texto: r[1], anchoUnidades: anchoMeta[1] },
    ])
    iniMeta.forEach(c => styleData(row.getCell(c), i % 2 === 1))
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    row.getCell(1).font = { size: fit.celdas[0].fontPt }
    row.height = fit.altoPt
  })
  // Resultado del Indicador: numerador ÷ denominador × 100, no la suma de la
  // columna (así lo definió Hugo).
  const resRow = filaMeta([
    'Resultado del Indicador', '',
    resultadoTexto(f.resultado.alcanzada, f.resultado.esPorcentaje),
    resultadoTexto(f.resultado.meta, f.resultado.esPorcentaje),
  ])
  iniMeta.forEach(c => styleTotal(resRow.getCell(c)))
  resRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }

  ws.addRow([])
  campo('Interpretación', f.interpretacion, 0)
  opciones('Dimensión que atiende', f.dimensiones)
  opciones('Frecuencia de Medición', f.frecuencias)
  campo('Fuente de información', f.fuenteInformacion, 1)

  ws.columns = ANCHOS.map(w => ({ width: w }))
  addFirmas(ws, datos, ANCHOS)
  return ws
}

// Construye el libro completo a partir de `datos` ya resueltos. Separado de
// generarExpedienteMMLExcel (que es quien consulta y descarga) para poder
// generar el Excel con datos reales en una prueba, sin pasar por el login.
export async function construirLibroExpedienteMML(datos, anio) {
  const p = datos.programa || {}
  const periodoLabel = `${p.clave || ''} ${p.nombre || ''} · ${anio}`
  const usados = new Set()

  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()
  const logoB64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '')
  const logoId = wb.addImage({ base64: logoB64, extension: 'png' })

  // ── 1. Ficha de Proyecto ────────────────────────────────────────────────
  addHojaFicha(wb, datos, anio, { logoId, periodoLabel, usados })

  // ── 2 y 3. Descripción de Programa / de Proyectos ───────────────────────
  DESCRIPCION_HOJAS.forEach(({ titulo, hoja }) => {
    addHojaDescripcion(wb, datos, anio, { logoId, periodoLabel, usados, titulo, hoja })
  })

  // ── 4. Índice — sin identificación ni firmas, igual que el PDF ─────────
  {
    const ANCHOS = [8, 45, 18, 18]
    const ws = wb.addWorksheet(nombreHoja('Índice', usados))
    addEncabezadoMML(ws, 'ÍNDICE — FORMATOS PROGRAMÁTICOS', logoId, anio, ANCHOS)
    // El Folio ocupa las 2 últimas columnas para que la tabla llegue al mismo
    // ancho que declara el banner (regla de rejilla). Su valor va en la 3ª,
    // que es la celda maestra del merge, así no se pierde.
    tablaEnRejilla(ws, ['No.', 'Formato', 'Folio'],
      INDICE_FORMATOS.map(f => [f.no, f.formato, f.folio]), ANCHOS, [1, 1, 2])
  }

  // ── 4. Transformación Deseada ───────────────────────────────────────────
  {
    // 4 columnas parejas: cada una de las 2 columnas lógicas de la tabla
    // combina 2 de la rejilla, así las firmas caen en cuartos exactos.
    const ANCHOS = ANCHOS_TEXTO
    const ws = wb.addWorksheet(nombreHoja('Transformación Deseada', usados))
    addEncabezadoMML(ws, 'TRANSFORMACIÓN DESEADA', logoId, anio, ANCHOS)
    addIdentificacion(ws, datos, ANCHOS)
    const filas = (datos.diagnostico || []).map(d => [d.situacion_actual, d.transformacion_deseada || '—'])
    tablaEnRejilla(ws, ['Diagnóstico (Situación Actual)', 'Transformación Deseada'],
      filas.length ? filas : [['—', '—']], ANCHOS, [2, 2])
    addFirmas(ws, datos, ANCHOS)
  }

  // ── 5. Árbol del Problema — solo el diagrama ────────────────────────────
  // Sin la tabla de nodos de respaldo (decisión de Hugo): la imagen ya trae
  // ese texto. Usa la MISMA rejilla que las otras hojas de diagrama para que
  // las cinco midan igual y sus firmas queden idénticas.
  {
    const ws = wb.addWorksheet(nombreHoja('Árbol del Problema', usados))
    addEncabezadoMML(ws, 'ÁRBOL DEL PROBLEMA', logoId, anio, ANCHOS_DIAGRAMA)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => arbolDiagramaDataURL(datos, 'PROBLEMA', TIPO_CONFIG_PROBLEMA))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 6. Involucrados (Mapa de Relaciones) — solo diagrama, sin tabla ─────
  {
    const ws = wb.addWorksheet(nombreHoja('Involucrados', usados))
    ws.columns = ANCHOS_DIAGRAMA.map(w => ({ width: w }))
    addEncabezadoMML(ws, 'ANÁLISIS DE INVOLUCRADOS', logoId, anio, ANCHOS_DIAGRAMA)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => involucradosDiagramaDataURL(datos))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 7. Árbol de Objetivos — solo el diagrama (ver nota en el del Problema) ──
  {
    const ws = wb.addWorksheet(nombreHoja('Árbol de Objetivos', usados))
    addEncabezadoMML(ws, 'ÁRBOL DE OBJETIVOS', logoId, anio, ANCHOS_DIAGRAMA)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => arbolDiagramaDataURL(datos, 'OBJETIVOS', TIPO_CONFIG_OBJETIVOS))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 8. Acciones — solo diagrama, sin tabla ──────────────────────────────
  {
    const ws = wb.addWorksheet(nombreHoja('Acciones', usados))
    ws.columns = ANCHOS_DIAGRAMA.map(w => ({ width: w }))
    addEncabezadoMML(ws, 'ACCIONES', logoId, anio, ANCHOS_DIAGRAMA)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => accionesDiagramaDataURL(datos))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 9. Alternativas — solo diagrama, sin tabla ──────────────────────────
  {
    const ws = wb.addWorksheet(nombreHoja('Alternativas', usados))
    ws.columns = ANCHOS_DIAGRAMA.map(w => ({ width: w }))
    addEncabezadoMML(ws, 'ALTERNATIVAS', logoId, anio, ANCHOS_DIAGRAMA)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => alternativasDiagramaDataURL(datos))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 10. Matriz de Riesgos / MIR ─────────────────────────────────────────
  {
    // Anchos elegidos para que los 4 cuartos midan 55/56/55/56 (antes
    // 54/60/48/60): el bloque de firmas queda parejo sin perder legibilidad.
    const ANCHOS = [16, 39, 32, 12, 12, 14, 41, 26, 30]
    const ws = wb.addWorksheet(nombreHoja('Matriz de Riesgos MIR', usados))
    addEncabezadoMML(ws, 'MATRIZ DE INDICADORES Y RIESGOS (MIR)', logoId, anio, ANCHOS)
    addIdentificacion(ws, datos, ANCHOS)
    const niveles = datos.mirNiveles || []
    tabla(ws, ['Nivel', 'Resumen narrativo (Objetivo)', 'Indicador', 'Tipo', 'Dimensión', 'Sentido', 'Interpretación', 'Supuestos / Riesgo', 'Medios de verificación'],
      niveles.map(n => [
        etiquetaNivelMIR(n), n.resumen_narrativo || '—', n.indicador?.nombre || '— sin vincular —',
        n.indicador?.tipo_indicador || '—', n.indicador?.dimension || '—', n.indicador?.sentido || '—',
        n.indicador?.interpretacion || '—', n.supuestos || '—', n.medios_verificacion || '—',
      ]), ANCHOS)
    addFirmas(ws, datos, ANCHOS)
  }

  // ── 11. Cronograma de Metas (POA) ───────────────────────────────────────
  {
    // Cuartos exactos de 48 (antes 54/46/48/52): Nivel+Meta | Unidad+Objetivo
    // +3 meses | 6 meses | 3 meses+Área.
    const ANCHOS = [12, 36, 14, 10, ...Array(12).fill(8), 24]
    const ws = wb.addWorksheet(nombreHoja('Cronograma de Metas', usados))
    addEncabezadoMML(ws, 'CRONOGRAMA DE METAS (POA)', logoId, anio, ANCHOS)
    addIdentificacion(ws, datos, ANCHOS)
    const niveles = (datos.mirNiveles || []).filter(n => n.indicador_id)
    // Mismo orden que la hoja "Metas" oficial: Nivel / Meta (narrativa MIR) /
    // Unidad de Medida / Objetivo Programado del año / calendario ENE-DIC /
    // Área Responsable (esta última al final, no junto al Nivel).
    tabla(ws, ['Nivel', 'Meta (verbos en infinitivo)', 'Unidad de Medida', `Objetivo Programado ${anio}`, ...MESES, 'Área Responsable'],
      niveles.map(n => [
        etiquetaNivelMIR(n), n.indicador?.nombre || '—', n.indicador?.unidad_medida || '—', n.metas?.[0] ?? 0,
        ...MESES.map((_, i) => n.metas?.[i + 1] ?? 0), n.indicador?.areas?.nombre || '—',
      ]), ANCHOS)
    addFirmas(ws, datos, ANCHOS)
  }

  // ── 12+. Fichas de indicador (una hoja por indicador vinculado) ─────────
  ;(datos.mirNiveles || [])
    .filter(n => n.indicador_id && n.indicador)
    .forEach(nivel => addHojaFichaIndicador(wb, datos, nivel, anio, { logoId, periodoLabel, usados }))

  return wb
}

export async function generarExpedienteMMLExcel(programaId, anio) {
  // `ejeNombre` ya viene resuelto desde resolverDatosMML.
  const datos = await resolverDatosMML(programaId, anio)
  datos.anio = anio
  const wb = await construirLibroExpedienteMML(datos, anio)
  const p = datos.programa || {}
  const nombreArchivo = `Expediente_MML_Excel_${p.clave || programaId}_${anio}.xlsx`.replace(/\s+/g, '_')
  await descargarExcel(wb, nombreArchivo)
}
