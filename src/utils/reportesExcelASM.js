import ExcelJS from 'exceljs'
import { XL, descargarExcel } from './reportesBase.js'

// ══════════════════════════════════════════════════════════════════════════════
// ASPECTOS SUSCEPTIBLES DE MEJORA (ASM) — exportación del consolidado
// ══════════════════════════════════════════════════════════════════════════════
const SEM_BG = { 'ÓPTIMO': XL.optBg, 'ADECUADO': XL.adeBg, 'RIESGO': XL.riesBg, 'CRÍTICO': XL.critBg }
const SEM_FG = { 'ÓPTIMO': XL.optimo, 'ADECUADO': XL.adecuado, 'RIESGO': XL.riesgo, 'CRÍTICO': XL.critico }

export async function generarExcelASM(filas, periodoLabel) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const ws = wb.addWorksheet('ASM')
  ws.properties.defaultRowHeight = 14.4

  const thinB   = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

  const HDR = [
    'Folio', 'Eje', 'Área', 'Indicador', 'Tipo Hallazgo', 'Prioridad',
    'Hallazgo', 'Acción de mejora', 'Responsable', 'Fecha compromiso',
    '% Avance', 'Estatus', 'Días al vencimiento',
  ]

  ws.mergeCells(1, 1, 1, HDR.length)
  const title = ws.getCell('A1')
  title.value     = `SIMA – Aspectos Susceptibles de Mejora · ${periodoLabel}`
  title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
  title.font      = { bold: true, size: 12, color: { argb: XL.blanco } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 24

  const hRow = ws.addRow(HDR)
  hRow.eachCell(c => {
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    c.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border    = borders
  })
  ws.getRow(hRow.number).height = 28

  filas.forEach((f, i) => {
    const isAlt = i % 2 === 1
    const row = ws.addRow([
      f.folio, f.eje_nombre, f.area_nombre, f.indicador_nombre, f.tipo_hallazgo, f.prioridad,
      f.hallazgo, f.accion, f.responsable_nombre || '—', f.fecha_compromiso,
      f.porcentaje_avance != null ? `${f.porcentaje_avance}%` : '-',
      f.estatus, f.dias_al_vencimiento,
    ])
    row.eachCell((c, col) => {
      c.border    = borders
      c.alignment = { horizontal: col <= 4 ? 'left' : 'center', vertical: 'middle', wrapText: col === 7 || col === 8 }
      if (col === 5) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SEM_BG[f.tipo_hallazgo] || XL.grisClaro } }
        c.font = { bold: true, color: { argb: SEM_FG[f.tipo_hallazgo] || XL.gris } }
      } else if (col === 12 && f.estatus === 'Atrasado') {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.critBg } }
        c.font = { bold: true, color: { argb: XL.critico } }
      } else if (isAlt) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.grisClaro } }
      }
    })
  })

  const anchos = [14, 10, 16, 26, 12, 10, 30, 30, 16, 14, 10, 12, 12]
  ws.columns.forEach((col, i) => { col.width = anchos[i] || 14 })

  await descargarExcel(wb, `SIMA_ASM_${periodoLabel.replace(/\s+/g, '_')}.xlsx`)
}
