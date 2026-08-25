// ── Catálogos fijos del Expediente MML (folios oficiales, capítulos, índice) ──

export const INDICE_FORMATOS = [
  { no: 1, formato: 'Transformación Deseada', folio: 'PP-FM-03-00' },
  { no: 2, formato: 'Árbol del Problema',      folio: 'PP-FM-04-00' },
  { no: 3, formato: 'Mapa de Relaciones',      folio: 'PP-FM-05-00' },
  // El PDF oficial de referencia imprime PP-FM-04 también aquí (bug detectado
  // en el documento fuente) — aquí se corrige a PP-FM-07, el folio correcto.
  { no: 4, formato: 'Árbol de Objetivos',       folio: 'PP-FM-07-00' },
  { no: 5, formato: 'Acciones',                 folio: 'PP-FM-08-00' },
  { no: 6, formato: 'Alternativas',             folio: 'PP-FM-09-00' },
  { no: 7, formato: 'Riesgos y MIR',            folio: 'PP-FM-0E-01' },
  { no: 8, formato: 'Metas (POA)',              folio: 'PP-FM-0F-01' },
]

export const CAPITULOS_LABEL = {
  1000: 'Servicios personales',
  2000: 'Materiales y suministros',
  3000: 'Servicios generales',
  4000: 'Transferencias, asignaciones, subsidios y otras ayudas',
  5000: 'Bienes muebles, inmuebles e intangibles',
  6000: 'Inversión pública',
  7000: 'Inversiones financieras y otras provisiones',
  8000: 'Participaciones y aportaciones',
  9000: 'Deuda pública',
}

// ── Ficha de Proyecto (fase_mml_14) ─────────────────────────────────────────
// El Municipio nunca cambia en este sistema: es el formato oficial de Apizaco.
export const FICHA_MUNICIPIO = '05 Apizaco, Tlaxcala'
// Teléfono institucional que el formato imprime fijo en "Datos del líder".
export const FICHA_TEL_DEFAULT = '2414180845'

// 2. Tipo de proyecto — varias marcables.
export const TIPOS_PROYECTO = [
  ['INVERSION', 'Inversión'],
  ['OPERACION', 'Operación'],
  ['OBRA_PUBLICA', 'Obra Pública'],
  ['INNOVACION', 'Innovación'],
  ['INVERSION_PRODUCTIVA', 'Inversión Productiva'],
]

// 4. Clasificación económica — varias marcables, agrupadas en programable /
// no programable tal como las imprime el formato.
export const CLASIF_ECONOMICA = [
  { grupo: 'Gasto Programable', opciones: [
    ['GASTO_OPERACION', 'Gastos de Operación'],
    ['GASTO_INVERSION', 'Gastos de Inversión'],
  ] },
  { grupo: 'Gasto No Programable', opciones: [
    ['ORG_AUTONOMOS', 'Recurso etiquetado para Organismos Autónomos'],
    ['GASTO_REASIGNADO', 'Gasto Reasignado'],
    ['DEUDA_PUBLICA', 'Deuda Pública'],
    ['ADEFAS', 'ADEFAS'],
  ] },
]

// 5. Clasificación funcional-programática — cada renglón lleva número + texto.
// La `key` es el prefijo de las columnas `<key>_num` / `<key>_texto` de
// ficha_proyecto.
export const CLASIF_FUNCIONAL = [
  ['finalidad', 'Finalidad'],
  ['funcion', 'Función'],
  ['subfuncion', 'Subfunción'],
  ['programa', 'Programa'],
  ['proyecto', 'Proyecto'],
  ['clasif_prog', 'Clasificación Programática'],
]

// 6. Clasificación regional — cada renglón es la columna `region_<key>`.
export const CLASIF_REGIONAL = [
  ['estatal', 'Estatal'],
  ['regional', 'Regional'],
  ['municipal', 'Municipal'],
  ['localidad', 'Localidad'],
]

// 7. Capítulos que imprime la Ficha (7 renglones + Total = las 9 filas del
// formato contando el encabezado). No son los 9 capítulos del catálogo
// completo: la Ficha omite 7000 y 8000.
export const FICHA_CAPITULOS = [1000, 2000, 3000, 4000, 5000, 6000, 9000]

