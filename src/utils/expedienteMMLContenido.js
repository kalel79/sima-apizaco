// ── Catálogos fijos del Expediente MML (folios oficiales, capítulos, índice) ──

export const INDICE_FORMATOS = [
  { no: 1, formato: 'Transformación Deseada', folio: 'PP-FM-03-00' },
  { no: 2, formato: 'Árbol del Problema',      folio: 'PP-FM-04-00' },
  { no: 3, formato: 'Mapa de Relaciones',      folio: 'PP-FM-05-00' },
  // El PDF oficial de referencia imprime PP-FM-04 también aquí (bug detectado
  // en el documento fuente) — aquí se corrige a PP-FM-07, el folio correcto.
  { no: 4, formato: 'Árbol de Objetivos',       folio: 'PP-FM-07-00' },
  { no: 5, formato: 'Acciones',                 folio: 'PP-FM-08-00' },
  { no: 6, formato: 'Alternativas',             folio: 'PP-FM-09-00' },
  { no: 7, formato: 'Riesgos y MIR',            folio: 'PP-FM-0E-01' },
  { no: 8, formato: 'Metas (POA)',              folio: 'PP-FM-0F-01' },
]

export const CAPITULOS_LABEL = {
  1000: 'Servicios personales',
  2000: 'Materiales y suministros',
  3000: 'Servicios generales',
  4000: 'Transferencias, asignaciones, subsidios y otras ayudas',
  5000: 'Bienes muebles, inmuebles e intangibles',
  6000: 'Inversión pública',
  7000: 'Inversiones financieras y otras provisiones',
  8000: 'Participaciones y aportaciones',
  9000: 'Deuda pública',
}

export const CATEGORIA_INVOLUCRADOS_LABEL = {
  BENEFICIARIO: 'Beneficiarios',
  EJECUTOR: 'Ejecutores',
  OPOSITOR: 'Opositores',
  INDIFERENTE: 'Indiferentes',
}

export const NIVEL_MIR_LABEL = { PROPOSITO: 'Propósito', FIN: 'Fin', COMPONENTE: 'Componente', ACTIVIDAD: 'Actividad' }

// Etiqueta de nivel MIR con numeración jerárquica — "Componente 2",
// "Actividad 2.3" (2 = número del Componente padre, 3 = orden de la
// actividad dentro de él). Propósito y Fin no llevan número: son únicos
// por programa. `numero`/`componenteNumero` ya vienen calculados desde
// derivarNivelesMIR() en lib/mml.js (resolverDatosMML), fuente única que
// comparten la pantalla de captura y el PDF — no se recalculan aquí.
export function etiquetaNivelMIR(nivel) {
  const base = NIVEL_MIR_LABEL[nivel.tipo] || nivel.tipo
  if (nivel.tipo === 'COMPONENTE' && nivel.numero != null) return `${base} ${nivel.numero}`
  if (nivel.tipo === 'ACTIVIDAD' && nivel.numero != null) return `${base} ${nivel.componenteNumero}.${nivel.numero}`
  return base
}
