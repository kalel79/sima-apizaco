/* ── PALETA INSTITUCIONAL ───────────────────────────────────── */
export const C = {
  guinda:'#7B1F2C', guindaMid:'#A52020', guindaDark:'#51141D',
  dorado:'#C8A96E', doradoLight:'#E2C998',
  bg:'#0D0D0D', bgCard:'#161616', bgPanel:'#1C1C1C',
  border:'#2A2A2A', txt:'#F0EAE0', txtMuted:'#706050', txtSub:'#A09080',
  // Semáforo corregido según especificación Hugo
  optimoB:  '#046205',  // verde oscuro óptimo
  adecuadoB:'#00B050',  // verde claro adecuado
  riesgoB:  '#FFC000',  // amarillo riesgo
  criticoB: '#C00000',  // rojo crítico
}

/* ── Variantes de color para <Button> (pares [oscuro, claro] del gradiente
   135deg que ya se usaba ad hoc, repetido y sin nombre, en ~14 pantallas) ── */
export const BOTON_VARIANTES = {
  guinda:       ['#51141D', '#7B1F2C'],
  verde:        ['#1a3a1a', '#1e6b1e'],
  azul:         ['#1a2e3a', '#1e4d6b'],
  doradoOsc:    ['#3a2000', '#7a4800'],
  verdeAzulado: ['#1a3a2e', '#1e6b4d'],
  morado:       ['#2a1a3a', '#5a2e7a'],
  ambar:        ['#3d3010', '#7a5f1c'],
}

/* ── Escala tipográfica — 422 usos de fontSize inline en el proyecto
   tenían 28 valores casi duplicados entre 0.6 y 0.85rem sin ningún
   token. Estos 6 escalones son el valor más representativo de cada
   agrupación natural encontrada; se adoptan primero en ui.jsx. ────── */
export const FS = {
  xxs: '0.62rem', // eyebrows uppercase, labels, encabezados de tabla, badges
  xs:  '0.68rem', // texto secundario, celdas de tabla
  sm:  '0.75rem', // cuerpo de texto, botones/inputs de tamaño estándar
  md:  '0.82rem', // subtítulos, botones primarios
  lg:  '0.95rem', // cifras destacadas, headers de sección
  xl:  '1.1rem',  // hero/splash
}
