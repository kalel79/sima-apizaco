import { useState, useEffect } from 'react'
import { XCircle, Loader2, CheckCircle2, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  getIndicadoresDePrograma, getAreasDePrograma, crearIndicador,
  actualizarNodoMIR, actualizarFichaIndicador,
  upsertVariable, eliminarVariable, upsertValorVariable,
  puedeEditarDatosIndicador,
} from '../../lib/supabase'
import {
  etiquetaNivelMIR, componerFormula,
  TIPOS_INDICADOR, DIMENSIONES_INDICADOR, SENTIDOS_INDICADOR, FRECUENCIAS_INDICADOR,
} from '../../utils/expedienteMMLContenido.js'
import { C } from '../../theme.js'

// Los catálogos viven en expedienteMMLContenido.js: son los mismos que el
// documento imprime como casillas en la ficha de indicador, así que lo que se
// puede elegir aquí y lo que se imprime allá no pueden desincronizarse.
const TIPO_INDICADOR = TIPOS_INDICADOR.map(([valor]) => valor)
const DIMENSIONES = DIMENSIONES_INDICADOR
const SENTIDOS = SENTIDOS_INDICADOR
const FRECUENCIAS = FRECUENCIAS_INDICADOR
const UNIDADES_MEDIDA = ['Porcentaje', 'Reunión', 'Documento', 'Sesión', 'Beneficiario', 'Proyecto', 'Obra', 'Curso', 'Evento']
const CREAR_NUEVO = '__crear__'

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.35rem 0.55rem', fontSize: '0.72rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }
const lbl = { fontSize: '0.6rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }
const th = { fontSize: '0.6rem', color: C.doradoLight, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'left', padding: '0.4rem 0.4rem', borderBottom: `1px solid ${C.border}` }
const td = { padding: '0.35rem 0.4rem', verticalAlign: 'top', borderBottom: `1px solid ${C.border}` }


// nivel_mir es un campo legacy (texto libre) que la tabla indicadores todavía
// exige NOT NULL — se deriva automáticamente del nivel MIR, mismo formato que
// usaban los datos originales ("Fin", "Componente 3", "Actividad 3.2").
function derivarNivelMirTexto(nivel) {
  if (nivel.tipo === 'FIN') return 'Fin'
  if (nivel.tipo === 'PROPOSITO') return 'Proposito'
  if (nivel.tipo === 'COMPONENTE') return `Componente ${nivel.numero}`
  if (nivel.tipo === 'ACTIVIDAD') return `Actividad ${nivel.componenteNumero}.${nivel.numero}`
  return nivel.tipo
}

export default function SeccionMIR({ programaId, anio, mirNiveles, rolInfo, onChange }) {
  const [expandido, setExpandido] = useState(null)
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)
  const [indicadores, setIndicadores] = useState([])
  const [areas, setAreas] = useState([])

  useEffect(() => {
    let cancel = false
    Promise.all([getIndicadoresDePrograma(programaId), getAreasDePrograma(programaId)])
      .then(([inds, ars]) => { if (!cancel) { setIndicadores(inds); setAreas(ars) } })
      .catch(() => {})
    return () => { cancel = true }
  }, [programaId])

  if (!Array.isArray(mirNiveles)) {
    return <div style={{ fontSize: '0.76rem', color: C.txtMuted }}>Sin niveles MIR cargados.</div>
  }

  async function conGuardado(key, fn) {
    setGuardando(key); setError(null)
    try {
      await fn()
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  // Tras crear un indicador nuevo, refresca también el catálogo local del
  // selector (además del refetch de datos que dispara onChange).
  async function refrescarIndicadores() {
    try { setIndicadores(await getIndicadoresDePrograma(programaId)) } catch { /* no crítico */ }
  }

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Matriz de Riesgos y MIR (PP-FM-0E / PP-FM-0F)
      </div>
      <div style={{ fontSize: '0.66rem', color: C.txtMuted, marginBottom: 8 }}>
        El resumen narrativo se edita en la pestaña "Árbol de Objetivos" — aquí solo se muestra.
      </div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {!mirNiveles.length && (
        <div style={{ fontSize: '0.76rem', color: C.txtMuted, padding: '0.75rem', textAlign: 'center' }}>
          Captura primero el Objetivo central y sus Medios/Fines en "Árbol de Objetivos" — la MIR se arma sola desde ahí.
        </div>
      )}
      {!!mirNiveles.length && (
        <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1150 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 100 }}>Nivel</th>
                <th style={{ ...th, width: 110 }}>Área</th>
                <th style={{ ...th, minWidth: 200 }}>Resumen narrativo (objetivo)</th>
                <th style={{ ...th, minWidth: 190 }}>Indicador</th>
                <th style={{ ...th, width: 100 }}>Tipo</th>
                <th style={{ ...th, width: 90 }}>Dimensión</th>
                <th style={{ ...th, width: 90 }}>Sentido</th>
                <th style={{ ...th, minWidth: 170 }}>Supuestos / Riesgo</th>
                <th style={{ ...th, minWidth: 170 }}>Medios de verificación</th>
                <th style={{ ...th, width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {mirNiveles.map(nivel => (
                <FilaMIR key={nivel.id} nivel={nivel} abierto={expandido === nivel.id}
                  onToggle={() => setExpandido(expandido === nivel.id ? null : nivel.id)}
                  indicadores={indicadores} areas={areas} programaId={programaId}
                  rolInfo={rolInfo} conGuardado={conGuardado} onChange={onChange}
                  refrescarIndicadores={refrescarIndicadores} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mirNiveles.map(nivel => {
        if (expandido !== nivel.id || !nivel.indicador) return null
        return (
          <FichaIndicador key={'ficha-' + nivel.id} nivel={nivel} ind={nivel.indicador} anio={anio}
            puedeEditar={puedeEditarDatosIndicador(nivel, rolInfo)} conGuardado={conGuardado}
            setGuardando={setGuardando} setError={setError} onChange={onChange} />
        )
      })}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function FilaMIR({ nivel, abierto, onToggle, indicadores, areas, programaId, rolInfo, conGuardado, onChange, refrescarIndicadores }) {
  const ind = nivel.indicador
  const puedeEditar = puedeEditarDatosIndicador(nivel, rolInfo)
  // Un enlace crea el indicador siempre para su propia área — no elige.
  const areaFijaEnlace = rolInfo?.isEnlace ? nivel.areaEfectivaId : null
  const [creando, setCreando] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', areaId: areaFijaEnlace || areas[0]?.id || '', unidadMedida: 'Porcentaje', frecuencia: 'Anual' })
  const [creandoGuardando, setCreandoGuardando] = useState(false)
  const [creandoError, setCreandoError] = useState(null)

  const nombreArea = areas.find(a => a.id === nivel.areaEfectivaId)?.nombre

  function handleSelect(valor) {
    if (valor === CREAR_NUEVO) {
      setNuevo(n => ({ ...n, areaId: areaFijaEnlace || n.areaId || areas[0]?.id || '' }))
      setCreando(true)
      return
    }
    conGuardado('nodo-' + nivel.id, () => actualizarNodoMIR(nivel.id, { indicadorId: valor ? +valor : null }))
  }

  async function handleCrear() {
    if (!nuevo.nombre || !nuevo.areaId) { setCreandoError('Nombre y área son obligatorios.'); return }
    setCreandoGuardando(true); setCreandoError(null)
    try {
      // crearIndicador ya vincula el nuevo indicador a este nivel en la misma
      // operación (RPC atómico, fase_mml_09) — no hace falta un segundo
      // actualizarNodoMIR aparte.
      await crearIndicador({
        nodoId: nivel.id, nombre: nuevo.nombre, areaId: +nuevo.areaId, programaId,
        unidadMedida: nuevo.unidadMedida, frecuencia: nuevo.frecuencia,
        nivelMir: derivarNivelMirTexto(nivel),
      })
      await refrescarIndicadores()
      setCreando(false)
      setNuevo({ nombre: '', areaId: areaFijaEnlace || areas[0]?.id || '', unidadMedida: 'Porcentaje', frecuencia: 'Anual' })
      onChange()
    } catch (e) {
      setCreandoError(e.message)
    } finally {
      setCreandoGuardando(false)
    }
  }

  return (
    <>
      <tr>
        <td style={td}>
          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: C.doradoLight, textTransform: 'uppercase' }}>
            {etiquetaNivelMIR(nivel)}
          </span>
        </td>
        <td style={td}>
          {nivel.mirTipo === 'PROPOSITO' || nivel.mirTipo === 'FIN' ? (
            <span style={{ fontSize: '0.64rem', color: C.txtMuted }}>compartida</span>
          ) : (
            <>
              <span style={{ fontSize: '0.68rem', color: nombreArea ? C.txt : C.criticoB }}>
                {nombreArea || 'sin asignar'}
              </span>
              {!puedeEditar && rolInfo?.isEnlace && (
                <span style={{ display: 'block', fontSize: '0.6rem', color: C.txtMuted, marginTop: 2 }}>
                  {nombreArea ? 'de otra dirección' : 'Planeación aún no la asigna'}
                </span>
              )}
            </>
          )}
        </td>
        <td style={{ ...td, fontSize: '0.72rem', color: C.txt, maxWidth: 240 }}>
          {nivel.resumen_narrativo || <span style={{ color: C.txtMuted }}>— sin redactar en el árbol —</span>}
        </td>
        <td style={td}>
          <select value={creando ? CREAR_NUEVO : (nivel.indicador_id || '')} disabled={!puedeEditar}
            onChange={e => handleSelect(e.target.value)}
            style={inp}>
            <option value="">— sin vincular —</option>
            {indicadores.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            {puedeEditar && <option value={CREAR_NUEVO}>+ Crear nuevo indicador…</option>}
          </select>
        </td>
        <td style={td}>
          <select defaultValue={ind?.tipo_indicador || ''} disabled={!puedeEditar || !ind}
            onBlur={e => { if (ind && e.target.value !== (ind.tipo_indicador || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { tipoIndicador: e.target.value })) }}
            style={inp}>
            <option value="">—</option>
            {TIPO_INDICADOR.map(t => <option key={t}>{t}</option>)}
          </select>
        </td>
        <td style={td}>
          <select defaultValue={ind?.dimension || ''} disabled={!puedeEditar || !ind}
            onBlur={e => { if (ind && e.target.value !== (ind.dimension || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { dimension: e.target.value })) }}
            style={inp}>
            <option value="">—</option>
            {DIMENSIONES.map(d => <option key={d}>{d}</option>)}
          </select>
        </td>
        <td style={td}>
          <select defaultValue={ind?.sentido || ''} disabled={!puedeEditar || !ind}
            onBlur={e => { if (ind && e.target.value !== (ind.sentido || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { sentido: e.target.value })) }}
            style={inp}>
            <option value="">—</option>
            {SENTIDOS.map(s => <option key={s}>{s}</option>)}
          </select>
        </td>
        <td style={td}>
          <textarea rows={5} defaultValue={nivel.supuestos || ''} disabled={!puedeEditar}
            onBlur={e => { if (e.target.value !== (nivel.supuestos || '')) conGuardado('nodo-' + nivel.id, () => actualizarNodoMIR(nivel.id, { supuestos: e.target.value })) }}
            style={inp} />
        </td>
        <td style={td}>
          <textarea rows={5} defaultValue={nivel.medios_verificacion || ''} disabled={!puedeEditar}
            onBlur={e => { if (e.target.value !== (nivel.medios_verificacion || '')) conGuardado('nodo-' + nivel.id, () => actualizarNodoMIR(nivel.id, { mediosVerificacion: e.target.value })) }}
            style={inp} />
        </td>
        <td style={td}>
          {ind && (
            <button onClick={onToggle}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.25rem 0.4rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex' }}>
              {abierto ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>
          )}
        </td>
      </tr>
      {creando && (
        <tr>
          <td colSpan={10} style={{ ...td, background: C.bgPanel }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px auto auto', gap: 6, alignItems: 'end' }}>
              <div>
                <label style={lbl}>Nombre del indicador nuevo</label>
                <input value={nuevo.nombre} onChange={e => setNuevo(n => ({ ...n, nombre: e.target.value }))}
                  placeholder="Ej. Porcentaje de..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Área</label>
                {areaFijaEnlace ? (
                  <div style={{ ...inp, display: 'flex', alignItems: 'center', color: C.txtMuted }}>
                    {areas.find(a => a.id === areaFijaEnlace)?.nombre || '—'}
                  </div>
                ) : (
                  <select value={nuevo.areaId} onChange={e => setNuevo(n => ({ ...n, areaId: e.target.value }))} style={inp}>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={lbl}>Unidad de medida</label>
                <select value={nuevo.unidadMedida} onChange={e => setNuevo(n => ({ ...n, unidadMedida: e.target.value }))} style={inp}>
                  {UNIDADES_MEDIDA.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Frecuencia</label>
                <select value={nuevo.frecuencia} onChange={e => setNuevo(n => ({ ...n, frecuencia: e.target.value }))} style={inp}>
                  {FRECUENCIAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <button onClick={handleCrear} disabled={creandoGuardando}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: `linear-gradient(135deg,${C.guindaDark},${C.guinda})`, border: 'none', borderRadius: 6, color: C.txt, padding: '0.4rem 0.7rem', fontSize: '0.7rem', fontWeight: 700, cursor: creandoGuardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {creandoGuardando
                  ? <Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/>
                  : <><CheckCircle2 size={13}/> Crear y vincular</>}
              </button>
              <button onClick={() => setCreando(false)} disabled={creandoGuardando}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.txtSub, padding: '0.4rem 0.7rem', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
            </div>
            {creandoError && <div style={{ fontSize: '0.68rem', color: C.criticoB, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><XCircle size={12}/> {creandoError}</div>}
            {!areas.length && <div style={{ fontSize: '0.66rem', color: C.txtMuted, marginTop: 6 }}>Este programa no tiene áreas asignadas (areas.programa_id) — pide a Planeación que las asigne antes de crear el indicador.</div>}
          </td>
        </tr>
      )}
    </>
  )
}

function FichaIndicador({ nivel, ind, anio, puedeEditar, conGuardado, setGuardando, setError, onChange }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.dorado}55`, borderRadius: 8, padding: '0.8rem', marginBottom: '0.6rem' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Ficha de indicador — {etiquetaNivelMIR(nivel)} · {ind.nombre}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 120px', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <div>
          <label style={lbl}>Definición</label>
          <textarea rows={4} defaultValue={ind.definicion || ''} disabled={!puedeEditar}
            onBlur={e => { if (e.target.value !== (ind.definicion || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { definicion: e.target.value })) }}
            style={inp} />
        </div>
        <div>
          <label style={lbl}>Año línea base</label>
          <input type="number" defaultValue={ind.linea_base_anio || ''} disabled={!puedeEditar}
            onBlur={e => { const v = e.target.value ? +e.target.value : null; if (v !== ind.linea_base_anio) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { lineaBaseAnio: v })) }}
            style={inp} />
        </div>
        <div>
          <label style={lbl}>Frecuencia</label>
          <select defaultValue={ind.frecuencia || 'Anual'} disabled={!puedeEditar}
            onBlur={e => { if (e.target.value !== (ind.frecuencia || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { frecuencia: e.target.value })) }}
            style={inp}>
            {FRECUENCIAS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Unidad de medida</label>
          <select defaultValue={ind.unidad_medida || 'Porcentaje'} disabled={!puedeEditar}
            onBlur={e => { if (e.target.value !== (ind.unidad_medida || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { unidadMedida: e.target.value })) }}
            style={inp}>
            {UNIDADES_MEDIDA.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: '0.8rem' }}>
        <label style={lbl}>Fórmula de cálculo</label>
        <textarea rows={2} defaultValue={ind.formula || ''} disabled={!puedeEditar}
          placeholder={componerFormula(nivel.variables, ind.unidad_medida) || 'Ej. (VS / VT) × 100'}
          onBlur={e => { if (e.target.value !== (ind.formula || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { formula: e.target.value })) }}
          style={inp} />
        <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 3 }}>
          Vacío = el documento arma la fórmula con los símbolos de las variables de abajo.
        </div>
      </div>
      <div style={{ marginBottom: '0.8rem' }}>
        <label style={lbl}>Interpretación</label>
        <textarea rows={4} defaultValue={ind.interpretacion || ''} disabled={!puedeEditar}
          onBlur={e => { if (e.target.value !== (ind.interpretacion || '')) conGuardado('ind-' + ind.id, () => actualizarFichaIndicador(ind.id, { interpretacion: e.target.value })) }}
          style={inp} />
      </div>

      <VariablesIndicador indicadorId={ind.id} anio={anio} variables={Array.isArray(nivel.variables) ? nivel.variables : []}
        puedeEditar={puedeEditar} onChange={onChange} setGuardando={setGuardando} setError={setError} />
    </div>
  )
}

function VariablesIndicador({ indicadorId, anio, variables, puedeEditar, onChange, setGuardando, setError }) {
  async function conGuardado(key, fn) {
    setGuardando(key); setError(null)
    try {
      await fn()
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  async function handleAgregar() {
    await conGuardado('var-nueva-' + indicadorId, () =>
      upsertVariable({ indicadorId, nombre: 'Nueva variable…', unidadMedida: 'Unidad', orden: variables.length + 1 }))
  }

  return (
    <div>
      <label style={lbl}>Variables de la fórmula</label>
      {variables.map(v => (
        <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 90px 90px 32px', gap: 5, marginBottom: 5, alignItems: 'center' }}>
          <input defaultValue={v.nombre} disabled={!puedeEditar} placeholder="Nombre"
            onBlur={e => { if (e.target.value !== v.nombre) conGuardado('var-' + v.id, () => upsertVariable({ id: v.id, indicadorId, nombre: e.target.value, simbolo: v.simbolo, unidadMedida: v.unidad_medida, fuente: v.fuente, orden: v.orden })) }}
            style={inp} />
          <input defaultValue={v.simbolo || ''} disabled={!puedeEditar} placeholder="Símbolo"
            onBlur={e => { if (e.target.value !== (v.simbolo || '')) conGuardado('var-' + v.id, () => upsertVariable({ id: v.id, indicadorId, nombre: v.nombre, simbolo: e.target.value, unidadMedida: v.unidad_medida, fuente: v.fuente, orden: v.orden })) }}
            style={inp} />
          <input defaultValue={v.unidad_medida} disabled={!puedeEditar} placeholder="Unidad real"
            onBlur={e => { if (e.target.value !== v.unidad_medida) conGuardado('var-' + v.id, () => upsertVariable({ id: v.id, indicadorId, nombre: v.nombre, simbolo: v.simbolo, unidadMedida: e.target.value, fuente: v.fuente, orden: v.orden })) }}
            style={inp} />
          <input type="number" step="0.01" defaultValue={v.valor?.valor_alcanzado ?? ''} disabled={!puedeEditar} placeholder="Alcanzada"
            onBlur={e => { const val = e.target.value; if (val !== String(v.valor?.valor_alcanzado ?? '')) conGuardado('valor-' + v.id, () => upsertValorVariable({ id: v.valor?.id, variableId: v.id, anio, valorAlcanzado: val, valorMeta: v.valor?.valor_meta })) }}
            style={inp} />
          <input type="number" step="0.01" defaultValue={v.valor?.valor_meta ?? ''} disabled={!puedeEditar} placeholder="Meta"
            onBlur={e => { const val = e.target.value; if (val !== String(v.valor?.valor_meta ?? '')) conGuardado('valor-' + v.id, () => upsertValorVariable({ id: v.valor?.id, variableId: v.id, anio, valorAlcanzado: v.valor?.valor_alcanzado, valorMeta: val })) }}
            style={inp} />
          {puedeEditar && (
            <button onClick={() => conGuardado('var-del-' + v.id, () => eliminarVariable(v.id))}
              style={{ background: 'none', border: `1px solid ${C.criticoB}55`, borderRadius: 6, color: C.criticoB, padding: '0.3rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={12}/>
            </button>
          )}
        </div>
      ))}
      {!variables.length && <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 6 }}>Sin variables capturadas.</div>}
      {puedeEditar && (
        <button onClick={handleAgregar}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, color: C.doradoLight, padding: '0.35rem 0.6rem', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={12}/> Agregar variable
        </button>
      )}
    </div>
  )
}
