// ── Árbol del Problema y de Objetivos (MIR) — los 9 programas en un solo PDF ──
// Formato presentación (apaisado): portada, índice de los 9 programas y
// cierre, envolviendo el contenido ya existente sin tocarlo. Reutiliza el
// diagrama de árbol que ya existe para el Expediente MML individual
// (drawArbolDiagrama), que ya señala el área responsable del indicador
// vinculado a cada nodo del árbol de Objetivos (de ahí se deriva la MIR:
// Fin/Propósito/Componentes/Actividades).
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getProgramasLista, resolverDatosMML } from '../lib/supabase.js'
import { drawArbolDiagrama } from './expedienteMMLSecciones.js'
import { TIPO_CONFIG_PROBLEMA, TIPO_CONFIG_OBJETIVOS } from './reporteExpedienteMML.js'
import { LOGO_BASE64 } from '../logo.js'
import { GUINDA, DORADO, GRIS, BLANCO, setColor, setFill, setDraw } from './reportesBase.js'

function formatFecha(d) {
  d = d || new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function generarFolio(anio) {
  return `ARB-${anio}-${Date.now().toString(36).toUpperCase()}`
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : GUINDA
}

export async function generarArbolProblemaObjetivosMIR(anio) {
  const programas = await getProgramasLista()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const ML = 14
  const folio = generarFolio(anio)

  // ── Diapositiva 1: Portada ────────────────────────────────────────────
  setFill(doc, GUINDA); doc.rect(0, 0, W, H, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W - 34) / 2, 20, 34, 34) } catch (_) {}

  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); setColor(doc, BLANCO)
  doc.text('H. AYUNTAMIENTO DE APIZACO 2024-2027', W / 2, 64, { align: 'center' })
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); setColor(doc, DORADO)
  doc.text('Dirección de Planeación y Evaluación', W / 2, 71, { align: 'center' })

  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); setColor(doc, BLANCO)
  doc.text('ÁRBOL PROBLEMA-OBJETIVOS MIR', W / 2, 96, { align: 'center' })
  doc.setFontSize(13); doc.setFont('helvetica', 'normal'); setColor(doc, DORADO)
  doc.text('Problema central y objetivo central · 9 programas presupuestarios', W / 2, 107, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.8); doc.line(W / 2 - 40, 114, W / 2 + 40, 114)

  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); setColor(doc, BLANCO)
  doc.text('Metodología de Marco Lógico (MML)', W / 2, 126, { align: 'center' })
  doc.setFontSize(8.5); setColor(doc, DORADO)
  doc.text(`Anteproyecto de Presupuesto de Egresos ${anio}  ·  Fecha de generación: ${formatFecha()}  ·  Folio: ${folio}`, W / 2, 134, { align: 'center' })

  setDraw(doc, DORADO); doc.setLineWidth(0.6); doc.line(ML, H - 16, W - ML, H - 16)
  doc.setFontSize(7.5); setColor(doc, BLANCO)
  doc.text('SIMA · Sistema de Información Municipal de Avance · H. Ayuntamiento de Apizaco 2024-2027', W / 2, H - 10, { align: 'center' })

  // ── Diapositiva 2: Índice de programas ─────────────────────────────────
  doc.addPage('letter', 'landscape')
  doc.setFontSize(12.5); doc.setFont('helvetica', 'bold')
  setFill(doc, GUINDA); doc.rect(0, 0, W, 18, 'F')
  setColor(doc, DORADO)
  doc.text('Índice de programas', ML, 12)

  // Cada programa ocupa exactamente 2 páginas (Problema + Objetivos), en el
  // mismo orden que getProgramasLista() — la numeración es determinística
  // porque drawArbolDiagrama nunca agrega páginas extra.
  autoTable(doc, {
    head: [['Eje', 'Clave', 'Programa presupuestario', 'Diapositivas']],
    body: programas.map((p, i) => [
      { content: p.eje_codigo || '—', styles: { textColor: hexToRgb(p.eje_color) } },
      p.clave,
      p.nombre,
      `${3 + i * 2}-${4 + i * 2}`,
    ]),
    startY: 24,
    margin: { left: ML, right: ML },
    styles: { fontSize: 8.5, cellPadding: 2.6, halign: 'left', valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 8, halign: 'left' },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [249, 244, 232] },
  })

  // ── Diapositivas 3-20: árbol del Problema + árbol de Objetivos por programa ─
  for (const p of programas) {
    const datos = await resolverDatosMML(p.id, anio)
    datos.anio = anio

    doc.addPage('letter', 'landscape')
    drawArbolDiagrama(doc, datos, 'PROBLEMA', TIPO_CONFIG_PROBLEMA, `PP-FM-04 · ${p.clave}`)

    doc.addPage('letter', 'landscape')
    drawArbolDiagrama(doc, datos, 'OBJETIVOS', TIPO_CONFIG_OBJETIVOS, `PP-FM-07 · ${p.clave}`)
  }

  // ── Diapositiva final: cierre ──────────────────────────────────────────
  doc.addPage('letter', 'landscape')
  setFill(doc, GUINDA); doc.rect(0, 0, W, H, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W - 30) / 2, H / 2 - 46, 30, 30) } catch (_) {}
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); setColor(doc, DORADO)
  doc.text('SIMA · Sistema de Información Municipal de Avance', W / 2, H / 2 - 4, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, BLANCO)
  doc.text('H. Ayuntamiento de Apizaco 2024-2027', W / 2, H / 2 + 5, { align: 'center' })
  doc.setFontSize(8); setColor(doc, DORADO)
  doc.text(`Folio: ${folio}  ·  ${formatFecha()}`, W / 2, H / 2 + 14, { align: 'center' })

  doc.save(`SIMA_Arbol_Problema_Objetivos_MIR_${anio}.pdf`)
}
