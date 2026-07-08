/* ── SEMÁFORO SIMA ──────────────────────────────────────────────
   Única fuente de verdad del semáforo en el frontend. Los umbrales
   replican calcular_semaforo() en SQL: >1.10 ÓPTIMO, ≥0.90 ADECUADO,
   ≥0.70 RIESGO, <0.70 CRÍTICO. */

export const SEM = {
  'ÓPTIMO':   { color: '#046205', bg: '#046205' },
  'ADECUADO': { color: '#00B050', bg: '#00B050' },
  'RIESGO':   { color: '#FFC000', bg: '#FFC000' },
  'CRÍTICO':  { color: '#C00000', bg: '#C00000' },
}

export function semColor(sem) { return SEM[sem]?.color || SEM['ADECUADO'].color }

export function getSemaforo(pct) {
  if (pct > 1.10)  return 'ÓPTIMO'
  if (pct >= 0.90) return 'ADECUADO'
  if (pct >= 0.70) return 'RIESGO'
  return 'CRÍTICO'
}
