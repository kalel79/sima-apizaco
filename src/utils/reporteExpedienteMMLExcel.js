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
import { XL, ENTIDAD_NOMBRE, styleHeader, styleData, styleTotal, addSheetHeader, descargarExcel } from './reportesBase.js'
import {
  INDICE_FORMATOS, etiquetaNivelMIR, resolverFicha, subtituloEjercicioFiscal, DESCRIPCION_HOJAS,
  unirOraciones, resolverFichaIndicador, resultadoTexto,
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
const ANCHOS_ARBOL = [16, 55, 40, 28]      // Árbol Problema/Objetivos (tabla de nodos de respaldo bajo la imagen)
const ANCHOS_DIAGRAMA = [35, 35, 35, 35]   // Acciones/Alternativas/Involucrados (solo imagen, sin tabla)

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
  const anchoValor = anchos.slice(1).reduce((a, b) => a + b, 0) || anchos[0]
  const p = datos.programa || {}
  const filas = [
    ['Eje:', `${p.eje_id ?? ''}. ${datos.ejeNombre || ''}`],
    ['Programa:', `${p.clave || ''}. ${p.nombre || ''}`],
    ['Entidad:', ENTIDAD_NOMBRE],
    ['Unidad Responsable:', p.unidad_resp || '—'],
  ]
  filas.forEach(([label, val]) => {
    const row = ws.addRow([label])
    row.getCell(1).font = { bold: true, size: 9, color: { argb: XL.guinda } }
    row.getCell(1).alignment = { vertical: 'middle' }
    if (cols > 1) ws.mergeCells(row.number, 2, row.number, cols)
    const vc = row.getCell(2)
    const fit = alturaFilaPrecisa([{ texto: val, anchoUnidades: anchoValor, fontMaxPt: 9.5, fontMinPt: 8, altoTopePt: 60 }])
    vc.value = val
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
  // Con pocas columnas reales, cada bloque toma una columna distinta (las
  // que sobren de nBloques quedan como columnas "virtuales" más allá de la
  // tabla, con el ancho por defecto de Excel) — nunca 2 bloques comparten
  // columna, que es lo que perdía firmantes silenciosamente.
  if (nCols <= nBloques) return Array.from({ length: nBloques }, (_, i) => [i + 1, i + 1])

  const acumulado = []
  let suma = 0
  anchos.forEach(w => { suma += w; acumulado.push(suma) })
  const total = suma

  // Corte k = la columna cuyo acumulado cruza primero la fracción k/nBloques
  // del ancho total.
  const cortes = []
  for (let k = 1; k < nBloques; k++) {
    const objetivo = (total * k) / nBloques
    let col = acumulado.findIndex(a => a >= objetivo) + 1
    if (col < 1) col = nCols
    cortes.push(col)
  }
  // Fuerza cortes estrictamente crecientes de izquierda a derecha...
  cortes.forEach((c, i) => {
    const minCol = i === 0 ? 1 : cortes[i - 1] + 1
    if (c < minCol) cortes[i] = minCol
  })
  // ...y de derecha a izquierda, para que siempre quede al menos 1 columna
  // libre por cada bloque posterior (incluido el final).
  for (let i = cortes.length - 1; i >= 0; i--) {
    const maxCol = nCols - (cortes.length - i)
    if (cortes[i] > maxCol) cortes[i] = maxCol
  }

  const bloques = []
  let colIni = 1
  cortes.forEach(c => { bloques.push([colIni, c]); colIni = c + 1 })
  bloques.push([colIni, nCols])
  return bloques
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
  nombreRow.height = Math.max(...fitsNombre.map(f => f.altoPt))
  cargoRow.height = Math.max(...fitsCargo.map(f => f.altoPt))

  firmantes.forEach((fm, i) => {
    const [c1, c2] = rangos[i]
    if (c2 > c1) ws.mergeCells(rolRow.number, c1, rolRow.number, c2)
    const rc = rolRow.getCell(c1)
    rc.value = fm.rol; rc.font = { bold: true, size: 9, color: { argb: XL.guinda } }; rc.alignment = { horizontal: 'center' }

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

// Nodos del árbol (Problema u Objetivos) como tabla plana de respaldo, en el
// mismo orden en que ya vienen (arbol_nodos ordenado por tipo/orden) — no
// reordena por jerarquía, es solo un respaldo buscable de lo que muestra la
// imagen de arriba. Mismas 4 columnas para ambos árboles (Problema no tiene
// indicador/área vinculados — salen "—") para que el ancho total de la tabla
// sea igual en las 2 hojas y coincida con ANCHOS_ARBOL del banner/firmas.
function tablaNodosArbol(ws, nodos) {
  const headers = ['Tipo', 'Texto', 'Indicador vinculado', 'Área responsable']
  const rows = nodos.map(n => [n.tipo, n.texto || '—', n.indicador?.nombre || '—', n.indicador?.areas?.nombre || '—'])
  tabla(ws, headers, rows, ANCHOS_ARBOL)
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
  const ANCHOS = [38, 18, 4, 44, 8, 18]
  const COLS = ANCHOS.length
  const ANCHO_LABEL = ANCHOS[0] + ANCHOS[1]
  const ANCHO_VALOR = ANCHOS.slice(2).reduce((a, b) => a + b, 0)
  const ws = wb.addWorksheet(nombreHoja('Ficha de Proyecto', usados))
  addSheetHeader(ws, 'FICHA DE PROYECTO', logoId, periodoLabel, COLS)
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

  // Renglón etiqueta (cols 1-2) / valor (cols 3-6). En Excel el espacio
  // vertical es libre, así que cada par va en su propio renglón en vez de
  // apretar dos por renglón como hace el PDF.
  const campo = (label, valor, i = 0) => {
    const row = ws.addRow([label, null, valor])
    ws.mergeCells(row.number, 1, row.number, 2)
    ws.mergeCells(row.number, 3, row.number, COLS)
    const fit = alturaFilaPrecisa([
      { texto: label, anchoUnidades: ANCHO_LABEL, bold: true },
      { texto: String(valor ?? '—'), anchoUnidades: ANCHO_VALOR },
    ])
    const lc = row.getCell(1)
    styleData(lc, false)
    lc.font = { bold: true, size: fit.celdas[0].fontPt, color: { argb: XL.guinda } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    const vc = row.getCell(3)
    styleData(vc, i % 2 === 1)
    vc.font = { size: fit.celdas[1].fontPt }
    vc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    row.height = fit.altoPt
  }

  // Opciones marcables: etiqueta (cols 1-4) + "X" en la columna de marca.
  const opcionMarcable = (label, marcado, i) => {
    const row = ws.addRow([label, null, null, null, marcado ? 'X' : ''])
    ws.mergeCells(row.number, 1, row.number, 4)
    const fit = alturaFilaPrecisa([{ texto: label, anchoUnidades: ANCHOS[0] + ANCHOS[1] + ANCHOS[2] + ANCHOS[3] }])
    const lc = row.getCell(1)
    styleData(lc, i % 2 === 1)
    lc.font = { size: fit.celdas[0].fontPt, bold: !!marcado }
    lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    const mc = row.getCell(5)
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

  // 7. Fuente de Financiamiento — dos tablas lado a lado: los capítulos en
  // las columnas 1-2 y "especificar fuente de financiamiento" en las 4-6,
  // escritas renglón por renglón porque comparten las mismas filas.
  apartado(7, 'Fuente de Financiamiento')
  const hdr7 = ws.addRow(['Capítulo', 'Importe', null, 'Especificar fuente de financiamiento', '', 'Importe'])
  ;[1, 2, 4, 5, 6].forEach(ci => styleHeader(hdr7.getCell(ci)))
  hdr7.height = 26

  const nFilas7 = Math.max(f.capitulos.length + 1, f.fuentes.length)
  for (let i = 0; i < nFilas7; i++) {
    const cap = f.capitulos[i]
    const esTotal = i === f.capitulos.length
    const fu = f.fuentes[i]
    const row = ws.addRow([
      esTotal ? 'Total' : (cap ? `${cap.capitulo} ${cap.label}` : null),
      esTotal ? f.totalCapitulos : (cap ? cap.importe : null),
      null,
      fu ? fu.label : null,
      fu ? (fu.marcado ? 'X' : '') : null,
      fu ? fu.importe : null,
    ])
    ;[1, 2].forEach(ci => {
      if (!cap && !esTotal) return
      if (esTotal) styleTotal(row.getCell(ci)); else styleData(row.getCell(ci), i % 2 === 1)
    })
    if (cap || esTotal) {
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      row.getCell(2).numFmt = '$#,##0.00'
    }
    if (fu) {
      ;[4, 5, 6].forEach(ci => styleData(row.getCell(ci), i % 2 === 1))
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
      row.getCell(5).font = { bold: true, size: 10, color: { argb: XL.guinda } }
      row.getCell(6).numFmt = '$#,##0.00'
    }
    row.height = alturaFilaPrecisa([
      { texto: esTotal ? 'Total' : (cap ? `${cap.capitulo} ${cap.label}` : ''), anchoUnidades: ANCHOS[0] },
      { texto: fu ? fu.label : '', anchoUnidades: ANCHOS[3] },
    ]).altoPt
  }

  // "Dejando dos filas de espacio" antes del Presupuesto Estimado.
  ws.addRow([]); ws.addRow([])
  const peRow = ws.addRow(['Presupuesto Estimado:', f.presupuestoEstimado])
  ws.mergeCells(peRow.number, 1, peRow.number, 1)
  peRow.getCell(1).font = { bold: true, size: 11, color: { argb: XL.guinda } }
  peRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  styleTotal(peRow.getCell(2))
  peRow.getCell(2).numFmt = '$#,##0.00'
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
  const ANCHOS = [20, 90]
  const anchoTotal = ANCHOS.reduce((a, b) => a + b, 0)
  const ws = wb.addWorksheet(nombreHoja(hoja, usados))
  addSheetHeader(ws, titulo, logoId, periodoLabel, ANCHOS.length)

  // La línea del ejercicio fiscal que el formato pide en el encabezado.
  // Va como renglón propio porque addSheetHeader() es compartido con los
  // otros reportes y solo imprime título + periodo.
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
      const fit = alturaFilaPrecisa([
        { texto: label, anchoUnidades: ANCHOS[0], bold: true },
        { texto: valor, anchoUnidades: ANCHOS[1] },
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

  bloqueTexto(ws, 'DESCRIPCIÓN', diag?.transformacion_deseada, 2, anchoTotal)
  bloqueTexto(ws, 'JUSTIFICACIÓN', diag?.situacion_actual, 2, anchoTotal)
  bloqueTexto(ws, 'OBJETIVOS ESTRATÉGICOS',
    unirOraciones([proposito?.resumen_narrativo, fin?.resumen_narrativo]), 2, anchoTotal)

  // METAS y PRINCIPALES INDICADORES: mismos niveles y mismo orden (Fin,
  // Propósito, C1..CN, C1A1..CNAN), que es el que ya trae derivarNivelesMIR().
  const tablaNiveles = (encabezado, valorDe) => {
    const hdr = ws.addRow([encabezado, ''])
    ws.mergeCells(hdr.number, 1, hdr.number, ANCHOS.length)
    styleHeader(hdr.getCell(1))
    hdr.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    niveles.forEach((n, i) => {
      const etiqueta = etiquetaNivelMIR(n)
      const valor = valorDe(n)
      const row = ws.addRow([etiqueta, valor])
      const fit = alturaFilaPrecisa([
        { texto: etiqueta, anchoUnidades: ANCHOS[0], bold: true },
        { texto: valor, anchoUnidades: ANCHOS[1] },
      ])
      row.eachCell((c, ci) => { styleData(c, i % 2 === 1); c.font = { ...c.font, size: fit.celdas[ci - 1].fontPt } })
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
  const ANCHOS = [34, 30, 22, 22]   // 4 columnas: las del apartado 4 (Meta del Indicador)
  const COLS = ANCHOS.length
  const ANCHO_VALOR = ANCHOS.slice(1).reduce((a, b) => a + b, 0)
  const ws = wb.addWorksheet(nombreHoja(`Ficha ${etiquetaNivelMIR(nivel)}`, usados))
  addSheetHeader(ws, 'FICHA DE INDICADOR DE RESULTADOS', logoId, periodoLabel, COLS)
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
    const row = ws.addRow([label, valor])
    ws.mergeCells(row.number, 2, row.number, COLS)
    const fit = alturaFilaPrecisa([
      { texto: label, anchoUnidades: ANCHOS[0], bold: true },
      { texto: String(valor ?? '—'), anchoUnidades: ANCHO_VALOR },
    ])
    const lc = row.getCell(1)
    styleData(lc, false)
    lc.font = { bold: true, size: fit.celdas[0].fontPt, color: { argb: XL.guinda } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    const vc = row.getCell(2)
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
      const row = ws.addRow([o.label, null, null, o.marcado ? 'X' : ''])
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
  const hdr = ws.addRow(['Variables', 'Unidad de Medida', 'Alcanzada', `Meta ${anio}`])
  hdr.eachCell(c => styleHeader(c))
  const filas = f.variables.length
    ? f.variables.map(v => [v.etiqueta, v.unidad, v.alcanzada, v.meta])
    : [['— sin variables capturadas —', '—', null, null]]
  filas.forEach((r, i) => {
    const row = ws.addRow(r)
    const fit = alturaFilaPrecisa([
      { texto: r[0], anchoUnidades: ANCHOS[0] }, { texto: r[1], anchoUnidades: ANCHOS[1] },
    ])
    row.eachCell({ includeEmpty: true }, c => styleData(c, i % 2 === 1))
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 }
    row.getCell(1).font = { size: fit.celdas[0].fontPt }
    row.height = fit.altoPt
  })
  // Resultado del Indicador: numerador ÷ denominador × 100, no la suma de la
  // columna (así lo definió Hugo).
  const resRow = ws.addRow([
    'Resultado del Indicador', '',
    resultadoTexto(f.resultado.alcanzada, f.resultado.esPorcentaje),
    resultadoTexto(f.resultado.meta, f.resultado.esPorcentaje),
  ])
  resRow.eachCell({ includeEmpty: true }, c => styleTotal(c))
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

export async function generarExpedienteMMLExcel(programaId, anio) {
  // `ejeNombre` ya viene resuelto desde resolverDatosMML.
  const datos = await resolverDatosMML(programaId, anio)
  datos.anio = anio

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
    const ws = wb.addWorksheet(nombreHoja('Índice', usados))
    addSheetHeader(ws, 'ÍNDICE — FORMATOS PROGRAMÁTICOS', logoId, periodoLabel, 3)
    tabla(ws, ['No.', 'Formato', 'Folio'],
      INDICE_FORMATOS.map(f => [f.no, f.formato, f.folio]), [8, 45, 18])
  }

  // ── 4. Transformación Deseada ───────────────────────────────────────────
  {
    const ANCHOS = [55, 55]
    const ws = wb.addWorksheet(nombreHoja('Transformación Deseada', usados))
    addSheetHeader(ws, 'TRANSFORMACIÓN DESEADA', logoId, periodoLabel, ANCHOS.length)
    addIdentificacion(ws, datos, ANCHOS)
    const filas = (datos.diagnostico || []).map(d => [d.situacion_actual, d.transformacion_deseada || '—'])
    tabla(ws, ['Diagnóstico (Situación Actual)', 'Transformación Deseada'], filas.length ? filas : [['—', '—']], ANCHOS)
    addFirmas(ws, datos, ANCHOS)
  }

  // ── 5. Árbol del Problema ───────────────────────────────────────────────
  {
    const ws = wb.addWorksheet(nombreHoja('Árbol del Problema', usados))
    addSheetHeader(ws, 'ÁRBOL DEL PROBLEMA', logoId, periodoLabel, ANCHOS_ARBOL.length)
    addIdentificacion(ws, datos, ANCHOS_ARBOL)
    await insertarImagenDiagrama(wb, ws, () => arbolDiagramaDataURL(datos, 'PROBLEMA', TIPO_CONFIG_PROBLEMA))
    tablaNodosArbol(ws, datos.arbolProblema || [])
    addFirmas(ws, datos, ANCHOS_ARBOL)
  }

  // ── 6. Involucrados (Mapa de Relaciones) — solo diagrama, sin tabla ─────
  {
    const ws = wb.addWorksheet(nombreHoja('Involucrados', usados))
    ws.columns = ANCHOS_DIAGRAMA.map(w => ({ width: w }))
    addSheetHeader(ws, 'ANÁLISIS DE INVOLUCRADOS', logoId, periodoLabel, ANCHOS_DIAGRAMA.length)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => involucradosDiagramaDataURL(datos))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 7. Árbol de Objetivos ───────────────────────────────────────────────
  {
    const ws = wb.addWorksheet(nombreHoja('Árbol de Objetivos', usados))
    addSheetHeader(ws, 'ÁRBOL DE OBJETIVOS', logoId, periodoLabel, ANCHOS_ARBOL.length)
    addIdentificacion(ws, datos, ANCHOS_ARBOL)
    await insertarImagenDiagrama(wb, ws, () => arbolDiagramaDataURL(datos, 'OBJETIVOS', TIPO_CONFIG_OBJETIVOS))
    tablaNodosArbol(ws, datos.arbolObjetivos || [])
    addFirmas(ws, datos, ANCHOS_ARBOL)
  }

  // ── 8. Acciones — solo diagrama, sin tabla ──────────────────────────────
  {
    const ws = wb.addWorksheet(nombreHoja('Acciones', usados))
    ws.columns = ANCHOS_DIAGRAMA.map(w => ({ width: w }))
    addSheetHeader(ws, 'ACCIONES', logoId, periodoLabel, ANCHOS_DIAGRAMA.length)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => accionesDiagramaDataURL(datos))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 9. Alternativas — solo diagrama, sin tabla ──────────────────────────
  {
    const ws = wb.addWorksheet(nombreHoja('Alternativas', usados))
    ws.columns = ANCHOS_DIAGRAMA.map(w => ({ width: w }))
    addSheetHeader(ws, 'ALTERNATIVAS', logoId, periodoLabel, ANCHOS_DIAGRAMA.length)
    addIdentificacion(ws, datos, ANCHOS_DIAGRAMA)
    await insertarImagenDiagrama(wb, ws, () => alternativasDiagramaDataURL(datos))
    addFirmas(ws, datos, ANCHOS_DIAGRAMA)
  }

  // ── 10. Matriz de Riesgos / MIR ─────────────────────────────────────────
  {
    const ANCHOS = [16, 38, 32, 14, 14, 12, 36, 30, 30]
    const ws = wb.addWorksheet(nombreHoja('Matriz de Riesgos MIR', usados))
    addSheetHeader(ws, 'MATRIZ DE INDICADORES Y RIESGOS (MIR)', logoId, periodoLabel, ANCHOS.length)
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
    const ANCHOS = [14, 40, 16, 14, ...Array(12).fill(9), 20]
    const ws = wb.addWorksheet(nombreHoja('Cronograma de Metas', usados))
    addSheetHeader(ws, 'CRONOGRAMA DE METAS (POA)', logoId, periodoLabel, ANCHOS.length)
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

  const nombreArchivo = `Expediente_MML_Excel_${p.clave || programaId}_${anio}.xlsx`.replace(/\s+/g, '_')
  await descargarExcel(wb, nombreArchivo)
}
