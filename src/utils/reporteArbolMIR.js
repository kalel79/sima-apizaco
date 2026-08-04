// ── Árbol del Problema y de Objetivos (MIR) — los 9 programas en un solo PDF ──
// Mismo patrón que informeGobierno.js: recorre una lista (aquí, programas) y
// añade secciones a un único jsPDF. Reutiliza el diagrama de árbol que ya
// existe para el Expediente MML individual (drawArbolDiagrama), que ahora
// también señala el área responsable del indicador vinculado a cada nodo del
// árbol de Objetivos (de ahí se deriva la MIR: Fin/Propósito/Componentes/
// Actividades).
import { jsPDF } from 'jspdf'
import { getProgramasLista, resolverDatosMML } from '../lib/supabase.js'
import { drawArbolDiagrama } from './expedienteMMLSecciones.js'
import { TIPO_CONFIG_PROBLEMA, TIPO_CONFIG_OBJETIVOS } from './reporteExpedienteMML.js'

export async function generarArbolProblemaObjetivosMIR(anio) {
  const programas = await getProgramasLista()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  let primera = true
  for (const p of programas) {
    const datos = await resolverDatosMML(p.id, anio)
    datos.anio = anio

    if (!primera) doc.addPage('letter', 'landscape')
    primera = false
    drawArbolDiagrama(doc, datos, 'PROBLEMA', TIPO_CONFIG_PROBLEMA, `PP-FM-04 · ${p.clave}`)

    doc.addPage('letter', 'landscape')
    drawArbolDiagrama(doc, datos, 'OBJETIVOS', TIPO_CONFIG_OBJETIVOS, `PP-FM-07 · ${p.clave}`)
  }

  doc.save(`SIMA_Arbol_Problema_Objetivos_MIR_${anio}.pdf`)
}
