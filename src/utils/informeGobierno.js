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
function drawEjeSection(doc, eje, indicadores, pmdList, acciones) {
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

  if (acciones && acciones.length) drawAccionesEje(doc, acciones, tituloEje)

  return page
}

// ── Acciones relevantes del Eje (fase_informe_01) ────────────────────────
// Capturadas por las áreas en SIMA; solo llegan aquí las que Planeación no
// quitó del informe. Agrupadas por programa PMD; las no vinculadas a la MIR
// van al final bajo "Otras acciones relevantes".
const fmtMonto = m => Number(m).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const fmtFechaCorta = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

// Anchos fijos: la columna "Acción" se parte de antemano en renglones (nombre
// en negritas + descripción) para que el alto de la celda sea el correcto.
const ACC_COLS = [20, null, 28, 24, 24]
const ACC_FS = 7.5, ACC_PAD = 2

function lineasAccion(doc, a, ancho) {
  doc.setFontSize(ACC_FS)
  doc.setFont('helvetica', 'bold')
  const titulo = doc.splitTextToSize(a.accion, ancho)
  doc.setFont('helvetica', 'normal')
  const desc = doc.splitTextToSize(a.descripcion, ancho)
  return { content: [...titulo, ...desc].join('\n'), nNegritas: titulo.length }
}

function drawAccionesEje(doc, acciones, tituloEje) {
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height, ML = 15
  const anchoAccion = W - ML * 2 - ACC_COLS.reduce((s, c) => s + (c || 0), 0)
  let yy = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40
  if (yy + 40 > H - 20) {
    doc.addPage('letter', 'portrait')
    drawRunningHeaderSimple(doc, tituloEje)
    yy = 26
  }

  const monto = acciones.reduce((s, a) => s + (Number(a.monto) || 0), 0)
  const benef = acciones.reduce((s, a) => s + (a.beneficiarios || 0), 0)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Acciones relevantes', ML, yy)
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  const resumen = [`${acciones.length} ${acciones.length === 1 ? 'acción' : 'acciones'}`]
  if (monto > 0) resumen.push(`${fmtMonto(monto)} invertidos`)
  if (benef > 0) resumen.push(`${benef.toLocaleString('es-MX')} beneficiarios`)
  doc.text(resumen.join('  ·  '), ML, yy + 5)

  const grupos = new Map()
  acciones.forEach(a => {
    const k = a.programa_pmd || 'Otras acciones relevantes'
    if (!grupos.has(k)) grupos.set(k, { orden: a.programa_pmd ? (a.programa_pmd_numero ?? 0) : 9999, filas: [] })
    grupos.get(k).filas.push(a)
  })
  const body = []
  ;[...grupos.entries()].sort((x, y) => x[1].orden - y[1].orden).forEach(([nombre, g]) => {
    body.push([{ content: nombre, colSpan: 5, styles: { fontStyle: 'bold', textColor: GUINDA, fillColor: [250, 248, 244] } }])
    g.filas
      .sort((x, y) => (x.fecha || '').localeCompare(y.fecha || ''))
      .forEach(a => body.push([
        fmtFechaCorta(a.fecha),
        lineasAccion(doc, a, anchoAccion - ACC_PAD * 2),
        a.area || '-',
        a.monto != null ? fmtMonto(a.monto) : '-',
        a.beneficiarios != null ? a.beneficiarios.toLocaleString('es-MX') : '-',
      ]))
  })

  autoTable(doc, {
    head: [['Fecha', 'Acción', 'Área', 'Monto', 'Beneficiarios']],
    body,
    startY: yy + 9,
    margin: { left: ML, right: ML, bottom: 20 },
    styles: { fontSize: ACC_FS, cellPadding: ACC_PAD, lineColor: [220, 220, 220], lineWidth: 0.1, valign: 'top', overflow: 'linebreak' },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: ACC_COLS[0] }, 1: { cellWidth: anchoAccion }, 2: { cellWidth: ACC_COLS[2] },
      3: { cellWidth: ACC_COLS[3], halign: 'right' }, 4: { cellWidth: ACC_COLS[4], halign: 'right' },
    },
    // autoTable dibuja la celda sin texto y aquí se escribe con el nombre de
    // la acción en negritas y la descripción en normal.
    willDrawCell: (data) => {
      if (data.section === 'body' && data.cell.raw?.nNegritas != null) data.cell.text = []
    },
    didDrawCell: (data) => {
      const n = data.cell.raw?.nNegritas
      if (data.section !== 'body' || n == null) return
      const lh = (ACC_FS * doc.getLineHeightFactor()) / doc.internal.scaleFactor
      doc.setFontSize(ACC_FS)
      data.cell.raw.content.split('\n').forEach((ln, k) => {
        doc.setFont('helvetica', k < n ? 'bold' : 'normal')
        setColor(doc, k < n ? [30, 30, 30] : [80, 80, 80])
        doc.text(ln, data.cell.x + ACC_PAD, data.cell.y + ACC_PAD + lh * k, { baseline: 'top' })
      })
    },
    didDrawPage: (data) => { if (data.pageNumber > 1) drawRunningHeaderSimple(doc, tituloEje) },
  })
}

// ══════════════════════════════════════════════════════════════════════════
// GENERAR INFORME DE GOBIERNO
// ══════════════════════════════════════════════════════════════════════════
// ejes:              filas de v_resumen_ejes (las 9), ordenadas por `orden`
// indicadoresPorEje: { [eje_codigo]: fila[] } de v_indicadores_acum
// claves:            { [indicador_id]: clave } (tabla indicadores, cruzado en cliente)
// pmdProgramas:      filas de v_comparativo_pmd
// acciones:          filas de v_informe_acciones con incluir_en_informe
export async function generarInformeGobierno({ ejes, indicadoresPorEje, claves, pmdProgramas, acciones = [] }) {
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
    const accsEje = acciones.filter(a => a.eje_codigo === eje.codigo)
    const pPag = drawEjeSection(doc, eje, inds, pmdPorEje[eje.codigo], accsEje)
    indiceEntries.push({ label: `${eje.codigo} · ${eje.eje}`, page: pPag })
  })

  drawIndice(doc, indiceEntries)
  drawFooters(doc, folio)

  const fStr = `${fechaGen.getFullYear()}${String(fechaGen.getMonth() + 1).padStart(2, '0')}${String(fechaGen.getDate()).padStart(2, '0')}`
  doc.save(`SIMA_SegundoInformeGobierno_${fStr}.pdf`)
}
