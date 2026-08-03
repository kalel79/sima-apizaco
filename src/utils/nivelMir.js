// nivel_mir viene como texto libre ("Fin", "Proposito", "Componente 2",
// "Actividad 1.1", con o sin acentos). Se normaliza para agrupar y ordenar
// Fin → Propósito → Componentes → Actividades, y numéricamente dentro de
// cada grupo (Actividad 1.2 antes que 1.10). Compartido entre la cascada MIR
// de PantallaPMD.jsx y el reporte PDF (reportesPMD.js).
export const GRUPOS_MIR = [
  { tipo: 'FIN',        label: 'Fin',         desc: 'Objetivo superior al que contribuye el programa' },
  { tipo: 'PROPOSITO',  label: 'Propósito',   desc: 'Resultado directo esperado en la población objetivo' },
  { tipo: 'COMPONENTE', label: 'Componentes', desc: 'Bienes y servicios que entrega el programa' },
  { tipo: 'ACTIVIDAD',  label: 'Actividades', desc: 'Acciones para producir los componentes' },
  { tipo: 'OTRO',       label: 'Otros',       desc: null },
]

export function parseNivelMir(nivel) {
  const plano = (nivel || '').normalize('NFD').replace(/\p{M}/gu, '').trim().toUpperCase()
  const tipo = plano.startsWith('FIN') ? 'FIN'
    : plano.startsWith('PROPOSITO') ? 'PROPOSITO'
    : plano.startsWith('COMPONENTE') ? 'COMPONENTE'
    : plano.startsWith('ACTIVIDAD') ? 'ACTIVIDAD'
    : 'OTRO'
  const nums = (plano.match(/\d+/g) || []).map(Number)
  return { tipo, orden: [(nums[0] ?? 0), (nums[1] ?? 0)] }
}

// Agrupa una lista de indicadores (cada uno con .nivel_mir y .nombre) en las
// secciones de GRUPOS_MIR, ordenados y filtrando los grupos vacíos.
export function agruparPorNivelMir(indicadores) {
  const conNivel = (indicadores || []).map(i => ({ ...i, _mir: parseNivelMir(i.nivel_mir) }))
  return GRUPOS_MIR
    .map(g => ({
      ...g,
      indicadores: conNivel
        .filter(i => i._mir.tipo === g.tipo)
        .sort((a, b) => (a._mir.orden[0] - b._mir.orden[0]) || (a._mir.orden[1] - b._mir.orden[1]) || a.nombre.localeCompare(b.nombre)),
    }))
    .filter(g => g.indicadores.length)
}
