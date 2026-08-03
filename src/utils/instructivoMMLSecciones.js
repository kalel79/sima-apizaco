// ── Secciones del Instructivo de llenado — Expediente MML ────────────────────
// Documento de lectura (no de captura): explica QUÉ es cada concepto de la
// Metodología de Marco Lógico y CÓMO se captura en la pantalla real de SIMA
// (Expediente MML), sección por sección, en el mismo orden que las pestañas
// de la app y los formatos oficiales PP-FM.
import autoTable from 'jspdf-autotable'
import { GUINDA, DORADO, GRIS, BLANCO, setColor, setFill, setDraw } from './reportesBase.js'
import { drawEncabezado } from './expedienteMMLSecciones.js'

const ML = 14
const CRITICO = [123, 20, 20]

function drawTitulo(doc, y, texto) {
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); setColor(doc, GUINDA)
  doc.text(texto, ML, y)
  return y + 5
}

function drawParrafo(doc, y, texto, { fontSize = 7.6, bold = false, color = [30, 30, 30] } = {}) {
  const W = doc.internal.pageSize.width
  doc.setFontSize(fontSize); doc.setFont('helvetica', bold ? 'bold' : 'normal'); setColor(doc, color)
  const lines = doc.splitTextToSize(texto, W - ML * 2)
  doc.text(lines, ML, y)
  return y + lines.length * (fontSize * 0.42) + 3
}

// Recuadro destacado: barra de color a la izquierda + etiqueta en negritas +
// una o más líneas de texto. `tono`: 'regla' (guinda) | 'error' (rojo) | 'tip' (dorado).
function drawCallout(doc, y, tono, etiqueta, texto) {
  const W = doc.internal.pageSize.width
  const color = tono === 'error' ? CRITICO : tono === 'tip' ? DORADO : GUINDA
  const anchoTexto = W - ML * 2 - 6
  doc.setFontSize(7.3); doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(texto, anchoTexto)
  const h = lines.length * 3.3 + 8
  setFill(doc, [250, 248, 245]); setDraw(doc, color); doc.setLineWidth(0.3)
  doc.roundedRect(ML, y, W - ML * 2, h, 1.2, 1.2, 'FD')
  setFill(doc, color); doc.rect(ML, y, 1.6, h, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); setColor(doc, color)
  doc.text(etiqueta, ML + 5, y + 4.5)
  doc.setFontSize(7.3); doc.setFont('helvetica', 'normal'); setColor(doc, [40, 40, 40])
  doc.text(lines, ML + 5, y + 8.3)
  return y + h + 4
}

function drawTablaDosCol(doc, y, head, filas, { colAW = 55 } = {}) {
  autoTable(doc, {
    startY: y, margin: { left: ML, right: ML },
    head: [head],
    body: filas,
    theme: 'grid',
    headStyles: { fillColor: GUINDA, textColor: BLANCO, fontSize: 7, halign: 'left' },
    styles: { fontSize: 6.8, cellPadding: 2, valign: 'top', lineColor: [210, 205, 195] },
    columnStyles: { 0: { cellWidth: colAW, fontStyle: 'bold', textColor: GUINDA } },
  })
  return doc.lastAutoTable.finalY + 4
}

function notaPie(doc, texto) {
  const H = doc.internal.pageSize.height
  doc.setFontSize(6.3); doc.setFont('helvetica', 'italic'); setColor(doc, GRIS)
  doc.text(texto, ML, H - 8)
}

