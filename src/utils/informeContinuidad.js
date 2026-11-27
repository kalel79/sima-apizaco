// ── Validador de continuidad del Informe ─────────────────────────────────────
// Revisa que cada eje se lea de corrido: lo usa el borrador (sección
// «Continuidad» de «Pendientes de captura»). No bloquea nada salvo los logros
// sin bloque, que impiden generar la versión final (informeGobierno.js).
// Funciones puras: reciben los mismos datos que el generador.

const MAX_TITULO = 60
const sinAcentos = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Palabras que no distinguen un tema de otro al comparar títulos.
const VACIAS = new Set(('a al con de del el en la las los para por que se su sus un una y o e mas entre sobre desde hasta ' +
  'municipio municipal municipales apizaco ayuntamiento personas ciudadania ciudadana ciudadanos realizacion atencion entrega ' +
  'capacitacion operacion implementacion instalacion conformacion colocacion ejecucion programa programas acciones nuevo nueva nuevos nuevas ' +
  'trabajo publico publica publicos publicas servicio servicios areas area ninas ninos adolescentes jovenes comunidades comunidad ' +
  'fortalecimiento rehabilitacion').split(' '))
const palabras = t => new Set(sinAcentos(t).replace(/[^a-zñ ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !VACIAS.has(w)))

// Dos títulos se parecen si comparten al menos dos palabras propias y estas
// son la mitad o más del título más corto.
export function titulosParecidos(a, b) {
  const x = palabras(a), y = palabras(b)
  const comunes = [...x].filter(w => y.has(w))
  return comunes.length >= 2 && comunes.length / Math.min(x.size, y.size) >= 0.5
}

// Defectos de un título de bloque.
export function defectosTitulo(t) {
  const s = String(t || '')
  const out = []
  if (s !== s.trim() || !s.trim()) out.push('espacios sobrantes o vacío')
  if (/^[a-zñáéíóú]/.test(s.trim())) out.push('empieza con minúscula')
  if (/\.$/.test(s.trim())) out.push('termina en punto')
  if (s.trim().length > MAX_TITULO) out.push(`más de ${MAX_TITULO} caracteres`)
  if (/\s(de|del|la|el|los|las|en|y|a|para|con)$/i.test(s.trim()) || /…$/.test(s.trim())) out.push('parece truncado')
  return out
}

// acciones: logros incluidos (v_informe_acciones); bloques: catálogo con
// eje_codigo; ejes: [{ codigo, eje }] en su orden; indicadoresPorEje: para las
// áreas con indicadores y sin logros; ordenar(acciones, bloquesDelEje): la
// misma función del generador (bloquesDe), para medir los tramos tal como se
// imprimen. Devuelve filas { eje, tipo, detalle }.
export function revisarContinuidad({ acciones = [], bloques = [], ejes = [], indicadoresPorEje = {}, ordenar }) {
  const filas = []
  const rotulo = Object.fromEntries(ejes.map(e => [e.codigo, /^E\d+$/.test(e.codigo) ? `Eje ${e.codigo.slice(1)}` : /^T[A-Z]$/.test(e.codigo) ? `Eje ${e.codigo.slice(1)}` : String(e.eje || e.codigo)]))
  const activos = bloques.filter(b => b.activo !== false)
  const ids = new Set(activos.map(b => b.id))

  ejes.forEach(e => {
    const delEje = acciones.filter(a => a.eje_codigo === e.codigo)
    if (!delEje.length) return
    const cat = activos.filter(b => b.eje_codigo === e.codigo)
    const principal = delEje.find(a => a.destacado_eje)
    const grupos = ordenar ? ordenar(delEje.filter(a => a !== principal), cat) : []

    // Áreas en más de un tramo, en el orden en que se imprime el eje.
    const sec = [principal, ...grupos.flatMap(g => g.filas)].filter(Boolean).map(a => a.area)
    const tramos = {}
    sec.forEach((a, i) => { if (i === 0 || sec[i - 1] !== a) tramos[a] = (tramos[a] || 0) + 1 })
    Object.entries(tramos).filter(([, n]) => n > 1)
      .forEach(([a, n]) => filas.push({ eje: rotulo[e.codigo], tipo: 'Área en varios tramos', detalle: `${a} aparece en ${n} tramos separados.` }))

    // Bloques con un solo logro (cuenta el que abre el eje) y logros sin bloque.
    cat.forEach(b => {
      const n = delEje.filter(a => a.bloque_id === b.id).length
      if (n === 1) filas.push({ eje: rotulo[e.codigo], tipo: 'Bloque de un solo logro', detalle: `«${b.titulo}»: conviene unirlo a un bloque afín.` })
      const d = defectosTitulo(b.titulo)
      if (n > 0 && d.length) filas.push({ eje: rotulo[e.codigo], tipo: 'Título de bloque', detalle: `«${b.titulo}»: ${d.join(', ')}.` })
    })
    delEje.filter(a => !ids.has(a.bloque_id))
      .forEach(a => filas.push({ eje: rotulo[e.codigo], tipo: 'Logro sin bloque', detalle: `#${a.id}, ${a.area}: ${a.accion}` }))
  })

  // Logros de ejes distintos con título muy parecido y sin referencia cruzada.
  for (let i = 0; i < acciones.length; i++) for (let j = i + 1; j < acciones.length; j++) {
    const a = acciones[i], b = acciones[j]
    if (a.eje_codigo === b.eje_codigo) continue
    if (a.eje_referencia_codigo === b.eje_codigo || b.eje_referencia_codigo === a.eje_codigo) continue
    if (!titulosParecidos(a.accion, b.accion)) continue
    filas.push({ eje: `${rotulo[a.eje_codigo]} / ${rotulo[b.eje_codigo]}`, tipo: 'Tema repetido entre ejes', detalle: `#${a.id} «${a.accion}» y #${b.id} «${b.accion}», sin referencia cruzada.` })
  }

  // Áreas con indicadores en la MIR y sin ningún logro en el Informe.
  const conLogro = new Set(acciones.map(a => a.area))
  ejes.forEach(e => {
    const areas = [...new Set((indicadoresPorEje[e.codigo] || []).map(i => i.area).filter(Boolean))].filter(a => !conLogro.has(a)).sort((x, y) => x.localeCompare(y, 'es'))
    areas.forEach(a => filas.push({ eje: rotulo[e.codigo], tipo: 'Área sin logros', detalle: `${a} tiene indicadores y no reportó ningún logro.` }))
  })
  return filas
}
