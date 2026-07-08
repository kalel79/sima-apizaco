import ExcelJS from 'exceljs'
import { LOGO_BASE64 } from '../logo.js'
import { XL, semLabel, semaforoEje, pctStr, descargarExcel } from './reportesBase.js'

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR EXCEL  (ExcelJS — estilos completos)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcel({ global: g, ejes, indicadoresPorEje, periodoLabel, piloto = false }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const logoB64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '')
  const logoId  = wb.addImage({ base64: logoB64, extension: 'png' })

  const ejesToRender = piloto ? ejes.slice(0, 1) : ejes

  const thinB  = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

  function semArgb(sem) {
    return { 'ÓPTIMO': XL.optimo, 'ADECUADO': XL.adecuado, 'RIESGO': XL.riesgo, 'CRÍTICO': XL.critico }[sem] || XL.gris
  }
  function semBgArgb(sem) {
    return { 'ÓPTIMO': XL.optBg, 'ADECUADO': XL.adeBg, 'RIESGO': XL.riesBg, 'CRÍTICO': XL.critBg }[sem] || XL.grisClaro
  }

  function styleHeader(cell) {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    cell.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = borders
  }

  function styleData(cell, isAlt, semVal) {
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: semVal ? semBgArgb(semVal) : (isAlt ? XL.crema : XL.blanco) },
    }
    cell.font = semVal
      ? { bold: true, color: { argb: semArgb(semVal) }, size: 9.5 }
      : { size: 9.5 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = borders
  }

  function styleTotal(cell) {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.dorado } }
    cell.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  }

  function addSheetHeader(ws, title, isEje = false) {
    ws.getRow(1).height = 30
    ws.getRow(2).height = 24
    ws.getRow(3).height = 20
    ws.getRow(4).height = 8
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 58, height: 58 } })
    for (let row = 1; row <= 3; row++) {
      for (let col = 2; col <= 9; col++) {
        ws.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      }
    }
    ws.mergeCells('B1:I2')
    const titleCell     = ws.getCell('B1')
    titleCell.value     = title
    titleCell.font      = { bold: true, size: isEje ? 16 : 15, color: { argb: XL.blanco } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.mergeCells('B3:I3')
    const perCell     = ws.getCell('B3')
    perCell.value     = `Periodo: ${periodoLabel}`
    perCell.font      = { size: isEje ? 12 : 11, color: { argb: XL.blanco } }
    perCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.addRow([])
  }

  const wsR = wb.addWorksheet('Resumen')
  wsR.properties.defaultRowHeight = 14.4
  addSheetHeader(wsR, 'SIMA – Resumen por Eje Estratégico', false)

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
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    for (let c = 2; c <= 7; c++) row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' }
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
  totR.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }

  wsR.columns = [
    {width:52},{width:12},{width:13},{width:10},{width:10},{width:10},{width:10},{width:14},
  ]
  wsR.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }]

  const IND_HDR = ['#', 'Nivel MIR', 'Indicador', 'Área', 'Meta', 'Resultado', '% Avance', 'Semáforo', 'Observaciones']
  const IND_W   = [19.2, 16, 55, 30, 12, 12, 12, 14, 28]

  ejesToRender.forEach(eje => {
    const inds  = indicadoresPorEje[eje.codigo] || []
    const sem   = semaforoEje(eje)
    const wsName = `${eje.codigo} ${eje.eje}`.substring(0, 31)
    const ws    = wb.addWorksheet(wsName)
    ws.properties.defaultRowHeight = 14.4
    addSheetHeader(ws, eje.eje, true)

    const statRow = ws.addRow([
      `Semáforo eje: ${sem}`,
      `Total: ${eje.total_indicadores||0}`,
      pctStr(eje.pct_promedio),
      `Óptimo: ${eje.optimo||0}`,
      `Adecuado: ${eje.adecuado||0}`,
      `Riesgo: ${eje.riesgo||0}`,
      `Crítico: ${eje.critico||0}`,
      '', '',
    ])
    statRow.eachCell(c => {
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E8' } }
      c.font      = { size: 10, color: { argb: XL.guinda } }
      c.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    const semArgbVal = { 'ÓPTIMO': XL.optimo, 'ADECUADO': XL.adecuado, 'RIESGO': XL.riesgo, 'CRÍTICO': XL.critico }[sem] || XL.gris
    statRow.getCell(1).font = { bold: true, size: 10, color: { argb: semArgbVal } }
    ws.getRow(statRow.number).height = 16

    const hRow = ws.addRow(IND_HDR)
    hRow.eachCell(c => styleHeader(c))
    ws.getRow(hRow.number).height = 20

    inds.forEach((ind, i) => {
      const semInd = semLabel(ind.semaforo)
      const isAlt  = i % 2 === 1
      const row    = ws.addRow([
        i + 1, ind.nivel_mir || '', ind.indicador || '', ind.area || '',
        ind.meta_evaluable != null ? +ind.meta_evaluable : '',
        ind.resultado      != null ? +ind.resultado      : '',
        pctStr(ind.pct_cumplimiento), semInd, '',
      ])
      row.eachCell((c, col) => styleData(c, isAlt, col === 8 ? semInd : null))
      row.height = 14.4
    })

    const totRow2 = ws.addRow([
      'Total indicadores:', inds.length, pctStr(eje.pct_promedio),
      '', '', '', '', '', '',
    ])
    totRow2.eachCell(c => styleTotal(c))
    totRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
    ws.columns = IND_W.map(w => ({ width: w }))
    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
  })

  if (!piloto) {
    const wsA  = wb.addWorksheet('Todos los Indicadores')
    wsA.properties.defaultRowHeight = 14.4
    addSheetHeader(wsA, 'Todos los Indicadores – Vista Global', false)
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
        row.height = 14.4
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
