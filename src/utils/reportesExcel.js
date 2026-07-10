import ExcelJS from 'exceljs'
import { LOGO_BASE64 } from '../logo.js'
import { barraDataURL, lineaDataURL } from './reporteMensualGraficas.js'
import {
  XL, FIRMAS_RESP, PROGRAMA_EJE, ENTIDAD_NOMBRE, MESES_NOMBRES,
  semLabel, semaforoEje, pctStr, sortByMIR, descargarExcel, alturaAjustada,
  semArgb, styleHeader, styleData, styleTotal, addSheetHeader,
} from './reportesBase.js'

// Anchos fijos de las 4 columnas iniciales de cada hoja de eje (compartidos
// entre el encabezado de programa, la tabla mensual y el cálculo de alturas).
const COL_FIJO = [6, 15, 42, 20] // #, Nivel MIR, Indicador, Área

// Encabezado de programa por eje (Entidad/Programa/Unidad Responsable/Elaboró) —
// mismo contenido que drawProgramaHeader() en reporteMensualPDF.js.
function addProgramaHeader(ws, eje) {
  const info = PROGRAMA_EJE[eje.codigo] || {}
  const anchoLabel = COL_FIJO[0] + COL_FIJO[1]
  const anchoValor = COL_FIJO[2] + COL_FIJO[3]
  const filas = [
    ['Entidad:', ENTIDAD_NOMBRE],
    ['Programa:', info.programa || '-'],
    ['Unidad Responsable:', info.responsable || '-'],
    ['Elaboró:', info.elaboro || '-'],
  ]
  filas.forEach(([label, val]) => {
    const row = ws.addRow([])
    ws.mergeCells(row.number, 1, row.number, 2)
    ws.mergeCells(row.number, 3, row.number, 4)
    const labelCell = row.getCell(1)
    labelCell.value = label
    labelCell.font = { bold: true, size: 9, color: { argb: XL.guinda } }
    labelCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    const valCell = row.getCell(3)
    valCell.value = val
    valCell.font = { size: 9, color: { argb: 'FF1E1E1E' } }
    valCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    row.height = alturaAjustada([label, val], [anchoLabel, anchoValor])
  })
  ws.addRow([])
}

// Bloque de firmas al pie de la hoja de un eje — mismo contenido y orden que
// drawFirmas() en reporteMensualPDF.js (Autorizó/Vo.Bo./Elaboró/Responsable),
// adaptado a filas de Excel: rol, línea en blanco para firmar, nombre, cargo.
// totalCols reparte las 4 firmas en bloques iguales sobre el ancho de la tabla.
function addFirmas(ws, ejeCodigo, totalCols) {
  const resp = FIRMAS_RESP[ejeCodigo] || { nombre: '___________________', cargo: 'Responsable del Eje' }
  const firmantes = [
    { rol: 'AUTORIZÓ',    nombre: 'C. Javier Rivera Bonilla',            cargo: 'Presidente Municipal de Apizaco' },
    { rol: 'VO.BO.',      nombre: 'C. María de la Paz Flores Hernández', cargo: 'Síndico Municipal' },
    { rol: 'ELABORÓ',     nombre: 'C.p. David Hernandez Montiel',        cargo: 'Tesorero' },
    { rol: 'RESPONSABLE', nombre: resp.nombre,                          cargo: resp.cargo },
  ]
  const blockW = Math.max(1, Math.floor(totalCols / 4))
  const rangos = [0, 1, 2, 3].map(i => {
    const c1 = i * blockW + 1
    const c2 = i === 3 ? totalCols : (i + 1) * blockW
    return [c1, Math.max(c1, c2)]
  })

  ws.addRow([])
  const rolRow    = ws.addRow([])
  const lineaRow  = ws.addRow([])
  const nombreRow = ws.addRow([])
  const cargoRow  = ws.addRow([])
  lineaRow.height  = 6
  nombreRow.height = 26
  cargoRow.height  = 22

  firmantes.forEach((f, i) => {
    const [c1, c2] = rangos[i]
    if (c2 > c1) ws.mergeCells(rolRow.number, c1, rolRow.number, c2)
    const rolCell = rolRow.getCell(c1)
    rolCell.value = f.rol
    rolCell.font = { bold: true, size: 9, color: { argb: XL.guinda } }
    rolCell.alignment = { horizontal: 'center', vertical: 'middle' }

    if (c2 > c1) ws.mergeCells(lineaRow.number, c1, lineaRow.number, c2)
    lineaRow.getCell(c1).border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } }

    if (c2 > c1) ws.mergeCells(nombreRow.number, c1, nombreRow.number, c2)
    const nombreCell = nombreRow.getCell(c1)
    nombreCell.value = f.nombre
    nombreCell.font = { bold: true, size: 9, color: { argb: 'FF1E1E1E' } }
    nombreCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

    if (c2 > c1) ws.mergeCells(cargoRow.number, c1, cargoRow.number, c2)
    const cargoCell = cargoRow.getCell(c1)
    cargoCell.value = f.cargo
    cargoCell.font = { italic: true, size: 8, color: { argb: XL.gris } }
    cargoCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })
}

