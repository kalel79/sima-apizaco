import { useState, useEffect } from 'react'
import {
  Lock, Clock, AlertTriangle, CheckCircle2, XCircle, Table2, Landmark,
  TreePine, Presentation, Search, FileText, FileSpreadsheet, FileBarChart2,
} from 'lucide-react'
import { generarPDF, generarExcel, generarExcelEjecutivo, generarPDFPiloto, generarExcelPiloto, generarExcelMetas } from '../../utils/reportes'
import { generarInformeGobierno } from '../../utils/informeGobierno'
import { generarArbolProblemaObjetivosMIR } from '../../utils/reporteArbolMIR'
import { generarMatrizPMDAreas } from '../../utils/reporteMatrizPMD'
import {
  getMetasResultados, getAvancesMensualesPDF, getComparativoPMD, getClavesIndicadores,
  getCierresMensuales, getIndicadoresPorEjeCatalogo, getCorreccionesExtemporaneas,
  getPeriodosConDatos, getResumenPeriodo,
} from '../../lib/supabase'
import { formatPeriodoLabel } from '../../utils/periodo'
import { getSemaforo } from '../../utils/semaforo.js'
import { C } from '../../theme.js'
import { inp } from './estilos.js'
import { Button } from '../ui.jsx'

// Sección de descarga de reportes del panel Admin. Recibe los datos del
// reporte desde el padre (instancia única de useDatosReporte).
export default function ReportesAdmin({ global, ejes, indicadoresPorEje, rLoading, rError, cargar, mesActual, anioActual, periodoLabel }) {
  const [genStatus, setGenStatus] = useState(null)
  const [anioArbol, setAnioArbol] = useState(2026)
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
      getIndicadoresPorEjeCatalogo(periodoSel.anio),
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

  async function handleArbolMIR() {
    setGenStatus('cargando')
    try {
      await generarArbolProblemaObjetivosMIR(anioArbol)
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleMatrizPMD() {
    setGenStatus('cargando')
    try {
      await generarMatrizPMDAreas()
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
      <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
        {periodoSel ? (
          <>Periodo: {formatPeriodoLabel(periodoSel.mes, periodoSel.anio)} {cierreSel ? <><Lock size={11}/> cerrado</> : <><Clock size={11}/> recalculado</>}</>
        ) : `Periodo: ${periodoLabel}`} · {rLoading ? 'Cargando datos…' : `${ejes.length} ejes`}
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
                {formatPeriodoLabel(p.mes, p.anio)} · {c ? `cerrado ${new Date(c.cerrado_at).toLocaleDateString('es-MX')}` : 'recalculado'}
              </option>
            )
          })}
        </select>
      </div>

      {rError && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14}/> Error al cargar datos: {rError}
        </div>
      )}

      {genStatus === 'ok' && (
        <div style={{ background: `${C.optimoB}20`, border: `1px solid ${C.optimoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: C.optimoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={14}/> Archivo generado y descargado correctamente.
        </div>
      )}
      {genStatus?.startsWith('error') && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={14}/> {genStatus.replace('error:', '')}
        </div>
      )}

      {/* Tabla metas vs resultados */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          TABLA COMPLETA — 170 indicadores, metas mes a mes + resultados:
        </div>
        <Button variant="azul" icon={Table2} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleExcelMetas}>
          Descargar Tabla Metas y Resultados
        </Button>
      </div>

      {/* Informe de Gobierno */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          SEGUNDO INFORME DE GOBIERNO — Sep 2025 – Ago 2026, portada + 9 ejes:
        </div>
        <Button variant="doradoOsc" icon={Landmark} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleInformeGobierno}>
          Descargar Informe de Gobierno
        </Button>
      </div>

      {/* Árbol Problema-Objetivos MIR (9 programas) */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          ÁRBOL PROBLEMA-OBJETIVOS (MIR) — los 9 programas presupuestales, con área responsable por nivel:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={anioArbol} onChange={e => setAnioArbol(+e.target.value)} style={inp}>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
          <Button variant="verdeAzulado" icon={TreePine} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleArbolMIR}>
            Árbol Problema-Objetivos MIR (9 programas)
          </Button>
        </div>
      </div>

      {/* Matriz de Programas PMD × Áreas × Indicadores */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          MATRIZ DE PROGRAMAS PMD — áreas responsables e indicadores por programa, formato presentación:
        </div>
        <Button variant="morado" icon={Presentation} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleMatrizPMD}>
          Matriz de Programas PMD (PDF tipo presentación)
        </Button>
      </div>

      {/* Botones piloto (validación antes del reporte completo) */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
          VALIDACIÓN — portada + resumen + 1 eje:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'PDF Piloto', fn: handlePilotoPDF },
            { label: 'Excel Piloto', fn: handlePilotoExcel },
          ].map(btn => (
            <Button key={btn.label} variant="ghost" size="sm" icon={Search} disabled={rLoading || genStatus === 'cargando'} onClick={btn.fn}>
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant="guinda" icon={FileText} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleGenerarPDF} style={{ flex: 1, minWidth: 180 }}>
          Descargar PDF Ejecutivo
        </Button>

        <Button variant="verde" icon={FileSpreadsheet} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleGenerarExcel} style={{ flex: 1, minWidth: 180 }}>
          Descargar Excel de Detalle
        </Button>

        <Button variant="ambar" icon={FileBarChart2} loading={genStatus === 'cargando'} disabled={rLoading} onClick={handleGenerarExcelEjecutivo} style={{ flex: 1, minWidth: 180 }}>
          Descargar Excel Ejecutivo
        </Button>
      </div>
    </div>
  )
}
