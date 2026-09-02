import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LOGO_BASE64 } from '../logo.js'
import { GUINDA, DORADO, GRIS, BLANCO, numStr, pctStr, formatFecha, setColor, setFill, setDraw } from './reportesBase.js'

// ══════════════════════════════════════════════════════════════════════════════
// ACUSE DE CAPTURA (PDF individual por área, tras validación completa del mes)
// ══════════════════════════════════════════════════════════════════════════════

// Semáforo del acuse: colores exactos de especificación (fill sólido + texto legible)
const SEM_ACUSE = {
  'ÓPTIMO':   { fill: [4,   98,   5], txt: BLANCO },
  'ADECUADO': { fill: [0,  176,  80], txt: BLANCO },
  'RIESGO':   { fill: [255, 192,   0], txt: [122, 88, 0] },
  'CRÍTICO':  { fill: [192,   0,   0], txt: BLANCO },
}

const MESES_LARGOS = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO',
                      'AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']

function slugArea(nombre) {
  return (nombre || 'AREA')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'AREA'
}

export function generarFolioAcuse(areaId, mes, anio) {
  const mesStr = String(mes).padStart(2, '0')
  const ts = Date.now().toString(36).toUpperCase()
  return `SIMA-${anio}-${mesStr}-${areaId}-${ts}`
}

