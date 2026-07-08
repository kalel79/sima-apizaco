import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PMD_EJE_MAP } from './informeGobiernoContenido.js'
import {
  GUINDA, BLANCO, GRIS, SEM_COLORS,
  setColor, setFill, setDraw,
  pctStr, pctPMDStr, semaforoFromPct, semaforoPMD,
  formatFechaLarga, generarFolioInforme,
  sectionBanner, drawRunningHeaderSimple,
  drawPortada, drawIndice, drawPresentacion, drawMensajePresidente,
  drawCabildo, drawAccionesCabildoPlaceholder, drawGabinete,
  drawResumenEjecutivo, drawDatosFinancierosPlaceholder, drawFooters,
} from './informeGobiernoSecciones.js'

// ── Sección por Eje ──────────────────────────────────────────────────────
function drawEjeSection(doc, eje, indicadores, pmdList) {
  doc.addPage('letter', 'portrait')
  const page = doc.internal.getNumberOfPages()
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height, ML = 15
  const conAvance = (eje.optimo || 0) + (eje.adecuado || 0) + (eje.riesgo || 0) + (eje.critico || 0)
  const sem = semaforoFromPct(eje.pct_promedio)
  const sc = SEM_COLORS[sem]
  const tituloEje = `${eje.codigo} · ${eje.eje}`

  let y = sectionBanner(doc, tituloEje.toUpperCase())

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(pctStr(eje.pct_promedio), ML, y + 8)
  setFill(doc, sc.bg); doc.roundedRect(ML + 42, y, 32, 13, 2, 2, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); setColor(doc, sc.txt)
  doc.text(sem, ML + 58, y + 8.5, { align: 'center' })
  y += 18

  const stats = [
    ['Total', eje.total_indicadores || 0],
    ['Con avance', conAvance],
    ['Óptimo', eje.optimo || 0],
    ['Adecuado', eje.adecuado || 0],
    ['Riesgo', eje.riesgo || 0],
    ['Crítico', eje.critico || 0],
  ]
  const cw = (W - ML * 2 - 5 * 2) / 6
  stats.forEach(([label, val], i) => {
    const x = ML + i * (cw + 2)
    setFill(doc, [250, 248, 244]); setDraw(doc, [225, 220, 210]); doc.setLineWidth(0.2)
    doc.roundedRect(x, y, cw, 16, 1.5, 1.5, 'FD')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(String(val), x + cw / 2, y + 7, { align: 'center' })
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(label, x + cw / 2, y + 12.5, { align: 'center' })
  })
  y += 24

  const rows = indicadores.map(ind => [
    ind.clave || '-', ind.indicador || '-', ind.area || '-',
    pctStr(ind.pct_cumplimiento), ind.semaforo || 'SIN DATO',
  ])
  autoTable(doc, {
    head: [['Clave', 'Indicador', 'Área', '% Avance', 'Semáforo']],
    body: rows,
    startY: y,
    margin: { left: ML, right: ML, bottom: 20 },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1, valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 26 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 24, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [245, 232, 234] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const semC = SEM_COLORS[data.cell.raw] || SEM_COLORS['SIN DATO']
        data.cell.styles.textColor = semC.txt
        data.cell.styles.fillColor = semC.bg
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawPage: (data) => { if (data.pageNumber > 1) drawRunningHeaderSimple(doc, tituloEje) },
  })

  if (pmdList && pmdList.length) {
    let yy = doc.lastAutoTable.finalY + 10
    if (yy + 30 > H - 20) {
      doc.addPage('letter', 'portrait')
      drawRunningHeaderSimple(doc, tituloEje)
      yy = 26
    }
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text('Programas PMD del Eje', ML, yy)

    const pmdRows = pmdList.map((p, i) => [
      i + 1, p.programa_nombre || '-', p.total_indicadores || 0,
      pctPMDStr(p.pct_promedio), semaforoPMD(p.pct_promedio),
    ])
    autoTable(doc, {
      head: [['#', 'Programa PMD', 'Indicadores', '% Avance', 'Semáforo']],
      body: pmdRows,
      startY: yy + 4,
      margin: { left: ML, right: ML, bottom: 20 },
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1, valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 24, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [245, 232, 234] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const semC = SEM_COLORS[data.cell.raw] || SEM_COLORS['SIN DATO']
          data.cell.styles.textColor = semC.txt
          data.cell.styles.fillColor = semC.bg
          data.cell.styles.fontStyle = 'bold'
        }
      },
      didDrawPage: (data) => { if (data.pageNumber > 1) drawRunningHeaderSimple(doc, tituloEje) },
    })
  }

  return page
}

