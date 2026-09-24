// ── Acuse de captura de MIR y POA por área (Expediente MML) ──────────────────
// Carátula con la constancia y el resumen, y después la MIR (PP-FM-0E) y el
// POA (PP-FM-0F) del mismo formato que el Expediente, filtrados a los
// Componentes/Actividades del área. Firman el enlace y el titular del área en
// cada hoja. Sin cliente de Supabase aquí: recibe todo ya resuelto.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { limpiarDatosPDF, GUINDA, BLANCO, GRIS, setColor, setDraw, formatFecha } from './reportesBase.js'
import { drawEncabezado, drawDatosPrograma, drawMatrizMIR, drawCronogramaMetas } from './expedienteMMLSecciones.js'
import { etiquetaNivelMIR, subtituloAnteproyecto } from './expedienteMMLContenido.js'

const ML = 14

export function generarFolioAcuseMML(programaClave, areaId, anio) {
  return `ACUSE-MML-${anio}-${programaClave || 'PP'}-${areaId}-${Date.now().toString(36).toUpperCase()}`
}

// Dos firmas centradas: el enlace que capturó y el titular del área.
function firmasAcuse(enlace, titular) {
  const firmantes = [
    { rol: 'ELABORÓ (ENLACE DEL ÁREA)', nombre: enlace?.nombre || '—', cargo: enlace?.cargo || '' },
    { rol: 'VO. BO. (TITULAR DEL ÁREA)', nombre: titular?.nombre || '—', cargo: titular?.cargo || '' },
  ]
  return (doc, y) => {
    const W = doc.internal.pageSize.width
    const colW = 70, gap = 24, x0 = (W - colW * 2 - gap) / 2
    doc.setFontSize(6.5)
    firmantes.forEach((fm, i) => {
      const xL = x0 + i * (colW + gap), xC = xL + colW / 2, lineY = y + 15
      doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
      doc.text(fm.rol, xC, y, { align: 'center' })
      setDraw(doc, [150, 150, 150]); doc.setLineWidth(0.3)
      doc.line(xL, lineY, xL + colW, lineY)
      doc.setFont('helvetica', 'bold'); setColor(doc, [30, 30, 30])
      const n = doc.splitTextToSize(fm.nombre, colW)
      doc.text(n, xC, lineY + 4, { align: 'center' })
      doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
      doc.text(doc.splitTextToSize(fm.cargo, colW), xC, lineY + 4 + n.length * 3.2, { align: 'center' })
    })
  }
}

// datos: salida de resolverDatosMML (el programa completo); area: { id, nombre };
// enlace/titular: { nombre, cargo }; generadoPor: nombre de quien lo descarga.
export function generarAcuseMIRPOA({ datos: datosCrudos, anio, area, niveles: nivelesArea, enlace, titular, generadoPor }) {
  const datos = limpiarDatosPDF({ ...datosCrudos, mirNiveles: nivelesArea, anio, areaAcuse: area.nombre })
  const niveles = datos.mirNiveles
  const [ent, tit] = limpiarDatosPDF([enlace, titular])
  const p = datos.programa || {}
  const folio = generarFolioAcuseMML(p.clave, area.id, anio)
  const firmas = firmasAcuse(ent, tit)
  const ahora = new Date()
  const fechaStr = `${formatFecha(ahora)} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.width, H = doc.internal.pageSize.height

  // ── Carátula ────────────────────────────────────────────────────────────
  let y = drawEncabezado(doc, `ACUSE DE CAPTURA — MIR Y POA ${anio}`, folio, subtituloAnteproyecto(anio))
  y = drawDatosPrograma(doc, datos, y)

  const comps = niveles.filter(n => n.tipo === 'COMPONENTE').length
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
  const constancia = `Se hace constar que el área ${area.nombre} concluyó la captura en SIMA de la Matriz de Indicadores `
    + `para Resultados (PP-FM-0E-01) y del Programa Operativo Anual (PP-FM-0F-01) del ejercicio ${anio} para los `
    + `${niveles.length} niveles a su cargo (${comps} Componente${comps === 1 ? '' : 's'} y ${niveles.length - comps} `
    + `Actividad${niveles.length - comps === 1 ? '' : 'es'}) del programa presupuestario ${p.clave || ''} ${p.nombre || ''}: `
    + 'cada nivel tiene indicador vinculado, tipo, dimensión y sentido, supuestos, medios de verificación y la meta de los 12 meses.'
  const lineas = doc.splitTextToSize(constancia, W - ML * 2)
  doc.text(lineas, ML, y + 2)
  y += 4 + lineas.length * 3.8

  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML, bottom: 45 },
    head: [['Nivel', 'Indicador', 'Meta anual', 'Meses']],
    body: niveles.map(n => [
      etiquetaNivelMIR(n),
      `${n.indicador?.clave ? `${n.indicador.clave} · ` : ''}${n.indicador?.nombre || '—'}`,
      n.metas?.[0] ?? '—',
      `${n.poaMesesCapturados ?? 0}/12`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 7.5, halign: 'center' },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
    },
  })

  y = doc.lastAutoTable.finalY + 6
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
  doc.text(`Generado en SIMA el ${fechaStr}${generadoPor ? ` por ${generadoPor}` : ''}.`, ML, y)
  doc.text('Este acuse es una constancia de captura: no bloquea cambios posteriores. Si la MIR o el POA cambian, '
    + 'debe generarse un acuse nuevo.', ML, y + 4, { maxWidth: W - ML * 2 })

  firmas(doc, H - 34)

  // ── MIR y POA del área, mismo formato que el Expediente ─────────────────
  doc.addPage('letter', 'portrait')
  drawMatrizMIR(doc, datos, { folio, firmas })
  doc.addPage('letter', 'portrait')
  drawCronogramaMetas(doc, datos, { folio, firmas })

  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(`${folio} · Página ${i} de ${total}`, W - ML, H - 6, { align: 'right' })
  }

  const slug = area.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_')
  doc.save(`Acuse_MIR_POA_${anio}_${p.clave || ''}_${slug}.pdf`)
}
