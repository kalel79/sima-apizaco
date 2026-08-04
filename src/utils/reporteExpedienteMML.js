// ── Orquestador del Expediente MML — PDF oficial PP-FM, página por página ────
// Mismo patrón que informeGobierno.js: junta las secciones de
// expedienteMMLSecciones.js sobre un único documento jsPDF y lo descarga.
import { jsPDF } from 'jspdf'
import { supabase, resolverDatosMML } from '../lib/supabase.js'
import {
  drawFichaProyecto, drawDescripcionPrograma, drawIndice, drawTransformacionDeseada,
  drawArbolDiagrama, drawInvolucrados, drawAcciones, drawAlternativas, drawMatrizMIR,
  drawCronogramaMetas, drawFichaIndicador,
} from './expedienteMMLSecciones.js'

export const TIPO_CONFIG_PROBLEMA = {
  titulo: 'ÁRBOL DEL PROBLEMA', tipoRaiz: 'CENTRAL', tipoSuperior: 'EFECTO', tipoPrimario: 'CAUSA',
  labelRaiz: 'PROBLEMA CENTRAL', labelSuperior: 'EFECTOS', labelPrimario: 'CAUSAS',
}
export const TIPO_CONFIG_OBJETIVOS = {
  titulo: 'ÁRBOL DE OBJETIVOS', tipoRaiz: 'OBJETIVO', tipoSuperior: 'FIN', tipoPrimario: 'MEDIO',
  labelRaiz: 'OBJETIVO CENTRAL', labelSuperior: 'FINES', labelPrimario: 'MEDIOS',
}

export async function generarExpedienteMML(programaId, anio) {
  const datos = await resolverDatosMML(programaId, anio)
  datos.anio = anio

  let ejeNombre = ''
  if (datos.programa?.eje_id) {
    const { data } = await supabase.from('ejes').select('nombre').eq('id', datos.programa.eje_id).maybeSingle()
    ejeNombre = data?.nombre || ''
  }
  datos.ejeNombre = ejeNombre

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  drawFichaProyecto(doc, datos, anio)

  doc.addPage('letter', 'portrait')
  drawDescripcionPrograma(doc, datos)

  doc.addPage('letter', 'portrait')
  drawIndice(doc)

  doc.addPage('letter', 'portrait')
  drawTransformacionDeseada(doc, datos)

  doc.addPage('letter', 'landscape')
  drawArbolDiagrama(doc, datos, 'PROBLEMA', TIPO_CONFIG_PROBLEMA, 'PP-FM-04-00')

  doc.addPage('letter', 'portrait')
  drawInvolucrados(doc, datos)

  doc.addPage('letter', 'landscape')
  drawArbolDiagrama(doc, datos, 'OBJETIVOS', TIPO_CONFIG_OBJETIVOS, 'PP-FM-07-00')

  doc.addPage('letter', 'landscape')
  drawAcciones(doc, datos)

  doc.addPage('letter', 'landscape')
  drawAlternativas(doc, datos)

  doc.addPage('letter', 'portrait')
  drawMatrizMIR(doc, datos)

  doc.addPage('letter', 'portrait')
  drawCronogramaMetas(doc, datos)

  const nivelesConIndicador = (datos.mirNiveles || []).filter(n => n.indicador_id && n.indicador)
  nivelesConIndicador.forEach(nivel => {
    doc.addPage('letter', 'portrait')
    drawFichaIndicador(doc, datos, nivel, anio)
  })

  const p = datos.programa || {}
  const nombreArchivo = `Expediente_MML_${p.clave || programaId}_${anio}.pdf`.replace(/\s+/g, '_')
  doc.save(nombreArchivo)
}
