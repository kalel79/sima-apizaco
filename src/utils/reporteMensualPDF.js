import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LOGO_BASE64 } from '../logo.js'
import {
  GUINDA, DORADO, GRIS, BLANCO, SEM_COLORS,
  FIRMAS_RESP, PROGRAMA_EJE, ENTIDAD_NOMBRE, MESES_NOMBRES,
  sortByMIR, pctStr, numStr, formatFecha, setColor, setFill, setDraw,
} from './reportesBase.js'
import { barraDataURL, lineaDataURL } from './reporteMensualGraficas.js'

// ── Encabezado de página corrido ─────────────────────────────────────────────
function drawRunningHeader(doc, ejeNombre) {
  const W = doc.internal.pageSize.width
  try { doc.addImage(LOGO_BASE64, 'PNG', 14, 6, 8, 8) } catch (_) {}
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(ejeNombre, 24, 12, { maxWidth: W - 42 })
  setDraw(doc, GUINDA); doc.setLineWidth(0.3); doc.line(14, 16, W - 14, 16)
  setDraw(doc, DORADO); doc.setLineWidth(0.2); doc.line(14, 16.5, W - 14, 16.5)
}

// ── Bloque de encabezado de programa (Entidad/Programa/Unidad Responsable/Elaboró) ──
// Tabla de 2 columnas (etiqueta en guinda, valor en negro) sobre fondo blanco,
// antes de la tabla de indicadores. Devuelve la Y donde debe iniciar la tabla.
function drawProgramaHeader(doc, eje, startY) {
  const W = doc.internal.pageSize.width, ML = 14
  const info = PROGRAMA_EJE[eje.codigo] || {}
  const rows = [
    ['Entidad:',             ENTIDAD_NOMBRE],
    ['Programa:',            info.programa   || '-'],
    ['Unidad Responsable:',  info.responsable || '-'],
    ['Elaboró:',             info.elaboro     || '-'],
  ]
  const LABEL_W = 40
  const VALUE_W = W - ML * 2 - LABEL_W - 4
  const FONT_SZ = 8, LINE_H = 3.6, PAD_V = 2

  doc.setFontSize(FONT_SZ)
  const wrapped = rows.map(([label, val]) => doc.splitTextToSize(val, VALUE_W))
  const rowH = wrapped.map(lines => Math.max(LINE_H + PAD_V * 2, lines.length * LINE_H + PAD_V * 2))
  const totalH = rowH.reduce((a, b) => a + b, 0)

  setDraw(doc, [210, 205, 195]); doc.setLineWidth(0.25)
  setFill(doc, BLANCO); doc.rect(ML, startY, W - ML * 2, totalH, 'FD')
  doc.line(ML + LABEL_W, startY, ML + LABEL_W, startY + totalH)

  let ry = startY
  rows.forEach(([label], i) => {
    const h = rowH[i]
    if (i > 0) doc.line(ML, ry, W - ML, ry)
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(label, ML + 2, ry + PAD_V + LINE_H - 1)
    doc.setFont('helvetica', 'normal'); setColor(doc, [20, 20, 20])
    doc.text(wrapped[i], ML + LABEL_W + 2, ry + PAD_V + LINE_H - 1)
    ry += h
  })

  return startY + totalH + 4
}

// ── Bloque de firmas ─────────────────────────────────────────────────────────
function drawFirmas(doc, ejeCodigo, y) {
  const resp = FIRMAS_RESP[ejeCodigo] || { nombre: '___________________', cargo: 'Responsable del Eje' }
  const firmantes = [
    { rol: 'AUTORIZÓ',    nombre: 'C. Javier Rivera Bonilla',           cargo: 'Presidente Municipal de Apizaco' },
    { rol: 'VO.BO.',      nombre: 'C. María de la Paz Flores Hernández', cargo: 'Síndico Municipal' },
    { rol: 'ELABORÓ',     nombre: 'C.p. David Hernandez Montiel',        cargo: 'Tesorero' },
    { rol: 'RESPONSABLE', nombre: resp.nombre,                           cargo: resp.cargo },
  ]
  const W = doc.internal.pageSize.width, ML = 14
  const colW = (W - ML * 2 - 9) / 4

  doc.setFontSize(6.5)
  firmantes.forEach((f, i) => {
    const xL = ML + i * (colW + 3), xC = xL + colW / 2, lineY = y + 17
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(f.rol, xC, y + 4, { align: 'center' })
    setDraw(doc, [150, 150, 150]); doc.setLineWidth(0.3)
    doc.line(xL + 2, lineY, xL + colW - 2, lineY)
    doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30])
    const nLines = doc.splitTextToSize(f.nombre, colW - 4)
    doc.text(nLines, xC, lineY + 4, { align: 'center' })
    doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    const cLines = doc.splitTextToSize(f.cargo, colW - 4)
    doc.text(cLines, xC, lineY + 4 + nLines.length * 3.5, { align: 'center' })
  })
}

