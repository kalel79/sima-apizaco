// ── Secciones de la Plantilla en blanco del Expediente MML ───────────────────
// Formato de llenado manuscrito para enlaces: mismo orden de formatos PP-FM
// que el expediente real (expedienteMMLSecciones.js), pero sin datos — cada
// campo trae una columna "Ejemplo" (guía) y una columna en blanco con líneas
// para escribir a mano. No lleva firmas (es un borrador de captura, no el
// documento oficial).
import autoTable from 'jspdf-autotable'
import { GUINDA, GRIS, BLANCO, setColor, setDraw } from './reportesBase.js'
import { drawEncabezado } from './expedienteMMLSecciones.js'

const ML = 14

// ── Líneas de renglón para escribir a mano dentro de una celda de autoTable ──
function dibujarRenglones(doc, cell) {
  setDraw(doc, [200, 194, 182]); doc.setLineWidth(0.15)
  const pad = 3, gap = 5
  let ly = cell.y + pad + gap
  while (ly < cell.y + cell.height - 1.5) {
    doc.line(cell.x + 1.5, ly, cell.x + cell.width - 1.5, ly)
    ly += gap
  }
}
// ── Tabla genérica Campo / Ejemplo / Tu respuesta ────────────────────────────
export function drawTablaCampos(doc, y, filas, { tituloTabla, colCampoW = 40 } = {}) {
  const W = doc.internal.pageSize.width
  const totalW = W - ML * 2
  const colEjemploW = (totalW - colCampoW) * 0.42
  const colRespuestaW = totalW - colCampoW - colEjemploW

  if (tituloTabla) {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
    doc.text(tituloTabla, ML, y)
    y += 4
  }

  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Campo', 'Ejemplo (guía)', 'Tu respuesta — llenar a mano']],
    body: filas.map(f => [f.campo, f.ejemplo, '']),
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 7, halign: 'center' },
    styles: { fontSize: 6.8, cellPadding: 2, valign: 'top', lineColor: [210, 205, 195] },
    columnStyles: {
      0: { cellWidth: colCampoW, fontStyle: 'bold', textColor: GUINDA },
      1: { cellWidth: colEjemploW, fontStyle: 'italic', textColor: GRIS, fillColor: [248, 246, 242] },
      2: { cellWidth: colRespuestaW, minCellHeight: 16 },
    },
    didParseCell(d) {
      if (d.section === 'body' && d.column.index === 2) {
        const filaIdx = d.row.index
        d.cell.styles.minCellHeight = filas[filaIdx]?.alto || 16
      }
    },
    didDrawCell(d) {
      if (d.section === 'body' && d.column.index === 2) dibujarRenglones(doc, d.cell)
    },
  })
  return doc.lastAutoTable.finalY
}

function notaPie(doc, texto, y) {
  const H = doc.internal.pageSize.height
  doc.setFontSize(6.3); doc.setFont('helvetica', 'italic'); setColor(doc, GRIS)
  doc.text(texto, ML, y ?? H - 8)
}

