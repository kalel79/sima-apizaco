// ── Barrel de acceso a datos ──────────────────────────────────────────────────
// Mantiene la API pública original de lib/supabase.js tras la partición en
// módulos por dominio (fase 0.3). Importar desde aquí sigue funcionando igual.

export { supabase } from './supabaseClient.js'

export {
  getDashboardGlobal, getResumenEjes, getResumenAreas, getAlertasLogros,
  getIndicadores, getAvanceCapturaAreas, getNombresEjes, getComparativoPMD,
  getClavesIndicadores, getIndicadoresPorPrograma, getDetalleIndicadoresPMD,
  getIndicadoresLista, getMetasResultados, getAvancesMensualesPDF,
} from './consultas.js'

export {
  getAvanceActual, getResumenValidacionArea, getEnlaceDeArea,
  validarInformacionMes, reautenticar, getAvancesValidadosMes,
  registrarAuditLog, getAvancesDetalleArea, corregirAvance, desvalidarAvance,
  actualizarPeriodo, guardarAvance,
} from './capturaValidacion.js'

export {
  EVIDENCIAS_BUCKET, EVIDENCIAS_MAX_BYTES,
  getIndicadorAreaId, getAvancePorIndicador, listarEvidencias,
  subirEvidencia, borrarEvidencia, getEvidenciaUrl,
} from './evidencias.js'

export {
  getMetasCatalogo, getMetasIndicadorAnio, getMetasArea, getIndicadoresOrdenados,
  upsertMeta, upsertMetasLote,
} from './metas.js'

export {
  getAniosDisponiblesIndicador, getFichaIndicador, getSparklinesAnio,
} from './historico.js'

export {
  getCierresMensuales, getCierreMensual, cerrarMesActual,
  getIndicadoresPorEjeCatalogo, getCorreccionesExtemporaneas,
  getPeriodosConDatos, getResumenPeriodo,
  getPublicacionesTransparencia, publicarTransparencia, despublicarTransparencia,
  getTransparenciaPublica,
} from './cierres.js'
