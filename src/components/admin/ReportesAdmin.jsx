import { useState } from 'react'
import { generarPDF, generarExcel, generarPDFPiloto, generarExcelPiloto, generarExcelMetas } from '../../utils/reportes'
import { generarInformeGobierno } from '../../utils/informeGobierno'
import { getMetasResultados, getAvancesMensualesPDF, getComparativoPMD, getClavesIndicadores } from '../../lib/supabase'
import { C } from '../../theme.js'

// Sección de descarga de reportes del panel Admin. Recibe los datos del
// reporte desde el padre (instancia única de useDatosReporte).
export default function ReportesAdmin({ global, ejes, indicadoresPorEje, rLoading, rError, cargar, mesActual, anioActual, periodoLabel }) {
  const [genStatus, setGenStatus] = useState(null)

  async function handleGenerarPDF() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      const avancesMensuales = await getAvancesMensualesPDF(anioActual)
      generarPDF({ global, ejes, indicadoresPorEje, avancesMensuales, mesActual, anioActual, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleGenerarExcel() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      await generarExcel({ global, ejes, indicadoresPorEje, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handlePilotoPDF() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      const avancesMensuales = await getAvancesMensualesPDF(anioActual)
      generarPDFPiloto({ global, ejes, indicadoresPorEje, avancesMensuales, mesActual, anioActual, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleInformeGobierno() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      const [pmdProgramas, claves] = await Promise.all([
        getComparativoPMD(),
        getClavesIndicadores(),
      ])
      await generarInformeGobierno({ ejes, indicadoresPorEje, claves, pmdProgramas })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleExcelMetas() {
    setGenStatus('cargando')
    try {
      const indicadores = await getMetasResultados()
      await generarExcelMetas({ indicadores, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handlePilotoExcel() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      await generarExcelPiloto({ global, ejes, indicadoresPorEje, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  return (
    <div style={{ marginTop: '2rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '0.3rem', letterSpacing: 1 }}>
        Reportes
      </div>
      <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: '1.2rem' }}>
        Periodo: {periodoLabel} · {rLoading ? 'Cargando datos…' : `${ejes.length} ejes`}
      </div>

      {rError && (
        <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#ff6b6b' }}>
          ⚠️ Error al cargar datos: {rError}
        </div>
      )}

      {genStatus === 'ok' && (
        <div style={{ background: '#04620520', border: `1px solid ${C.optimoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: C.optimoB }}>
          ✅ Archivo generado y descargado correctamente.
        </div>
      )}
      {genStatus?.startsWith('error') && (
        <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#ff6b6b' }}>
          ❌ {genStatus.replace('error:', '')}
        </div>
      )}

      {/* Tabla metas vs resultados */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          TABLA COMPLETA — 170 indicadores, metas mes a mes + resultados:
        </div>
        <button
          onClick={handleExcelMetas}
          disabled={rLoading || genStatus === 'cargando'}
          style={{
            background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,#1a2e3a,#1e4d6b)`,
            border: 'none', borderRadius: 8, color: C.txt,
            padding: '0.75rem 1.2rem', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'inherit', cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
            letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          📋 Descargar Tabla Metas y Resultados
        </button>
      </div>

      {/* Informe de Gobierno */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          SEGUNDO INFORME DE GOBIERNO — Sep 2025 – Ago 2026, portada + 9 ejes:
        </div>
        <button
          onClick={handleInformeGobierno}
          disabled={rLoading || genStatus === 'cargando'}
          style={{
            background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,#3a2000,#7a4800)`,
            border: 'none', borderRadius: 8, color: C.txt,
            padding: '0.75rem 1.2rem', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'inherit', cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
            letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          📋 Descargar Informe de Gobierno
        </button>
      </div>

      {/* Botones piloto (validación antes del reporte completo) */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          VALIDACIÓN — portada + resumen + 1 eje:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: '🔍 PDF Piloto', fn: handlePilotoPDF },
            { label: '🔍 Excel Piloto', fn: handlePilotoExcel },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn}
              disabled={rLoading || genStatus === 'cargando'}
              style={{
                background: rLoading || genStatus === 'cargando' ? '#333' : '#2A2A2A',
                border: `1px solid ${C.border}`, borderRadius: 6,
                color: C.txtMuted, padding: '0.45rem 0.85rem',
                fontSize: '0.72rem', fontFamily: 'inherit',
                cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
              }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleGenerarPDF}
          disabled={rLoading || genStatus === 'cargando'}
          style={{
            flex: 1, minWidth: 180,
            background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
            border: 'none', borderRadius: 8, color: C.txt,
            padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'inherit', cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
            letterSpacing: 1, opacity: rLoading ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {genStatus === 'cargando' ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #ffffff44', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              Generando…
            </>
          ) : '📄 Descargar PDF Ejecutivo'}
        </button>

        <button
          onClick={handleGenerarExcel}
          disabled={rLoading || genStatus === 'cargando'}
          style={{
            flex: 1, minWidth: 180,
            background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,#1a3a1a,#1e6b1e)`,
            border: 'none', borderRadius: 8, color: C.txt,
            padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'inherit', cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
            letterSpacing: 1, opacity: rLoading ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {genStatus === 'cargando' ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #ffffff44', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              Generando…
            </>
          ) : '📊 Descargar Excel de Detalle'}
        </button>
      </div>
    </div>
  )
}