// ══════════════════════════════════════════════════════════════════════════
// GENERAR INFORME DE GOBIERNO
// ══════════════════════════════════════════════════════════════════════════
// ejes:              filas de v_resumen_ejes (las 9), ordenadas por `orden`
// indicadoresPorEje: { [eje_codigo]: fila[] } de v_indicadores_acum
// claves:            { [indicador_id]: clave } (tabla indicadores, cruzado en cliente)
// pmdProgramas:      filas de v_comparativo_pmd
export async function generarInformeGobierno({ ejes, indicadoresPorEje, claves, pmdProgramas }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const fechaGen = new Date()
  const folio = generarFolioInforme()

  drawPortada(doc, formatFechaLarga(fechaGen))

  doc.addPage('letter', 'portrait') // página 2 — reservada para el índice

  const indiceEntries = []

  indiceEntries.push({ label: 'Presentación', page: drawPresentacion(doc) })
  indiceEntries.push({ label: 'Mensaje del Presidente Municipal', page: drawMensajePresidente(doc) })
  indiceEntries.push({ label: 'Integrantes del H. Cabildo', page: drawCabildo(doc) })
  indiceEntries.push({ label: 'Acciones del H. Cabildo', page: drawAccionesCabildoPlaceholder(doc) })
  indiceEntries.push({ label: 'Gabinete Municipal', page: drawGabinete(doc) })

  // Totales derivados de los 9 ejes de v_resumen_ejes (v_dashboard_global usa
  // otro alcance de indicadores y no coincide con la suma de los 9 ejes).
  const totalInd = ejes.reduce((s, e) => s + (e.total_indicadores || 0), 0)
  const optimo   = ejes.reduce((s, e) => s + (e.optimo || 0), 0)
  const adecuado = ejes.reduce((s, e) => s + (e.adecuado || 0), 0)
  const riesgo   = ejes.reduce((s, e) => s + (e.riesgo || 0), 0)
  const critico  = ejes.reduce((s, e) => s + (e.critico || 0), 0)
  const pctGlobal = totalInd > 0
    ? ejes.reduce((s, e) => s + (e.pct_promedio || 0) * (e.total_indicadores || 0), 0) / totalInd
    : 0

  const pmdTotal = pmdProgramas.length
  const pmdConAvance = pmdProgramas.filter(p => (p.indicadores_con_avance || 0) > 0).length

  indiceEntries.push({
    label: 'Resumen Ejecutivo',
    page: drawResumenEjecutivo(doc, { total: totalInd, pctGlobal, optimo, adecuado, riesgo, critico }, pmdTotal, pmdConAvance),
  })
  indiceEntries.push({ label: 'Datos Financieros', page: drawDatosFinancierosPlaceholder(doc) })

  const pmdPorEje = {}
  pmdProgramas.forEach(p => {
    const codigo = PMD_EJE_MAP[p.eje]
    if (!codigo) return
    if (!pmdPorEje[codigo]) pmdPorEje[codigo] = []
    pmdPorEje[codigo].push(p)
  })

  ejes.forEach(eje => {
    const indsRaw = indicadoresPorEje[eje.codigo] || []
    const inds = indsRaw
      .map(ind => ({ ...ind, clave: claves[ind.indicador_id] || '-' }))
      .sort((a, b) => (a.clave || '').localeCompare(b.clave || '', 'es'))
    const pPag = drawEjeSection(doc, eje, inds, pmdPorEje[eje.codigo])
    indiceEntries.push({ label: `${eje.codigo} · ${eje.eje}`, page: pPag })
  })

  drawIndice(doc, indiceEntries)
  drawFooters(doc, folio)

  const fStr = `${fechaGen.getFullYear()}${String(fechaGen.getMonth() + 1).padStart(2, '0')}${String(fechaGen.getDate()).padStart(2, '0')}`
  doc.save(`SIMA_SegundoInformeGobierno_${fStr}.pdf`)
}
