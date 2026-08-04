// ── Módulo MML (Metodología de Marco Lógico) — Expediente por programa ───────
// La MIR se deriva del Árbol de Objetivos (decisión 2026-07-23, corrige el
// diseño anterior que la trataba como estructura independiente y obligaba a
// capturar la misma narrativa dos veces): el Objetivo central es el Propósito;
// el FIN de menor `orden` (el de mayor jerarquía) hijo del Objetivo es el Fin;
// cada MEDIO de primer nivel (hijo directo del Objetivo) es un Componente;
// cada nodo que cuelga de un Medio es una Actividad de ese Componente.
import { supabase } from './supabaseClient.js'

// Resuelve el área/programa propio de un enlace (mismo criterio que Captura.jsx
// usa con profile.area_id, aquí resuelto hasta el programa vía areas.programa_id).
export async function getProgramaIdDeArea(areaId) {
  if (!areaId) return null
  const { data, error } = await supabase
    .from('areas').select('programa_id').eq('id', areaId).maybeSingle()
  if (error) throw error
  return data?.programa_id ?? null
}

export async function getProgramasLista() {
  const { data, error } = await supabase
    .from('programas')
    .select('id, clave, nombre, eje_id, ejes(codigo, nombre, color_hex)')
    .order('clave')
  if (error) throw error
  return (data || []).map(p => ({
    id: p.id, clave: p.clave, nombre: p.nombre, eje_id: p.eje_id,
    eje_codigo: p.ejes?.codigo, eje_nombre: p.ejes?.nombre, eje_color: p.ejes?.color_hex,
  }))
}

// Catálogo de indicadores de un programa (año-independiente, para el selector
// "vincular indicador" de cada nivel MIR).
export async function getIndicadoresDePrograma(programaId) {
  const { data, error } = await supabase
    .from('indicadores').select('id, clave, nombre').eq('programa_id', programaId).order('nombre')
  if (error) throw error
  return data || []
}

// Áreas del programa, para el selector al crear un indicador nuevo
// (indicadores.area_id es obligatorio).
export async function getAreasDePrograma(programaId) {
  const { data, error } = await supabase
    .from('areas').select('id, nombre').eq('programa_id', programaId).order('nombre')
  if (error) throw error
  return data || []
}

// Crea un indicador nuevo para 2027 que no existía en el catálogo 2026 (ej. una
// Actividad/Componente agregado al reorganizar el Árbol de Objetivos) y lo deja
// listo para vincular al nivel MIR correspondiente.
export async function crearIndicador({ nombre, areaId, programaId, unidadMedida, frecuencia, nivelMir }) {
  const { data, error } = await supabase
    .from('indicadores')
    .insert({
      nombre, area_id: areaId, programa_id: programaId,
      unidad_medida: unidadMedida || 'Porcentaje', frecuencia: frecuencia || 'Anual',
      nivel_mir: nivelMir, activo: true,
    })
    .select().single()
  if (error) throw error
  return data
}

// El embed de PostgREST para una relación many-to-one normalmente devuelve un
// objeto, pero se maneja también el caso arreglo defensivamente (evita un
// crash de render si Supabase-js lo entrega distinto a lo esperado).
function normalizarIndicador(raw) {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] || null) : raw
}