// ── Gráficas por eje (página dedicada) ───────────────────────────────────────
function drawGraficasPage(doc, eje, periodoLabel, indsEje, avancesMensuales, mesActual) {
  const W = doc.internal.pageSize.width, ML = 14

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Avance del Eje', W / 2, 21, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.5); doc.line(ML, 24.5, W - ML, 24.5)

  // ── Barra de avance acumulado del eje (color institucional uniforme) ────────
  // Caja proporcional al canvas (460×95, ratio ≈4.84) para no distorsionar el render.
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Avance Acumulado del Eje', W / 2, 32, { align: 'center' })
  const BAR_W = 170, BAR_H = 35, BAR_X = (W - BAR_W) / 2
  try {
    const barURL = barraDataURL(eje.pct_promedio || 0, 460, 95)
    doc.addImage(barURL, 'PNG', BAR_X, 36, BAR_W, BAR_H)
  } catch (_) {}

  // Stats
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Total indicadores: ${eje.total_indicadores||0}`, W / 2, 80, { align: 'center' })
  doc.text(`Período: ${periodoLabel}`, W / 2, 86, { align: 'center' })

  setDraw(doc, [220, 220, 220]); doc.setLineWidth(0.2); doc.line(ML, 93, W - ML, 93)

  // ── Gráfica de línea acumulada meta vs resultado ────────────────────────────
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Tendencia Acumulada Mensual', W / 2, 102, { align: 'center' })

  try {
    const mesAct = mesActual || 5
    const avMap  = avancesMensuales || {}
    const inds   = indsEje || []

    const lineData = Array.from({ length: mesAct }, (_, mi) => {
      const targetMes = mi + 1
      let metaAcum = 0, resAcum = 0
      inds.forEach(ind => {
        const avInd = avMap[ind.id] || {}
        for (let m = 1; m <= targetMes; m++) {
          metaAcum += avInd[m]?.meta || 0
          resAcum  += avInd[m]?.res  || 0
        }
      })
      return { mesLabel: MESES_NOMBRES[mi], metaAcum, resAcum }
    })

    // Caja proporcional al canvas (460×175, ratio ≈2.63) para no distorsionar el render.
    const LINE_W = 105, LINE_H = 40, LINE_X = (W - LINE_W) / 2
    const lineURL = lineaDataURL(lineData, 460, 175)
    doc.addImage(lineURL, 'PNG', LINE_X, 106, LINE_W, LINE_H)
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════════════════════
// GENERAR PDF
// ══════════════════════════════════════════════════════════════════════════════
export function generarPDF({
  global: g, ejes, indicadoresPorEje,
  avancesMensuales, mesActual, anioActual,
  periodoLabel, piloto = false, correccionesExtemporaneas = [],
}) {
  const ejesToRender = piloto ? ejes.slice(0, 1) : ejes
  const mesAct = mesActual || 5
  const ML = 14

  // ── PORTADA (portrait) ─────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W_P = doc.internal.pageSize.width
  const H_P = doc.internal.pageSize.height

  setFill(doc, GUINDA); doc.rect(0, 0, W_P, 78, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W_P - 50) / 2, 13, 50, 50) } catch (_) {}

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('H. AYUNTAMIENTO DE APIZACO 2024-2027', W_P / 2, 92, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('Sistema de Información Municipal de Avance', W_P / 2, 101, { align: 'center' })
  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('INFORME DE AVANCE MIR', W_P / 2, 123, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.9); doc.line(ML + 22, 128, W_P - ML - 22, 128)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(`Periodo: ${periodoLabel}`, W_P / 2, 140, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('Generado por: Dirección de Planeación y Evaluación', W_P / 2, 151, { align: 'center' })
  doc.text(`Fecha de generación: ${formatFecha()}`, W_P / 2, 159, { align: 'center' })

  const kpis = [
    { label: 'Cumplimiento Global', value: pctStr(g?.pct_global) },
    { label: 'Con Avance',          value: `${(g?.optimo||0)+(g?.adecuado||0)} ind.` },
    { label: 'Ejes Estratégicos',   value: `${ejes.length}` },
    { label: 'Riesgo / Crítico',    value: `${(g?.riesgo||0)+(g?.critico||0)}` },
  ]
  const kpiW = (W_P - ML * 2 - 9) / 4
  kpis.forEach((k, i) => {
    const x = ML + i * (kpiW + 3)
    setFill(doc, [250, 248, 244]); setDraw(doc, DORADO); doc.setLineWidth(0.3)
    doc.roundedRect(x, 172, kpiW, 25, 2, 2, 'FD')
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(k.value, x + kpiW / 2, 185, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(k.label, x + kpiW / 2, 192, { align: 'center' })
  })
  setDraw(doc, DORADO); doc.setLineWidth(1); doc.line(ML, H_P - 18, W_P - ML, H_P - 18)
  doc.setFontSize(7); setColor(doc, GRIS)
  doc.text('H. Ayuntamiento de Apizaco · Dirección de Planeación y Evaluación · SIMA 2026', W_P / 2, H_P - 10, { align: 'center' })

  // ── RESUMEN EJECUTIVO (landscape) ──────────────────────────────────────────
  doc.addPage('letter', 'landscape')
  const W_L = doc.internal.pageSize.width

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Resumen Ejecutivo', ML, 22)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(periodoLabel, W_L - ML, 22, { align: 'right' })
  setDraw(doc, DORADO); doc.setLineWidth(0.6); doc.line(ML, 25, W_L - ML, 25)

  // Anchos: Eje=88 + TotalInd=14 + %Avance=18 + Óptimo=14 + Adecuado=16 + Riesgo=14 + Crítico=14 = 178mm
  const RES_TOTAL_W = 178
  const resMargin = (W_L - RES_TOTAL_W) / 2

  autoTable(doc, {
    head: [['Eje Estratégico', 'Total\nInd.', '% Avance', 'Óptimo', 'Adecuado', 'Riesgo', 'Crítico']],
    body: ejes.map(e => [e.eje, e.total_indicadores||0, pctStr(e.pct_promedio),
      e.optimo||0, e.adecuado||0, e.riesgo||0, e.critico||0]),
    startY: 30,
    margin: { left: resMargin, right: resMargin },
    styles: {
      fontSize: 8.5, cellPadding: [2.5, 2, 2.5, 2],
      lineColor: [220, 220, 220], lineWidth: 0.1,
      halign: 'center', valign: 'middle', overflow: 'linebreak',
    },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', halign: 'center', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 88, halign: 'left' },
      1: { cellWidth: 14 },
      2: { cellWidth: 18 },
      3: { cellWidth: 14 },
      4: { cellWidth: 16 },
      5: { cellWidth: 14 },
      6: { cellWidth: 14 },
    },
    alternateRowStyles: { fillColor: [249, 244, 232] },
  })

  // ── AVISO: correcciones registradas después del cierre de este periodo ─────
  if (correccionesExtemporaneas.length) {
    const yExt = doc.lastAutoTable.finalY + 10
    setFill(doc, [255, 243, 224]); setDraw(doc, [239, 108, 0]); doc.setLineWidth(0.4)
    doc.roundedRect(resMargin, yExt, RES_TOTAL_W, 10, 2, 2, 'FD')
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setColor(doc, [180, 80, 0])
    doc.text(`⚠ ${correccionesExtemporaneas.length} corrección(es) registrada(s) después del cierre de este periodo`, resMargin + 4, yExt + 6.5)

    autoTable(doc, {
      head: [['Avance', 'Mes', 'Corrigió', 'Fecha', 'Justificación']],
      body: correccionesExtemporaneas.map(c => [
        `#${c.registro_id}`,
        MESES_NOMBRES[(c.datos_nuevo?.mes || 1) - 1],
        c.usuario?.nombre || '—',
        formatFecha(new Date(c.created_at)),
        c.datos_nuevo?.justificacion || '—',
      ]),
      startY: yExt + 14,
      margin: { left: resMargin, right: resMargin },
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [239, 108, 0], textColor: BLANCO, fontSize: 7.5 },
    })
  }

  // ── PÁGINAS POR EJE ────────────────────────────────────────────────────────
  const H_L  = 215.9
  const avMap = avancesMensuales || {}

  // Cálculo dinámico de columnas para tabla mensual
  const NUM_MESES   = mesAct
  const CW_NUM      = 5
  const CW_NIVEL    = 22
  const CW_AREA     = 22
  const CW_ACUM_MET = 12
  const CW_ACUM_RES = 12
  const CW_ACUM_PCT = 17
  const ACUM_FIXED  = CW_ACUM_MET + CW_ACUM_RES + CW_ACUM_PCT
  const USABLE_W    = 249
  const AVAIL_IND   = USABLE_W - CW_NUM - CW_NIVEL - CW_AREA - ACUM_FIXED
  // Distribuir entre indicador y columnas de mes
  const CW_MES      = Math.max(5, Math.floor((AVAIL_IND - 55) / (NUM_MESES * 2)))
  const CW_IND      = Math.max(40, AVAIL_IND - NUM_MESES * 2 * CW_MES)
  const TABLE_W     = CW_NUM + CW_NIVEL + CW_IND + CW_AREA + NUM_MESES * 2 * CW_MES + ACUM_FIXED
  const indMargin   = (W_L - TABLE_W) / 2
  const FONT_SZ     = NUM_MESES <= 5 ? 7 : NUM_MESES <= 8 ? 6.5 : 6
  const ACUM_START  = 4 + NUM_MESES * 2

  ejesToRender.forEach(eje => {
    const indsRaw = indicadoresPorEje[eje.codigo] || []
    const inds    = sortByMIR(indsRaw)

    // ── PASO A: Encabezado de programa + tabla mensual + firmas ───────────
    doc.addPage('letter', 'landscape')
    const tablaStartY = drawProgramaHeader(doc, eje, 20)

    // Encabezados dobles
    const headRow1 = [
      { content: '#',        rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Nivel\nMIR', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Indicador',rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Área',     rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      ...MESES_NOMBRES.slice(0, NUM_MESES).map(m => ({
        content: m, colSpan: 2,
        styles: { halign: 'center', valign: 'middle', fillColor: [100, 20, 32] },
      })),
      { content: 'ACUMULADO', colSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [70, 14, 22] } },
    ]
    const subStyle = { halign: 'center', valign: 'middle', fontSize: FONT_SZ - 0.5, fontStyle: 'normal' }
    const headRow2 = [
      ...MESES_NOMBRES.slice(0, NUM_MESES).flatMap(() => [
        { content: 'Meta', styles: { ...subStyle, fillColor: [140, 50, 65] } },
        { content: 'Res',  styles: { ...subStyle, fillColor: [110, 35, 48] } },
      ]),
      { content: 'Meta',   styles: { ...subStyle, fillColor: [60, 10, 18] } },
      { content: 'Res',    styles: { ...subStyle, fillColor: [60, 10, 18] } },
      { content: '% Av.',  styles: { ...subStyle, fillColor: [60, 10, 18] } },
    ]

    // Filas de datos
    const bodyRows = inds.map((ind, idx) => {
      const avInd = avMap[ind.id] || {}
      const monthCells = Array.from({ length: NUM_MESES }, (_, mi) => {
        const m  = mi + 1
        const av = avInd[m]
        return [av ? numStr(av.meta) : '', av ? numStr(av.res) : '']
      }).flat()
      const metaAcum = Array.from({ length: NUM_MESES }, (_, mi) => avInd[mi+1]?.meta || 0).reduce((a,b) => a+b, 0)
      const resAcum  = Array.from({ length: NUM_MESES }, (_, mi) => avInd[mi+1]?.res  || 0).reduce((a,b) => a+b, 0)
      const pctAcum  = metaAcum > 0 ? resAcum / metaAcum : resAcum > 0 ? resAcum / 1.0 : null
      return [
        idx + 1,
        ind.nivel_mir || '-',
        ind.indicador || '-',
        ind.area      || '-',
        ...monthCells,
        metaAcum > 0 ? numStr(metaAcum) : (resAcum > 0 ? '1' : '-'),
        numStr(resAcum),
        pctAcum,  // raw number → formateado en didParseCell
      ]
    })

    // Column styles
    const colStyles = {
      0: { cellWidth: CW_NUM,   halign: 'center', valign: 'middle' },
      1: { cellWidth: CW_NIVEL, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      2: { cellWidth: CW_IND,   halign: 'center', valign: 'middle', overflow: 'linebreak' },
      3: { cellWidth: CW_AREA,  halign: 'center', valign: 'middle', overflow: 'linebreak' },
    }
    for (let m = 0; m < NUM_MESES * 2; m++) {
      colStyles[4 + m] = { cellWidth: CW_MES, halign: 'center' }
    }
    colStyles[ACUM_START]   = { cellWidth: CW_ACUM_MET, halign: 'center' }
    colStyles[ACUM_START+1] = { cellWidth: CW_ACUM_RES, halign: 'center' }
    colStyles[ACUM_START+2] = { cellWidth: CW_ACUM_PCT, halign: 'center' }

    autoTable(doc, {
      head: [headRow1, headRow2],
      body: bodyRows,
      startY: tablaStartY,
      margin: { left: indMargin, right: indMargin, bottom: 60, top: 20 },
      styles: {
        fontSize: FONT_SZ, cellPadding: [1.5, 1.2, 1.5, 1.2],
        lineColor: [220, 220, 220], lineWidth: 0.1,
        overflow: 'linebreak', textColor: [40, 40, 40],
        halign: 'center', valign: 'middle',
        minCellHeight: 0,
      },
      headStyles: {
        fillColor: GUINDA, textColor: BLANCO,
        fontStyle: 'bold', fontSize: FONT_SZ,
        halign: 'center', valign: 'middle',
        minCellHeight: 0,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: colStyles,
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Asegurar wrapping en todas las celdas de texto
          data.cell.styles.overflow = 'linebreak'
          data.cell.styles.valign   = 'middle'
          if (data.column.index === ACUM_START + 2) {
            const pct = data.cell.raw
            if (typeof pct === 'number') {
              data.cell.text = [pctStr(pct)]
              const sem = pct >= 1.10 ? 'ÓPTIMO' : pct >= 0.90 ? 'ADECUADO' : pct >= 0.70 ? 'RIESGO' : 'CRÍTICO'
              const sc  = SEM_COLORS[sem]
              data.cell.styles.textColor = sc.txt
              data.cell.styles.fillColor = sc.bg
              data.cell.styles.fontStyle = 'bold'
            } else {
              data.cell.text = ['-']
            }
          }
        }
      },
      didDrawPage: (data) => {
        // Siempre redibujar el encabezado en cada página (incluyendo la primera)
        drawRunningHeader(doc, eje.eje)
      },
    })

    const finalY = doc.lastAutoTable.finalY
    if (finalY + 56 > H_L - 8) {
      doc.addPage('letter', 'landscape')
      drawRunningHeader(doc, eje.eje)
      drawFirmas(doc, eje.codigo, 26)
    } else {
      drawFirmas(doc, eje.codigo, finalY + 8)
    }

    // ── PASO B: Página de gráficas + firmas ────────────────────────────────
    doc.addPage('letter', 'landscape')
    drawRunningHeader(doc, eje.eje)
    drawGraficasPage(doc, eje, periodoLabel, indsRaw, avMap, mesAct)
    drawFirmas(doc, eje.codigo, 150)
  })

  // Pie de página en todas las páginas
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, [150, 150, 150])
    doc.text(`Página ${p} de ${totalPages}  ·  SIMA · H. Ayuntamiento de Apizaco · ${periodoLabel}`,
      W / 2, H - 6, { align: 'center' })
  }

  doc.save(`SIMA_InformeAvance${piloto ? '_PILOTO' : ''}_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.pdf`)
}

export function generarPDFPiloto(datos) {
  return generarPDF({ ...datos, piloto: true })
}