// ── Portada ───────────────────────────────────────────────────────────────────
export function drawPortadaInstructivo(doc) {
  let y = drawEncabezado(doc, 'INSTRUCTIVO DE LLENADO — EXPEDIENTE MML', null)

  y = drawParrafo(doc, y,
    'Esta guía explica, sección por sección, cómo capturar el Expediente MML (Metodología de Marco Lógico) de tu programa presupuestario en el sistema SIMA: qué significa cada concepto y qué debes llenar en cada pantalla. Sigue el mismo orden que las pestañas de la app.')

  y = drawTitulo(doc, y + 2, 'Flujo recomendado')
  const pasos = [
    '(Opcional) Llena primero la Plantilla en blanco en papel con tu equipo de área — botón "Plantilla en blanco (enlaces)".',
    'Entra a SIMA > Expediente MML > selecciona tu Programa y el Año.',
    'Captura en este orden: Diagnóstico > Árbol del Problema > Involucrados > Árbol de Objetivos > Acciones/Alternativas > MIR (indicadores) > Metas (POA).',
    'Revisa el semáforo de cada pestaña (check = completo, triángulo de alerta = incompleto) — te dice si a esa sección le falta información.',
    'Cuando esté completo, Planeación genera el PDF oficial con el botón "Generar PDF del Expediente".',
  ]
  pasos.forEach((p, i) => { y = drawParrafo(doc, y, `${i + 1}. ${p}`) })

  y = drawTitulo(doc, y + 2, 'Roles y permisos en este módulo')
  y = drawTablaDosCol(doc, y, ['Rol', 'Qué puede hacer en Expediente MML'], [
    ['Administrador', 'Todo: encabezado institucional, presupuesto, diagnóstico, árboles, involucrados, acciones, MIR/indicadores y Metas (POA).'],
    ['Planeación', 'Todo lo anterior EXCEPTO el encabezado institucional (clave programática, finalidad, etc.) y las Metas (POA), que son solo de Administrador.'],
    ['Enlace de área', 'Diagnóstico, árboles, involucrados, acciones e indicadores (supuestos, medios de verificación, vincular indicador) — únicamente del programa de su propia área.'],
    ['Directivo', 'Solo consulta — no puede editar ningún campo del módulo.'],
  ], { colAW: 32 })

  notaPie(doc, 'El sistema guarda automáticamente al salir de cada campo (perder el foco / cambiar de selección) — no hay botón "Guardar" general.')
}

// ── Insumos por área — qué debe llevar cada enlace antes de capturar ─────────
export function drawInsumosInstructivo(doc) {
  let y = drawEncabezado(doc, 'INSUMOS QUE DEBE LLEVAR EL ÁREA', null)
  y = drawParrafo(doc, y, 'Antes de sentarse a capturar en SIMA, el enlace de cada área debe tener ya preparada (en papel o en un documento) la siguiente información. Prepararla con anticipación evita dejar pestañas incompletas o tener que regresar varias veces.')

  y = drawTablaDosCol(doc, y, ['Sección en SIMA', 'Información / insumo que debe traer el área'], [
    ['Encabezado institucional', 'Clave programática, finalidad/función/subfunción, tipo de proyecto y fuentes de financiamiento del programa (solo lo captura Administrador; el área debe tenerlo identificado y validado).'],
    ['Diagnóstico', 'Descripción objetiva de la situación actual del problema (con datos o cifras si existen) y la redacción de la transformación deseada en positivo.'],
    ['Árbol del Problema', 'Problema central ya identificado (un solo enunciado), lista de causas y sub-causas, y lista de efectos que provoca el problema.'],
    ['Involucrados', 'Directorio de actores relacionados con el problema (personas, dependencias, grupos), clasificados como Beneficiario, Ejecutor, Opositor o Indiferente.'],
    ['Árbol de Objetivos', 'La misma redacción del Árbol del Problema pero en positivo (no requiere insumo nuevo: es el problema, las causas y los efectos convertidos en objetivo, medios y fines).'],
    ['Acciones/Alternativas', 'Por cada Medio (Componente): la acción o estrategia con la que se va a lograr; si se evaluó más de una alternativa, la justificación de por qué se eligió esa.'],
    ['MIR — Indicadores', 'Por cada nivel (Fin, Propósito, Componentes, Actividades): nombre del indicador, fórmula (variables del numerador y denominador con su unidad de medida), definición, año de línea base, tipo (Estratégico/Gestión), dimensión, sentido, supuestos y medios de verificación.'],
    ['Metas (POA)', 'Meta anual de cada indicador ya vinculado en la MIR, distribuida por el área en los 12 meses del año (la captura final es de Administrador).'],
  ], { colAW: 38 })

  y = drawCallout(doc, y, 'tip', 'RECOMENDACIÓN',
    'Usa el botón "Plantilla en blanco (enlaces)" para llenar primero esta información en papel con tu equipo, antes de entrar a capturar en pantalla — así la sesión de captura en SIMA es solo de transcripción.')

  notaPie(doc, 'Tabla de referencia rápida — el detalle de cómo se captura cada campo está en las páginas siguientes de este instructivo.')
}

