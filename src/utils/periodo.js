const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

export function formatPeriodoLabel(mesActual, anioActual) {
  const mes  = mesActual  ?? 5
  const anio = anioActual ?? 2026
  if (mes <= 1) return `ENE ${anio}`
  return `ENE-${MESES[mes - 1]} ${anio}`
}
