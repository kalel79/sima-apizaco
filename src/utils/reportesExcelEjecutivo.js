import ExcelJS from 'exceljs'
import { LOGO_BASE64 } from '../logo.js'
import {
  MESES_NOMBRES, semaforoEje, pctStr, descargarExcel, alturaAjustada,
  styleHeader, styleData, styleTotal, addSheetHeader,
} from './reportesBase.js'

const RES_COLS = 8 // Eje/TotalInd/%Avance/Óptimo/Adecuado/Riesgo/Crítico/Semáforo

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR EXCEL EJECUTIVO — solo la hoja "Resumen" (equivalente al PDF Ejecutivo:
// portada + tabla por eje + aviso de correcciones), sin hojas de detalle por eje
// ni "Todos los Indicadores". Misma tabla que la hoja "Resumen" de generarExcel().
// ══════════════════════════════════════════════════════════════════════════════
export async function generarExcelEjecutivo({ global: g, ejes, periodoLabel, correccionesExtemporaneas = [] }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  const logoB64 = LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '')
  const logoId  = wb.addImage({ base64: logoB64, extension: 'png' })

  const wsR = wb.addWorksheet('Resumen')
  wsR.properties.defaultRowHeight = 14.4
  addSheetHeader(wsR, 'SIMA – Resumen Ejecutivo', logoId, periodoLabel, RES_COLS, false)

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

  await descargarExcel(wb, `SIMA_Ejecutivo_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.xlsx`)
}