// ── Encabezado institucional ──────────────────────────────────────────────────
export function drawEncabezadoInstructivo(doc) {
  let y = drawEncabezado(doc, 'ENCABEZADO INSTITUCIONAL', null)
  y = drawParrafo(doc, y, 'Son los datos generales de identificación programática y presupuestal del programa — el mismo dato que aparece en la clasificación funcional del presupuesto de egresos.')

  y = drawTitulo(doc, y + 2, 'Pestaña "Encabezado" — campos')
  y = drawTablaDosCol(doc, y, ['Campo', 'Qué escribir'], [
    ['Clave programática', 'La clave oficial del programa presupuestario dentro de la estructura del Ayuntamiento.'],
    ['Finalidad / Función / Subfunción', 'Clasificación funcional del gasto conforme al clasificador oficial (CONAC).'],
    ['Tipo de proyecto', 'Ej. "Inversión", "Servicios", "Administrativo", según corresponda.'],
    ['Fuentes de financiamiento', 'De dónde provienen los recursos: Ingresos propios, Participaciones federales, etc.'],
  ])

  y = drawCallout(doc, y, 'tip', 'QUIÉN LO LLENA',
    'Solo el Administrador puede editar estos 6 campos. Planeación y Administrador capturan el "Presupuesto por capítulo" (1000 a 9000). Las Firmas son de solo lectura: las administra Planeación desde su catálogo.')

  notaPie(doc, 'PP-FM-0A/00 (ficha del proyecto) · Este encabezado alimenta la "Ficha de Proyecto", la primera página del expediente oficial.')
}

// ── Diagnóstico ────────────────────────────────────────────────────────────────
export function drawDiagnosticoInstructivo(doc) {
  let y = drawEncabezado(doc, 'DIAGNÓSTICO — TRANSFORMACIÓN DESEADA', 'PP-FM-03-00')
  y = drawParrafo(doc, y, 'Es el punto de partida de todo el expediente: describe el problema en el estado actual y cómo se vería la realidad una vez resuelto.')

  y = drawTablaDosCol(doc, y, ['Concepto', 'Qué es'], [
    ['Situación actual', 'El problema descrito de forma objetiva, con datos o cifras si es posible. Es un diagnóstico, no una queja.'],
    ['Transformación deseada', 'La misma situación redactada EN POSITIVO — el estado al que se quiere llegar, no la lista de acciones para llegar ahí.'],
  ])

  y = drawCallout(doc, y, 'error', 'ERROR COMÚN',
    'No confundir "transformación deseada" con actividades. Ejemplo incorrecto: "Comprar luminarias LED". Ejemplo correcto: "El municipio cuenta con alumbrado público eficiente en el 95% de su territorio".')

  y = drawTitulo(doc, y + 1, 'Cómo se captura en SIMA')
  y = drawParrafo(doc, y, 'Pestaña "Diagnóstico" > botón "+ Agregar problema/transformación" > llena los dos recuadros de texto (Situación actual / Transformación deseada) > haz clic fuera del recuadro para que se guarde automáticamente. Puedes agregar más de una fila si el diagnóstico tiene varios problemas relacionados.')

  notaPie(doc, 'Un programa puede tener más de una fila de diagnóstico si atiende más de un problema — lo normal es que baste con una.')
}

// ── Árbol del Problema ────────────────────────────────────────────────────────
export function drawArbolProblemaInstructivo(doc) {
  let y = drawEncabezado(doc, 'ÁRBOL DEL PROBLEMA', 'PP-FM-04-00')
  y = drawParrafo(doc, y, 'Ordena el problema en tres niveles: el Problema central en medio, sus Causas debajo (por qué existe) y sus Efectos arriba (qué provoca).')

  y = drawTablaDosCol(doc, y, ['Nivel', 'Qué es'], [
    ['Problema central', 'UN SOLO nodo, redactado como una condición negativa que YA EXISTE — nunca como falta de una solución.'],
    ['Causas', 'Por qué existe el problema. Cada Causa puede tener Sub-causas (un nivel más profundo, "cuelgan" de la Causa).'],
    ['Efectos', 'Qué consecuencias provoca el problema si no se atiende.'],
  ])

  y = drawCallout(doc, y, 'regla', 'REGLA DE ORO',
    'Solo debe existir un nodo tipo CENTRAL y sin padre. Evita redactar causas como "falta de X" — describe la condición negativa en sí. Incorrecto: "Falta de mantenimiento". Correcto: "Las luminarias no reciben mantenimiento correctivo".')

  y = drawTitulo(doc, y + 1, 'Cómo se captura en SIMA')
  y = drawParrafo(doc, y, 'Pestaña "Árbol del Problema" > botón "+ Agregar nodo" > elige el Tipo (CENTRAL / CAUSA / EFECTO), escribe el Texto y elige el Padre en el tercer selector.')
  y = drawParrafo(doc, y, 'Orden sugerido de captura: 1) el nodo CENTRAL sin padre; 2) los EFECTOS y CAUSAS de primer nivel, con el CENTRAL como padre; 3) las sub-causas, con su Causa correspondiente como padre.')

  notaPie(doc, 'PP-FM-04-00 · Si borras un nodo que tiene "hijos", esos hijos quedan sin padre — vuelve a asignarles uno.')
}

