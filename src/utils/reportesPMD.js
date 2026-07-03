import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LOGO_BASE64 } from '../logo.js'

// ── Paleta PDF (RGB) — misma paleta que reportes.js ────────────────────────
const GUINDA = [123, 31, 44]
const DORADO = [201, 169, 97]
const GRIS   = [89,  89,  89]
const BLANCO = [255, 255, 255]

const SEM_COLORS = {
  'ÓPTIMO':    { txt: [4,   98,   5], bg: [209, 235, 209] },
  'ADECUADO':  { txt: [0,  176,  80], bg: [200, 243, 220] },
  'RIESGO':    { txt: [180, 135,  0], bg: [255, 248, 200] },
  'CRÍTICO':   { txt: [192,   0,  0], bg: [255, 215, 215] },
  'SIN DATOS': { txt: GRIS,           bg: [235, 235, 235] },
  'SIN DATO':  { txt: GRIS,           bg: [235, 235, 235] },
}

const MESES_NOMBRES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

function formatFecha(d) {
  d = d || new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

// pct_promedio de v_comparativo_pmd ya viene en escala de porcentaje (ej. 101.45)
function pctStrPMD(val) {
  if (val == null) return '-'
  return (+val).toFixed(1) + '%'
}

// Mismos umbrales que usa v_comparativo_pmd para clasificar cada indicador
function semaforoPrograma(pct) {
  if (pct == null) return 'SIN DATOS'
  if (pct >= 110) return 'ÓPTIMO'
  if (pct >= 90)  return 'ADECUADO'
  if (pct >= 70)  return 'RIESGO'
  return 'CRÍTICO'
}

function generarFolioPMD(mes, anio) {
  const mesStr = String(mes).padStart(2, '0')
  const ts = Date.now().toString(36).toUpperCase()
  return `RPM-${anio}-${mesStr}-${ts}`
}

/**
 * @param {Object} params
 * @param {Array}  params.programas          filas de v_comparativo_pmd
 * @param {number} params.mesActual
 * @param {number} params.anioActual
 * @param {string} params.periodoLabel
 * @param {boolean} [params.incluirDetalle]
 * @param {Object}  [params.detallePorPrograma] { [programa_id]: [{clave,nombre,area_nombre,pct_pmd,semaforo}] } — pct_pmd acumulado, escala de porcentaje
 */
export function generarReportePMD({
  programas, mesActual, anioActual, periodoLabel,
  incluirDetalle = false, detallePorPrograma = {},
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const ML = 14
  const folio = generarFolioPMD(mesActual, anioActual)

  // ── PORTADA ────────────────────────────────────────────────────────────
  setFill(doc, GUINDA); doc.rect(0, 0, W, 78, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W - 46) / 2, 12, 46, 46) } catch (_) {}

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('H. AYUNTAMIENTO DE APIZACO 2024-2027', W / 2, 90, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('Dirección de Planeación y Evaluación', W / 2, 98, { align: 'center' })

  doc.setFontSize(19); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('REPORTE COMPARATIVO PMD', W / 2, 118, { align: 'center' })
  doc.text('vs AVANCE MIR', W / 2, 128, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.9); doc.line(ML + 26, 133, W - ML - 26, 133)

  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text('Plan Municipal de Desarrollo 2024-2027', W / 2, 144, { align: 'center' })

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(`Periodo: ENE-${MESES_NOMBRES[(mesActual || 1) - 1]} ${anioActual}`, W / 2, 158, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Fecha de generación: ${formatFecha()}`, W / 2, 166, { align: 'center' })
  doc.text(`Folio: ${folio}`, W / 2, 173, { align: 'center' })

  setDraw(doc, DORADO); doc.setLineWidth(0.8); doc.line(ML, H - 20, W - ML, H - 20)
  doc.setFontSize(7.5); setColor(doc, GRIS)
  doc.text('SIMA · Sistema de Información Municipal de Avance · H. Ayuntamiento de Apizaco 2024-2027', W / 2, H - 12, { align: 'center' })

  // ── SECCIÓN 1: RESUMEN EJECUTIVO ──────────────────────────────────────────
  doc.addPage('letter', 'portrait')
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Resumen Ejecutivo', ML, 22)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(periodoLabel, W - ML, 22, { align: 'right' })
  setDraw(doc, DORADO); doc.setLineWidth(0.5); doc.line(ML, 25, W - ML, 25)

  const conAvance = programas.filter(p => p.indicadores_con_avance > 0).length
  const conPct = programas.filter(p => p.pct_promedio != null)
  const pctGlobal = conPct.length
    ? conPct.reduce((s, p) => s + Number(p.pct_promedio), 0) / conPct.length
    : null
  const totales = programas.reduce((acc, p) => ({
    optimo:   acc.optimo   + (p.optimo   || 0),
    adecuado: acc.adecuado + (p.adecuado || 0),
    riesgo:   acc.riesgo   + (p.riesgo   || 0),
    critico:  acc.critico  + (p.critico  || 0),
  }), { optimo: 0, adecuado: 0, riesgo: 0, critico: 0 })
  const sinDatos = programas.reduce((s, p) => s + ((p.total_indicadores || 0) - (p.indicadores_con_avance || 0)), 0)

  const kpis = [
    { label: 'Programas PMD',      value: `${programas.length}` },
    { label: 'Con avance',         value: `${conAvance} / ${programas.length}` },
    { label: '% Promedio global',  value: pctGlobal != null ? pctStrPMD(pctGlobal) : '—' },
  ]
  const kpiW = (W - ML * 2 - 6) / 3
  kpis.forEach((k, i) => {
    const x = ML + i * (kpiW + 3)
    setFill(doc, [250, 248, 244]); setDraw(doc, DORADO); doc.setLineWidth(0.3)
    doc.roundedRect(x, 30, kpiW, 24, 2, 2, 'FD')
    doc.setFontSize(15); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(k.value, x + kpiW / 2, 42, { align: 'center' })
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(k.label, x + kpiW / 2, 49, { align: 'center' })
  })

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Distribución de indicadores por semáforo', ML, 68)

  const SEM_LABELS = ['ÓPTIMO (≥110%)', 'ADECUADO (90-109%)', 'RIESGO (70-89%)', 'CRÍTICO (<70%)', 'SIN DATOS']
  const SEM_KEYS   = ['ÓPTIMO', 'ADECUADO', 'RIESGO', 'CRÍTICO', 'SIN DATOS']
  autoTable(doc, {
    head: [SEM_LABELS],
    body: [[totales.optimo, totales.adecuado, totales.riesgo, totales.critico, sinDatos]],
    startY: 72,
    margin: { left: ML, right: ML },
    styles: { fontSize: 9.5, halign: 'center', valign: 'middle', cellPadding: 4, fontStyle: 'bold' },
    headStyles: { fontSize: 7.5, halign: 'center' },
    didParseCell: (data) => {
      const sc = SEM_COLORS[SEM_KEYS[data.column.index]]
      if (data.section === 'head') {
        data.cell.styles.fillColor = sc.txt
        data.cell.styles.textColor = BLANCO
      } else {
        data.cell.styles.fillColor = sc.bg
        data.cell.styles.textColor = sc.txt
      }
    },
  })

  // ── SECCIÓN 2 (+3 opcional): POR EJE ──────────────────────────────────────
  const ejesOrdenados = Array.from(new Set(programas.map(p => p.eje).filter(Boolean)))

  ejesOrdenados.forEach(eje => {
    const progsEje = programas.filter(p => p.eje === eje).sort((a, b) => a.numero - b.numero)

    doc.addPage('letter', 'portrait')
    setFill(doc, GUINDA); doc.rect(0, 0, W, 15, 'F')
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); setColor(doc, DORADO)
    doc.text(eje, ML, 10)

    autoTable(doc, {
      head: [['#', 'Programa PMD', 'Indicadores', '% Avance', 'Semáforo']],
      body: progsEje.map(p => {
        const pct = p.pct_promedio != null ? Number(p.pct_promedio) : null
        return [p.numero, p.programa_nombre, `${p.indicadores_con_avance}/${p.total_indicadores}`, pctStrPMD(pct), semaforoPrograma(pct)]
      }),
      startY: 20,
      margin: { left: ML, right: ML },
      styles: { fontSize: 8.5, cellPadding: 2.5, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 26 },
      },
      alternateRowStyles: { fillColor: [249, 244, 232] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const sc = SEM_COLORS[data.cell.raw] || SEM_COLORS['SIN DATOS']
          data.cell.styles.textColor = sc.txt
          data.cell.styles.fillColor = sc.bg
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    if (incluirDetalle) {
      progsEje.forEach(p => {
        const inds = detallePorPrograma[p.programa_id] || []
        if (!inds.length) return

        doc.addPage('letter', 'portrait')
        doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
        doc.text(`${eje} · ${p.numero}. ${p.programa_nombre}`, ML, 18, { maxWidth: W - ML * 2 })
        setDraw(doc, DORADO); doc.setLineWidth(0.4); doc.line(ML, 23, W - ML, 23)

        autoTable(doc, {
          head: [['Clave', 'Indicador', 'Área', '% Avance', 'Semáforo']],
          body: inds.map(i => [i.clave, i.nombre, i.area_nombre, pctStrPMD(i.pct_pmd), i.semaforo || 'SIN DATO']),
          startY: 27,
          margin: { left: ML, right: ML },
          styles: { fontSize: 7.5, cellPadding: 2, halign: 'center', valign: 'middle', overflow: 'linebreak' },
          headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 7.5 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 'auto', halign: 'left' },
            2: { cellWidth: 28 },
            3: { cellWidth: 20 },
            4: { cellWidth: 22 },
          },
          alternateRowStyles: { fillColor: [249, 244, 232] },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
              const sc = SEM_COLORS[data.cell.raw] || SEM_COLORS['SIN DATOS']
              data.cell.styles.textColor = sc.txt
              data.cell.styles.fillColor = sc.bg
              data.cell.styles.fontStyle = 'bold'
            }
          },
        })
      })
    }
  })

  // ── PIE DE PÁGINA en todas las hojas ──────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const w = doc.internal.pageSize.width, h = doc.internal.pageSize.height
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text('SIMA · Sistema de Información Municipal de Avance · H. Ayuntamiento de Apizaco 2024-2027', w / 2, h - 10, { align: 'center' })
    doc.text(`Página ${p} de ${totalPages}  ·  Folio: ${folio}`, w / 2, h - 5.5, { align: 'center' })
  }

  doc.save(`SIMA_ReportePMD_${periodoLabel.replace(/[^A-Z0-9]/g, '_')}.pdf`)
  return folio
}
