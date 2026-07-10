import { useState, useEffect } from 'react'
import { generarPDF, generarExcel, generarExcelEjecutivo, generarPDFPiloto, generarExcelPiloto, generarExcelMetas } from '../../utils/reportes'
import { generarInformeGobierno } from '../../utils/informeGobierno'
import {
  getMetasResultados, getAvancesMensualesPDF, getComparativoPMD, getClavesIndicadores,
  getCierresMensuales, getIndicadoresPorEjeCatalogo, getCorreccionesExtemporaneas,
  getPeriodosConDatos, getResumenPeriodo,
} from '../../lib/supabase'
import { formatPeriodoLabel } from '../../utils/periodo'
import { getSemaforo } from '../../utils/semaforo.js'
import { C } from '../../theme.js'
import { inp } from './estilos.js'

// Sección de descarga de reportes del panel Admin. Recibe los datos del
// reporte desde el padre (instancia única de useDatosReporte).
export default function ReportesAdmin({ global, ejes, indicadoresPorEje, rLoading, rError, cargar, mesActual, anioActual, periodoLabel }) {
  const [genStatus, setGenStatus] = useState(null)
  const [cierres, setCierres] = useState([])
  const [periodosConDatos, setPeriodosConDatos] = useState([])
  const [periodoSelKey, setPeriodoSelKey] = useState('actual') // 'actual' | `${anio}-${mes}`

  useEffect(() => {
    getCierresMensuales().then(setCierres).catch(() => {})
    getPeriodosConDatos().then(setPeriodosConDatos).catch(() => {})
  }, [])

  const cierresMap = Object.fromEntries(cierres.map(c => [`${c.anio}-${c.mes}`, c]))
  // Meses anteriores al periodo activo (el activo se reporta "en vivo" como siempre).
  const periodosAnteriores = periodosConDatos.filter(p =>
    p.anio < anioActual || (p.anio === anioActual && p.mes < mesActual)
  )

  const periodoSel = periodoSelKey === 'actual'
    ? null
    : periodosAnteriores.find(p => `${p.anio}-${p.mes}` === periodoSelKey) || null
  const cierreSel = periodoSel ? cierresMap[`${periodoSel.anio}-${periodoSel.mes}`] || null : null

  // Arma los datos que consumen generarPDF/generarExcel: del periodo activo
  // en vivo (comportamiento de siempre), de un mes ya cerrado (cifras de
  // resumen congeladas en cierres_mensuales), o de un mes pasado que nunca
  // se cerró (recalculado en vivo con la misma fórmula vía RPC
  // resumen_*_periodo) — en los tres casos, el catálogo de indicadores se
  // re-acumula desde avances, que ya es independiente del periodo activo.
  async function resolverDatosReporte() {
    if (!periodoSel) {
      const avancesMensuales = await getAvancesMensualesPDF(anioActual)
      return { global, ejes, indicadoresPorEje, avancesMensuales, mesActual, anioActual, periodoLabel, correccionesExtemporaneas: [] }
    }

    const [resumen, catalogoPorEje, avancesMensuales, correcciones] = await Promise.all([
      cierreSel ? Promise.resolve(cierreSel) : getResumenPeriodo(periodoSel.anio, periodoSel.mes),
      getIndicadoresPorEjeCatalogo(),
      getAvancesMensualesPDF(periodoSel.anio),
      getCorreccionesExtemporaneas(periodoSel.anio, periodoSel.mes),
    ])

    const indicadoresPorEjeCerrado = {}
    Object.entries(catalogoPorEje).forEach(([codigo, inds]) => {
      indicadoresPorEjeCerrado[codigo] = inds.map(ind => {
        const porMes = avancesMensuales[ind.id] || {}
        let metaAcum = 0, resAcum = 0
        for (let m = 1; m <= periodoSel.mes; m++) {
          metaAcum += porMes[m]?.meta || 0
          resAcum  += porMes[m]?.res  || 0
        }
        const pct = metaAcum > 0 ? resAcum / metaAcum : (resAcum > 0 ? resAcum : null)
        return { ...ind, meta_evaluable: metaAcum, resultado: resAcum, pct_cumplimiento: pct, semaforo: pct == null ? null : getSemaforo(pct) }
      })
    })

    return {
      global: resumen.resumen_global,
      ejes: resumen.resumen_ejes,
      indicadoresPorEje: indicadoresPorEjeCerrado,
      avancesMensuales,
      mesActual: periodoSel.mes,
      anioActual: periodoSel.anio,
      periodoLabel: `${formatPeriodoLabel(periodoSel.mes, periodoSel.anio)} ${cierreSel ? '(cerrado)' : '(recalculado)'}`,
      correccionesExtemporaneas: correcciones,
    }
  }

  async function handleGenerarPDF() {
    setGenStatus('cargando')
    try {
      if (!global && !periodoSel) await cargar()
      generarPDF(await resolverDatosReporte())
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleGenerarExcel() {
    setGenStatus('cargando')
    try {
      if (!global && !periodoSel) await cargar()
      await generarExcel(await resolverDatosReporte())
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleGenerarExcelEjecutivo() {
    setGenStatus('cargando')
    try {
      if (!global && !periodoSel) await cargar()
      await generarExcelEjecutivo(await resolverDatosReporte())
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handlePilotoPDF() {
    setGenStatus('cargando')
    try {
      if (!global && !periodoSel) await cargar()
      generarPDFPiloto(await resolverDatosReporte())
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
      const indicadores = await getMetasResultados(anioActual)
      await generarExcelMetas({ indicadores, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handlePilotoExcel() {
    setGenStatus('cargando')
    try {
      if (!global && !periodoSel) await cargar()
      await generarExcelPiloto(await resolverDatosReporte())
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
      <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: '0.8rem' }}>
        Periodo: {periodoSel
          ? `${formatPeriodoLabel(periodoSel.mes, periodoSel.anio)} ${cierreSel ? '🔒 cerrado' : '🕓 recalculado'}`
          : periodoLabel} · {rLoading ? 'Cargando datos…' : `${ejes.length} ejes`}
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{ fontSize: '0.62rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
          Periodo a reportar (aplica a PDF Ejecutivo y Excel de Detalle)
        </label>
        <select value={periodoSelKey} onChange={e => setPeriodoSelKey(e.target.value)} style={inp}>
          <option value="actual">Actual (en vivo) · {periodoLabel}</option>
          {periodosAnteriores.map(p => {
            const key = `${p.anio}-${p.mes}`
            const c = cierresMap[key]
            return (
              <option key={key} value={key}>
                {c ? '🔒' : '🕓'} {formatPeriodoLabel(p.mes, p.anio)} · {c ? `cerrado ${new Date(c.cerrado_at).toLocaleDateString('es-MX')}` : 'recalculado'}
              </option>
            )
          })}
        </select>
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

        <button
          onClick={handleGenerarExcelEjecutivo}
          disabled={rLoading || genStatus === 'cargando'}
          style={{
            flex: 1, minWidth: 180,
            background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,#3d3010,#7a5f1c)`,
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
          ) : '📈 Descargar Excel Ejecutivo'}
        </button>
      </div>
    </div>
  )
}