// ── Involucrados ───────────────────────────────────────────────────────────────
export function drawInvolucradosInstructivo(doc) {
  let y = drawEncabezado(doc, 'MAPA DE RELACIONES / INVOLUCRADOS', 'PP-FM-05-00')
  y = drawParrafo(doc, y, 'Identifica a los actores (personas, dependencias, grupos) relacionados con el problema y clasifícalos en una de estas 4 categorías.')

  y = drawTablaDosCol(doc, y, ['Categoría', 'Qué es'], [
    ['Beneficiario', 'Se favorece con la ejecución del Programa.'],
    ['Ejecutor', 'Participa en la operación o implementación del Programa.'],
    ['Opositor', 'Se ve afectado negativamente o se resiste al Programa.'],
    ['Indiferente', 'No le impacta directamente, pero está relacionado con el tema.'],
  ])

  y = drawTitulo(doc, y + 1, 'Cómo se captura en SIMA')
  drawParrafo(doc, y, 'Pestaña "Involucrados" > en la categoría correspondiente, botón "+ Agregar" > escribe el nombre del actor (persona, dependencia o grupo). Agrega tantos actores como identifiques por categoría.')

  notaPie(doc, 'PP-FM-05-00 · No es necesario llenar las 4 categorías si un programa no tiene actores en alguna de ellas.')
}

// ── Árbol de Objetivos ────────────────────────────────────────────────────────
export function drawArbolObjetivosInstructivo(doc) {
  let y = drawEncabezado(doc, 'ÁRBOL DE OBJETIVOS', 'PP-FM-07-00')
  y = drawParrafo(doc, y, 'Se construye reflejando en positivo el Árbol del Problema: cada Causa se convierte en un Medio, cada Efecto en un Fin, y el Problema central en el Objetivo central.')

  y = drawTablaDosCol(doc, y, ['Nivel', 'Viene de…'], [
    ['Objetivo central', 'El Problema central, redactado en positivo (el estado que se quiere lograr).'],
    ['Fines', 'Los Efectos, redactados en positivo.'],
    ['Medios', 'Las Causas, redactadas en positivo.'],
  ])

  y = drawCallout(doc, y, 'regla', 'REGLA CRÍTICA — de este árbol se arma la MIR automáticamente',
    'El nodo raíz (tipo OBJETIVO, sin padre) = Propósito de la MIR. El FIN de mayor jerarquía = Fin de la MIR. Cada MEDIO que cuelga directo del Objetivo central = un Componente. Cada nodo que cuelga de un Medio (aunque su tipo también sea MEDIO) = una Actividad de ese Componente. Si los niveles de "padre" quedan mal capturados, la MIR se arma mal — revisa bien el árbol antes de pasar a la pestaña MIR.')

  y = drawTitulo(doc, y + 1, 'Cómo se captura en SIMA')
  drawParrafo(doc, y, 'Mismo mecanismo que el Árbol del Problema (botón "+ Agregar nodo", Tipo/Texto/Padre), con los tipos OBJETIVO, MEDIO y FIN. Para capturar una Actividad, agrega un nodo tipo MEDIO cuyo Padre sea el Medio (Componente) al que pertenece — no un tipo nuevo.')

  notaPie(doc, 'PP-FM-07-00 · Todo Medio de primer nivel (Componente) debe tener al menos una Actividad capturada debajo de él.')
}