// ── Portada / instrucciones + datos de identificación ────────────────────────
export function drawPortadaPlantilla(doc, prefill) {
  let y = drawEncabezado(doc, 'PLANTILLA DE CAPTURA — EXPEDIENTE MML (borrador manuscrito)', null)
  const p = prefill?.programa || {}

  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Instrucciones', ML, y); y += 5
  doc.setFontSize(7.3); doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
  const instrucciones = [
    'Llena a mano cada recuadro en blanco. La columna "Ejemplo" solo es una guía de referencia — no la copies literal, describe tu propio programa.',
    'Sigue el orden de las hojas: primero el Diagnóstico y el Árbol del Problema, después el Árbol de Objetivos y sus Acciones — el Árbol de Objetivos se construye reflejando (en positivo) las Causas y Efectos que ya identificaste en el Árbol del Problema.',
    'La hoja "Ficha de indicador" es reutilizable: fotocopiala tantas veces como indicadores necesites capturar (uno por Fin, Propósito, cada Componente y cada Actividad).',
    'Una vez llena, entrega esta plantilla a tu enlace de Planeación para capturarla en el sistema SIMA (pestaña "Expediente MML").',
  ]
  instrucciones.forEach((t, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${t}`, doc.internal.pageSize.width - ML * 2)
    doc.text(lines, ML, y)
    y += lines.length * 3.6 + 2.5
  })
  y += 4

  y = drawTablaCampos(doc, y, [
    { campo: 'Programa presupuestario', ejemplo: '005 Seguridad Pública y Tránsito Vial', alto: 12 },
    { campo: 'Eje', ejemplo: 'Eje 1 — Apizaco Seguro', alto: 12 },
    { campo: 'Área / Unidad responsable', ejemplo: 'Dirección de Seguridad Pública', alto: 12 },
    { campo: 'Nombre del enlace', ejemplo: 'Juan Pérez López', alto: 12 },
    { campo: 'Fecha de llenado', ejemplo: '15/01/2026', alto: 12 },
  ], { tituloTabla: 'Datos de identificación' })

  if (p.clave || p.nombre) {
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); setColor(doc, GRIS)
    doc.text(`Programa preseleccionado en el sistema: ${p.clave || ''} ${p.nombre || ''}`, ML, y + 5)
  }
}

// ── PP-FM-03: Transformación Deseada ─────────────────────────────────────────
export function drawTransformacionDeseadaPlantilla(doc) {
  let y = drawEncabezado(doc, 'TRANSFORMACIÓN DESEADA', 'PP-FM-03-00 (borrador)')
  drawTablaCampos(doc, y, [
    {
      campo: 'Situación actual (Diagnóstico)',
      ejemplo: 'El 45% de las luminarias del municipio presenta fallas o está fuera de servicio, generando inseguridad y quejas constantes de la ciudadanía.',
      alto: 34,
    },
    {
      campo: 'Transformación deseada',
      ejemplo: 'El municipio cuenta con un sistema de alumbrado público eficiente, con cobertura del 95% y tecnología LED, que reduce la incidencia delictiva nocturna.',
      alto: 34,
    },
  ])
  notaPie(doc, 'PP-FM-03-00 · La "transformación deseada" es la situación actual redactada en positivo, como si el problema ya estuviera resuelto.')
}

// ── PP-FM-04 / PP-FM-07: Árbol del Problema / de Objetivos ───────────────────
export function drawArbolPlantilla(doc, tipoConfig) {
  let y = drawEncabezado(doc, tipoConfig.titulo, `${tipoConfig.folio} (borrador)`)

  y = drawTablaCampos(doc, y, [
    { campo: tipoConfig.labelRaiz, ejemplo: tipoConfig.ejemploRaiz, alto: 16 },
  ], { tituloTabla: tipoConfig.labelRaiz })

  y += 3
  y = drawTablaCampos(doc, y, tipoConfig.ejemplosSuperior.map((ej, i) => ({
    campo: `${tipoConfig.labelSuperior} ${i + 1}`, ejemplo: ej, alto: 12,
  })), { tituloTabla: tipoConfig.labelSuperior })

  y += 3
  const filasPrimario = []
  tipoConfig.ejemplosPrimario.forEach((grupo, i) => {
    filasPrimario.push({ campo: `${tipoConfig.labelPrimario} ${i + 1}`, ejemplo: grupo.principal, alto: 12 })
    grupo.subs.forEach((sub, j) => {
      filasPrimario.push({ campo: `  ↳ Sub-${tipoConfig.labelPrimario.toLowerCase()} ${i + 1}.${j + 1}`, ejemplo: sub, alto: 10 })
    })
  })
  drawTablaCampos(doc, y, filasPrimario, { tituloTabla: `${tipoConfig.labelPrimario} (y sus sub-${tipoConfig.labelPrimario.toLowerCase()})` })

  notaPie(doc, `${tipoConfig.folio} · Cada ${tipoConfig.labelPrimario.toLowerCase()} debe tener al menos una sub-causa/sub-medio; agrega más renglones a mano si necesitas más de 3.`)
}

export const TIPO_CONFIG_PROBLEMA_PLANTILLA = {
  titulo: 'ÁRBOL DEL PROBLEMA', folio: 'PP-FM-04-00',
  labelRaiz: 'Problema central', labelSuperior: 'Efecto', labelPrimario: 'Causa',
  ejemploRaiz: 'Insuficiente cobertura y mantenimiento del alumbrado público en el municipio.',
  ejemplosSuperior: [
    'Incremento en la percepción de inseguridad ciudadana.',
    'Aumento de incidentes viales nocturnos.',
    'Quejas ciudadanas recurrentes ante el Ayuntamiento.',
  ],
  ejemplosPrimario: [
    { principal: 'Insuficiente presupuesto para mantenimiento correctivo.', subs: ['Falta de programa de mantenimiento preventivo.', 'Robo de cableado y luminarias.'] },
    { principal: 'Tecnología obsoleta (luminarias de vapor de sodio).', subs: ['Alto consumo de energía eléctrica.', 'Vida útil vencida en más del 60% del parque.'] },
    { principal: 'Falta de personal técnico especializado.', subs: ['Alta rotación de personal capacitado.', 'Sin capacitación continua.'] },
  ],
}

export const TIPO_CONFIG_OBJETIVOS_PLANTILLA = {
  titulo: 'ÁRBOL DE OBJETIVOS', folio: 'PP-FM-07-00',
  labelRaiz: 'Objetivo central', labelSuperior: 'Fin', labelPrimario: 'Medio',
  ejemploRaiz: 'Garantizar la cobertura y el buen funcionamiento del alumbrado público municipal.',
  ejemplosSuperior: [
    'Contribuir a la reducción de la incidencia delictiva nocturna.',
    'Disminuir los incidentes viales nocturnos.',
    'Mejorar la percepción de seguridad ciudadana.',
  ],
  ejemplosPrimario: [
    { principal: 'Suficiente presupuesto para mantenimiento correctivo y preventivo.', subs: ['Programa de mantenimiento preventivo implementado.', 'Videovigilancia en puntos críticos para prevenir robo de cableado.'] },
    { principal: 'Tecnología LED de alta eficiencia instalada.', subs: ['Reducción del consumo de energía eléctrica.', 'Renovación del parque de luminarias.'] },
    { principal: 'Personal técnico capacitado y suficiente.', subs: ['Programa de capacitación continua.', 'Esquema de retención de personal especializado.'] },
  ],
}

// ── PP-FM-05: Mapa de Relaciones / Involucrados ──────────────────────────────
export function drawInvolucradosPlantilla(doc) {
  let y = drawEncabezado(doc, 'ANÁLISIS DE INVOLUCRADOS', 'PP-FM-05-00 (borrador)')
  drawTablaCampos(doc, y, [
    { campo: 'Beneficiarios', ejemplo: 'Ciudadanía en general; comercios establecidos en vialidades principales.', alto: 22 },
    { campo: 'Ejecutores', ejemplo: 'Dirección de Servicios Públicos Municipales; Dirección de Obras Públicas.', alto: 22 },
    { campo: 'Opositores', ejemplo: 'Proveedor actual de mantenimiento (resistencia al cambio de contrato).', alto: 22 },
    { campo: 'Indiferentes', ejemplo: 'Dependencias municipales no relacionadas con infraestructura urbana.', alto: 22 },
  ], { tituloTabla: 'Identifica a los actores involucrados en cada categoría (uno por renglón)' })
  notaPie(doc, 'PP-FM-05-00 · Beneficiario = se favorece con el Programa · Ejecutor = participa en su operación · Opositor = se ve afectado o se resiste · Indiferente = no le impacta directamente.')
}

// ── PP-FM-08: Acciones (Objetivo → Medios/Componentes → Actividades) ────────
export function drawAccionesPlantilla(doc) {
  let y = drawEncabezado(doc, 'ACCIONES', 'PP-FM-08-00 (borrador)')
  y = drawTablaCampos(doc, y, [
    { campo: 'Objetivo central', ejemplo: 'Garantizar la cobertura y el buen funcionamiento del alumbrado público municipal. (copia el mismo del Árbol de Objetivos)', alto: 14 },
  ])
  y += 3
  const filas = []
  ;[1, 2, 3].forEach(n => {
    filas.push({
      campo: `Medio / Componente ${n}`,
      ejemplo: n === 1 ? 'Luminarias LED instaladas.' : n === 2 ? 'Programa de mantenimiento preventivo operando.' : '(agrega uno por cada Medio de primer nivel de tu Árbol de Objetivos)',
      alto: 12,
    })
    filas.push({
      campo: `  ↳ Actividades del Medio ${n}`,
      ejemplo: n === 1
        ? `${n}.1 Diagnóstico del parque de luminarias actual\n${n}.2 Adquisición de luminarias LED\n${n}.3 Instalación y sustitución de luminarias`
        : n === 2
          ? `${n}.1 Elaboración del calendario de mantenimiento\n${n}.2 Capacitación de cuadrillas técnicas`
          : '(una actividad por renglón, numerada N.1, N.2…)',
      alto: 22,
    })
  })
  drawTablaCampos(doc, y, filas, { tituloTabla: 'Medios / Componentes y sus Actividades' })
  notaPie(doc, 'PP-FM-08-00 · Cada Medio de primer nivel del Árbol de Objetivos se convierte en un Componente; sus actividades cuelgan de él.')
}

// ── PP-FM-09: Alternativas ───────────────────────────────────────────────────
export function drawAlternativasPlantilla(doc) {
  let y = drawEncabezado(doc, 'ALTERNATIVAS', 'PP-FM-09-00 (borrador)')
  y = drawTablaCampos(doc, y, [
    {
      campo: 'Actividades (numeradas, una por renglón)',
      ejemplo: '1.1 Diagnóstico del parque de luminarias\n1.2 Adquisición de luminarias LED\n1.3 Instalación y sustitución\n2.1 Calendario de mantenimiento\n2.2 Capacitación de cuadrillas',
      alto: 32,
    },
  ], { tituloTabla: 'Copia aquí las actividades del formato "Acciones"' })
  y += 3
  drawTablaCampos(doc, y, [
    {
      campo: 'Alternativa combinada',
      ejemplo: '1.1 + 1.2 + 1.3 + 2.1 + 2.2 = Sustitución del alumbrado público con mantenimiento preventivo programado.',
      alto: 22,
    },
  ], { tituloTabla: 'Combina las actividades en la(s) alternativa(s) de solución que se ejecutará(n)' })
  notaPie(doc, 'PP-FM-09-00 · Si identificaste más de una alternativa posible, usa un renglón por cada combinación.')
}

// ── PP-FM-0E: Matriz de Riesgos y MIR ─────────────────────────────────────────
export function drawMatrizMIRPlantilla(doc) {
  const W = doc.internal.pageSize.width
  let y = drawEncabezado(doc, 'MATRIZ DE INDICADORES Y RIESGOS (MIR)', 'PP-FM-0E-01 (borrador)')

  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
  const intro = doc.splitTextToSize(
    'Por cada nivel de tu Árbol de Objetivos (Fin, Propósito, cada Componente, cada Actividad) define un indicador. Usa un renglón por nivel; agrega más renglones a mano si te faltan.',
    W - ML * 2)
  doc.text(intro, ML, y); y += intro.length * 3.6 + 4

  const cols = [
    { header: 'Nivel', w: 20 },
    { header: 'Resumen narrativo (Objetivo)', w: 40 },
    { header: 'Indicador propuesto', w: 40 },
    { header: 'Tipo / Dim. / Sentido', w: 26 },
    { header: 'Supuestos / Riesgo', w: 34 },
    { header: 'Medios de verificación', w: 34 },
  ]
  const filaEjemplo = [
    'Componente 1', 'Luminarias LED instaladas',
    'Porcentaje de luminarias sustituidas por tecnología LED',
    'Gestión / Eficacia / Ascendente',
    'Se cuenta con el presupuesto autorizado en tiempo y forma.',
    'Bitácora de instalación y reporte fotográfico de la Dirección de Servicios Públicos.',
  ]

  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [cols.map(c => c.header)],
    body: [filaEjemplo, ...Array.from({ length: 6 }, () => ['', '', '', '', '', ''])],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 6.8, halign: 'center' },
    styles: { fontSize: 6.5, cellPadding: 1.5, valign: 'top', lineColor: [210, 205, 195] },
    columnStyles: Object.fromEntries(cols.map((c, i) => [i, { cellWidth: c.w }])),
    didParseCell(d) {
      if (d.section === 'body' && d.row.index === 0) {
        d.cell.styles.fillColor = [248, 246, 242]
        d.cell.styles.fontStyle = 'italic'
        d.cell.styles.textColor = GRIS
      }
      if (d.section === 'body' && d.row.index > 0) d.cell.styles.minCellHeight = 14
    },
    didDrawCell(d) {
      if (d.section === 'body' && d.row.index > 0) dibujarRenglones(doc, d.cell)
    },
  })
  notaPie(doc, 'PP-FM-0E-01 · Tipo: Estratégico / de Gestión · Dimensión: Eficacia / Eficiencia / Calidad / Economía · Sentido: Ascendente / Descendente.')
}

// ── PP-FM-0F: Cronograma de Metas (POA) ──────────────────────────────────────
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function drawCronogramaMetasPlantilla(doc) {
  const W = doc.internal.pageSize.width
  let y = drawEncabezado(doc, 'CRONOGRAMA DE METAS (POA)', 'PP-FM-0F-01 (borrador)')

  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); setColor(doc, [30, 30, 30])
  const intro = doc.splitTextToSize(
    'Distribuye la meta anual de cada indicador entre los 12 meses (verbos en infinitivo, ej. "Sustituir", "Capacitar"). Un renglón por indicador.',
    W - ML * 2)
  doc.text(intro, ML, y); y += intro.length * 3.6 + 4

  const filaEjemplo = ['Componente 1', 'Sustituir luminarias LED', '20', '30', '40', '40', '50', '50', '50', '60', '60', '40', '40', '20', '500']

  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Nivel', 'Meta (indicador)', ...MESES, 'Anual']],
    body: [filaEjemplo, ...Array.from({ length: 5 }, () => Array(15).fill(''))],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 6.2, halign: 'center' },
    styles: { fontSize: 6, cellPadding: 1, halign: 'center', lineColor: [210, 205, 195] },
    columnStyles: { 0: { cellWidth: 20, halign: 'left' }, 1: { cellWidth: 34, halign: 'left' } },
    didParseCell(d) {
      if (d.section === 'body' && d.row.index === 0) {
        d.cell.styles.fillColor = [248, 246, 242]
        d.cell.styles.fontStyle = 'italic'
        d.cell.styles.textColor = GRIS
      }
      if (d.section === 'body' && d.row.index > 0) d.cell.styles.minCellHeight = 8
    },
  })
}

// ── Ficha de Indicador (reutilizable — fotocopiar una por indicador) ────────
export function drawFichaIndicadorPlantilla(doc) {
  let y = drawEncabezado(doc, 'FICHA DE INDICADOR DE RESULTADOS (hoja reutilizable)', null)

  y = drawTablaCampos(doc, y, [
    { campo: 'Nivel MIR (Fin/Propósito/Componente/Actividad)', ejemplo: 'Componente 1', alto: 10 },
    { campo: 'Nombre del indicador', ejemplo: 'Porcentaje de luminarias sustituidas por tecnología LED', alto: 12 },
    { campo: 'Definición', ejemplo: 'Mide el avance en la sustitución de luminarias convencionales por tecnología LED respecto al total programado.', alto: 18 },
    { campo: 'Tipo de indicador (Estratégico / de Gestión)', ejemplo: 'De Gestión', alto: 10 },
    { campo: 'Dimensión (Eficacia/Eficiencia/Calidad/Economía)', ejemplo: 'Eficacia', alto: 10 },
    { campo: 'Sentido (Ascendente / Descendente)', ejemplo: 'Ascendente', alto: 10 },
    { campo: 'Año línea base', ejemplo: '2025', alto: 10 },
    { campo: 'Supuestos / Riesgo', ejemplo: 'Se cuenta con el presupuesto autorizado en tiempo y forma.', alto: 14 },
    { campo: 'Medios de verificación', ejemplo: 'Bitácora de instalación y reporte fotográfico de la Dirección de Servicios Públicos.', alto: 14 },
  ], { tituloTabla: 'Datos generales del indicador' })

  y += 3
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text('Variables de la fórmula', ML, y); y += 3

  const filaEjemplo = ['Luminarias LED instaladas', 'LI', 'luminarias', 'Bitácora de obra', '500']
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [['Variable', 'Símbolo', 'Unidad de medida', 'Fuente', `Meta del año`]],
    body: [filaEjemplo, ['Luminarias programadas', 'LP', 'luminarias', 'Programa anual de sustitución', '500'], ...Array.from({ length: 2 }, () => ['', '', '', '', ''])],
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 7, halign: 'center' },
    styles: { fontSize: 6.7, cellPadding: 1.5, lineColor: [210, 205, 195] },
    didParseCell(d) {
      if (d.section === 'body' && d.row.index <= 1) {
        d.cell.styles.fillColor = [248, 246, 242]
        d.cell.styles.fontStyle = 'italic'
        d.cell.styles.textColor = GRIS
      }
      if (d.section === 'body' && d.row.index > 1) d.cell.styles.minCellHeight = 10
    },
    didDrawCell(d) {
      if (d.section === 'body' && d.row.index > 1) dibujarRenglones(doc, d.cell)
    },
  })
  notaPie(doc, 'Hoja reutilizable · fotocopia una por cada indicador (Fin, Propósito, cada Componente y cada Actividad que tenga indicador).')
}
