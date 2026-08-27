// ── Barrel de acceso a datos ──────────────────────────────────────────────────
// Mantiene la API pública original de lib/supabase.js tras la partición en
// módulos por dominio (fase 0.3). Importar desde aquí sigue funcionando igual.

export { supabase } from './supabaseClient.js'

export {
  getDashboardGlobal, getResumenEjes, getResumenAreas, getAlertasLogros,
  getIndicadores, getAvanceCapturaAreas, getNombresEjes, getComparativoPMD,
  getClavesIndicadores, getIndicadoresPorPrograma, getDetalleIndicadoresPMD,
  getProgramasPresupuestariosDePmd, getProgramasPresupuestariosPorPmd,
  getIndicadoresLista, getMetasResultados, getAvancesMensualesPDF,
  getMatrizProgramasAreas,
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
  subirEvidencia, borrarEvidencia, getEvidenciaUrl, getMatrizEvidencias,
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

export {
  getAsmConsolidado, getAccionesAbiertas, getPctCumplimientoIndicador,
  crearHallazgo, actualizarHallazgo, crearAccionMejora, actualizarAccionMejora, actualizarAvanceAccion, crearRecurso,
} from './asm.js'

export {
  listarEvidenciasAsm, subirEvidenciaAsm, borrarEvidenciaAsm, getEvidenciaAsmUrl,
} from './asmEvidencias.js'

export {
  getProgramaIdDeArea, getProgramasLista, getIndicadoresDePrograma, getAreasDePrograma,
  crearIndicador, resolverDatosMML,
  upsertDiagnostico, eliminarDiagnostico, copiarDiagnosticoDeAnioAnterior,
  upsertArbolNodo, eliminarArbolNodo, actualizarAreaResponsable, copiarArbolDeAnioAnterior,
  upsertInvolucrado, eliminarInvolucrado, copiarInvolucradosDeAnioAnterior,
  copiarMetasDeAnioAnterior,
  upsertAccionAlternativa, eliminarAccionAlternativa, generarAccionesDesdeMedios,
  actualizarNodoMIR, actualizarFichaIndicador,
  upsertVariable, eliminarVariable, upsertValorVariable,
  actualizarPresupuesto,
  actualizarFichaProyecto, actualizarFuenteFinanciamiento,
  puedeEditarDatosIndicador, puedeAsignarAreaResponsable,
  getAvanceMMLAreas, getAvanceMMLProgramas, getAniosMML, getAvanceMMLDetalleArea,
} from './mml.js'