// 7. "Especificar fuente de financiamiento" — los 7 renglones fijos del
// formato, cada uno marcable y con importe (tabla ficha_fuente_financiamiento).
export const FUENTES_FINANCIAMIENTO = [
  ['LOCALES', 'Ingresos derivados de fuentes locales'],
  ['PARTICIPACIONES', 'Participaciones e incentivos económicos'],
  ['APORTACIONES_FEDERALES', 'Aportaciones federales'],
  ['FEDERAL_REASIGNADO', 'Gasto federal reasignado'],
  ['ESTATAL_REASIGNADO', 'Gasto Estatal reasignado'],
  ['BENEFICIARIOS', 'Aportación de beneficiarios'],
  ['OTRAS', 'Otras'],
]

export const CATEGORIA_INVOLUCRADOS_LABEL = {
  BENEFICIARIO: 'Beneficiarios',
  EJECUTOR: 'Ejecutores',
  OPOSITOR: 'Opositores',
  INDIFERENTE: 'Indiferentes',
}

export const NIVEL_MIR_LABEL = { PROPOSITO: 'Propósito', FIN: 'Fin', COMPONENTE: 'Componente', ACTIVIDAD: 'Actividad' }

// Línea que las hojas de Descripción llevan en el encabezado, además del
// título — compartida por PDF y Excel para que digan exactamente lo mismo.
export function subtituloEjercicioFiscal(anio) {
  return `Presupuesto de Egresos para el Ejercicio Fiscal del Año ${anio}`
}

// Segundo renglón del encabezado institucional. Vive aquí (y no en
// expedienteMMLSecciones.js) para que el generador de Excel pueda usarlo sin
// arrastrar jsPDF como dependencia.
export function subtituloAnteproyecto(anio) {
  return anio ? `ANTEPROYECTO DE PRESUPUESTO DE EGRESOS ${anio}` : null
}

// ── Ficha de Indicador (fase_mml_16) ────────────────────────────────────────
// Catálogos compartidos entre la pantalla de captura (SeccionMIR) y los dos
// generadores del documento, para que las opciones que se ofrecen al capturar
// sean exactamente las que el formato imprime como casillas.
// La clave es el valor que va a la base; la etiqueta, lo que se imprime.
export const TIPOS_INDICADOR = [['Estratégico', 'Estratégico'], ['Gestión', 'De Gestión']]
export const SENTIDOS_INDICADOR = ['Ascendente', 'Descendente', 'Regular', 'Nominal']
export const DIMENSIONES_INDICADOR = ['Eficacia', 'Calidad', 'Eficiencia', 'Economía']
export const FRECUENCIAS_INDICADOR = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Otro']
export const NIVELES_MIR_OPCIONES = [
  ['FIN', 'Fin'], ['PROPOSITO', 'Propósito'], ['COMPONENTE', 'Componente'], ['ACTIVIDAD', 'Actividad'],
]

// Las dos hojas de Descripción son el mismo formato con distinto título.
export const DESCRIPCION_HOJAS = [
  { titulo: 'DESCRIPCIÓN DE PROGRAMA', hoja: 'Descripción de Programa' },
  { titulo: 'DESCRIPCIÓN DE PROYECTOS', hoja: 'Descripción de Proyectos' },
]

// ── resolverFicha: fuente ÚNICA de la Ficha de Proyecto para PDF y Excel ────
// Mismo criterio que resolverDatosReporte()/resolverDatosMML(): los dos
// generadores consumen exactamente esta estructura, así que un cambio de
// formato o de respaldo se hace en un solo lugar y sale idéntico en ambos.
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// `iso` viene de una columna `date` de Postgres ("2026-01-01"): se parte a
// mano en vez de usar new Date(iso), que la interpretaría como UTC y en
// zona -06 mostraría el día anterior.
export function fechaLarga(iso) {
  if (!iso) return null
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  if (!a || !m || !d) return null
  return `${String(d).padStart(2, '0')} de ${MESES_LARGO[m - 1]} de ${a}`
}