// Deriva la lista de niveles MIR (Propósito/Fin/Componentes/Actividades) a
// partir de los nodos del Árbol de Objetivos ya cargados.
function derivarNivelesMIR(nodosObjetivos) {
  const objetivoCentral = nodosObjetivos.find(n => n.tipo === 'OBJETIVO' && !n.padre_id)
  if (!objetivoCentral) return []

  const niveles = [{ ...objetivoCentral, mirTipo: 'PROPOSITO', numero: null }]

  const finesDelObjetivo = nodosObjetivos
    .filter(n => n.tipo === 'FIN' && n.padre_id === objetivoCentral.id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  if (finesDelObjetivo.length) {
    niveles.push({ ...finesDelObjetivo[0], mirTipo: 'FIN', numero: null })
  }

  const componentes = nodosObjetivos
    .filter(n => n.tipo === 'MEDIO' && n.padre_id === objetivoCentral.id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  componentes.forEach((comp, ci) => {
    niveles.push({ ...comp, mirTipo: 'COMPONENTE', numero: ci + 1 })
    const actividades = nodosObjetivos
      .filter(n => n.tipo === 'MEDIO' && n.padre_id === comp.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    actividades.forEach((act, ai) => {
      niveles.push({ ...act, mirTipo: 'ACTIVIDAD', numero: ai + 1, componenteNumero: ci + 1 })
    })
  })

  return niveles
}

// ── resolverDatosMML: fuente única para la pantalla de captura (y, después,
// para el generador de documento) — mismo patrón que resolverDatosReporte(). ──
export async function resolverDatosMML(programaId, anio) {
  const [
    { data: programa, error: eProg },
    { data: firmasGlobal, error: eFG },
    { data: firmasPrograma, error: eFP },
    { data: presupuesto, error: ePres },
    { data: diagnostico, error: eDiag },
    { data: nodosProblema, error: eNP },
    { data: nodosObjetivosRaw, error: eNO },
    { data: involucrados, error: eInv },
    { data: acciones, error: eAcc },
  ] = await Promise.all([
    supabase.from('programas').select('*').eq('id', programaId).maybeSingle(),
    supabase.from('firmas_programa').select('*').is('programa_id', null),
    supabase.from('firmas_programa').select('*').eq('programa_id', programaId),
    supabase.from('presupuesto_programa').select('*').eq('programa_id', programaId).eq('anio', anio),
    supabase.from('diagnostico_programa').select('*').eq('programa_id', programaId).eq('anio', anio).order('orden'),
    supabase.from('arbol_nodos').select('*').eq('programa_id', programaId).eq('anio', anio).eq('arbol', 'PROBLEMA').order('tipo').order('orden'),
    supabase.from('arbol_nodos')
      .select('*, indicadores(id, clave, nombre, definicion, tipo_indicador, dimension, sentido, linea_base_anio, interpretacion, unidad_medida, area_id, areas!fk_indicadores_area(nombre))')
      .eq('programa_id', programaId).eq('anio', anio).eq('arbol', 'OBJETIVOS').order('tipo').order('orden'),
    supabase.from('involucrados_programa').select('*').eq('programa_id', programaId).eq('anio', anio).order('categoria').order('orden'),
    supabase.from('acciones_alternativas').select('*').eq('programa_id', programaId).eq('anio', anio).order('orden'),
  ])
  for (const e of [eProg, eFG, eFP, ePres, eDiag, eNP, eNO, eInv, eAcc]) if (e) throw e

  const nodosObjetivos = (nodosObjetivosRaw || []).map(n => ({ ...n, indicador: normalizarIndicador(n.indicadores) }))

  // Firmas resueltas: override por programa si existe, si no el default global.
  const firmasPorRol = {}
  ;(firmasGlobal || []).forEach(f => { firmasPorRol[f.rol_firma] = f })
  ;(firmasPrograma || []).forEach(f => { firmasPorRol[f.rol_firma] = f })

  const nivelesMIRBase = derivarNivelesMIR(nodosObjetivos)

  // Variables de fórmula y metas calendarizadas de los indicadores ya
  // vinculados a algún nivel MIR, en sendos viajes únicos (no uno por indicador).
  const indicadorIds = nivelesMIRBase.map(n => n.indicador_id).filter(Boolean)
  let variablesPorIndicador = {}
  let metasPorIndicador = {}
  if (indicadorIds.length) {
    const [{ data: variables, error: eVar }, { data: metasRows, error: eMetas }] = await Promise.all([
      supabase.from('indicador_variables').select('*').in('indicador_id', indicadorIds).order('orden'),
      supabase.from('metas').select('indicador_id, mes, valor').in('indicador_id', indicadorIds).eq('anio', anio),
    ])
    if (eVar) throw eVar
    if (eMetas) throw eMetas
    metasPorIndicador = (metasRows || []).reduce((acc, m) => {
      ;(acc[m.indicador_id] ||= {})[m.mes] = m.valor
      return acc
    }, {})
    const variableIds = (variables || []).map(v => v.id)
    let valoresPorVariable = {}
    if (variableIds.length) {
      const { data: valores, error: eVal } = await supabase
        .from('indicador_variables_valores').select('*').in('variable_id', variableIds).eq('anio', anio)
      if (eVal) throw eVal
      valoresPorVariable = Object.fromEntries((valores || []).map(v => [v.variable_id, v]))
    }
    variablesPorIndicador = (variables || []).reduce((acc, v) => {
      const item = { ...v, valor: valoresPorVariable[v.id] || null }
      ;(acc[v.indicador_id] ||= []).push(item)
      return acc
    }, {})
  }

  const nivelesMIR = nivelesMIRBase.map(n => ({
    ...n,
    tipo: n.mirTipo, // FIN/PROPOSITO/COMPONENTE/ACTIVIDAD, no OBJETIVO/MEDIO del árbol
    resumen_narrativo: n.texto, // una sola redacción: se edita en Árbol de Objetivos
    variables: n.indicador_id ? (variablesPorIndicador[n.indicador_id] || []) : [],
    metas: n.indicador_id ? (metasPorIndicador[n.indicador_id] || {}) : {},
  }))

  // Medios de primer nivel (candidatos a Componente) para Acciones/Alternativas.
  const medios = nodosObjetivos
    .filter(n => n.tipo === 'MEDIO' && n.padre_id === nodosObjetivos.find(o => o.tipo === 'OBJETIVO' && !o.padre_id)?.id)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  return {
    programa,
    firmas: firmasPorRol,
    presupuesto: presupuesto || [],
    diagnostico: diagnostico || [],
    arbolProblema: nodosProblema || [],
    arbolObjetivos: nodosObjetivos,
    medios,
    involucrados: involucrados || [],
    acciones: acciones || [],
    mirNiveles: nivelesMIR,
  }
}

// ── CRUD por sección ──────────────────────────────────────────────────────────

export async function upsertDiagnostico({ id, programaId, anio, orden, situacionActual, transformacionDeseada }) {
  const payload = {
    programa_id: programaId, anio, orden,
    situacion_actual: situacionActual, transformacion_deseada: transformacionDeseada || null,
  }
  const query = id
    ? supabase.from('diagnostico_programa').update(payload).eq('id', id)
    : supabase.from('diagnostico_programa').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function eliminarDiagnostico(id) {
  const { error } = await supabase.from('diagnostico_programa').delete().eq('id', id)
  if (error) throw error
}

export async function upsertArbolNodo({ id, programaId, anio, arbol, tipo, padreId, orden, texto }) {
  const payload = {
    programa_id: programaId, anio, arbol, tipo,
    padre_id: padreId || null, orden: orden ?? 0, texto,
  }
  const query = id
    ? supabase.from('arbol_nodos').update(payload).eq('id', id)
    : supabase.from('arbol_nodos').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function eliminarArbolNodo(id) {
  const { error } = await supabase.from('arbol_nodos').delete().eq('id', id)
  if (error) throw error
}

export async function upsertInvolucrado({ id, programaId, anio, categoria, actor, orden }) {
  const payload = { programa_id: programaId, anio, categoria, actor, orden: orden ?? 0 }
  const query = id
    ? supabase.from('involucrados_programa').update(payload).eq('id', id)
    : supabase.from('involucrados_programa').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function eliminarInvolucrado(id) {
  const { error } = await supabase.from('involucrados_programa').delete().eq('id', id)
  if (error) throw error
}

export async function upsertAccionAlternativa({ id, programaId, anio, medioId, texto, seleccionada, justificacion, orden }) {
  const payload = {
    programa_id: programaId, anio, medio_id: medioId || null, texto,
    seleccionada: !!seleccionada, justificacion: justificacion || null, orden: orden ?? 0,
  }
  const query = id
    ? supabase.from('acciones_alternativas').update(payload).eq('id', id)
    : supabase.from('acciones_alternativas').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function eliminarAccionAlternativa(id) {
  const { error } = await supabase.from('acciones_alternativas').delete().eq('id', id)
  if (error) throw error
}

// Genera (si no existe ya) una acción/alternativa candidata por cada Medio de
// primer nivel del árbol de objetivos que todavía no tenga una asociada —
// decisión 2026-07-23: Acciones/Alternativas se deriva de los Medios, no se
// captura suelta.
export async function generarAccionesDesdeMedios({ programaId, anio, medios, accionesExistentes }) {
  const medioIdsConAccion = new Set((accionesExistentes || []).map(a => a.medio_id).filter(Boolean))
  const faltantes = (medios || []).filter(m => !medioIdsConAccion.has(m.id))
  if (!faltantes.length) return []

  const payload = faltantes.map((m, i) => ({
    programa_id: programaId, anio, medio_id: m.id,
    texto: m.texto, seleccionada: false,
    orden: (accionesExistentes?.length || 0) + i + 1,
  }))
  const { data, error } = await supabase.from('acciones_alternativas').insert(payload).select()
  if (error) throw error
  return data || []
}

// Nivel MIR = nodo del Árbol de Objetivos. Solo se actualizan aquí los campos
// propios de la MIR (supuestos/riesgo, medios de verificación, indicador
// vinculado) — el texto/jerarquía se edita en la pestaña Árbol de Objetivos
// (una sola redacción, sin capturarla dos veces).
export async function actualizarNodoMIR(nodoId, { supuestos, mediosVerificacion, indicadorId }) {
  const payload = {}
  if (supuestos !== undefined) payload.supuestos = supuestos || null
  if (mediosVerificacion !== undefined) payload.medios_verificacion = mediosVerificacion || null
  if (indicadorId !== undefined) payload.indicador_id = indicadorId || null

  const { data, error } = await supabase
    .from('arbol_nodos').update(payload).eq('id', nodoId).select().single()
  if (error) throw error
  return data
}

export async function actualizarFichaIndicador(indicadorId, campos) {
  const payload = {}
  if ('definicion' in campos) payload.definicion = campos.definicion || null
  if ('tipoIndicador' in campos) payload.tipo_indicador = campos.tipoIndicador || null
  if ('dimension' in campos) payload.dimension = campos.dimension || null
  if ('sentido' in campos) payload.sentido = campos.sentido || null
  if ('lineaBaseAnio' in campos) payload.linea_base_anio = campos.lineaBaseAnio || null
  if ('interpretacion' in campos) payload.interpretacion = campos.interpretacion || null

  const { data, error } = await supabase
    .from('indicadores').update(payload).eq('id', indicadorId).select().single()
  if (error) throw error
  return data
}

export async function upsertVariable({ id, indicadorId, nombre, simbolo, unidadMedida, fuente, orden }) {
  const payload = {
    indicador_id: indicadorId, nombre, simbolo: simbolo || null,
    unidad_medida: unidadMedida, fuente: fuente || null, orden: orden ?? 0,
  }
  const query = id
    ? supabase.from('indicador_variables').update(payload).eq('id', id)
    : supabase.from('indicador_variables').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function eliminarVariable(id) {
  const { error } = await supabase.from('indicador_variables').delete().eq('id', id)
  if (error) throw error
}

export async function upsertValorVariable({ id, variableId, anio, valorAlcanzado, valorMeta }) {
  const payload = {
    variable_id: variableId, anio,
    valor_alcanzado: valorAlcanzado === '' || valorAlcanzado == null ? null : valorAlcanzado,
    valor_meta: valorMeta === '' || valorMeta == null ? null : valorMeta,
  }
  const query = id
    ? supabase.from('indicador_variables_valores').update(payload).eq('id', id)
    : supabase.from('indicador_variables_valores').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function actualizarPresupuesto({ id, programaId, anio, capitulo, importe }) {
  const payload = { programa_id: programaId, anio, capitulo, importe: importe || 0 }
  const query = id
    ? supabase.from('presupuesto_programa').update(payload).eq('id', id)
    : supabase.from('presupuesto_programa').insert(payload)
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function actualizarEncabezadoPrograma(programaId, campos) {
  const payload = {}
  if ('claveProgramatica' in campos) payload.clave_programatica = campos.claveProgramatica || null
  if ('finalidad' in campos) payload.finalidad = campos.finalidad || null
  if ('funcion' in campos) payload.funcion = campos.funcion || null
  if ('subfuncion' in campos) payload.subfuncion = campos.subfuncion || null
  if ('tipoProyecto' in campos) payload.tipo_proyecto = campos.tipoProyecto || null
  if ('fuentesFinanciamiento' in campos) payload.fuentes_financiamiento = campos.fuentesFinanciamiento || null

  const { data, error } = await supabase
    .from('programas').update(payload).eq('id', programaId).select().single()
  if (error) throw error
  return data
}
