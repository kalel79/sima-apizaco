// ── Barrel de reportes ─────────────────────────────────────────────────────
// Mantiene la API pública original de utils/reportes.js tras la partición
// en módulos (fase 0.3). Importar desde aquí sigue funcionando igual.

export { generarPDF, generarPDFPiloto } from './reporteMensualPDF.js'
export { generarExcel, generarExcelPiloto } from './reportesExcel.js'
export { generarExcelAvanceCaptura, generarExcelMetas } from './reportesExcelAdmin.js'
export { generarAcusePDF, generarFolioAcuse } from './acusePDF.js'
