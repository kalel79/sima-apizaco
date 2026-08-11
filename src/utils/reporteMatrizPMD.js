// ── Matriz de Programas PMD × Área responsable × Indicadores ───────────────
// Documento tipo presentación (PDF apaisado): portada, diapositiva de
// resumen con KPIs y una diapositiva de tabla por cada eje del PMD,
// agrupando los programas y, dentro de cada uno, sus áreas responsables con
// el conteo de indicadores ligados. Estructural (programa_pmd_id/area_id de
// `indicadores`), no depende del periodo de evaluación — mismo patrón
// visual que reportesPMD.js/reporteArbolMIR.js.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LOGO_BASE64 } from '../logo.js'
import { getMatrizProgramasAreas, getNombresEjes } from '../lib/supabase.js'

// ── Paleta PDF (RGB) — misma paleta que reportesPMD.js ─────────────────────
const GUINDA = [123, 31, 44]
const DORADO = [201, 169, 97]
const GRIS   = [89, 89, 89]
const BLANCO = [255, 255, 255]
const CREMA  = [245, 240, 230]

function setColor(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]) }
function setFill(doc, rgb)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]) }
function setDraw(doc, rgb)  { doc.setDrawColor(rgb[0], rgb[1], rgb[2]) }

// Las fuentes estándar de jsPDF (helvetica) no incluyen glifos fuera de
// WinAnsi/Latin-1 — se sanea el texto dinámico antes de dibujarlo (mismo
// criterio que reportesPMD.js).
function sanitizarPDF(str) {
  if (str == null) return str
  return String(str)
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
}

