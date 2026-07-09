import { useState, useEffect, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { supabase, getMetasArea, upsertMeta, upsertMetasLote, getIndicadoresOrdenados, getClavesIndicadores } from '../../lib/supabase'
import { XL, descargarExcel, MESES_NOMBRES } from '../../utils/reportesBase.js'
import { C } from '../../theme.js'
import { inp } from './estilos.js'

const ANIOS = [2025, 2026, 2027]

// Pantalla admin: captura/edición de metas mensuales por indicador (mes a mes
// + meta anual), por año — reemplaza a las columnas fijas meta_ene..meta_dic.
// Permite abrir 2027 (u otro año) sin ninguna migración adicional.
export default function MetasPorAnio() {
  const [anio,        setAnio]        = useState(2027)
  const [areas,       setAreas]       = useState([])
  const [areaId,      setAreaId]      = useState('')
  const [indicadores, setIndicadores] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [cellStatus,  setCellStatus]  = useState({}) // `${indicadorId}-${mes}` -> 'saving'|'ok'|'error'
  const [importing,   setImporting]   = useState(false)
  const [importStatus, setImportStatus] = useState(null)

  useEffect(() => {
    supabase.from('areas').select('id, nombre').order('nombre').then(({ data }) => setAreas(data || []))
  }, [])

  const cargar = useCallback(async () => {
    if (!areaId) { setIndicadores([]); return }
    setLoading(true)
    try {
      setIndicadores(await getMetasArea(+areaId, anio))
    } finally {
      setLoading(false)
    }
  }, [areaId, anio])

  useEffect(() => { cargar() }, [cargar])

  async function handleCambiarCelda(indicadorId, mes, valorStr) {
    const key = `${indicadorId}-${mes}`
    const valor = valorStr === '' ? null : parseFloat(valorStr)
    if (valorStr !== '' && Number.isNaN(valor)) return
    setIndicadores(prev => prev.map(ind =>
      ind.id === indicadorId ? { ...ind, metas: { ...ind.metas, [mes]: valor } } : ind
    ))
    setCellStatus(s => ({ ...s, [key]: 'saving' }))
    try {
      await upsertMeta(indicadorId, anio, mes, valor)
      setCellStatus(s => ({ ...s, [key]: 'ok' }))
    } catch {
      setCellStatus(s => ({ ...s, [key]: 'error' }))
    }
  }

  async function handleDescargarPlantilla() {
    const lista = await getIndicadoresOrdenados()
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(`Metas ${anio}`)
    const CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true }
    const HDR = ['Clave', 'Eje', 'Nivel MIR', 'Área', 'Indicador', ...MESES_NOMBRES, 'ANUAL']
    const hRow = ws.addRow(HDR)
    hRow.eachCell(c => {
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      c.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
      c.alignment = CENTER
    })
    lista.forEach(ind => {
      const row = ws.addRow([
        ind.clave || '', ind.eje_codigo || '', ind.nivel_mir || '', ind.area_nombre || '', ind.nombre,
        ...Array(12).fill(''), '',
      ])
      row.eachCell(c => { c.alignment = CENTER })
    })
    ws.getColumn(1).width = 10; ws.getColumn(2).width = 8; ws.getColumn(3).width = 14
    ws.getColumn(4).width = 22; ws.getColumn(5).width = 50
    for (let i = 6; i <= 17; i++) ws.getColumn(i).width = 9
    ws.getColumn(18).width = 10
    await descargarExcel(wb, `SIMA_Plantilla_Metas_${anio}.xlsx`)
  }

  // Formato esperado (igual al de la plantilla): Clave | Eje | Nivel MIR | Área |
  // Indicador | ENE..DIC | ANUAL. Solo se usa la columna Clave para emparejar;
  // Eje/Nivel MIR/Área/Indicador son solo de referencia.
  async function handleImportar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportStatus(null)
    try {
      const buffer = await file.arrayBuffer()
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(buffer)
      const ws = wb.getWorksheet(1)
      if (!ws) throw new Error('El archivo no tiene hojas.')

      const claves = await getClavesIndicadores()
      const claveToId = Object.fromEntries(
        Object.entries(claves).filter(([, c]) => c).map(([id, c]) => [String(c).trim(), +id])
      )

      const filas = []
      const rechazadas = []
      ws.eachRow((row, rn) => {
        if (rn === 1) return
        const claveCell = row.getCell(1).value
        if (claveCell === null || claveCell === undefined || claveCell === '') return
        const claveStr = String(claveCell).trim()
        const indicadorId = claveToId[claveStr]
        if (!indicadorId) { rechazadas.push({ fila: rn, motivo: `clave "${claveStr}" no encontrada` }); return }
        for (let m = 1; m <= 12; m++) {
          const v = row.getCell(5 + m).value
          if (v === null || v === undefined || v === '') continue
          const valor = parseFloat(v)
          if (Number.isNaN(valor)) { rechazadas.push({ fila: rn, motivo: `${MESES_NOMBRES[m - 1]} no numérico` }); continue }
          filas.push({ indicador_id: indicadorId, anio, mes: m, valor })
        }
        const anualV = row.getCell(18).value
        if (anualV !== null && anualV !== undefined && anualV !== '') {
          const valorAnual = parseFloat(anualV)
          if (!Number.isNaN(valorAnual)) filas.push({ indicador_id: indicadorId, anio, mes: 0, valor: valorAnual })
          else rechazadas.push({ fila: rn, motivo: 'ANUAL no numérico' })
        }
      })

      if (filas.length) await upsertMetasLote(filas)
      setImportStatus({ ok: true, insertadas: filas.length, rechazadas })
      await cargar()
    } catch (err) {
      setImportStatus({ ok: false, msg: err.message })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const cellBorder = key => {
    const st = cellStatus[key]
    if (st === 'saving') return C.dorado
    if (st === 'error')  return C.criticoB
    return C.border
  }

  return (
    <div style={{ marginTop: '2rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '0.3rem', letterSpacing: 1 }}>
        Metas por Año
      </div>
      <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: '1.2rem' }}>
        Edita metas mensuales por indicador para cualquier año — captura 2027 sin tocar código.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Año</label>
          <select value={anio} onChange={e => setAnio(+e.target.value)} style={inp}>
            {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Área</label>
          <select value={areaId} onChange={e => setAreaId(e.target.value)} style={inp}>
            <option value="">— Selecciona un área —</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading && <div style={{ fontSize: '0.78rem', color: C.txtMuted }}>Cargando…</div>}

      {!loading && areaId && indicadores.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: '1.2rem' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: C.doradoLight, padding: '0.4rem 0.6rem', minWidth: 220 }}>Indicador</th>
                {MESES_NOMBRES.map(m => (
                  <th key={m} style={{ color: C.doradoLight, padding: '0.4rem 0.3rem', minWidth: 62 }}>{m}</th>
                ))}
                <th style={{ color: C.doradoLight, padding: '0.4rem 0.3rem', minWidth: 70 }}>ANUAL</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map(ind => (
                <tr key={ind.id}>
                  <td style={{ color: C.txt, padding: '0.3rem 0.6rem', borderTop: `1px solid ${C.border}` }}>
                    {ind.clave ? `[${ind.clave}] ` : ''}{ind.nombre}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => {
                    const key = `${ind.id}-${mes}`
                    return (
                      <td key={mes} style={{ padding: '0.2rem', borderTop: `1px solid ${C.border}` }}>
                        <input
                          type="number"
                          defaultValue={ind.metas?.[mes] ?? ''}
                          onBlur={e => handleCambiarCelda(ind.id, mes, e.target.value)}
                          style={{ ...inp, padding: '0.3rem', textAlign: 'center', border: `1px solid ${cellBorder(key)}` }}
                        />
                      </td>
                    )
                  })}
                  <td style={{ padding: '0.2rem', borderTop: `1px solid ${C.border}` }}>
                    <input
                      type="number"
                      defaultValue={ind.metas?.[0] ?? ''}
                      onBlur={e => handleCambiarCelda(ind.id, 0, e.target.value)}
                      style={{ ...inp, padding: '0.3rem', textAlign: 'center', border: `1px solid ${cellBorder(`${ind.id}-0`)}` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && areaId && indicadores.length === 0 && (
        <div style={{ fontSize: '0.78rem', color: C.txtMuted, marginBottom: '1.2rem' }}>Esta área no tiene indicadores.</div>
      )}

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1 }}>
          Carga masiva (todos los indicadores)
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleDescargarPlantilla} style={{
            background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.txtSub,
            padding: '0.55rem 1rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}>
            ⬇ Descargar plantilla {anio}
          </button>
          <label style={{
            background: importing ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
            border: 'none', borderRadius: 8, color: C.txt,
            padding: '0.55rem 1rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit',
            cursor: importing ? 'not-allowed' : 'pointer',
          }}>
            {importing ? '⏳ Importando…' : '⬆ Importar Excel'}
            <input type="file" accept=".xlsx" onChange={handleImportar} disabled={importing} style={{ display: 'none' }} />
          </label>
        </div>

        {importStatus && (
          <div style={{
            background: importStatus.ok ? '#04620520' : '#C0000022',
            border: `1px solid ${importStatus.ok ? C.optimoB : C.criticoB}`,
            borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.75rem',
            color: importStatus.ok ? C.optimoB : '#ff6b6b',
          }}>
            {importStatus.ok ? (
              <>
                ✅ {importStatus.insertadas} valores importados.
                {importStatus.rechazadas.length > 0 && (
                  <div style={{ marginTop: 6, color: '#ff6b6b' }}>
                    ⚠️ {importStatus.rechazadas.length} filas con problemas:
                    <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                      {importStatus.rechazadas.slice(0, 10).map((r, i) => (
                        <li key={i}>Fila {r.fila}: {r.motivo}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : `⚠️ ${importStatus.msg}`}
          </div>
        )}
      </div>
    </div>
  )
}
