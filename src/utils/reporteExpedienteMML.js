// ── Orquestador del Expediente MML — PDF oficial PP-FM, página por página ────
// Mismo patrón que informeGobierno.js: junta las secciones de
// expedienteMMLSecciones.js sobre un único documento jsPDF y lo descarga.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { resolverDatosMML } from '../lib/supabase.js'
import { limpiarDatosPDF, GUINDA, BLANCO, GRIS, setColor } from './reportesBase.js'
import {
  drawEncabezado, drawFichaProyecto, drawDescripcion, drawIndice, drawTransformacionDeseada,
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

// ── Extracto consolidado: solo la MIR (PP-FM-0E) y el POA (PP-FM-0F) de todos
// los programas, en un solo PDF con portada e índice. Mismas secciones que el
// Expediente completo, así que sale con el mismo formato y firmas. ──
export async function generarMIRPOAConsolidado(programas, anio) {
  // Uno por uno para no disparar 9 × 14 consultas a la vez contra Supabase.
  const expedientes = []
  for (const prog of programas) {
    const datos = limpiarDatosPDF(await resolverDatosMML(prog.id, anio))
    datos.anio = anio
    expedientes.push(datos)
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  const cuenta = (niveles, tipo) => niveles.filter(n => n.tipo === tipo).length
  const resumen = expedientes.map(({ programa: p = {}, mirNiveles = [] }) =>
    [p.clave || '', p.nombre || '', cuenta(mirNiveles, 'COMPONENTE'), cuenta(mirNiveles, 'ACTIVIDAD'), mirNiveles.length])
  const totales = [2, 3, 4].map(i => resumen.reduce((s, r) => s + r[i], 0))

  const y = drawEncabezado(doc, `MATRICES DE INDICADORES PARA RESULTADOS Y PROGRAMA OPERATIVO ANUAL ${anio}`, null,
    `${expedientes.length} PROGRAMAS PRESUPUESTARIOS`)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Extracto del Expediente MML ${anio}: Matriz de Indicadores y Riesgos (PP-FM-0E-01) y`, 14, y + 4)
  doc.text('Cronograma de Metas (PP-FM-0F-01) de cada programa presupuestario.', 14, y + 9)
  autoTable(doc, {
    startY: y + 14, margin: { left: 14, right: 14 },
    head: [['PP', 'Programa presupuestario', 'Componentes', 'Actividades', 'Niveles']],
    body: [...resumen, ['', 'Total', ...totales]],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 8, halign: 'center' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 14, halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    didParseCell: d => { if (d.section === 'body' && d.row.index === resumen.length) d.cell.styles.fontStyle = 'bold' },
  })

  expedientes.forEach(datos => {
    doc.addPage('letter', 'portrait')
    drawMatrizMIR(doc, datos)
    doc.addPage('letter', 'portrait')
    drawCronogramaMetas(doc, datos)
  })

  // La MIR y el POA desbordan a varias hojas en los programas grandes: el
  // número de página ayuda a no perderse en un documento de ~30 hojas.
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const { width: W, height: H } = doc.internal.pageSize
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(`Página ${i} de ${total}`, W - 14, H - 6, { align: 'right' })
  }

  doc.save(`MIR_POA_${anio}_Apizaco.pdf`)
}