// Encadena narrativas capturadas por separado en un solo párrafo, sin
// duplicar el punto final de las que ya venían terminadas en punto.
export function unirOraciones(textos) {
  const partes = (textos || [])
    .filter(t => t && String(t).trim())
    .map(t => String(t).trim().replace(/\.+$/, ''))
  return partes.length ? `${partes.join('. ')}.` : ''
}

export function pesos(n) {
  return `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// "3 Coordinación de la política de gobierno" — número y texto van en columnas
// separadas en la base, pero el formato oficial los imprime juntos.
function numTexto(num, texto) {
  return [num, texto].filter(v => v != null && String(v).trim() !== '').join(' ') || '—'
}

// "003, Sindicatura, Dirección Jurídica" — la clave del Programa Presupuestal
// seguida de las áreas que lo integran (catálogo `areas`, por programa_id).
// La usan el "Eje Rector" de la ficha de indicador y el "Programa Según
// Catálogo OFS" de las hojas de Descripción: Hugo pidió el mismo formato en
// ambos. Sin áreas en el catálogo, cae a la unidad responsable del programa.
export function programaConAreas(programa, areas) {
  const p = programa || {}
  const nombres = (areas || []).map(a => a?.nombre).filter(Boolean)
  const detalle = nombres.length ? nombres.join(', ') : (p.unidad_resp || '')
  return [p.clave, detalle].filter(Boolean).join(', ') || '—'
}

export function resolverFicha(datos, anio) {
  const p = datos.programa || {}
  const f = datos.ficha || {}
  const tipos = f.tipos_proyecto || []
  const economica = f.clasif_economica || []
  const fuentesPorKey = Object.fromEntries((datos.fichaFuentes || []).map(r => [r.fuente, r]))
  const importePorCapitulo = Object.fromEntries((datos.presupuesto || []).map(r => [r.capitulo, Number(r.importe) || 0]))

  const capitulos = FICHA_CAPITULOS.map(c => ({
    capitulo: c, label: CAPITULOS_LABEL[c], importe: importePorCapitulo[c] || 0,
  }))
  // El Presupuesto Estimado del formato es la suma de la columna Importe de la
  // tabla de capítulos — el mismo total, repetido al pie como cifra de control.
  const totalCapitulos = capitulos.reduce((a, r) => a + r.importe, 0)

  return {
    nombre: `${p.clave || ''} ${p.nombre || ''}`.trim() || '—',
    // Los 2 renglones que encabezan las hojas de Descripción. Editables en la
    // Ficha; vacíos, se derivan de lo que el sistema ya sabe del programa.
    ejePmd: f.eje_pmd || [p.eje_id, datos.ejeNombre].filter(Boolean).join('. ') || '—',
    programaOfs: f.programa_ofs || programaConAreas(p, datos.areasPrograma),
    tiposProyecto: TIPOS_PROYECTO.map(([key, label]) => ({ key, label, marcado: tipos.includes(key) })),
    administrativa: {
      ramo: numTexto(f.ramo_numero, f.ramo_texto),
      municipio: FICHA_MUNICIPIO,
      // Si no se capturó una unidad responsable propia de la ficha, se usa la
      // que ya trae el programa (columna programas.unidad_resp, sembrada).
      unidadResp: numTexto(f.unidad_resp_numero, f.unidad_resp_texto || p.unidad_resp),
    },
    economica: CLASIF_ECONOMICA.map(g => ({
      grupo: g.grupo,
      opciones: g.opciones.map(([key, label]) => ({ key, label, marcado: economica.includes(key) })),
    })),
    funcional: CLASIF_FUNCIONAL.map(([key, label]) => ({
      key, label, valor: numTexto(f[`${key}_num`], f[`${key}_texto`]),
    })),
    regional: CLASIF_REGIONAL.map(([key, label]) => ({
      key, label, valor: f[`region_${key}`] || '—',
    })),
    capitulos,
    totalCapitulos,
    fuentes: FUENTES_FINANCIAMIENTO.map(([key, label]) => ({
      key, label,
      marcado: !!fuentesPorKey[key]?.marcado,
      importe: Number(fuentesPorKey[key]?.importe) || 0,
    })),
    presupuestoEstimado: totalCapitulos,
    periodo: {
      // Respaldo: el año presupuestal completo, que es lo que el formato traía
      // impreso antes de que las fechas fueran capturables.
      inicio: fechaLarga(f.fecha_inicio) || `01 de enero de ${anio}`,
      termino: fechaLarga(f.fecha_termino) || `31 de diciembre de ${anio}`,
    },
    lider: {
      nombre: f.lider_nombre || p.elaboro_nombre || '—',
      cargo: f.lider_cargo || p.elaboro_cargo || '—',
      tel: f.lider_tel || FICHA_TEL_DEFAULT,
      email: f.lider_email || '—',
    },
  }
}

// ── resolverFichaIndicador: fuente ÚNICA de la ficha de indicador ───────────
// Mismo criterio que resolverFicha(): PDF y Excel consumen esta estructura.
// `nivel` es un renglón de datos.mirNiveles (ya trae `indicador` y las
// `variables` con su valor del año).
const marcables = (opciones, valor) => opciones.map(o => {
  const [key, label] = Array.isArray(o) ? o : [o, o]
  return { key, label, marcado: valor === key }
})

// Fórmula compuesta con los símbolos de las variables del indicador. La
// columna `indicadores.formula` está vacía en los 177 indicadores, pero sus
// 350 variables SÍ traen símbolo sembrado, así que la fórmula se puede armar
// sin capturar nada: numerador / denominador (× 100 si mide porcentaje).
// Compartida por el documento y por la pantalla de captura, que la muestra
// como sugerencia. Una fórmula capturada a mano siempre tiene preferencia.
export function componerFormula(variables, unidadMedida) {
  const vs = (variables || []).filter(Boolean)
  const sim = i => vs[i]?.simbolo || vs[i]?.nombre || '?'
  if (!vs.length) return ''
  if (vs.length === 1) return sim(0)
  const cociente = `${sim(0)} / ${sim(1)}`
  return String(unidadMedida || '').toLowerCase() === 'porcentaje'
    ? `(${cociente}) × 100`
    : cociente
}

// Clave Programática compuesta: Finalidad-Función-Subfunción-PP-Proyecto,
// donde PP es la clave del Programa Presupuestal (003, 037…) y NO el número
// de "Programa" de la clasificación funcional — así lo definió Hugo, para que
// el programa presupuestal quede dentro de la clave. Los segmentos vacíos se
// dejan visibles (guion sin número) para que se note lo que falta capturar.
export function componerClaveProgramatica(ficha, programa) {
  const f = ficha || {}
  const seg = [f.finalidad_num, f.funcion_num, f.subfuncion_num, programa?.clave, f.proyecto_num]
    .map(v => String(v ?? '').trim())
  return seg.some(Boolean) ? seg.join('-') : '—'
}

export function resolverFichaIndicador(datos, nivel, anio) {
  const p = datos.programa || {}
  const ficha = resolverFicha(datos, anio)
  const ind = nivel.indicador || {}
  const porKey = Object.fromEntries(ficha.funcional.map(c => [c.key, c.valor]))
  const objetivoCentral = (datos.arbolObjetivos || []).find(n => n.tipo === 'OBJETIVO' && !n.padre_id)

  const variables = (nivel.variables || []).map(v => ({
    simbolo: v.simbolo || null,
    nombre: v.nombre || '—',
    // El símbolo delante del nombre es lo que hace legible la fórmula: sin él,
    // "(CR30 / TC) × 100" no se puede leer contra esta tabla.
    etiqueta: v.simbolo ? `${v.simbolo} — ${v.nombre || '—'}` : (v.nombre || '—'),
    unidad: v.unidad_medida || '—',
    alcanzada: v.valor?.valor_alcanzado ?? null,
    meta: v.valor?.valor_meta ?? null,
  }))

  // Resultado del Indicador = numerador / denominador × 100, NO la suma de la
  // columna: la primera variable (por `orden`, que es como ya vienen) es el
  // numerador y la segunda el denominador. Con denominador nulo/cero no hay
  // porcentaje que calcular. Los indicadores de una sola variable (los 4 de
  // unidad "Documento") no son un cociente: ahí el resultado es el valor de
  // esa variable tal cual, y `esPorcentaje` avisa para no imprimirle un "%".
  const esPorcentaje = variables.length >= 2
  const resultadoDe = campo => {
    if (!variables.length) return null
    const num = Number(variables[0][campo])
    if (!Number.isFinite(num)) return null
    if (!esPorcentaje) return num
    const den = Number(variables[1][campo])
    if (!Number.isFinite(den) || den === 0) return null
    return (num / den) * 100
  }


  return {
    tiposIndicador: marcables(TIPOS_INDICADOR, ind.tipo_indicador),
    identificacion: [
      // Decisión de Hugo: en la ficha de indicador, "Eje Rector" imprime el
      // Programa Presupuestal y las áreas que lo integran, no el eje del PMD.
      ['Eje Rector', programaConAreas(p, datos.areasPrograma)],
      ['Finalidad', porKey.finalidad],
      ['Función', porKey.funcion],
      ['Subfunción', porKey.subfuncion],
      ['Programa', porKey.programa],
      ['Proyecto', porKey.proyecto],
      ['Unidad Responsable', ficha.administrativa.unidadResp],
      ['Objetivo(s) del Programa', objetivoCentral?.texto || '—'],
      ['Clave Programática', componerClaveProgramatica(datos.ficha, p)],
      // Decisión de Hugo: se reusa la Transformación Deseada del Diagnóstico
      // en vez de un campo nuevo por indicador.
      ['Resultado Esperado del Proyecto', (datos.diagnostico || [])[0]?.transformacion_deseada || '—'],
    ].map(([label, valor]) => ({ label, valor: valor || '—' })),
    estructura: {
      nombre: ind.nombre || '—',
      formula: ind.formula || componerFormula(nivel.variables, ind.unidad_medida) || '—',
      nivelesMIR: marcables(NIVELES_MIR_OPCIONES, nivel.tipo),
      sentidos: marcables(SENTIDOS_INDICADOR, ind.sentido),
    },
    variables,
    resultado: {
      alcanzada: resultadoDe('alcanzada'), meta: resultadoDe('meta'), esPorcentaje,
    },
    interpretacion: ind.interpretacion || '—',
    dimensiones: marcables(DIMENSIONES_INDICADOR, ind.dimension),
    frecuencias: marcables(FRECUENCIAS_INDICADOR, ind.frecuencia),
    // "la información correspondiente al indicador que esté en los medios de
    // verificación" — se captura por nodo del árbol (arbol_nodos), no por
    // indicador; el respaldo es el campo homónimo del catálogo de indicadores.
    fuenteInformacion: nivel.medios_verificacion || ind.medios_verificacion || '—',
    programa: `${p.clave || ''} ${p.nombre || ''}`.trim() || '—',
  }
}

// Resultado del Indicador: porcentaje con 2 decimales cuando es un cociente,
// el número tal cual cuando el indicador tiene una sola variable, "—" cuando
// no se pudo calcular.
export function resultadoTexto(v, esPorcentaje = true) {
  if (v == null) return '—'
  return esPorcentaje
    ? `${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    : v.toLocaleString('es-MX')
}

export function numeroTexto(v) {
  return v == null || v === '' ? '—' : Number(v).toLocaleString('es-MX')
}

// Etiqueta de nivel MIR con numeración jerárquica — "Componente 2",
// "Actividad 2.3" (2 = número del Componente padre, 3 = orden de la
// actividad dentro de él). Propósito y Fin no llevan número: son únicos
// por programa. `numero`/`componenteNumero` ya vienen calculados desde
// derivarNivelesMIR() en lib/mml.js (resolverDatosMML), fuente única que
// comparten la pantalla de captura y el PDF — no se recalculan aquí.
export function etiquetaNivelMIR(nivel) {
  const base = NIVEL_MIR_LABEL[nivel.tipo] || nivel.tipo
  if (nivel.tipo === 'COMPONENTE' && nivel.numero != null) return `${base} ${nivel.numero}`
  if (nivel.tipo === 'ACTIVIDAD' && nivel.numero != null) return `${base} ${nivel.componenteNumero}.${nivel.numero}`
  return base
}
