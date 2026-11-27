import { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Save, RotateCcw } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { Spinner, ErrMsg, Button, Input } from '../ui.jsx'
import { getEjesInforme, getBloquesInforme, getTextosEjeInforme, guardarHilacionEje, mensajeErrorHilacion } from '../../lib/informe.js'

// Editor de la hilación del Informe (admin/planeación). Por eje: entradilla,
// cierre y sus bloques narrativos en orden; dentro de cada bloque, las áreas
// en un solo tramo y sus logros en orden. Nada se guarda hasta «Guardar».
// El PDF imprime exactamente este orden: bloque → área → logro.

const MAX_TITULO = 60
const porFecha = (x, y) => (x.fecha || '').localeCompare(y.fecha || '') || x.id - y.id

// Mismo orden que el generador (bloquesDe): las áreas por su primer logro
// según el orden manual; dentro del área, orden manual y fecha.
function areasDe(logros) {
  const man = a => a.orden_en_bloque ?? 9999
  const m = new Map()
  logros.forEach(a => { if (!m.has(a.area_id)) m.set(a.area_id, []); m.get(a.area_id).push(a) })
  return [...m.values()]
    .map(l => l.sort((x, y) => man(x) - man(y) || porFecha(x, y)))
    .sort((x, y) => man(x[0]) - man(y[0]) || porFecha(x[0], y[0]))
    .map(l => ({ area_id: l[0].area_id, area: l[0].area, logros: l }))
}

function modeloEje(eje, bloquesBD, textosBD, acciones) {
  const delEje = acciones.filter(a => a.eje_codigo === eje.codigo && a.incluir_en_informe)
  const bloques = bloquesBD.filter(b => b.eje_id === eje.id && b.activo !== false).sort((x, y) => x.orden - y.orden || x.id - y.id)
  const ids = new Set(bloques.map(b => b.id))
  return {
    entradilla: textosBD[eje.codigo]?.entradilla || '', cierre: textosBD[eje.codigo]?.cierre || '',
    bloques: bloques.map(b => ({
      clave: `b${b.id}`, id: b.id, titulo: b.titulo, texto_puente: b.texto_puente || '',
      areas: areasDe(delEje.filter(a => a.bloque_id === b.id)),
    })),
    sin: delEje.filter(a => !ids.has(a.bloque_id)).sort(porFecha),
    borrados: [],
  }
}

const mover = (lista, i, d) => { const r = [...lista], j = i + d; if (j < 0 || j >= r.length) return lista; [r[i], r[j]] = [r[j], r[i]]; return r }
const errorTitulo = (t, otros) => {
  const s = t.trim()
  if (s.length < 3) return 'Escribe el título'
  if (s.length > MAX_TITULO) return `Máximo ${MAX_TITULO} caracteres`
  if (/\.$/.test(s)) return 'Sin punto final'
  if (otros.filter(o => o.trim().toLowerCase() === s.toLowerCase()).length > 1) return 'Título repetido en el eje'
  return null
}

function Flecha({ icon: Icon, title, onClick, disabled }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} disabled={disabled}
      style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 4px', lineHeight: 0,
        cursor: disabled ? 'default' : 'pointer', color: disabled ? C.border : C.txtSub }}>
      <Icon size={13} />
    </button>
  )
}

