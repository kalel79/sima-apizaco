import { jsPDF } from 'jspdf'
import { PMD_EJE_MAP } from './informeGobiernoContenido.js'
import { prepararRecursos } from './informePDF/recursos.js'
import { satelitesEje } from './informePDF/pictogramasSvg.js'
import { pesos, accionConFormato } from './informePDF/formato.js'
import {
  portadaPrincipal, indice, presentacion, mensajePresidente, cabildo, gabinete,
  resumenEjecutivo, notaMetodologica, colofon, contraportada, portadaEje, resultadosEje, logrosEje, diezLogros, logrosDelAnio, pies, datosEje,
} from './informePDF/paginas.js'

// Colores de eje propios del Informe: el azul del Eje 5 y el naranja de
// Municipio Solidario se sustituyen solo en el PDF (en SIMA siguen los de `ejes`).
const COLOR_INFORME = { E5: '#00695C', MS: '#6D4C41' }
const conColor = filas => filas.map(e => COLOR_INFORME[e.codigo] ? { ...e, color_hex: COLOR_INFORME[e.codigo] } : e)

// Texto del corte de los indicadores: último día del mes de corte.
function textoCorte(corte) {
  const f = corte ? new Date(corte.anio, corte.mes, 0) : new Date()
  return { anio: f.getFullYear(), largo: f.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) }
}

// ══════════════════════════════════════════════════════════════════════════
// GENERAR INFORME DE GOBIERNO
// ══════════════════════════════════════════════════════════════════════════
// ejes, indicadoresPorEje: indicadores acumulados al corte del Informe
//                    (indicadoresAlCorte en informeIndicadores.js)
// pmdProgramas:      filas de v_comparativo_pmd, al mismo corte (programasAlCorte)
// corte:             { anio, mes } del acumulado de los indicadores
// borrador:          marca de agua «Borrador» en cada página
// acciones:          filas de v_informe_acciones con incluir_en_informe
// catalogo:          filas de `ejes` (descripción de cada eje para su portada)
// fotosPorAccion:    Map accion_id → [{ orden, bmp }] (fase_informe_02)
export async function generarInformeGobierno({
  ejes: ejesBase, indicadoresPorEje, pmdProgramas, acciones: accionesBase = [], catalogo: catalogoBase = [], fotosPorAccion = new Map(), corte, borrador = false,
}) {
  const ejes = conColor(ejesBase), catalogo = conColor(catalogoBase)
  // Montos con signo de peso y el mismo formato en todo el documento.
  const acciones = accionesBase.map(accionConFormato)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true })
  const imgs = await prepararRecursos(doc)
  const ctx = { imgs, portadas: new Set() }
  const corteTexto = textoCorte(corte)
  doc.setProperties({
    title: 'Segundo Informe de Gobierno · Apizaco', subject: `Logros del periodo e indicadores con corte al ${corteTexto.largo}`,
    author: 'H. Ayuntamiento de Apizaco, Tlaxcala', creator: 'SIMA · Sistema de Información Municipal de Avance',
  })
  doc.setLanguage('es-MX')

  await portadaPrincipal(doc, ctx)
  doc.addPage('letter', 'portrait') // página 2 — el índice se escribe al final

  // El Informe destaca logros: abre con los logros del año, cada eje cuenta
  // los suyos y el avance de los indicadores va completo al anexo estadístico.
  const datos = Object.fromEntries(ejes.map(e => [e.codigo, datosEje(e, catalogo.find(c => c.codigo === e.codigo))]))
  const ordenEje = Object.fromEntries(ejes.map((e, i) => [e.codigo, i]))

  const entradas = []
  entradas.push({ label: 'Presentación', page: presentacion(doc, ctx, catalogo) })
  entradas.push({ label: 'Mensaje del Presidente Municipal', page: mensajePresidente(doc, ctx) })
  const logros = logrosDelAnio(acciones, ordenEje)
  if (logros.length) entradas.push({ label: 'Los logros del año', page: diezLogros(doc, ctx, logros, datos) })
  entradas.push({ label: 'Integrantes del H. Cabildo', page: cabildo(doc, ctx) })
  // "Acciones del H. Cabildo" y "Datos financieros" aún no tienen contenido en
  // SIMA: se omiten en lugar de publicarse como recuadros vacíos.
  entradas.push({ label: 'Gabinete Municipal', page: gabinete(doc, ctx) })

  const pmdPorEje = {}
  pmdProgramas.forEach(p => {
    const codigo = PMD_EJE_MAP[p.eje]
    if (!codigo) return
    ;(pmdPorEje[codigo] ||= []).push(p)
  })
  const indsDe = eje => [...(indicadoresPorEje[eje.codigo] || [])]
    .sort((a, b) => (a.clave || '').localeCompare(b.clave || '', 'es'))
  const accsDe = eje => acciones.filter(a => a.eje_codigo === eje.codigo)

  // Capítulos: portada del eje y sus logros.
  for (const eje of ejes) {
    const d = datos[eje.codigo]
    const areas = [...new Set(indsDe(eje).map(i => i.area).filter(Boolean))]
    // La portada del eje va sin foto de fondo: las imágenes de las acciones
    // son evidencias (tablas, organigramas, capturas) y no sirven de fondo.
    const accs = accsDe(eje)
    // Pie de la portada: logros del eje y su inversión (o las áreas que participan).
    const monto = accs.reduce((t, a) => t + (Number(a.monto) || 0), 0)
    const nAreas = new Set(accs.map(a => a.area_id ?? a.area)).size
    const cifras = accs.length ? [
      [accs.length.toLocaleString('es-MX'), accs.length === 1 ? 'Logro del periodo' : 'Logros del periodo'],
      monto > 0
        ? [pesos(monto), 'Inversión reportada']
        : [String(nAreas), nAreas === 1 ? 'Área participante' : 'Áreas participantes'],
    ] : []
    const pPag = await portadaEje(doc, ctx, d, null, satelitesEje(pmdPorEje[eje.codigo], areas), cifras)
    if (accs.length) await logrosEje(doc, ctx, d, accs, fotosPorAccion)
    entradas.push({ label: d.nombre, cod: d.cod, color: d.color, page: pPag })
  }

  // Anexo estadístico: resumen de los indicadores y el detalle de cada eje.
  entradas.push({
    label: 'Indicadores de desempeño por eje', anexo: true,
    page: resumenEjecutivo(doc, ctx, {
      ejes, catalogo, corteTexto,
      pmdTotal: pmdProgramas.length,
      pmdConAvance: pmdProgramas.filter(p => (p.indicadores_con_avance || 0) > 0).length,
    }),
  })
  for (const eje of ejes) resultadosEje(doc, ctx, datos[eje.codigo], indsDe(eje), pmdPorEje[eje.codigo])
  entradas.push({ label: 'Nota metodológica y glosario', anexo: true, page: notaMetodologica(doc, ctx, corteTexto.largo) })
  colofon(doc, ctx, { corteLargo: corteTexto.largo, nLogros: acciones.length })
  await contraportada(doc, ctx)

  indice(doc, ctx, entradas)
  pies(doc, ctx, `Indicadores con corte al ${corteTexto.largo}`, borrador)
  // Marcadores del PDF: las mismas entradas del contenido.
  entradas.forEach(e => doc.outline.add(null, e.cod ? `${datos[e.cod].kick} · ${e.label}` : e.label, { pageNumber: e.page }))

  const f = new Date()
  const fStr = `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}`
  doc.save(`SIMA_SegundoInformeGobierno_${fStr}${borrador ? '_BORRADOR' : ''}.pdf`)
}