function formatFecha(d) {
  d = d || new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function generarFolio() {
  return `MTZ-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
}

// programas_pmd.eje guarda una etiqueta corta ("Eje 1", "Transversal A");
// el nombre descriptivo completo vive en la tabla ejes (mismo patrón que
// reportesPMD.js).
function codigoCortoEje(etiqueta) {
  const m = /^Eje (\d+)$/.exec(etiqueta || '')
  if (m) return 'E' + m[1]
  const m2 = /^Transversal ([A-Z])$/.exec(etiqueta || '')
  if (m2) return 'T' + m2[1]
  return null
}
function nombreCompletoEje(etiquetaCorta, ejes) {
  const codigo = codigoCortoEje(etiquetaCorta)
  const eje = (ejes || []).find(e => e.codigo === codigo)
  if (!eje?.nombre) return etiquetaCorta
  if (/^Transversal /.test(etiquetaCorta)) return eje.nombre
  return `${etiquetaCorta} — ${eje.nombre}`
}

function drawHeaderBar(doc, titulo) {
  const W = doc.internal.pageSize.width
  doc.setFontSize(12.5); doc.setFont('helvetica', 'bold')
  const lineas = doc.splitTextToSize(titulo, W - 28)
  const barH = Math.max(18, 8 + lineas.length * 6)
  setFill(doc, GUINDA); doc.rect(0, 0, W, barH, 'F')
  setColor(doc, DORADO)
  doc.text(lineas, 14, 12)
  return barH
}

export async function generarMatrizPMDAreas() {
  const [programas, ejes] = await Promise.all([
    getMatrizProgramasAreas(),
    getNombresEjes(),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  const ML = 14
  const folio = generarFolio()

  // ── Diapositiva 1: Portada ────────────────────────────────────────────
  setFill(doc, GUINDA); doc.rect(0, 0, W, H, 'F')
  try { doc.addImage(LOGO_BASE64, 'PNG', (W - 34) / 2, 20, 34, 34) } catch (_) {}

  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); setColor(doc, BLANCO)
  doc.text('H. AYUNTAMIENTO DE APIZACO 2024-2027', W / 2, 64, { align: 'center' })
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); setColor(doc, DORADO)
  doc.text('Dirección de Planeación y Evaluación', W / 2, 71, { align: 'center' })

  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); setColor(doc, BLANCO)
  doc.text('MATRIZ DE PROGRAMAS PMD', W / 2, 96, { align: 'center' })
  doc.setFontSize(13); doc.setFont('helvetica', 'normal'); setColor(doc, DORADO)
  doc.text('Áreas responsables e indicadores por programa', W / 2, 107, { align: 'center' })
  setDraw(doc, DORADO); doc.setLineWidth(0.8); doc.line(W / 2 - 40, 114, W / 2 + 40, 114)

  doc.setFontSize(10.5); doc.setFont('helvetica', 'normal'); setColor(doc, BLANCO)
  doc.text('Plan Municipal de Desarrollo 2024-2027', W / 2, 126, { align: 'center' })
  doc.setFontSize(8.5); setColor(doc, DORADO)
  doc.text(`Fecha de generación: ${formatFecha()}  ·  Folio: ${folio}`, W / 2, 134, { align: 'center' })

  setDraw(doc, DORADO); doc.setLineWidth(0.6); doc.line(ML, H - 16, W - ML, H - 16)
  doc.setFontSize(7.5); setColor(doc, BLANCO)
  doc.text('SIMA · Sistema de Información Municipal de Avance · H. Ayuntamiento de Apizaco 2024-2027', W / 2, H - 10, { align: 'center' })

  // ── Diapositiva 2: Resumen ────────────────────────────────────────────
  doc.addPage('letter', 'landscape')
  drawHeaderBar(doc, 'Resumen general')

  const conIndicadores = programas.filter(p => p.totalIndicadores > 0)
  const pendientes = programas.filter(p => p.totalIndicadores === 0)
  const areasDistintas = new Set()
  let totalIndicadores = 0
  programas.forEach(p => { p.areas.forEach(a => { areasDistintas.add(a.area); totalIndicadores += a.n }) })

  const kpis = [
    { label: 'Programas PMD', value: String(programas.length) },
    { label: 'Con indicadores asignados', value: `${conIndicadores.length} / ${programas.length}` },
    { label: 'Áreas involucradas', value: String(areasDistintas.size) },
    { label: 'Indicadores totales', value: String(totalIndicadores) },
  ]
  const kpiW = (W - ML * 2 - 9) / 4
  kpis.forEach((k, i) => {
    const x = ML + i * (kpiW + 3)
    setFill(doc, [250, 248, 244]); setDraw(doc, DORADO); doc.setLineWidth(0.3)
    doc.roundedRect(x, 32, kpiW, 30, 2.5, 2.5, 'FD')
    doc.setFontSize(19); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(k.value, x + kpiW / 2, 48, { align: 'center' })
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(k.label, x + kpiW / 2, 56, { align: 'center' })
  })

  if (pendientes.length) {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text('Programas pendientes de alineación (sin indicador vinculado):', ML, 74)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    const texto = pendientes.map(p => `${p.numero}. ${sanitizarPDF(p.nombre)}`).join('   ·   ')
    const lineas = doc.splitTextToSize(texto, W - ML * 2)
    doc.text(lineas, ML, 80)
  }

  // ── Diapositivas 3+: tabla por eje ────────────────────────────────────
  const ejesOrdenados = Array.from(new Set(programas.map(p => p.eje).filter(Boolean)))

  ejesOrdenados.forEach(eje => {
    const progsEje = programas.filter(p => p.eje === eje).sort((a, b) => a.numero - b.numero)

    doc.addPage('letter', 'landscape')
    const tituloEje = sanitizarPDF(nombreCompletoEje(eje, ejes))
    const barH = drawHeaderBar(doc, tituloEje)

    const body = []
    progsEje.forEach(p => {
      body.push([{
        content: sanitizarPDF(`${p.numero}. ${p.nombre}`), colSpan: 2,
        styles: { fillColor: CREMA, textColor: GUINDA, fontStyle: 'bold', halign: 'left', fontSize: 8.5 },
      }])
      if (!p.areas.length) {
        body.push([{
          content: 'Pendiente de alineación con indicadores', colSpan: 2,
          styles: { textColor: GRIS, fontStyle: 'italic', halign: 'left', fontSize: 7.5 },
        }])
      } else {
        p.areas.forEach(a => {
          body.push([{
            content: sanitizarPDF(`${a.area} — ${a.n} indicador${a.n === 1 ? '' : 'es'}`), colSpan: 2,
            styles: { textColor: GUINDA, fontStyle: 'bold', halign: 'left', fontSize: 7.5, fillColor: BLANCO },
          }])
          a.indicadores.forEach(ind => body.push([sanitizarPDF(ind.clave), sanitizarPDF(ind.nombre)]))
        })
        if (p.areas.length > 1) {
          body.push([
            { content: 'Total del programa', styles: { fontStyle: 'bold', halign: 'right', textColor: GUINDA } },
            { content: String(p.totalIndicadores), styles: { fontStyle: 'bold', textColor: GUINDA } },
          ])
        }
      }
    })

    autoTable(doc, {
      head: [['Clave', 'Indicador']],
      body,
      startY: barH + 6,
      margin: { left: ML, right: ML },
      styles: { fontSize: 7.8, cellPadding: 2, halign: 'left', valign: 'middle', overflow: 'linebreak' },
      headStyles: { fillColor: GUINDA, textColor: BLANCO, fontStyle: 'bold', fontSize: 8, halign: 'left' },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [249, 244, 232] },
    })
  })

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

  // ── Pie de página (diapositivas de resumen y tablas, no portada/cierre) ─
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 2; p <= totalPages - 1; p++) {
    doc.setPage(p)
    const w = doc.internal.pageSize.width, h = doc.internal.pageSize.height
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text('SIMA · Sistema de Información Municipal de Avance · H. Ayuntamiento de Apizaco 2024-2027', w / 2, h - 6, { align: 'center' })
    doc.text(`Diapositiva ${p} de ${totalPages}  ·  Folio: ${folio}`, w / 2, h - 3, { align: 'center' })
  }

  doc.save(`SIMA_Matriz_Programas_PMD_${folio}.pdf`)
  return folio
}
