import { useState } from 'react'
import { XCircle, Copy, Loader2 } from 'lucide-react'
import { upsertMeta, puedeEditarDatosIndicador, copiarMetasDeAnioAnterior } from '../../lib/supabase'
import { etiquetaNivelMIR } from '../../utils/expedienteMMLContenido.js'
import { C } from '../../theme.js'

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

// Anchos pensados para que los 12 meses + indicador + anual quepan sin scroll
// horizontal en el ancho normal de la app (~980px) — antes recortaba a partir
// de octubre porque la tabla era más ancha que su contenedor visible.
const inpCelda = { width: 42, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 4, color: C.txt, padding: '0.2rem', fontSize: '0.62rem', fontFamily: 'inherit', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }
const th = { fontSize: '0.54rem', color: C.doradoLight, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', padding: '0.3rem 0.15rem', borderBottom: `1px solid ${C.border}` }
const td = { padding: '0.22rem 0.15rem', textAlign: 'center', borderBottom: `1px solid ${C.border}` }

// POA / Metas calendarizadas (PP-FM-0F). Reutiliza la tabla `metas` ya existente
// (fase 1.1) — mes 0 = meta anual, 1-12 = mensual. La fila "Total anual" del
// formato oficial se sustituye (decisión 2026-07-21) por una fila de resumen
// con sentido: cuántos indicadores tienen meta programada ese mes / total.
// fase_mml_10: el permiso ya no es un booleano de pantalla — cada fila se
// habilita según el Área responsable de su Componente (puedeEditarDatosIndicador),
// igual que ya hace cumplir la RLS de `metas` del lado del servidor.
export default function SeccionMetas({ anio, mirNiveles, rolInfo, puedeCopiar, anioOrigenDisponible, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  const filas = (Array.isArray(mirNiveles) ? mirNiveles : []).filter(n => n.indicador_id && n.indicador)
  const sinMetasCapturadas = filas.length > 0 && filas.every(f => !f.metas || Object.keys(f.metas).length === 0)

  async function handleCopiar() {
    setGuardando('copiar'); setError(null)
    try {
      await copiarMetasDeAnioAnterior({ anio, indicadorIds: filas.map(f => f.indicador_id) })
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  // El Anual (mes 0) no se captura a mano — es la suma de los 12 meses
  // (decisión 2026-07-23). Desde fase_mml_20 esa suma la hace un trigger en la
  // base, no esta pantalla: antes se calculaba aquí a partir de `fila.metas`,
  // que es la foto de props del render en curso, así que capturar varios meses
  // seguidos sin esperar la recarga guardaba un anual desfasado en silencio.
  async function handleGuardar(fila, mes, valorTexto) {
    const key = `${fila.indicador_id}-${mes}`
    setGuardando(key); setError(null)
    try {
      await upsertMeta(fila.indicador_id, anio, mes, valorTexto === '' ? null : +valorTexto)
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  const resumenPorMes = MESES.map((_, i) => {
    const mes = i + 1
    const conMeta = filas.filter(f => f.metas?.[mes] != null).length
    return { mes, conMeta, total: filas.length }
  })
  const conMetaAnual = filas.filter(f => f.metas?.[0] != null).length

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Metas calendarizadas · POA (PP-FM-0F) · {anio}
      </div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {rolInfo?.isEnlace && (
        <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 8 }}>
          Solo puedes capturar las metas de los indicadores del Componente de tu área.
        </div>
      )}
      {!filas.length && (
        <div style={{ fontSize: '0.76rem', color: C.txtMuted, padding: '0.75rem', textAlign: 'center' }}>
          Este programa no tiene indicadores enlazados a la MIR todavía.
        </div>
      )}
      {sinMetasCapturadas && puedeCopiar && anioOrigenDisponible && (
        <button onClick={handleCopiar} disabled={guardando === 'copiar'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgPanel, border: `1px dashed ${C.doradoLight}`, borderRadius: 8, color: C.doradoLight, padding: '0.55rem 0.9rem', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '0.8rem', width: '100%', justifyContent: 'center' }}>
          {guardando === 'copiar'
            ? <><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Copiando…</>
            : <><Copy size={13}/> Copiar metas de {anioOrigenDisponible} — dejarlas como base editable para {anio}</>}
        </button>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {!!filas.length && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', minWidth: 260, maxWidth: 320 }}>Indicador</th>
                {MESES.map(m => <th key={m} style={th}>{m}</th>)}
                <th style={{ ...th, minWidth: 50 }} title="Se calcula solo, suma de los 12 meses">Anual Σ</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => {
                const puedeEditarFila = puedeEditarDatosIndicador(f, rolInfo)
                return (
                <tr key={f.id}>
                  <td style={{ ...td, textAlign: 'left', fontSize: '0.64rem', color: C.txt, maxWidth: 320 }}>
                    {/* etiquetaNivelMIR y no `${f.tipo} ${f.numero}` a mano: las
                        Actividades se numeran dentro de su Componente (1.1, 1.2,
                        2.1…), y con el número suelto salían repetidas — dos
                        "Actividad 1" en la misma tabla. */}
                    <span style={{ fontSize: '0.54rem', color: C.txtMuted, display: 'block' }}>{etiquetaNivelMIR(f)}</span>
                    <span style={{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word' }}>{f.indicador.nombre}</span>
                  </td>
                  {MESES.map((_, i) => {
                    const mes = i + 1
                    const key = `${f.indicador_id}-${mes}`
                    return (
                      <td key={mes} style={td}>
                        <input type="number" step="0.01" defaultValue={f.metas?.[mes] ?? ''} disabled={!puedeEditarFila || guardando === key}
                          onBlur={e => { const v = e.target.value; if (v !== String(f.metas?.[mes] ?? '')) handleGuardar(f, mes, v) }}
                          style={inpCelda} />
                      </td>
                    )
                  })}
                  <td style={td} title="Se calcula solo, suma de los 12 meses">
                    <input type="number" value={f.metas?.[0] ?? 0} disabled
                      style={{ ...inpCelda, fontWeight: 700, opacity: 0.85, cursor: 'not-allowed' }} />
                  </td>
                </tr>
              )})}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...td, textAlign: 'left', fontSize: '0.68rem', color: C.doradoLight, fontWeight: 700 }}>
                  Indicadores con meta programada
                </td>
                {resumenPorMes.map(r => (
                  <td key={r.mes} style={{ ...td, fontSize: '0.64rem', color: C.txtSub }}>{r.conMeta}/{r.total}</td>
                ))}
                <td style={{ ...td, fontSize: '0.64rem', color: C.doradoLight, fontWeight: 700 }}>
                  {conMetaAnual}/{filas.length} ({filas.length ? Math.round((conMetaAnual / filas.length) * 100) : 0}%)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
