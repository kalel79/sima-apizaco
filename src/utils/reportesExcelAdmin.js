import ExcelJS from 'exceljs'
import { XL, descargarExcel } from './reportesBase.js'

// ══════════════════════════════════════════════════════════════════════════════
// AVANCE DE CAPTURA DEL MES POR ÁREA (panel Admin)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcelAvanceCaptura({ areas, periodoLabel }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const ws = wb.addWorksheet('Avance de Captura')
  ws.properties.defaultRowHeight = 14.4

  const thinB   = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }
  const ESTADO_BG = {
    COMPLETO:          'FFE8F5E9',
    'EN PROGRESO':     'FFFFF3E0',
    PENDIENTE:         'FFFFEBEE',
    'SIN INDICADORES': 'FFF5F5F5',
  }
  const ESTADO_FG = {
    COMPLETO:          'FF007830',
    'EN PROGRESO':     'FFEF6C00',
    PENDIENTE:         'FFC62828',
    'SIN INDICADORES': XL.gris,
  }

  ws.mergeCells('A1:G1')
  const title = ws.getCell('A1')
  title.value     = `SIMA – Avance de Captura del Mes por Área · ${periodoLabel}`
  title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
  title.font      = { bold: true, size: 12, color: { argb: XL.blanco } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 24

  const HDR = ['Área', 'Total Indicadores', 'Capturados', 'Validados', '% Captura', '% Validación', 'Estado']
  const hRow = ws.addRow(HDR)
  hRow.eachCell(c => {
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    c.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border    = borders
  })
  ws.getRow(hRow.number).height = 22

  areas.forEach((a, i) => {
    const isAlt = i % 2 === 1
    const row = ws.addRow([
      a.area, a.total_indicadores, a.capturados, a.validados,
      a.pct_captura   != null ? `${a.pct_captura}%`   : '-',
      a.pct_validacion != null ? `${a.pct_validacion}%` : '-',
      a.estado_captura,
    ])
    row.eachCell((c, col) => {
      c.border    = borders
      c.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' }
      if (col === 7) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ESTADO_BG[a.estado_captura] || 'FFFFFFFF' } }
        c.font = { bold: true, size: 9.5, color: { argb: ESTADO_FG[a.estado_captura] || XL.gris } }
      } else {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? XL.crema : XL.blanco } }
        c.font = { size: 9.5 }
      }
    })
  })

  ws.columns = [{ width: 34 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 13 }, { width: 16 }]
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }]

  await descargarExcel(wb, `SIMA_AvanceCaptura_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`)
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLA COMPLETA: METAS MES A MES + RESULTADOS (todos los indicadores)
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcelMetas({ indicadores, periodoLabel }) {
  const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const ws = wb.addWorksheet('Metas y Resultados 2026')
  ws.properties.defaultRowHeight = 14.4

  const thinB  = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

  const HDR_INFO = ['#', 'Eje', 'Área', 'Indicador', 'Nivel MIR']
  ws.addRow([...HDR_INFO, ...MESES.flatMap(m => [m, ''])])

  MESES.forEach((m, i) => {
    const c1 = 6 + i * 2, c2 = c1 + 1
    ws.mergeCells(1, c1, 1, c2)
    const cell = ws.getCell(1, c1)
    cell.value = m
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3A3A3A' } }
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  })
  HDR_INFO.forEach((_, i) => {
    const cell = ws.getCell(1, i + 1)
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    cell.font      = { bold: true, color: { argb: XL.blanco }, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  })
  ws.getRow(1).height = 18

  const hdrRow2 = ws.addRow(['', '', '', '', '', ...MESES.flatMap(() => ['Meta', 'Real'])])
  hdrRow2.eachCell((cell, col) => {
    if (col <= 5) {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      cell.font   = { bold: true, color: { argb: XL.blanco }, size: 9 }
    } else {
      const isMeta = (col - 6) % 2 === 0
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isMeta ? 'FFFFF8E8' : 'FFF0F0F0' } }
      cell.font   = { bold: true, color: { argb: isMeta ? XL.guinda : XL.gris }, size: 8.5 }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = borders
  })
  ws.getRow(2).height = 16

  indicadores.forEach((ind, idx) => {
    const isAlt = idx % 2 === 1
    const rowVals = [
      idx + 1, ind.eje_codigo, ind.area_nombre, ind.nombre, ind.nivel_mir || '',
      ...MESES.flatMap((_, mi) => {
        const meta = parseFloat(ind.metas?.[mi + 1] || 0)
        const av   = ind.avances?.[mi + 1]
        const real = av ? parseFloat(av.resultado) : null
        return [meta === 0 ? '' : meta, real ?? '']
      }),
    ]
    const row = ws.addRow(rowVals)
    row.height = 14.4
    const infoBg = isAlt ? XL.crema : XL.blanco
    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c)
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: infoBg } }
      cell.font      = { size: 9 }
      cell.alignment = { horizontal: c <= 2 ? 'center' : (c === 4 ? 'left' : 'center'), vertical: 'middle', wrapText: c === 4 }
      cell.border    = borders
    }
    MESES.forEach((_, mi) => {
      const colMeta = 6 + mi * 2, colReal = colMeta + 1
      const meta = parseFloat(ind.metas?.[mi + 1] || 0)
      const av   = ind.avances?.[mi + 1]
      const real = av ? parseFloat(av.resultado) : null
      const sem  = av?.semaforo || null
      const cMeta = row.getCell(colMeta)
      cMeta.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: meta > 0 ? 'FFFFF8E8' : (isAlt ? 'FFFAFAFA' : XL.blanco) } }
      cMeta.font      = { size: 9, color: { argb: meta > 0 ? XL.guinda : 'FFCCCCCC' } }
      cMeta.alignment = { horizontal: 'center', vertical: 'middle' }
      cMeta.border    = borders
      const cReal = row.getCell(colReal)
      if (real !== null) {
        const semBgs = { 'ÓPTIMO': 'FFE8F5E9', 'ADECUADO': 'FFFFF9E6', 'RIESGO': 'FFFFF3E0', 'CRÍTICO': 'FFFFEBEE' }
        const semFgs = { 'ÓPTIMO': XL.optimo,  'ADECUADO': XL.adecuado,'RIESGO': XL.riesgo,  'CRÍTICO': XL.critico }
        cReal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: semBgs[sem] || (isAlt ? XL.crema : XL.blanco) } }
        cReal.font = { size: 9, bold: !!sem, color: { argb: semFgs[sem] || XL.gris } }
      } else {
        cReal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? 'FFF5F5F5' : XL.blanco } }
        cReal.font = { size: 9, color: { argb: 'FFCCCCCC' } }
      }
      cReal.alignment = { horizontal: 'center', vertical: 'middle' }
      cReal.border    = borders
    })
  })

  ws.getColumn(1).width = 4; ws.getColumn(2).width = 5
  ws.getColumn(3).width = 22; ws.getColumn(4).width = 52; ws.getColumn(5).width = 14
  MESES.forEach((_, i) => {
    ws.getColumn(6 + i * 2).width     = 7
    ws.getColumn(6 + i * 2 + 1).width = 7
  })
  ws.views = [{ state: 'frozen', xSplit: 5, ySplit: 2 }]

  await descargarExcel(wb, `SIMA_MetasResultados_2026_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`)
}
