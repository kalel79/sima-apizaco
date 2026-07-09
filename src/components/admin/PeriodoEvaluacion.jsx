import { useState, useEffect, useCallback } from 'react'
import { actualizarPeriodo, getCierreMensual, cerrarMesActual } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C } from '../../theme.js'
import { inp } from './estilos.js'

const MESES_LABEL = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Cambio del periodo de evaluación activo (mes/año) con confirmación.
// `cargar` recarga los datos de reportes del padre tras actualizar el periodo.
export default function PeriodoEvaluacion({ mesActual, anioActual, periodoLabel, refetchCfg, cargar }) {
  const { profile } = useAuth()
  const [cfgMes,     setCfgMes]     = useState(null)   // null = sin cambio pendiente
  const [cfgAnio,    setCfgAnio]    = useState(null)
  const [cfgPending, setCfgPending] = useState(false)  // esperando confirmación
  const [cfgSaving,  setCfgSaving]  = useState(false)
  const [cfgStatus,  setCfgStatus]  = useState(null)

  const [cierre,        setCierre]        = useState(undefined) // undefined=cargando, null=no cerrado
  const [cierrePending, setCierrePending] = useState(false)
  const [cierreSaving,  setCierreSaving]  = useState(false)
  const [cierreError,   setCierreError]   = useState(null)

  // Inicializar selectors cuando carga la config
  useEffect(() => {
    if (mesActual && anioActual && cfgMes === null) {
      setCfgMes(mesActual)
      setCfgAnio(anioActual)
    }
  }, [mesActual, anioActual]) // eslint-disable-line

  const cargarCierre = useCallback(() => {
    if (!mesActual || !anioActual) return
    setCierre(undefined)
    getCierreMensual(anioActual, mesActual).then(setCierre).catch(e => setCierreError(e.message))
  }, [mesActual, anioActual])

  useEffect(() => { cargarCierre() }, [cargarCierre])

  async function handleConfirmarPeriodo() {
    setCfgSaving(true)
    setCfgStatus(null)
    try {
      await actualizarPeriodo(cfgMes, cfgAnio)
      await refetchCfg()
      await cargar()
      setCfgStatus({ ok: true, msg: `Periodo actualizado a ${MESES_LABEL[cfgMes-1]} ${cfgAnio}.` })
    } catch (e) {
      setCfgStatus({ ok: false, msg: e.message })
    } finally {
      setCfgSaving(false)
      setCfgPending(false)
    }
  }

  async function handleCerrarMes() {
    setCierreSaving(true)
    setCierreError(null)
    try {
      await cerrarMesActual(anioActual, mesActual, profile?.id)
      cargarCierre()
    } catch (e) {
      setCierreError(e.message)
    } finally {
      setCierreSaving(false)
      setCierrePending(false)
    }
  }

  return (
    <div style={{ marginTop: '2rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '0.3rem', letterSpacing: 1 }}>
        Periodo de Evaluación
      </div>
      <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: '1.2rem' }}>
        Activo: <strong style={{ color: C.txt }}>{periodoLabel}</strong> · Cambia el mes al capturar todos los avances del mes siguiente.
      </div>

      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.9rem 1rem', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: C.doradoLight, marginBottom: 4, letterSpacing: 1 }}>
          Cierre de {periodoLabel}
        </div>

        {cierreError && (
          <div style={{ color: '#ff6b6b', fontSize: '0.74rem', marginBottom: 8 }}>⚠️ {cierreError}</div>
        )}

        {cierre === undefined && (
          <div style={{ fontSize: '0.74rem', color: C.txtMuted }}>Consultando estado del cierre…</div>
        )}

        {cierre === null && !cierrePending && (
          <>
            <div style={{ fontSize: '0.72rem', color: C.txtMuted, marginBottom: 8 }}>
              El resumen de este mes aún no está congelado — ciérralo antes de avanzar el periodo para poder regenerar su reporte más adelante con las mismas cifras.
            </div>
            <button
              onClick={() => setCierrePending(true)}
              style={{
                background: `linear-gradient(135deg,#1a3a1a,#1e6b1e)`, border: 'none', borderRadius: 8,
                color: C.txt, padding: '0.55rem 1rem', fontSize: '0.78rem', fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
              }}
            >
              🔒 Cerrar mes actual
            </button>
          </>
        )}

        {cierre === null && cierrePending && (
          <div style={{ background: '#C0000018', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', color: C.txt, marginBottom: '0.65rem', lineHeight: 1.5 }}>
              ¿Confirmas cerrar <strong style={{ color: C.dorado }}>{periodoLabel}</strong>? Las cifras de resumen quedarán congeladas para reportes futuros de este mes — no se puede deshacer desde la app.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCerrarMes}
                disabled={cierreSaving}
                style={{
                  background: cierreSaving ? '#444' : C.criticoB, border: 'none', borderRadius: 6, color: '#fff',
                  padding: '0.5rem 1.1rem', fontSize: '0.78rem', fontWeight: 700,
                  fontFamily: 'inherit', cursor: cierreSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {cierreSaving ? '⏳ Cerrando…' : '✔ Confirmar cierre'}
              </button>
              <button
                onClick={() => setCierrePending(false)}
                style={{
                  background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.txtMuted,
                  padding: '0.5rem 1rem', fontSize: '0.78rem', fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cierre && (
          <div style={{ fontSize: '0.76rem', color: C.optimoB }}>
            🔒 Cerrado el {formatFecha(cierre.cerrado_at)}{cierre.cerrado_por?.nombre ? ` por ${cierre.cerrado_por.nombre}` : ''}.
          </div>
        )}
      </div>

      {cfgStatus && (
        <div style={{
          background: cfgStatus.ok ? '#04620520' : '#C0000022',
          border: `1px solid ${cfgStatus.ok ? C.optimoB : C.criticoB}`,
          borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem',
          fontSize: '0.78rem', color: cfgStatus.ok ? C.optimoB : '#ff6b6b',
        }}>
          {cfgStatus.ok ? '✅' : '⚠️'} {cfgStatus.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
            Mes
          </label>
          <select
            value={cfgMes ?? mesActual}
            onChange={e => { setCfgMes(+e.target.value); setCfgPending(false); setCfgStatus(null) }}
            style={inp}
          >
            {MESES_LABEL.map((m, i) => (
              <option key={i+1} value={i+1}>{m} ({i+1})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
            Año
          </label>
          <select
            value={cfgAnio ?? anioActual}
            onChange={e => { setCfgAnio(+e.target.value); setCfgPending(false); setCfgStatus(null) }}
            style={inp}
          >
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Advertencia cuando mes=1 y año no cambió */}
      {cfgMes === 1 && cfgAnio === anioActual && (
        <div style={{ background: '#FFC00018', border: '1px solid #FFC000', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#a07800' }}>
          ⚠️ Estás seleccionando enero. Si estás avanzando al siguiente año, recuerda cambiar también el año.
        </div>
      )}

      {/* Panel de confirmación */}
      {cfgPending ? (
        <div style={{ background: '#C0000018', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: C.txt, marginBottom: '0.75rem', lineHeight: 1.5 }}>
            ¿Confirmas actualizar el periodo de evaluación a <strong style={{ color: C.dorado }}>{MESES_LABEL[(cfgMes??mesActual)-1]} {cfgAnio??anioActual}</strong>?<br/>
            <span style={{ fontSize: '0.72rem', color: C.txtMuted }}>Asegúrate de que todas las áreas hayan capturado sus avances del mes.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleConfirmarPeriodo}
              disabled={cfgSaving}
              style={{
                background: cfgSaving ? '#444' : C.criticoB,
                border: 'none', borderRadius: 6, color: '#fff',
                padding: '0.5rem 1.2rem', fontSize: '0.8rem', fontWeight: 700,
                fontFamily: 'inherit', cursor: cfgSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {cfgSaving ? '⏳ Guardando…' : '✔ Confirmar cambio'}
            </button>
            <button
              onClick={() => setCfgPending(false)}
              style={{
                background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 6, color: C.txtMuted,
                padding: '0.5rem 1rem', fontSize: '0.8rem',
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setCfgPending(true); setCfgStatus(null) }}
          disabled={cfgMes === mesActual && cfgAnio === anioActual}
          style={{
            background: (cfgMes === mesActual && cfgAnio === anioActual) ? '#333'
              : `linear-gradient(135deg,#3a2000,#7a4800)`,
            border: 'none', borderRadius: 8, color: C.txt,
            padding: '0.65rem 1.2rem', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'inherit', letterSpacing: 1,
            cursor: (cfgMes === mesActual && cfgAnio === anioActual) ? 'not-allowed' : 'pointer',
            opacity: (cfgMes === mesActual && cfgAnio === anioActual) ? 0.4 : 1,
          }}
        >
          📅 Actualizar Periodo
        </button>
      )}
    </div>
  )
}
