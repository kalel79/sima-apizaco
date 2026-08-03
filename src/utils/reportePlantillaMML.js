// ── Orquestador de la Plantilla en blanco del Expediente MML ─────────────────
// Mismo patrón que reporteExpedienteMML.js: junta las secciones de
// plantillaMMLSecciones.js sobre un único documento jsPDF y lo descarga. A
// diferencia del expediente real, no requiere datos capturados — es un
// formato de llenado manuscrito para que los enlaces lo trabajen en papel
// antes de capturarlo en el sistema.
import { jsPDF } from 'jspdf'
import {
  drawPortadaPlantilla, drawTransformacionDeseadaPlantilla, drawArbolPlantilla,
  drawInvolucradosPlantilla, drawAccionesPlantilla, drawAlternativasPlantilla,
  drawMatrizMIRPlantilla, drawCronogramaMetasPlantilla, drawFichaIndicadorPlantilla,
  TIPO_CONFIG_PROBLEMA_PLANTILLA, TIPO_CONFIG_OBJETIVOS_PLANTILLA,
} from './plantillaMMLSecciones.js'

// `prefill` es opcional: { programa } — si ya hay un programa seleccionado en
// la pantalla de Expediente MML, se imprime como referencia en la portada.
export function generarPlantillaExpedienteMML(prefill) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  drawPortadaPlantilla(doc, prefill)

  doc.addPage('letter', 'portrait')
  drawTransformacionDeseadaPlantilla(doc)

  doc.addPage('letter', 'portrait')
  drawArbolPlantilla(doc, TIPO_CONFIG_PROBLEMA_PLANTILLA)

  doc.addPage('letter', 'portrait')
  drawInvolucradosPlantilla(doc)

  doc.addPage('letter', 'portrait')
  drawArbolPlantilla(doc, TIPO_CONFIG_OBJETIVOS_PLANTILLA)

  doc.addPage('letter', 'portrait')
  drawAccionesPlantilla(doc)

  doc.addPage('letter', 'portrait')
  drawAlternativasPlantilla(doc)

  doc.addPage('letter', 'landscape')
  drawMatrizMIRPlantilla(doc)

  doc.addPage('letter', 'landscape')
  drawCronogramaMetasPlantilla(doc)

  doc.addPage('letter', 'portrait')
  drawFichaIndicadorPlantilla(doc)

  doc.save('Plantilla_Expediente_MML.pdf')
}
