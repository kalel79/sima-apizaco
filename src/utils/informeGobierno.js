import { jsPDF } from 'jspdf'
import { PMD_EJE_MAP } from './informeGobiernoContenido.js'
import { prepararRecursos } from './informePDF/recursos.js'
import { satelitesEje } from './informePDF/pictogramasSvg.js'
import {
  portadaPrincipal, indice, presentacion, mensajePresidente, cabildo, gabinete,
  seccionPendiente, resumenEjecutivo, portadaEje, resultadosEje, accionesEje, pies, datosEje,
} from './informePDF/paginas.js'

// Colores de eje propios del Informe: el azul del Eje 5 y el naranja de
// Municipio Solidario se sustituyen solo en el PDF (en SIMA siguen los de `ejes`).
const COLOR_INFORME = { E5: '#00695C', MS: '#6D4C41' }
const conColor = filas => filas.map(e => COLOR_INFORME[e.codigo] ? { ...e, color_hex: COLOR_INFORME[e.codigo] } : e)

function generarFolioInforme() {
  const d = new Date()
  const ts = Date.now().toString(36).toUpperCase()
  return `IG2-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${ts}`
}

// ══════════════════════════════════════════════════════════════════════════
// GENERAR INFORME DE GOBIERNO
// ══════════════════════════════════════════════════════════════════════════
// ejes:              filas de v_resumen_ejes (las 9), ordenadas por `orden`
// indicadoresPorEje: { [eje_codigo]: fila[] } de v_indicadores_acum
// claves:            { [indicador_id]: clave } (tabla indicadores, cruzado en cliente)
// pmdProgramas:      filas de v_comparativo_pmd
// acciones:          filas de v_informe_acciones con incluir_en_informe
// catalogo:          filas de `ejes` (descripción de cada eje para su portada)
// fotosPorAccion:    Map accion_id → [{ orden, bmp }] (fase_informe_02)
export async function generarInformeGobierno({
  ejes: ejesBase, indicadoresPorEje, claves, pmdProgramas, acciones = [], catalogo: catalogoBase = [], fotosPorAccion = new Map(),
}) {
  const ejes = conColor(ejesBase), catalogo = conColor(catalogoBase)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true })
  const imgs = await prepararRecursos(doc)
  const ctx = { imgs, portadas: new Set() }
  const folio = generarFolioInforme()

  await portadaPrincipal(doc, ctx)
  doc.addPage('letter', 'portrait') // página 2 — el índice se escribe al final

  const entradas = []
  entradas.push({ label: 'Presentación', page: presentacion(doc, ctx, catalogo) })
  entradas.push({ label: 'Mensaje del Presidente Municipal', page: mensajePresidente(doc, ctx) })
  entradas.push({ label: 'Integrantes del H. Cabildo', page: cabildo(doc, ctx) })
  entradas.push({
    label: 'Acciones del H. Cabildo',
    page: seccionPendiente(doc, ctx, 'Acciones del H. Cabildo', 'Sesiones, acuerdos y dictámenes aprobados por el H. Cabildo durante el periodo que se informa.'),
  })
  entradas.push({ label: 'Gabinete Municipal', page: gabinete(doc, ctx) })

  // Totales derivados de los 9 ejes de v_resumen_ejes (v_dashboard_global usa
  // otro alcance de indicadores y no coincide con la suma de los 9 ejes).
  const suma = k => ejes.reduce((s, e) => s + (e[k] || 0), 0)
  const total = suma('total_indicadores')
  const totales = {
    total, optimo: suma('optimo'), adecuado: suma('adecuado'), riesgo: suma('riesgo'), critico: suma('critico'),
    pctGlobal: total > 0 ? ejes.reduce((s, e) => s + (e.pct_promedio || 0) * (e.total_indicadores || 0), 0) / total : 0,
  }
  entradas.push({
    label: 'Resumen ejecutivo',
    page: resumenEjecutivo(doc, ctx, {
      ejes, catalogo, totales,
      pmdTotal: pmdProgramas.length,
      pmdConAvance: pmdProgramas.filter(p => (p.indicadores_con_avance || 0) > 0).length,
      nAcciones: acciones.length,
    }),
  })
  entradas.push({
    label: 'Datos financieros',
    page: seccionPendiente(doc, ctx, 'Datos financieros', 'Ingresos, egresos y ejercicio del presupuesto municipal del periodo, con información de la Tesorería Municipal.'),
  })

  const pmdPorEje = {}
  pmdProgramas.forEach(p => {
    const codigo = PMD_EJE_MAP[p.eje]
    if (!codigo) return
    ;(pmdPorEje[codigo] ||= []).push(p)
  })

  for (const eje of ejes) {
    const d = datosEje(eje, catalogo.find(c => c.codigo === eje.codigo))
    const inds = (indicadoresPorEje[eje.codigo] || [])
      .map(ind => ({ ...ind, clave: claves[ind.indicador_id] || '—' }))
      .sort((a, b) => (a.clave || '').localeCompare(b.clave || '', 'es'))
    const accs = acciones.filter(a => a.eje_codigo === eje.codigo)
    // La portada del eje usa la primera foto de sus acciones, si hay.
    const primera = accs.map(a => fotosPorAccion.get(a.id)?.[0]?.bmp).find(Boolean)
    const areas = [...new Set(inds.map(i => i.area).filter(Boolean))]
    const pPag = await portadaEje(doc, ctx, d, primera, satelitesEje(pmdPorEje[eje.codigo], areas))
    resultadosEje(doc, ctx, d, inds, pmdPorEje[eje.codigo], accs.length)
    if (accs.length) accionesEje(doc, ctx, d, accs, fotosPorAccion)
    entradas.push({ label: d.nombre, cod: d.cod, color: d.color, page: pPag })
  }

  indice(doc, ctx, entradas)
  pies(doc, ctx, folio)

  const f = new Date()
  const fStr = `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}`
  doc.save(`SIMA_SegundoInformeGobierno_${fStr}.pdf`)
}
