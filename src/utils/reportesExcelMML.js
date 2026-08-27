import ExcelJS from 'exceljs'
import { XL, descargarExcel } from './reportesBase.js'

// ══════════════════════════════════════════════════════════════════════════════
// AVANCE DE CAPTURA DEL EXPEDIENTE MML POR ÁREA (fase_mml_22)
// ------------------------------------------------------------------------------
// Contraparte, para el ejercicio completo, de generarExcelAvanceCaptura (que
// cubre la captura mensual de avances). Misma maqueta: título guinda, encabezado
// blanco sobre guinda, renglones alternados y la columna Estado coloreada.
// Dos hojas: el corte por área (Componentes y Actividades) y el corte por
// programa, que es donde viven Fin y Propósito — no tienen área responsable.
// ══════════════════════════════════════════════════════════════════════════════

const thinB   = { style: 'thin', color: { argb: 'FFD0D0D0' } }
const borders = { top: thinB, left: thinB, bottom: thinB, right: thinB }

const ESTADO_BG = {
  COMPLETO:      'FFE8F5E9',
  'EN PROGRESO': 'FFFFF3E0',
  PENDIENTE:     'FFFFEBEE',
  'SIN NIVELES': 'FFF5F5F5',
}
const ESTADO_FG = {
  COMPLETO:      'FF007830',
  'EN PROGRESO': 'FFEF6C00',
  PENDIENTE:     'FFC62828',
  'SIN NIVELES': XL.gris,
}

const pct = v => (v != null ? `${v}%` : '-')

function encabezado(ws, titulo, columnas) {
  const ultima = String.fromCharCode(64 + columnas.length)
  ws.mergeCells(`A1:${ultima}1`)
  const t = ws.getCell('A1')
  t.value     = titulo
  t.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
  t.font      = { bold: true, size: 12, color: { argb: XL.blanco } }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 24

  const h = ws.addRow(columnas)
  h.eachCell(c => {
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
    c.font      = { bold: true, color: { argb: XL.blanco }, size: 10 }
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    c.border    = borders
  })
  ws.getRow(h.number).height = 30
  return h
}

// Pinta un renglón de datos; `colEstado` recibe el trato especial de color.
function pintarFila(ws, valores, i, { colEstado, estado } = {}) {
  const isAlt = i % 2 === 1
  const row = ws.addRow(valores)
  row.eachCell((c, col) => {
    c.border    = borders
    c.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' }
    if (colEstado && col === colEstado) {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ESTADO_BG[estado] || 'FFFFFFFF' } }
      c.font = { bold: true, size: 9.5, color: { argb: ESTADO_FG[estado] || XL.gris } }
    } else {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? XL.crema : XL.blanco } }
      c.font = { size: 9.5 }
    }
  })
  return row
}

export async function generarExcelAvanceMML({ areas, programas, anio }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMA · Dirección de Planeación y Evaluación'
  wb.created = new Date()

  // ── Hoja 1: por área ──────────────────────────────────────────────────────
  const ws = wb.addWorksheet('Avance MML por Área')
  ws.properties.defaultRowHeight = 14.4

  encabezado(ws, `SIMA – Avance de Captura del Expediente MML por Área · ${anio}`, [
    'Área', 'Eje', 'Niveles MIR',
    '% MIR', '% Riesgos', '% Ficha', '% Metas', '% Global', 'Estado',
  ])

  ;(areas || []).forEach((a, i) => {
    pintarFila(ws, [
      a.area, a.eje_codigo || '-', a.total_niveles,
      pct(a.pct_mir), pct(a.pct_riesgos), pct(a.pct_ficha), pct(a.pct_metas), pct(a.pct_global),
      a.estado_captura,
    ], i, { colEstado: 9, estado: a.estado_captura })
  })

  ws.columns = [
    { width: 34 }, { width: 8 }, { width: 12 },
    { width: 10 }, { width: 11 }, { width: 10 }, { width: 10 }, { width: 11 }, { width: 16 },
  ]
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }]

  // ── Hoja 2: por programa (incluye Fin y Propósito, que no tienen área) ────
  const wp = wb.addWorksheet('Avance MML por Programa')
  wp.properties.defaultRowHeight = 14.4

  encabezado(wp, `SIMA – Avance de Captura del Expediente MML por Programa · ${anio}`, [
    'Programa', 'Clave', 'Niveles MIR', 'Fin/Propósito',
    '% MIR', '% Riesgos', '% Ficha', '% Metas', '% Global', 'Ficha del Proyecto',
  ])

  ;(programas || []).forEach((p, i) => {
    pintarFila(wp, [
      p.programa, p.clave, p.total_niveles, p.niveles_sin_area,
      pct(p.pct_mir), pct(p.pct_riesgos), pct(p.pct_ficha), pct(p.pct_metas), pct(p.pct_global),
      p.tiene_ficha_proyecto ? 'Capturada' : 'Pendiente',
    ], i, { colEstado: 10, estado: p.tiene_ficha_proyecto ? 'COMPLETO' : 'PENDIENTE' })
  })

  wp.columns = [
    { width: 40 }, { width: 9 }, { width: 12 }, { width: 13 },
    { width: 10 }, { width: 11 }, { width: 10 }, { width: 10 }, { width: 11 }, { width: 18 },
  ]
  wp.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }]

  // ── Hoja 3: cómo se calcula, para que el número sea auditable ─────────────
  const wn = wb.addWorksheet('Cómo se calcula')
  wn.properties.defaultRowHeight = 14.4
  wn.getColumn(1).width = 22
  wn.getColumn(2).width = 96
  ;[
    ['Bloque', 'Qué se cuenta como capturado'],
    ['MIR (1 dato)', 'El nivel de la MIR tiene un indicador vinculado.'],
    ['Riesgos (2 datos)', 'Supuestos y Medios de verificación del nivel.'],
    ['Ficha (7 datos)', 'Del indicador: definición, fórmula, tipo, dimensión, sentido, año de línea base e interpretación.'],
    ['Metas (12 datos)', 'Una meta con valor por cada mes del ejercicio.'],
    ['', ''],
    ['Total por nivel', '22 datos. El % de cada bloque es capturados / esperados; el % Global suma los cuatro bloques.'],
    ['Fin y Propósito', 'No tienen área responsable: son del programa completo y solo aparecen en la hoja por programa.'],
    ['Ficha del Proyecto', 'Es por programa y ejercicio (no repartible entre áreas), por eso se reporta como Capturada/Pendiente.'],
    ['Excluidos', 'Frecuencia y Unidad de medida no se cuentan: son NOT NULL con valor por omisión, siempre se verían llenos.'],
  ].forEach((fila, i) => {
    const row = wn.addRow(fila)
    row.eachCell((c, col) => {
      c.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' }
      c.font = i === 0 ? { bold: true, size: 10, color: { argb: XL.blanco } } : { size: 9.5 }
      if (i === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: XL.guinda } }
      if (i > 0 && col === 1) c.font = { bold: true, size: 9.5 }
    })
  })

  await descargarExcel(wb, `SIMA_AvanceMML_${anio}.xlsx`)
}
