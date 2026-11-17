// ── Revisión previa del Informe de Gobierno ──────────────────────────────────
// Antes de descargar el PDF se revisa el contenido que capturaron las áreas.
// Lo que impide la versión final son las acciones con texto de plantilla sin
// llenar; lo demás son avisos de lo que el documento mostrará o dejará fuera.
export const MAX_LOGROS_ANIO = 10

// Qué le falta a una acción para publicarse como logro completo. El pie de
// foto solo cuenta si la acción tiene fotos.
export function faltantesLogro(a, nFotos = 0) {
  return [
    !(a.cifra_valor && a.cifra_etiqueta) && 'cifra principal',
    !a.lugar && 'dónde',
    !a.tema && 'tema',
    nFotos > 0 && !a.pie_foto && 'pie de foto',
  ].filter(Boolean)
}

// Texto de plantilla: algo entre corchetes, como "[número]" o "$[monto]".
const CORCHETES = /\[[^\]\n]{1,120}\]/
export const tieneCorchetes = a => CORCHETES.test(a.accion || '') || CORCHETES.test(a.descripcion || '')

// acciones: las incluidas en el Informe; fotosPorAccion: Map id → [{ huella }];
// ejes: [{ codigo, eje }] en su orden; indicadoresPorEje: para contar "sin meta".
export function revisarInforme({ acciones, fotosPorAccion = new Map(), ejes = [], indicadoresPorEje = {} }) {
  const nFotos = a => fotosPorAccion.get(a.id)?.length || 0
  const nombreEje = Object.fromEntries(ejes.map(e => [e.codigo, String(e.eje || '').replace(/^Transversal [AB]\s*[–-]\s*/, '')]))
  const conAcciones = new Set(acciones.map(a => a.eje_codigo))

  // La misma imagen subida a más de una acción.
  const porHuella = new Map()
  acciones.forEach(a => (fotosPorAccion.get(a.id) || []).forEach(f => {
    if (!f.huella) return
    if (!porHuella.has(f.huella)) porHuella.set(f.huella, new Set())
    porHuella.get(f.huella).add(a.id)
  }))
  const repetidas = [...porHuella.values()].filter(s => s.size > 1).map(s => [...s])
  const conRepetida = new Set(repetidas.flat())

  const ref = a => ({ id: a.id, area: a.area, accion: a.accion })
  const corchetes = acciones.filter(tieneCorchetes).map(ref)
  return {
    total: acciones.length,
    corchetes,
    // Sin cifra, dónde o tema (el pie de foto se cuenta aparte: su falta solo
    // cambia el texto bajo la foto, no cómo se publica la acción).
    sinDatos: acciones.filter(a => faltantesLogro(a).length).length,
    sinPie: acciones.filter(a => nFotos(a) > 0 && !a.pie_foto).length,
    logrosAnio: acciones.filter(a => a.destacado_informe).length,
    sinApertura: ejes.filter(e => conAcciones.has(e.codigo) && !acciones.some(a => a.eje_codigo === e.codigo && a.destacado_eje)).map(e => nombreEje[e.codigo]),
    ejesSinLogros: ejes.filter(e => !conAcciones.has(e.codigo)).map(e => nombreEje[e.codigo]),
    repetidas: acciones.filter(a => conRepetida.has(a.id)).map(ref),
    sinMeta: Object.values(indicadoresPorEje).flat().filter(i => i.semaforo === 'SIN META').length,
    bloqueos: corchetes.length,
  }
}
