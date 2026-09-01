// ── fase_mml_26 — La Meta de las variables sale del POA ─────────────────────
// El enlace tecleaba el mismo número dos veces: el POA mes a mes, y la Meta de
// cada variable en la ficha del indicador. Los dos se separaban en silencio —el
// 2026-09-01 había 28 variables desfasadas en 2027, todas con su POA ya
// completo: la ficha se quedaba con el valor viejo cuando el POA se corregía
// después. La Meta de un Componente/Actividad ES el anual del POA; en 2026, 128
// de 130 llevan el mismo valor en sus dos variables y ese valor es el anual.
//
// Tres límites, decididos con Hugo el 2026-09-01:
//  · Solo con el POA COMPLETO (los 12 meses). Con una captura a medias el anual
//    es una suma parcial, que todavía no es la meta.
//  · Solo Componentes y Actividades. Las variables de Fin y Propósito son
//    líneas base, no metas: 8 de los 9 Fines de 2026 llevan a propósito valores
//    distintos entre sí (p. ej. "Superficie año base" contra "Superficie
//    actual"). Derivarlas destruiría el dato.
//  · Solo desde ANIO_META_DERIVADA. El 2026 está cerrado y entregado; aplicarlo
//    ahí movería 11 valores impresos y llenaría 44 casillas hoy vacías.
//
// La columna valor_meta se sigue capturando y guardando: es lo que se muestra
// mientras el POA no esté completo, y el respaldo de los niveles que no derivan.
//
// Módulo aparte y SIN DEPENDENCIAS a propósito: lo consumen la pantalla de la
// MIR, mml.js (que sí importa el cliente de Supabase) y
// expedienteMMLContenido.js (que es puro y alimenta el PDF y el Excel). Ponerlo
// en mml.js habría arrastrado el cliente hasta los generadores del documento.

export const ANIO_META_DERIVADA = 2027

export const MESES_DEL_POA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// Cuántos de los 12 meses del POA llevan valor. Mismo criterio que ya usa el
// reporte de avance de captura MML (v_mml_captura_nivel.d_metas), calculado
// aquí sobre las metas que getDatosExpediente ya trajo.
export function contarMesesPOA(metas) {
  return MESES_DEL_POA.filter(m => metas?.[m] != null).length
}

// Devuelve { valor, origen }: 'POA' cuando la Meta se deriva del anual,
// 'CAPTURA' cuando sigue siendo la que se teclea en la ficha.
export function metaEfectivaVariable(nivel, variable) {
  const capturada = variable?.valor?.valor_meta ?? null
  const derivable = (nivel?.anio ?? 0) >= ANIO_META_DERIVADA
    && (nivel?.tipo === 'COMPONENTE' || nivel?.tipo === 'ACTIVIDAD')
    && nivel?.poaCompleto === true
  return derivable
    ? { valor: nivel.poaAnual, origen: 'POA' }
    : { valor: capturada, origen: 'CAPTURA' }
}
