import ExcelJS from 'exceljs'
import { XL, descargarExcel } from './reportesBase.js'

// ══════════════════════════════════════════════════════════════════════════════
// INFORME DE GOBIERNO — consolidado de acciones para Comunicación Social
// Mismas columnas que la hoja "Captura de Acciones" de las plantillas por área,
// más el Folio (id de SIMA) para que Comunicación Social amarre ahí las fotos.
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcelAccionesInforme(acciones, informe) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const ws = wb.addWorksheet('Acciones')
  const thinB   = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

  const HDR = [
    'Folio', 'Eje', 'Área', 'Coordinación', '¿Vinculada a MIR?', 'Indicador MIR', 'Nivel MIR',
    'Programa PMD', 'Justificación (si NO vinculada)', 'Acción', 'Fecha', 'Monto ($)',
    'Beneficiarios', 'Descripción', 'Foto', 'Video', 'Revisada', 'Incluir en informe',
  ]

  ws.mergeCells(1, 1, 1, HDR.length)
  const title = ws.getCell('A1')
  title.value     = `${informe.numero}º Informe de Gobierno · Acciones relevantes · ${informe.periodo_inicio} a ${informe.periodo_fin}`
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
  ws.getRow(hRow.number).height = 30

  const siNo = v => (v ? 'Sí' : 'No')
  acciones.forEach((a, i) => {
    const row = ws.addRow([
      a.id, a.eje_codigo ? `${a.eje_codigo} · ${a.eje}` : '', a.area, a.coordinacion || '',
      siNo(a.indicador_id), a.indicador_id ? `${a.indicador_clave} - ${a.indicador}` : '',
      a.nivel_mir || '', a.programa_pmd || '', a.justificacion || '', a.accion,
      a.fecha ? new Date(`${a.fecha}T12:00:00`) : '', a.monto != null ? Number(a.monto) : null,
      a.beneficiarios, a.descripcion, siNo(a.tiene_foto), siNo(a.tiene_video),
      siNo(a.revisada), siNo(a.incluir_en_informe),
    ])
    row.eachCell({ includeEmpty: true }, (c, col) => {
      c.border    = borders
      c.alignment = { vertical: 'top', wrapText: [6, 8, 9, 10, 14].includes(col),
                      horizontal: [1, 5, 11, 15, 16, 17, 18].includes(col) ? 'center' : undefined }
      if (i % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.grisClaro } }
      if (col === 18 && !a.incluir_en_informe) c.font = { bold: true, color: { argb: XL.critico } }
    })
    row.getCell(11).numFmt = 'dd/mm/yyyy'
    row.getCell(12).numFmt = '"$"#,##0.00'
    row.getCell(13).numFmt = '#,##0'
  })

  const anchos = [7, 22, 20, 18, 10, 34, 12, 30, 28, 34, 11, 14, 12, 50, 7, 7, 9, 10]
  ws.columns.forEach((col, i) => { col.width = anchos[i] || 14 })
  ws.views = [{ state: 'frozen', ySplit: 2 }]
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: HDR.length } }

  const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  await descargarExcel(wb, `SIMA_Informe${informe.numero}_Acciones_${hoy}.xlsx`)
}