// ── Acciones y Alternativas ────────────────────────────────────────────────────
export function drawAccionesInstructivo(doc) {
  let y = drawEncabezado(doc, 'ACCIONES Y ALTERNATIVAS', 'PP-FM-08-00 / PP-FM-09-00')
  y = drawParrafo(doc, y, 'Por cada Medio de primer nivel (Componente) del Árbol de Objetivos, define la acción o estrategia con la que se va a lograr. Si hay más de una forma posible de lograrlo, regístralas todas y marca cuál fue la elegida.')

  y = drawTitulo(doc, y + 1, 'Cómo se captura en SIMA')
  const pasos = [
    'Pestaña "Acciones/Alternativas" > botón "Generar acción(es) pendiente(s) de los Medios" — crea automáticamente una fila por cada Medio de primer nivel que todavía no tiene una acción registrada.',
    'En cada fila, escribe el texto de la Acción (qué se va a hacer para lograr ese Medio).',
    'Revisa que el selector "Medio asociado" apunte al Medio correcto del Árbol de Objetivos.',
    'Si evaluaste más de una alternativa, usa el campo "Justificación" para explicar por qué se eligió esa y marca la casilla "Alternativa seleccionada" en la opción ganadora.',
  ]
  pasos.forEach((p, i) => { y = drawParrafo(doc, y, `${i + 1}. ${p}`) })

  drawCallout(doc, y, 'tip', 'TIP',
    'No necesitas escribir las Actividades aquí — esas ya quedaron capturadas como nodos del Árbol de Objetivos (colgando de cada Medio). Esta pestaña es solo para la acción/estrategia general y, en su caso, la justificación de por qué se eligió sobre otras opciones.')

  notaPie(doc, 'PP-FM-08-00 / PP-FM-09-00 · El botón "Generar" no duplica: si un Medio ya tiene una acción, no vuelve a crear otra fila para él.')
}

// ── MIR (concepto) ─────────────────────────────────────────────────────────────
export function drawMIRConceptoInstructivo(doc) {
  let y = drawEncabezado(doc, 'MATRIZ DE INDICADORES PARA RESULTADOS (MIR)', 'PP-FM-0E-01')
  y = drawParrafo(doc, y, 'La MIR se arma SOLA a partir del Árbol de Objetivos — no se crean niveles a mano. Cada nivel necesita un Indicador que mida si se está logrando el objetivo de ese nivel.')

  y = drawTitulo(doc, y + 1, 'Lógica vertical')
  y = drawParrafo(doc, y, 'Si las Actividades se cumplen, se logra el Componente. Si los Componentes se logran, se logra el Propósito. Si el Propósito se logra y además se cumplen los Supuestos (factores externos fuera del control del Programa), se contribuye al Fin. Por eso cada nivel tiene su propia columna de "Supuestos / Riesgo".')

  y = drawTitulo(doc, y + 1, 'Lógica horizontal')
  y = drawParrafo(doc, y, 'Cada nivel debe tener un Indicador que lo mida objetivamente y unos Medios de verificación: de dónde vas a obtener el dato para calcular ese indicador (una bitácora, un padrón, un reporte de otra dependencia, etc.).')

  y = drawCallout(doc, y, 'tip', 'IMPORTANTE',
    'El "Resumen narrativo" de cada nivel (la columna con el texto del objetivo) NO se edita en la pestaña MIR — se edita en "Árbol de Objetivos", porque es el mismo texto del nodo. En MIR solo se muestra de referencia.')

  notaPie(doc, 'Si la pestaña MIR aparece vacía, regresa primero a "Árbol de Objetivos" y captura el Objetivo central con sus Medios y Fines.')
}

// ── MIR (captura del indicador) ────────────────────────────────────────────────
export function drawMIRCapturaInstructivo(doc) {
  let y = drawEncabezado(doc, 'MIR — CÓMO CAPTURAR EL INDICADOR', 'PP-FM-0E-01 (cont.)')

  y = drawTitulo(doc, y, 'Vincular o crear un indicador')
  y = drawParrafo(doc, y, 'En la columna "Indicador" de cada renglón, elige uno ya existente del programa o selecciona "+ Crear nuevo indicador...", que abre un formulario con Nombre, Área responsable, Unidad de medida y Frecuencia — al terminar, botón "Crear y vincular".')

  y = drawTablaDosCol(doc, y, ['Campo', 'Qué elegir'], [
    ['Tipo', 'Estratégico (mide el impacto en la población) o de Gestión (mide procesos/productos).'],
    ['Dimensión', 'Eficacia, Eficiencia, Economía o Calidad — qué aspecto del desempeño mide.'],
    ['Sentido', 'Ascendente (más es mejor), Descendente (menos es mejor) o Regular (hay un valor óptimo, ni mucho ni poco).'],
    ['Supuestos / Riesgo', 'Factor externo, fuera del control del Programa, que debe cumplirse para pasar a ese nivel.'],
    ['Medios de verificación', 'Dónde se puede consultar/comprobar el dato del indicador.'],
  ])

  y = drawTitulo(doc, y + 1, 'Ficha de indicador (flecha desplegable en cada renglón)')
  y = drawParrafo(doc, y, 'Al desplegar la ficha puedes capturar: Definición (qué mide en una frase), Año línea base, Interpretación (cómo se lee el resultado) y las Variables de la fórmula (Nombre, Símbolo, Unidad real, valor Alcanzado y Meta) — botón "+ Agregar variable" por cada variable del numerador y denominador.')

  drawCallout(doc, y, 'error', 'ERROR COMÚN',
    'Mezclar unidades de medida entre las variables de un mismo indicador (ej. una variable en "luminarias" y otra en "kilómetros"). Todas las variables de la fórmula deben poder combinarse entre sí con sentido.')

  notaPie(doc, 'PP-FM-0E-01 · Un indicador puede reutilizarse: si ya existe uno adecuado para ese nivel, elígelo en vez de crear uno nuevo.')
}

