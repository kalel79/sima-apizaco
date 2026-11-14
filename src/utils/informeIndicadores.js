// ── Indicadores del Informe de Gobierno, acumulados a un mes de corte ────────
// El anexo estadístico reporta el ejercicio con corte al cierre del periodo del
// Informe (31 de agosto), sin importar en qué mes se descargue. Aquí se
// re-acumula cada indicador desde el catálogo de metas y los avances
// capturados, con la misma metodología de v_indicadores_acum salvo dos casos
// que las vistas esconden:
//   · sin dato: el indicador no tiene ninguna captura al corte (las vistas lo
//     omiten; aquí se lista);
//   · sin meta: tiene resultado pero no meta programada al corte (las vistas
//     dividen entre 1 y salen avances de 700 % a 2,700 %; aquí no se califica
//     ni entra en los promedios).
export const SIN_META = 'SIN META'

// Mismos umbrales que v_indicadores_acum.
export function semaforoDe(pct) {
  if (pct == null) return null
  return pct >= 1.10 ? 'ÓPTIMO' : pct >= 0.90 ? 'ADECUADO' : pct >= 0.70 ? 'RIESGO' : 'CRÍTICO'
}

// ind: { metas: { [mes]: valor }, avances: { [mes]: { resultado } } }
export function acumularIndicador(ind, mes) {
  let meta = 0, resultado = 0, capturas = 0
  for (let m = 1; m <= mes; m++) {
    meta += Number(ind.metas?.[m]) || 0
    const av = ind.avances?.[m]
    if (av) { capturas++; resultado += Number(av.resultado) || 0 }
  }
  const sinDato = capturas === 0
  const sinMeta = !sinDato && meta <= 0
  const pct = sinDato || sinMeta ? null : resultado / meta
  return {
    meta_evaluable: meta > 0 ? meta : null,
    resultado: sinDato ? null : resultado,
    pct_cumplimiento: pct,
    semaforo: sinMeta ? SIN_META : semaforoDe(pct),
  }
}

// Resumen de un eje a partir de sus indicadores ya acumulados. El avance
// promedio es resultado acumulado entre meta acumulada (como v_resumen_ejes),
// solo de los indicadores con meta y captura.
export function resumenEje(indicadores) {
  const cuenta = k => indicadores.filter(i => i.semaforo === k).length
  const medibles = indicadores.filter(i => i.pct_cumplimiento != null)
  const meta = medibles.reduce((s, i) => s + i.meta_evaluable, 0)
  return {
    total_indicadores: indicadores.length,
    optimo: cuenta('ÓPTIMO'), adecuado: cuenta('ADECUADO'), riesgo: cuenta('RIESGO'), critico: cuenta('CRÍTICO'),
    sin_meta: cuenta(SIN_META), sin_dato: indicadores.filter(i => i.semaforo == null).length,
    pct_promedio: meta > 0 ? medibles.reduce((s, i) => s + i.resultado, 0) / meta : null,
  }
}

// lista: salida de getMetasResultados(anio); catalogo: filas de `ejes`.
// Devuelve lo que consume generarInformeGobierno: { ejes, indicadoresPorEje }.
export function indicadoresAlCorte(lista, catalogo, claves, mes) {
  const indicadoresPorEje = {}
  lista.forEach(ind => {
    ;(indicadoresPorEje[ind.eje_codigo] ||= []).push({
      indicador_id: ind.id, indicador: ind.nombre, nivel_mir: ind.nivel_mir, area: ind.area_nombre,
      clave: claves[ind.id] || '—', ...acumularIndicador(ind, mes),
    })
  })
  const ejes = catalogo.map(e => ({
    codigo: e.codigo, eje: e.nombre, color_hex: e.color_hex, orden: e.orden,
    ...resumenEje(indicadoresPorEje[e.codigo] || []),
  }))
  return { ejes, indicadoresPorEje }
}

// Mes de corte del Informe: el del fin de su periodo, salvo que el periodo
// activo de SIMA aún no llegue ahí (entonces, lo capturado hasta hoy).
export function corteInforme(informe, anioActual, mesActual) {
  if (!informe?.periodo_fin) return { anio: anioActual, mes: mesActual }
  const [anio, mes] = String(informe.periodo_fin).split('-').map(Number)
  const antes = anioActual < anio || (anioActual === anio && mesActual < mes)
  return antes ? { anio: anioActual, mes: mesActual } : { anio, mes }
}

// Programas del PMD con su avance al mismo corte que los indicadores
// (v_comparativo_pmd refleja el mes activo de SIMA). progDe: { indicador_id:
// programa_pmd_id }. pct_promedio queda en escala de porcentaje, como la vista.
export function programasAlCorte(pmdProgramas, indicadoresPorEje, progDe) {
  const todos = Object.values(indicadoresPorEje).flat()
  return pmdProgramas.map(p => {
    const inds = todos.filter(i => progDe[i.indicador_id] === p.programa_id)
    const r = resumenEje(inds)
    return {
      ...p, total_indicadores: inds.length,
      indicadores_con_avance: inds.length - r.sin_dato,
      pct_promedio: r.pct_promedio == null ? null : r.pct_promedio * 100,
    }
  })
}