export default function EditorHilacion({ informe, acciones, onCerrar, onCambio }) {
  const [ejes, setEjes] = useState([])
  const [bloquesBD, setBloquesBD] = useState([])
  const [textosBD, setTextosBD] = useState({})
  const [ejeSel, setEjeSel] = useState(null)
  const [m, setM] = useState(null)                 // modelo editable del eje elegido
  const [sucio, setSucio] = useState(false)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [serie, setSerie] = useState(1)            // claves de bloques nuevos

  const cargar = useCallback(async () => {
    setError(null)
    try {
      const [ej, bl, tx] = await Promise.all([getEjesInforme(), getBloquesInforme(informe.id), getTextosEjeInforme(informe.id)])
      setEjes(ej); setBloquesBD(bl); setTextosBD(tx)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [informe.id])
  useEffect(() => { cargar() }, [cargar])

  // Solo los ejes que tienen logros incluidos llevan capítulo.
  const ejesConLogros = useMemo(() => {
    const n = {}
    acciones.forEach(a => { if (a.incluir_en_informe) n[a.eje_codigo] = (n[a.eje_codigo] || 0) + 1 })
    return ejes.filter(e => n[e.codigo]).map(e => ({ ...e, logros: n[e.codigo] }))
  }, [ejes, acciones])

  const eje = ejesConLogros.find(e => e.codigo === ejeSel) || ejesConLogros[0] || null
  // El modelo se rearma al cambiar de eje o al recargar los datos guardados.
  useEffect(() => {
    if (!eje) { setM(null); return }
    setM(modeloEje(eje, bloquesBD, textosBD, acciones)); setSucio(false)
  }, [eje?.id, bloquesBD, textosBD, acciones]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = fn => { setM(prev => fn(prev)); setSucio(true); setAviso(null) }
  const enBloque = (bi, fn) => cambiar(p => ({ ...p, bloques: p.bloques.map((b, i) => i === bi ? fn(b) : b) }))

  // Continuidad: áreas en más de un tramo y bloques con un solo logro.
  const avisos = useMemo(() => {
    if (!m) return []
    const out = []
    const sec = m.bloques.flatMap(b => b.areas.map(a => a.area))
    const tramos = {}
    sec.forEach((a, i) => { if (i === 0 || sec[i - 1] !== a) tramos[a] = (tramos[a] || 0) + 1 })
    Object.entries(tramos).filter(([, n]) => n > 1).forEach(([a, n]) => out.push(`${a} aparece en ${n} tramos separados del eje.`))
    m.bloques.forEach(b => {
      const n = b.areas.reduce((t, a) => t + a.logros.length, 0)
      if (n === 1) out.push(`«${b.titulo}» tiene un solo logro: conviene unirlo a un bloque afín.`)
      if (n === 0) out.push(`«${b.titulo}» no tiene logros: no se imprime.`)
    })
    if (m.sin.length) out.push(`${m.sin.length} logro(s) sin bloque: la versión final del Informe no se genera mientras existan.`)
    return out
  }, [m])

  if (error) return <ErrMsg msg={error} onRetry={() => { setLoading(true); cargar() }} />
  if (loading || (eje && !m)) return <Spinner />
  if (!eje) return <ErrMsg msg="Todavía no hay logros incluidos en el Informe." />

  const titulos = m.bloques.map(b => b.titulo)
  const hayError = m.bloques.some(b => errorTitulo(b.titulo, titulos))

  function moverLogro(a, destino) {
    cambiar(p => {
      const quitar = b => ({ ...b, areas: b.areas.map(g => ({ ...g, logros: g.logros.filter(l => l.id !== a.id) })).filter(g => g.logros.length) })
      const bloques = p.bloques.map(quitar).map(b => {
        if (b.clave !== destino) return b
        const g = b.areas.find(x => x.area_id === a.area_id)
        return g
          ? { ...b, areas: b.areas.map(x => x === g ? { ...x, logros: [...x.logros, a] } : x) }
          : { ...b, areas: [...b.areas, { area_id: a.area_id, area: a.area, logros: [a] }] }
      })
      const sin = p.sin.filter(l => l.id !== a.id)
      return { ...p, bloques, sin: destino ? sin : [...sin, a].sort(porFecha) }
    })
  }

  function agregarBloque() {
    cambiar(p => ({ ...p, bloques: [...p.bloques, { clave: `n${serie}`, id: null, titulo: '', texto_puente: '', areas: [] }] }))
    setSerie(s => s + 1)
  }
  function quitarBloque(bi) {
    cambiar(p => ({ ...p, bloques: p.bloques.filter((_, i) => i !== bi), borrados: p.bloques[bi].id ? [...p.borrados, p.bloques[bi].id] : p.borrados }))
  }

  async function guardar() {
    setGuardando(true); setAviso(null)
    try {
      const original = Object.fromEntries(bloquesBD.map(b => [b.id, b]))
      const bloques = m.bloques.map((b, i) => {
        const o = b.id ? original[b.id] : null
        return {
          id: b.id, clave: b.clave, orden: i + 1, titulo: b.titulo, texto_puente: b.texto_puente,
          cambio: !o || o.orden !== i + 1 || o.titulo !== b.titulo.trim() || (o.texto_puente || '') !== b.texto_puente.trim(),
        }
      })
      const logros = []
      m.bloques.forEach(b => b.areas.flatMap(g => g.logros).forEach((a, k) => {
        if (a.bloque_id !== b.id || a.orden_en_bloque !== k + 1) logros.push({ id: a.id, clave: b.clave, orden: k + 1 })
      }))
      m.sin.forEach(a => { if (a.bloque_id != null) logros.push({ id: a.id, clave: null, orden: null }) })
      const t0 = textosBD[eje.codigo] || { entradilla: '', cierre: '' }
      const textos = (t0.entradilla || '') !== m.entradilla.trim() || (t0.cierre || '') !== m.cierre.trim() ? { entradilla: m.entradilla, cierre: m.cierre } : null
      await guardarHilacionEje(informe.id, eje.id, { bloques, borrados: m.borrados, logros, textos })
      await Promise.all([cargar(), onCambio?.()])
      setAviso('Cambios guardados.')
    } catch (e) {
      setAviso(mensajeErrorHilacion(e)); await cargar().catch(() => {}); await onCambio?.()
    } finally { setGuardando(false) }
  }

  const caja = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '0.9rem', marginBottom: '0.8rem' }
  const sel = { background: C.bgPanel, color: C.txt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 6px', fontSize: FS.xs, fontFamily: 'inherit', maxWidth: 210 }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '0.8rem' }}>
        <Button variant="azul" size="sm" icon={ArrowLeft} disabled={guardando} onClick={onCerrar}>Áreas</Button>
        <div>
          <div style={{ fontSize: FS.xxs, letterSpacing: 2, color: C.dorado, textTransform: 'uppercase' }}>{informe.numero}º Informe de Gobierno</div>
          <div style={{ fontSize: FS.xl, fontWeight: 800, color: C.txt }}>Hilación del Informe</div>
        </div>
      </div>
      <div style={{ fontSize: FS.sm, color: C.txtSub, marginBottom: '0.8rem' }}>
        Cada eje se cuenta en bloques con orden fijo. El PDF imprime este orden: bloque → área → logro.
        Aquí no se cambian los textos, cifras ni fechas de los logros.
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.8rem' }}>
        {ejesConLogros.map(e => (
          <button key={e.id} disabled={sucio && e.id !== eje.id} onClick={() => setEjeSel(e.codigo)}
            title={sucio && e.id !== eje.id ? 'Guarda o descarta los cambios antes de cambiar de eje' : e.nombre}
            style={{ background: e.id === eje.id ? C.guinda : C.bgPanel, color: e.id === eje.id ? C.txt : C.txtSub, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '6px 10px', fontSize: FS.sm, fontWeight: 700, fontFamily: 'inherit',
              cursor: sucio && e.id !== eje.id ? 'not-allowed' : 'pointer', opacity: sucio && e.id !== eje.id ? 0.45 : 1 }}>
            {e.codigo} <span style={{ fontWeight: 400, color: e.id === eje.id ? C.doradoLight : C.txtMuted }}>· {e.logros}</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: FS.lg, fontWeight: 700, color: C.txt, marginBottom: '0.6rem' }}>{eje.nombre}</div>

      <div style={caja}>
        <Input textarea rows={3} label="Entradilla (párrafo que abre el eje y anuncia el recorrido)"
          value={m.entradilla} onChange={e => cambiar(p => ({ ...p, entradilla: e.target.value }))} />
        <div style={{ height: 10 }} />
        <Input textarea rows={2} label="Cierre (frase que enlaza con el compromiso del año siguiente; opcional)"
          value={m.cierre} onChange={e => cambiar(p => ({ ...p, cierre: e.target.value }))} />
      </div>

      {avisos.length > 0 && (
        <div style={{ ...caja, borderColor: C.riesgoB }}>
          <div style={{ fontSize: FS.xxs, letterSpacing: 1, textTransform: 'uppercase', color: C.riesgoB, fontWeight: 700, marginBottom: 4 }}>Continuidad</div>
          {avisos.map(t => <div key={t} style={{ fontSize: FS.sm, color: C.txtSub }}>· {t}</div>)}
        </div>
      )}

      {m.bloques.map((b, bi) => {
        const err = errorTitulo(b.titulo, titulos)
        const n = b.areas.reduce((t, a) => t + a.logros.length, 0)
        return (
          <div key={b.clave} style={caja}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ fontSize: FS.xl, fontWeight: 800, color: C.dorado, minWidth: 22, paddingTop: 16 }}>{bi + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input label={`Título del bloque · ${b.titulo.trim().length}/${MAX_TITULO}${err ? ` · ${err}` : ''}`} labelColor={err ? C.criticoB : undefined}
                  value={b.titulo} maxLength={80} onChange={e => enBloque(bi, x => ({ ...x, titulo: e.target.value }))} />
                <div style={{ height: 8 }} />
                <Input textarea rows={2} label="Frase puente (una o dos frases que enlazan con el bloque anterior; opcional)"
                  value={b.texto_puente} onChange={e => enBloque(bi, x => ({ ...x, texto_puente: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 16 }}>
                <Flecha icon={ArrowUp} title="Subir bloque" disabled={bi === 0} onClick={() => cambiar(p => ({ ...p, bloques: mover(p.bloques, bi, -1) }))} />
                <Flecha icon={ArrowDown} title="Bajar bloque" disabled={bi === m.bloques.length - 1} onClick={() => cambiar(p => ({ ...p, bloques: mover(p.bloques, bi, 1) }))} />
                <Flecha icon={Trash2} title={n ? 'Para borrar el bloque, primero mueve sus logros' : 'Borrar bloque'} disabled={n > 0} onClick={() => quitarBloque(bi)} />
              </div>
            </div>

            <div style={{ marginTop: 10, marginLeft: 30 }}>
              {n === 0 && <div style={{ fontSize: FS.sm, color: C.txtMuted }}>Sin logros.</div>}
              {b.areas.map((g, ai) => (
                <div key={g.area_id} style={{ borderTop: `1px solid ${C.border}`, padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Flecha icon={ArrowUp} title="Subir área" disabled={ai === 0} onClick={() => enBloque(bi, x => ({ ...x, areas: mover(x.areas, ai, -1) }))} />
                    <Flecha icon={ArrowDown} title="Bajar área" disabled={ai === b.areas.length - 1} onClick={() => enBloque(bi, x => ({ ...x, areas: mover(x.areas, ai, 1) }))} />
                    <span style={{ fontSize: FS.xxs, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, color: C.doradoLight }}>{g.area}</span>
                  </div>
                  {g.logros.map((a, li) => (
                    <FilaLogro key={a.id} a={a} sel={sel} bloques={m.bloques} actual={b.clave} onMover={moverLogro}
                      subir={li > 0 ? () => enBloque(bi, x => ({ ...x, areas: x.areas.map((y, k) => k === ai ? { ...y, logros: mover(y.logros, li, -1) } : y) })) : null}
                      bajar={li < g.logros.length - 1 ? () => enBloque(bi, x => ({ ...x, areas: x.areas.map((y, k) => k === ai ? { ...y, logros: mover(y.logros, li, 1) } : y) })) : null} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {m.sin.length > 0 && (
        <div style={{ ...caja, borderColor: C.criticoB }}>
          <div style={{ fontSize: FS.md, fontWeight: 700, color: C.txt, marginBottom: 4 }}>Sin clasificar · {m.sin.length}</div>
          <div style={{ fontSize: FS.sm, color: C.txtSub, marginBottom: 6 }}>Elige el bloque de cada logro. En el borrador salen al final del eje.</div>
          {m.sin.map(a => <FilaLogro key={a.id} a={a} sel={sel} bloques={m.bloques} actual="" onMover={moverLogro} conArea />)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', position: 'sticky', bottom: 0, background: C.bg, padding: '0.6rem 0', borderTop: `1px solid ${C.border}` }}>
        <Button variant="ghost" size="sm" icon={Plus} disabled={guardando} onClick={agregarBloque}>Agregar bloque</Button>
        <Button variant="verde" size="sm" icon={Save} loading={guardando} loadingLabel="Guardando…" disabled={!sucio || hayError} onClick={guardar}>Guardar cambios</Button>
        <Button variant="ghost" size="sm" icon={RotateCcw} disabled={!sucio || guardando}
          onClick={() => { setM(modeloEje(eje, bloquesBD, textosBD, acciones)); setSucio(false); setAviso(null) }}>Descartar</Button>
        {sucio && !aviso && <span style={{ fontSize: FS.sm, color: C.riesgoB }}>{hayError ? 'Corrige los títulos marcados para poder guardar.' : 'Hay cambios sin guardar.'}</span>}
        {aviso && <span style={{ fontSize: FS.sm, color: aviso === 'Cambios guardados.' ? C.adecuadoB : C.criticoB }}>{aviso}</span>}
      </div>
    </div>
  )
}

function FilaLogro({ a, sel, bloques, actual, onMover, subir, bajar, conArea = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
      {!conArea && <Flecha icon={ArrowUp} title="Subir logro" disabled={!subir} onClick={subir || undefined} />}
      {!conArea && <Flecha icon={ArrowDown} title="Bajar logro" disabled={!bajar} onClick={bajar || undefined} />}
      <span style={{ fontSize: FS.xxs, color: C.txtMuted, minWidth: 30 }}>#{a.id}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: FS.sm, color: C.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.accion}>
        {conArea && <span style={{ color: C.txtSub }}>{a.area} · </span>}{a.accion}
      </span>
      <select style={sel} value={actual} aria-label="Mover a otro bloque" onChange={e => onMover(a, e.target.value || null)}>
        <option value="">— Sin bloque —</option>
        {bloques.map((b, i) => <option key={b.clave} value={b.clave}>{i + 1}. {b.titulo || '(bloque nuevo)'}</option>)}
      </select>
    </div>
  )
}