// El acuse maneja DOS escalas y tiene que decirlo en todos lados: la meta y el
// resultado son del mes que se acaba de validar, mientras que el
// pct_cumplimiento y el semáforo que guarda `avances` son del acumulado
// ENE→mes del ejercicio. Antes el encabezado decía solo "Periodo capturado:
// ENE-AGO 2026" y la tabla ponía las cuatro cifras en fila, así que en agosto
// los 121 indicadores con meta 0 en el mes salían como "Meta 0 · Resultado 0 ·
// 200% ÓPTIMO" sin nada que explicara de dónde venía el porcentaje.
//
// `periodoLabel` es el rango del acumulado ("ENE-AGO 2026"); el mes suelto se
// arma aquí a partir de `mes`/`anio`.
// datos: { area, enlaceNombre, mes, anio, periodoLabel, indicadores, folio, validadoAt }
export function generarAcusePDF({
  area, enlaceNombre, mes, anio, periodoLabel, indicadores, folio, validadoAt,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.width
  const ML = 14
  const fecha = validadoAt || new Date()
  const fechaStr = `${formatFecha(fecha)} ${String(fecha.getHours()).padStart(2,'0')}:${String(fecha.getMinutes()).padStart(2,'0')}`

  // ── Encabezado institucional (franja guinda) ────────────────────────────────
  setFill(doc, GUINDA); doc.rect(0, 0, W, 44, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', ML, 7, 20, 20) } catch (_) {}

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); setColor(doc, DORADO)
  doc.text('ACUSE DE CAPTURA — SIMA', W / 2, 15, { align: 'center' })
  doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); setColor(doc, DORADO)
  doc.text('Sistema de Información Municipal de Avance', W / 2, 22, { align: 'center' })
  doc.setFontSize(8.5)
  doc.text('H. Ayuntamiento de Apizaco · 2024-2027', W / 2, 29, { align: 'center' })
  doc.text('Dirección de Planeación y Evaluación', W / 2, 35, { align: 'center' })

  // ── Datos del acuse ───────────────────────────────────────────────────────
  let y = 54
  doc.setFontSize(9); setColor(doc, [30, 30, 30])
  const mesLabel = `${MESES_LARGOS[(mes || 1) - 1]} ${anio}`
  const campos = [
    ['Área:',                     area || '-'],
    ['Enlace responsable:',       enlaceNombre || '-'],
    ['Mes capturado:',            mesLabel],
    ['Avance acumulado:',         periodoLabel || '-'],
    ['Fecha y hora de validación:', fechaStr],
    ['Folio de acuse:',           folio],
  ]
  campos.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(label, ML, y)
    doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
    doc.text(String(val), ML + 46, y)
    y += 6.5
  })

  setDraw(doc, DORADO); doc.setLineWidth(0.4); doc.line(ML, y + 2, W - ML, y + 2)
  y += 9

  // ── Tabla de indicadores capturados ──────────────────────────────────────
  const rows = (indicadores || []).map((ind, idx) => [
    idx + 1,
    ind.clave || '-',
    ind.nombre || '',
    ind.nivel_mir || '-',
    numStr(ind.meta_programada),
    numStr(ind.resultado),
    numStr(ind.meta_acum),
    numStr(ind.resultado_acum),
    ind.pct_cumplimiento,
    ind.semaforo || 'SIN DATO',
  ])

  // Dos renglones de encabezado: el porcentaje y el semáforo cuelgan del grupo
  // "Acumulado", junto a la meta y el resultado con los que se calcularon, para
  // que no se lean como si fueran del mes.
  autoTable(doc, {
    head: [
      [
        { content: '#',         rowSpan: 2 },
        { content: 'Clave',     rowSpan: 2 },
        { content: 'Indicador', rowSpan: 2 },
        { content: 'Nivel MIR', rowSpan: 2 },
        { content: mesLabel, colSpan: 2 },
        { content: `Acumulado ${periodoLabel || ''}`.trim(), colSpan: 4 },
      ],
      ['Meta', 'Resultado', 'Meta', 'Resultado', '% Avance', 'Semáforo'],
    ],
    body: rows,
    startY: y,
    margin: { left: ML, right: ML },
    styles: {
      fontSize: 7, cellPadding: [1.6, 1.6, 1.6, 1.6],
      lineColor: [220, 220, 220], lineWidth: 0.1,
      halign: 'center', valign: 'middle', overflow: 'linebreak', textColor: [20, 20, 20],
    },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      // 188 mm utiles en carta vertical. Clave y Nivel MIR llevan el ancho
      // justo para no partirse a 7 pt ('E7-IMM-A1.1-01', 'Actividad 1.1');
      // lo que sobra se va al nombre del indicador.
      0: { cellWidth: 8 },
      1: { cellWidth: 21 },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 20 },
      4: { cellWidth: 14 },
      5: { cellWidth: 16 },
      6: { cellWidth: 14 },
      7: { cellWidth: 16 },
      8: { cellWidth: 15 },
      9: { cellWidth: 20 },
    },
    alternateRowStyles: { fillColor: [245, 232, 234] },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 8) {
          data.cell.text = [pctStr(data.cell.raw)]
        }
        if (data.column.index === 9) {
          const sc = SEM_ACUSE[data.cell.raw] || { fill: [230, 230, 230], txt: [80, 80, 80] }
          data.cell.styles.fillColor  = sc.fill
          data.cell.styles.textColor  = sc.txt
          data.cell.styles.fontStyle  = 'bold'
        }
      }
    },
  })

  // ── Pie del documento ─────────────────────────────────────────────────────
  const H = doc.internal.pageSize.height
  const FOOTER_H = 50 // espacio total que ocupa el bloque de pie + firma
  let fy
  if (doc.lastAutoTable.finalY + FOOTER_H > H - 10) {
    doc.addPage('letter', 'portrait')
    fy = 25
  } else {
    fy = doc.lastAutoTable.finalY + 16
  }

  doc.setFontSize(8); doc.setFont('helvetica', 'italic'); setColor(doc, GRIS)
  doc.text('Este documento es el acuse oficial de captura de avances en SIMA.', W / 2, fy, { align: 'center' })
  fy += 4.5
  doc.setFontSize(7)
  doc.text(`La meta y el resultado son los capturados en ${mesLabel}; el % de avance y el semaforo se`, W / 2, fy, { align: 'center' })
  fy += 4
  doc.text(`calculan sobre el acumulado ${periodoLabel || ''} del ejercicio.`.trim(), W / 2, fy, { align: 'center' })
  fy += 5
  doc.setFontSize(8)
  doc.text(`Generado el ${fechaStr} por ${enlaceNombre || '-'}`, W / 2, fy, { align: 'center' })
  fy += 16

  setDraw(doc, [120, 120, 120]); doc.setLineWidth(0.3)
  doc.line(W / 2 - 40, fy, W / 2 + 40, fy)
  fy += 5
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30])
  doc.text(`${enlaceNombre || '-'}  ·  Enlace de Área`, W / 2, fy, { align: 'center' })
  fy += 7
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Folio: ${folio}`, W / 2, fy, { align: 'center' })

  const fileName = `ACUSE_SIMA_${slugArea(area)}_${MESES_LARGOS[(mes || 1) - 1].slice(0, 3)}_${anio}.pdf`
  doc.save(fileName)
  return fileName
}
