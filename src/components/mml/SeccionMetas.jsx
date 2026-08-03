import { useState } from 'react'
import { upsertMeta } from '../../lib/supabase'
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
export default function SeccionMetas({ anio, mirNiveles, puedeEditar, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  const filas = (Array.isArray(mirNiveles) ? mirNiveles : []).filter(n => n.indicador_id && n.indicador)

  // El Anual ya no se captura a mano — se recalcula solo como suma de los 12
  // meses cada vez que se guarda uno (decisión 2026-07-23).
  async function handleGuardar(fila, mes, valorTexto) {
    const key = `${fila.indicador_id}-${mes}`
    setGuardando(key); setError(null)
    try {
      const valor = valorTexto === '' ? null : +valorTexto
      await upsertMeta(fila.indicador_id, anio, mes, valor)
      const valoresActualizados = { ...fila.metas, [mes]: valor }
      const sumaAnual = Array.from({ length: 12 }, (_, i) => i + 1)
        .reduce((acc, m) => acc + (Number(valoresActualizados[m]) || 0), 0)
      await upsertMeta(fila.indicador_id, anio, 0, sumaAnual)
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
        <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB }}>
          ❌ {error}
        </div>
      )}
      {!puedeEditar && (
        <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 8 }}>
          Solo Administrador puede capturar metas (mismo alcance que "Metas por año").
        </div>
      )}
      {!filas.length && (
        <div style={{ fontSize: '0.76rem', color: C.txtMuted, padding: '0.75rem', textAlign: 'center' }}>
          Este programa no tiene indicadores enlazados a la MIR todavía.
        </div>
      )}
      {!!filas.length && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', minWidth: 140, maxWidth: 160 }}>Indicador</th>
                {MESES.map(m => <th key={m} style={th}>{m}</th>)}
                <th style={{ ...th, minWidth: 50 }} title="Se calcula solo, suma de los 12 meses">Anual Σ</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.id}>
                  <td style={{ ...td, textAlign: 'left', fontSize: '0.64rem', color: C.txt, maxWidth: 160, overflow: 'hidden' }} title={f.indicador.nombre}>
                    <span style={{ fontSize: '0.54rem', color: C.txtMuted, display: 'block' }}>{f.tipo}{f.numero ? ` ${f.numero}` : ''}</span>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.indicador.nombre}</span>
                  </td>
                  {MESES.map((_, i) => {
                    const mes = i + 1
                    const key = `${f.indicador_id}-${mes}`
                    return (
                      <td key={mes} style={td}>
                        <input type="number" step="0.01" defaultValue={f.metas?.[mes] ?? ''} disabled={!puedeEditar || guardando === key}
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
              ))}
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
