// ── Orquestador del Instructivo de llenado — Expediente MML ─────────────────
// Mismo patrón que reportePlantillaMML.js: junta las secciones de
// instructivoMMLSecciones.js sobre un único documento jsPDF y lo descarga.
// No requiere datos capturados — es material de lectura, no de captura.
import { jsPDF } from 'jspdf'
import {
  drawPortadaInstructivo, drawInsumosInstructivo, drawEncabezadoInstructivo, drawDiagnosticoInstructivo,
  drawArbolProblemaInstructivo, drawInvolucradosInstructivo, drawArbolObjetivosInstructivo,
  drawAccionesInstructivo, drawMIRConceptoInstructivo, drawMIRCapturaInstructivo,
  drawMetasInstructivo, drawChecklistGlosarioInstructivo,
} from './instructivoMMLSecciones.js'

export function generarInstructivoExpedienteMML() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  drawPortadaInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawInsumosInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawEncabezadoInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawDiagnosticoInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawArbolProblemaInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawInvolucradosInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawArbolObjetivosInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawAccionesInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawMIRConceptoInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawMIRCapturaInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawMetasInstructivo(doc)

  doc.addPage('letter', 'portrait')
  drawChecklistGlosarioInstructivo(doc)

  doc.save('Instructivo_Expediente_MML.pdf')
}
