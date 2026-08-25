// ── Orquestador del Expediente MML — PDF oficial PP-FM, página por página ────
// Mismo patrón que informeGobierno.js: junta las secciones de
// expedienteMMLSecciones.js sobre un único documento jsPDF y lo descarga.
import { jsPDF } from 'jspdf'
import { resolverDatosMML } from '../lib/supabase.js'
import { limpiarDatosPDF } from './reportesBase.js'
import {
  drawFichaProyecto, drawDescripcion, drawIndice, drawTransformacionDeseada,
  drawArbolDiagrama, drawInvolucrados, drawAcciones, drawAlternativas, drawMatrizMIR,
  drawCronogramaMetas, drawFichaIndicador,
} from './expedienteMMLSecciones.js'
import { DESCRIPCION_HOJAS } from './expedienteMMLContenido.js'

export const TIPO_CONFIG_PROBLEMA = {
  titulo: 'ÁRBOL DEL PROBLEMA', tipoRaiz: 'CENTRAL', tipoSuperior: 'EFECTO', tipoPrimario: 'CAUSA',
  labelRaiz: 'PROBLEMA CENTRAL', labelSuperior: 'EFECTOS', labelPrimario: 'CAUSAS',
  // fase_mml_11: nivel opcional arriba de Efectos (ver drawArbolDiagrama).
  tipoSuperiorGeneral: 'EFECTO_GENERAL', labelSuperiorGeneral: 'EFECTO',
}
export const TIPO_CONFIG_OBJETIVOS = {
  titulo: 'ÁRBOL DE OBJETIVOS', tipoRaiz: 'OBJETIVO', tipoSuperior: 'FIN', tipoPrimario: 'MEDIO',
  labelRaiz: 'OBJETIVO CENTRAL', labelSuperior: 'FINES', labelPrimario: 'MEDIOS',
  // fase_mml_11: nivel opcional arriba de Fines (ver drawArbolDiagrama).
  tipoSuperiorGeneral: 'FIN_GENERAL', labelSuperiorGeneral: 'FIN',
}

export async function generarExpedienteMML(programaId, anio) {
  // limpiarDatosPDF: los fonts estándar de jsPDF no soportan caracteres fuera
  // de Latin-1 (guion largo "–", viñeta "•", "≥"...) — sin esto, cualquier
  // texto capturado con ese tipo de carácter se corrompe/desaparece en el PDF
  // a partir de ahí (ver reportesBase.js).
  // `ejeNombre` ya viene resuelto desde resolverDatosMML (y limpiado junto
  // con el resto por limpiarDatosPDF).
  const datos = limpiarDatosPDF(await resolverDatosMML(programaId, anio))
  datos.anio = anio

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  drawFichaProyecto(doc, datos, anio)

  // Descripción de Programa y Descripción de Proyectos: mismo formato, el
  // documento oficial las pide como dos hojas consecutivas.
  DESCRIPCION_HOJAS.forEach(({ titulo }) => {
    doc.addPage('letter', 'portrait')
    drawDescripcion(doc, datos, anio, titulo)
  })

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