// Gráficas del eje (barra de avance acumulado + línea de tendencia mensual) —
// reutiliza tal cual barraDataURL/lineaDataURL, las mismas funciones de canvas
// que ya usa el PDF, insertadas como imagen (ExcelJS no tiene gráficos nativos).
function addGraficasEje(ws, wb, eje, indsRaw, avMap, mesAct) {
  ws.addRow([])
  const tituloRow = ws.addRow([])
  tituloRow.getCell(1).value = 'Avance del Eje'
  tituloRow.getCell(1).font = { bold: true, size: 11, color: { argb: XL.guinda } }
  ws.addRow([])

  const barraB64 = barraDataURL(eje.pct_promedio || 0, 460, 90).replace(/^data:image\/\w+;base64,/, '')
  const barraId  = wb.addImage({ base64: barraB64, extension: 'png' })
  ws.addImage(barraId, { tl: { col: 0, row: ws.rowCount }, ext: { width: 460, height: 90 } })
  for (let i = 0; i < 7; i++) ws.addRow([])

  const lineData = Array.from({ length: mesAct }, (_, mi) => {
    const targetMes = mi + 1
    let metaAcum = 0, resAcum = 0
    indsRaw.forEach(ind => {
      const avInd = avMap[ind.id] || {}
      for (let m = 1; m <= targetMes; m++) {
        metaAcum += avInd[m]?.meta || 0
        resAcum  += avInd[m]?.res  || 0
      }
    })
    return { mesLabel: MESES_NOMBRES[mi], metaAcum, resAcum }
  })
  const lineaB64 = lineaDataURL(lineData, 460, 175).replace(/^data:image\/\w+;base64,/, '')
  const lineaId  = wb.addImage({ base64: lineaB64, extension: 'png' })
  ws.addImage(lineaId, { tl: { col: 0, row: ws.rowCount }, ext: { width: 460, height: 175 } })
  for (let i = 0; i < 13; i++) ws.addRow([])
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR EXCEL  (ExcelJS — estilos completos)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcel({
  global: g, ejes, indicadoresPorEje, avancesMensuales, mesActual,
  periodoLabel, piloto = false, correccionesExtemporaneas = [],
}) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const logoB64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '')
  const logoId  = wb.addImage({ base64: logoB64, extension: 'png' })

  const ejesToRender = piloto ? ejes.slice(0, 1) : ejes

  const RES_COLS = 8 // Eje/TotalInd/%Avance/Óptimo/Adecuado/Riesgo/Crítico/Semáforo
  const wsR = wb.addWorksheet('Resumen')
  wsR.properties.defaultRowHeight = 14.4
  addSheetHeader(wsR, 'SIMA – Resumen por Eje Estratégico', logoId, periodoLabel, RES_COLS, false)

  const resHdr = ['Eje Estratégico', 'Total Ind.', '% Avance', 'Óptimo', 'Adecuado', 'Riesgo', 'Crítico', 'Semáforo']
  const rhRow  = wsR.addRow(resHdr)
  rhRow.eachCell(c => styleHeader(c))
  wsR.getRow(rhRow.number).height = 20

  ejes.forEach((e, i) => {
    const sem = semaforoEje(e)
    const row = wsR.addRow([
      e.eje, e.total_indicadores||0, pctStr(e.pct_promedio),
      e.optimo||0, e.adecuado||0, e.riesgo||0, e.critico||0, sem,
    ])
    const isAlt = i % 2 === 1
    row.eachCell((c, col) => styleData(c, isAlt, col === 8 ? sem : null))
    row.height = alturaAjustada([e.eje], [58])
  })

  const totR = wsR.addRow([
    'TOTAL MUNICIPIO',
    ejes.reduce((s, e) => s + (e.total_indicadores||0), 0),
    pctStr(g?.pct_global),
    ejes.reduce((s, e) => s + (e.optimo||0), 0),
    ejes.reduce((s, e) => s + (e.adecuado||0), 0),
    ejes.reduce((s, e) => s + (e.riesgo||0), 0),
    ejes.reduce((s, e) => s + (e.critico||0), 0),
    '',
  ])
  totR.eachCell(c => styleTotal(c))

  if (correccionesExtemporaneas.length) {
    wsR.addRow([])
    const avisoRow = wsR.addRow([`⚠ ${correccionesExtemporaneas.length} corrección(es) registrada(s) después del cierre de este periodo`])
    wsR.mergeCells(avisoRow.number, 1, avisoRow.number, RES_COLS)
    avisoRow.getCell(1).font      = { bold: true, color: { argb: 'FFB45400' }, size: 10 }
    avisoRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }
    avisoRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

    const hdrExt = wsR.addRow(['Avance', 'Mes', 'Corrigió', 'Fecha', 'Justificación'])
    hdrExt.eachCell(c => {
      c.font = { bold: true, size: 9 }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } }
      c.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    correccionesExtemporaneas.forEach(c => {
      const fila = wsR.addRow([
        `#${c.registro_id}`,
        MESES_NOMBRES[(c.datos_nuevo?.mes || 1) - 1],
        c.usuario?.nombre || '—',
        new Date(c.created_at).toLocaleDateString('es-MX'),
        c.datos_nuevo?.justificacion || '—',
      ])
      fila.eachCell(cc => { cc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } })
      fila.height = alturaAjustada(
        ['', '', '', '', c.datos_nuevo?.justificacion || ''],
        [12, 8, 12, 12, 60],
      )
    })
  }

  wsR.columns = [
    {width:58},{width:12},{width:13},{width:10},{width:10},{width:10},{width:10},{width:14},
  ]
  wsR.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }]

  const mesAct     = Math.min(Math.max(mesActual || 5, 1), 12)
  const avMap      = avancesMensuales || {}
  const totalCols  = 4 + mesAct * 2 + 3 + 1 // fijas + (Meta/Res)×mes + Acumulado(Meta/Res/%Av) + Semáforo

  ejesToRender.forEach(eje => {
    const indsRaw = indicadoresPorEje[eje.codigo] || []
    const inds    = sortByMIR(indsRaw)
    const sem     = semaforoEje(eje)
    const wsName  = `${eje.codigo} ${eje.eje}`.substring(0, 31)
    const ws      = wb.addWorksheet(wsName)
    ws.properties.defaultRowHeight = 14.4
    addSheetHeader(ws, eje.eje, logoId, periodoLabel, totalCols, true)

    addProgramaHeader(ws, eje)

    // Fila de estadísticas del eje — una sola celda fusionada a todo el ancho
    // de la tabla, para que el texto nunca se corte contra la columna vecina.
    const statRow = ws.addRow([])
    ws.mergeCells(statRow.number, 1, statRow.number, totalCols)
    const statCell = statRow.getCell(1)
    statCell.value = {
      richText: [
        { text: `Semáforo eje: ${sem}`, font: { bold: true, size: 10, color: { argb: semArgb(sem) } } },
        { text: `   ·   Total: ${eje.total_indicadores||0}   ·   Avance: ${pctStr(eje.pct_promedio)}   ·   Óptimo: ${eje.optimo||0}   ·   Adecuado: ${eje.adecuado||0}   ·   Riesgo: ${eje.riesgo||0}   ·   Crítico: ${eje.critico||0}`,
          font: { size: 10, color: { argb: XL.guinda } } },
      ],
    }
    statCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E8' } }
    statCell.alignment = { horizontal: 'center', vertical: 'middle' }
    statRow.height = 18

    // ── Tabla mensual por indicador (reemplaza la tabla acumulada) ────────────
    const headRow1 = ws.addRow([])
    const headRow2 = ws.addRow([])
    ;['#', 'Nivel MIR', 'Indicador', 'Área'].forEach((label, i) => {
      ws.mergeCells(headRow1.number, i + 1, headRow2.number, i + 1)
      const c = headRow1.getCell(i + 1)
      c.value = label
      styleHeader(c)
    })
    for (let mi = 0; mi < mesAct; mi++) {
      const col = 5 + mi * 2
      ws.mergeCells(headRow1.number, col, headRow1.number, col + 1)
      const mesCell = headRow1.getCell(col)
      mesCell.value = MESES_NOMBRES[mi]
      styleHeader(mesCell)
      const metaCell = headRow2.getCell(col);     metaCell.value = 'Meta'; styleHeader(metaCell)
      const resCell  = headRow2.getCell(col + 1); resCell.value  = 'Res';  styleHeader(resCell)
    }
    const accCol = 5 + mesAct * 2
    ws.mergeCells(headRow1.number, accCol, headRow1.number, accCol + 2)
    const accCell = headRow1.getCell(accCol)
    accCell.value = 'ACUMULADO'
    styleHeader(accCell)
    ;['Meta', 'Res', '% Av.'].forEach((label, i) => {
      const c = headRow2.getCell(accCol + i)
      c.value = label
      styleHeader(c)
    })
    const semCol = accCol + 3
    ws.mergeCells(headRow1.number, semCol, headRow2.number, semCol)
    const semHeadCell = headRow1.getCell(semCol)
    semHeadCell.value = 'Semáforo'
    styleHeader(semHeadCell)
    headRow1.height = 18
    headRow2.height = 16

    inds.forEach((ind, i) => {
      const semInd  = semLabel(ind.semaforo)
      const isAlt   = i % 2 === 1
      const avInd   = avMap[ind.id] || {}
      const rowVals = [i + 1, ind.nivel_mir || '', ind.indicador || '', ind.area || '']
      let metaAcum = 0, resAcum = 0
      for (let m = 1; m <= mesAct; m++) {
        const av = avInd[m]
        rowVals.push(av ? +av.meta : '', av ? +av.res : '')
        metaAcum += av?.meta || 0
        resAcum  += av?.res  || 0
      }
      rowVals.push(metaAcum || '', resAcum || '', pctStr(ind.pct_cumplimiento), semInd)
      const row = ws.addRow(rowVals)
      row.eachCell((c, col) => styleData(c, isAlt, col === semCol ? semInd : null))
      row.height = alturaAjustada(
        [ind.nivel_mir, ind.indicador, ind.area],
        [COL_FIJO[1], COL_FIJO[2], COL_FIJO[3]],
      )
    })

    // Fila de total — misma técnica de celda fusionada que la de estadísticas,
    // "Total indicadores:" ya no cabía en la columna "#" (ancho 6).
    const totRow2 = ws.addRow([])
    ws.mergeCells(totRow2.number, 1, totRow2.number, 2)
    const totLabelCell = totRow2.getCell(1)
    totLabelCell.value = 'Total indicadores:'
    const totCountCell = totRow2.getCell(3)
    totCountCell.value = inds.length
    const totPctCell = totRow2.getCell(4)
    totPctCell.value = pctStr(eje.pct_promedio)
    for (let col = 5; col <= totalCols; col++) totRow2.getCell(col).value = ''
    totRow2.eachCell({ includeEmpty: true }, c => styleTotal(c))

    addFirmas(ws, eje.codigo, totalCols)
    addGraficasEje(ws, wb, eje, indsRaw, avMap, mesAct)

    ws.columns = [
      { width: COL_FIJO[0] }, { width: COL_FIJO[1] }, { width: COL_FIJO[2] }, { width: COL_FIJO[3] },
      ...Array.from({ length: mesAct * 2 }, () => ({ width: 8 })),
      { width: 10 }, { width: 10 }, { width: 10 },
      { width: 13 },
    ]
    ws.views = [{ state: 'frozen', xSplit: 4, ySplit: headRow2.number }]
  })

  if (!piloto) {
    const TODOS_COLS = 9
    const wsA  = wb.addWorksheet('Todos los Indicadores')
    wsA.properties.defaultRowHeight = 14.4
    addSheetHeader(wsA, 'Todos los Indicadores – Vista Global', logoId, periodoLabel, TODOS_COLS, false)
    const allHdr = ['#', 'Eje', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance', 'Semáforo']
    const hRowA  = wsA.addRow(allHdr)
    hRowA.eachCell(c => styleHeader(c))
    wsA.getRow(hRowA.number).height = 20
    let idx = 1
    ejes.forEach(eje => {
      ;(indicadoresPorEje[eje.codigo] || []).forEach(ind => {
        const semInd = semLabel(ind.semaforo)
        const isAlt  = idx % 2 === 1
        const row    = wsA.addRow([
          idx++, eje.eje,
          ind.nivel_mir || '', ind.indicador || '', ind.area || '',
          ind.meta_evaluable != null ? +ind.meta_evaluable : '',
          ind.resultado      != null ? +ind.resultado      : '',
          pctStr(ind.pct_cumplimiento), semInd,
        ])
        row.eachCell((c, col) => styleData(c, isAlt, col === 9 ? semInd : null))
        row.height = alturaAjustada(
          [eje.eje, ind.nivel_mir, ind.indicador, ind.area],
          [35, 15, 55, 28],
        )
      })
    })
    wsA.columns = [
      {width:6},{width:35},{width:15},{width:55},{width:28},{width:12},{width:12},{width:12},{width:14},
    ]
    wsA.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }]
  }

  await descargarExcel(wb, `SIMA_Detalle${piloto ? '_PILOTO' : ''}_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`)
}

export function generarExcelPiloto(datos) {
  return generarExcel({ ...datos, piloto: true })
}