// ── Metas (POA) ─────────────────────────────────────────────────────────────────
export function drawMetasInstructivo(doc) {
  let y = drawEncabezado(doc, 'METAS CALENDARIZADAS (POA)', 'PP-FM-0F-01')
  y = drawParrafo(doc, y, 'Distribuye la meta anual de cada indicador entre los 12 meses del año, para dar seguimiento mensual al avance del Programa.')

  y = drawCallout(doc, y, 'tip', 'IMPORTANTE',
    'La columna "Anual (suma)" NO se captura a mano — se calcula sola como la suma de los 12 meses cada vez que guardas un valor mensual.')

  y = drawTitulo(doc, y + 1, 'Cómo se captura en SIMA')
  y = drawParrafo(doc, y, 'Pestaña "Metas (POA)" > escribe el valor numérico de la meta en el mes correspondiente para cada indicador > clic fuera de la celda para guardar. Solo aparecen aquí los indicadores que ya están vinculados a algún nivel de la MIR.')

  drawCallout(doc, y, 'regla', 'QUIÉN LO LLENA',
    'Esta pestaña es exclusiva de Administrador — ni Planeación ni Enlace pueden capturar metas, es el mismo alcance que el panel "Metas por año" del resto del sistema.')

  notaPie(doc, 'PP-FM-0F-01 · Si un indicador nuevo no aparece en esta lista, revisa que ya esté vinculado a un nivel en la pestaña MIR.')
}

// ── Checklist + glosario ────────────────────────────────────────────────────────
export function drawChecklistGlosarioInstructivo(doc) {
  let y = drawEncabezado(doc, 'CHECKLIST FINAL Y GLOSARIO', null)

  y = drawTitulo(doc, y, 'Cómo leer el semáforo de las pestañas')
  y = drawParrafo(doc, y, 'Cada pestaña del Expediente MML muestra una marca de check cuando tiene información capturada y un triángulo de alerta cuando le falta. Las pestañas "MIR" y "Metas" además muestran un porcentaje: la proporción de indicadores con ficha completa (MIR) o con meta programada en los 12 meses (Metas). Usa este semáforo como tu checklist antes de avisar a Planeación que tu programa está listo.')

  y = drawTitulo(doc, y + 1, 'Glosario rápido')
  y = drawTablaDosCol(doc, y, ['Término', 'Significado'], [
    ['Problema central', 'La condición negativa que da origen a todo el análisis — debe ser una sola.'],
    ['Causa / Sub-causa', 'Por qué existe el problema, en distintos niveles de profundidad.'],
    ['Efecto', 'Consecuencia del problema si no se atiende.'],
    ['Objetivo central / Propósito', 'El Problema central redactado en positivo — el resultado esperado del Programa.'],
    ['Fin', 'El Efecto de mayor jerarquía, redactado en positivo — a qué contribuye el Programa en el largo plazo.'],
    ['Medio / Componente', 'La Causa redactada en positivo — lo que el Programa entrega para lograr el Propósito.'],
    ['Actividad', 'Las acciones concretas que producen un Componente.'],
    ['Supuesto', 'Factor externo, fuera del control del Programa, necesario para pasar de un nivel al siguiente.'],
    ['Medio de verificación', 'Fuente de donde se obtiene el dato para calcular un indicador.'],
    ['Línea base', 'El valor del indicador en el año de referencia, antes de la intervención.'],
    ['Indicador estratégico / de gestión', 'Estratégico mide el impacto en la población; de gestión mide procesos o productos internos.'],
  ], { colAW: 46 })

  notaPie(doc, 'Cualquier duda sobre el llenado, consulta a la Dirección de Planeación y Evaluación.')
}
