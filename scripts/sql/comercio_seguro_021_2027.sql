-- ============================================================
-- Integración del programa "COMERCIO SEGURO" al Programa Presupuestal 021
-- Eje 7 / "Desarrollo Integral para la Familia"
-- Ejercicio 2027 — Expediente MML
-- programa_id = 5 (clave '021'), eje_id = 7, anio = 2027, area_id = 24
--
-- YA APLICADO en producción el 2026-08-31 (aprobado por Hugo). NO RE-EJECUTAR.
--   ids resultantes: indicadores 193 (E7-IMM-C5-01) y 194 (E7-IMM-A5.1-01);
--   arbol_nodos 875 = Componente 5, 876 = Actividad 5.1,
--                877 = Causa 5,      878 = subcausa 5.1.
--
-- ORIGEN DE LA NARRATIVA: documento oficial
--   "MML_Comercio_Seguro_Apizaco.xlsx", hoja única "MML Comercio Seguro":
--     "MATRIZ DE INDICADORES PARA RESULTADOS (MML) — PROGRAMA 'COMERCIO SEGURO'
--      — Dirección de Planeación y Evaluación
--      Objetivo: Capacitar al comercio en prevención de violencia de género y
--      crear puntos seguros."
--   Trae 1 Componente y 1 Actividad. Resumen narrativo, nombre del indicador,
--   fórmula, medios de verificación y supuestos se toman VERBATIM de ese
--   archivo, tanto en `indicadores` como en `arbol_nodos`.
--
-- DÓNDE SE COLGÓ Y POR QUÉ: el Excel no dice a qué programa presupuestal
--   pertenece — "Comercio Seguro" es el nombre del documento, no un PP del
--   catálogo. Hugo decidió el 021 porque el resultado que mide es prevención
--   de violencia de género, tema del Instituto Municipal de la Mujer (área 24),
--   y no regulación comercial (que viviría en el 012 / Comercio en Vía Pública).
--
-- ADAPTACIONES respecto al Excel:
--   a) NUMERACIÓN. El Excel dice "Componente" y "Actividad" a secas. En el 021
--      los Componentes 1 a 4 ya están tomados (710, 711, 713, 716), así que
--      esto entra como Componente 5 / Actividad 5.1.
--   b) ÁRBOL DEL PROBLEMA. El Excel solo trae la MIR, no el árbol del problema.
--      La Causa 5 y su subcausa son REDACCIÓN MÍA, espejo negativo directo de
--      los dos Medios. Editables desde la pantalla del Expediente MML.
--   c) SIN METAS. El Excel no trae columna de meta, y de todos modos el POA
--      2027 lo captura el enlace del área.
--   d) Las 4 viñetas de "Nota metodológica" del Excel (lógica vertical y
--      horizontal, CONEVAL) son explicación de la MML, no contenido a capturar;
--      no se sembraron.
--
-- Convenciones respetadas (verificadas contra los ids del propio 021):
--   · clave: E7-IMM-C{n}-01 / E7-IMM-A{n}.{m}-01 (IMM = Instituto Municipal de
--     la Mujer; el eje del área 24 es el 7).
--   · Componente: Porcentaje / Trimestral / Gestión / Eficacia / Regular.
--     Actividad:  Porcentaje / Trimestral / Gestión / Eficiencia / Regular.
--     (Es la mezcla que ya usan los 14 indicadores previos del área: los
--      Componentes en Eficacia, las Actividades casi todas en Eficiencia.)
--   · Ambas fórmulas del Excel ya son porcentajes, así que aquí NO hubo que
--     desviarse a unidades absolutas como en Movilidad y Transporte.
--   · El `texto` de Medios y Actividades NUNCA lleva número — el renderer del
--     PDF/Excel lo antepone solo (regla del piloto 021).
--   · area_responsable_id solo en el Componente; la Actividad la hereda vía
--     get_area_efectiva_nodo() / v_mml_niveles (fase_mml_09).
--   · No se agrega FIN ni EFECTO: el Componente alimenta los Fines de violencia
--     de género que ya existen bajo el Propósito 707.
-- ============================================================

BEGIN;

-- 1) Indicadores del Componente 5 y su Actividad 5.1 (Excel oficial).
INSERT INTO indicadores
  (clave, nombre, nivel_mir, area_id, programa_id, unidad_medida, frecuencia,
   tipo_indicador, dimension, sentido, formula, medios_verificacion,
   interpretacion, activo)
SELECT v.clave, v.nombre, v.nivel, 24, 5, 'Porcentaje', 'Trimestral',
       'Gestión', v.dimension, 'Regular', v.formula, v.mv, v.interpretacion, true
FROM (VALUES
  ('E7-IMM-C5-01',
   'Porcentaje de comercios reconocidos como Puntos Seguros',
   'Componente 5', 'Eficacia',
   '(Número de comercios certificados como Punto Seguro en el periodo / Número de comercios programados para certificación en el periodo) x 100',
   'Padrón de comercios certificados como Punto Seguro; listas de verificación de certificación; base de datos de la Dirección de Planeación y Evaluación.',
   'Mide la proporción de comercios establecidos que obtienen la certificación como Punto Seguro respecto a los programados para certificación en el periodo.'),
  ('E7-IMM-A5.1-01',
   'Porcentaje de personas capacitadas en los talleres',
   'Actividad 5.1', 'Eficiencia',
   '(Número de personas que concluyeron el taller de capacitación / Número de personas inscritas al taller) x 100',
   'Listas de asistencia firmadas; constancias de capacitación emitidas; evidencia fotográfica y minutas de los talleres.',
   'Mide la proporción de personas inscritas a los talleres de prevención de violencia de género que efectivamente los concluyen.')
) AS v(clave, nombre, nivel, dimension, formula, mv, interpretacion);

-- 2) Árbol de Objetivos: Componente 5 (MEDIO hijo del Propósito 707) con área
--    responsable = Instituto Municipal de la Mujer (24), y su Actividad 5.1.
WITH comp AS (
  INSERT INTO arbol_nodos
    (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
     area_responsable_id, supuestos, medios_verificacion)
  SELECT 5, 2027, 'OBJETIVOS', 'MEDIO',
         (SELECT id FROM arbol_nodos WHERE programa_id=5 AND anio=2027
            AND arbol='OBJETIVOS' AND tipo='OBJETIVO' AND padre_id IS NULL),
         5,
         'Comercios establecidos del municipio capacitados y reconocidos como Puntos Seguros en materia de prevención de violencia de género.',
         (SELECT id FROM indicadores WHERE clave='E7-IMM-C5-01'),
         24,
         'Los comercios participantes cumplen con los criterios de certificación establecidos para operar como Punto Seguro.',
         'Padrón de comercios certificados como Punto Seguro; listas de verificación de certificación; base de datos de la Dirección de Planeación y Evaluación.'
  RETURNING id
)
INSERT INTO arbol_nodos
  (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
   area_responsable_id, supuestos, medios_verificacion)
SELECT 5, 2027, 'OBJETIVOS', 'MEDIO', comp.id, 1,
  'Impartición de talleres de capacitación en prevención de violencia de género dirigidos a personal de comercios establecidos.',
  (SELECT id FROM indicadores WHERE clave='E7-IMM-A5.1-01'),
  NULL,
  'Los comercios convocados asisten y participan de forma activa en los talleres programados.',
  'Listas de asistencia firmadas; constancias de capacitación emitidas; evidencia fotográfica y minutas de los talleres.'
FROM comp;

-- 3) Árbol del Problema: Causa 5 espejo (hija del problema central 683) con su
--    subcausa. REDACCIÓN MÍA — el Excel no trae árbol del problema.
WITH causa AS (
  INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2027, 'PROBLEMA', 'CAUSA',
         (SELECT id FROM arbol_nodos WHERE programa_id=5 AND anio=2027
            AND arbol='PROBLEMA' AND tipo='CENTRAL' AND padre_id IS NULL),
         5,
         'Comercios establecidos sin capacitación ni reconocimiento como Puntos Seguros en materia de prevención de violencia de género.'
  RETURNING id
)
INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 5, 2027, 'PROBLEMA', 'CAUSA', causa.id, 1,
  'Personal de los comercios establecidos sin capacitación en prevención de violencia de género.'
FROM causa;

-- 4) Conteo denormalizado del catálogo de áreas. Ojo: el campo traía 15 con 14
--    indicadores reales (ya estaba desalineado antes de este cambio), así que
--    se recalcula desde la tabla en vez de sumarle 2. Queda en 16.
UPDATE areas
   SET num_indicadores_mir = (SELECT count(*) FROM indicadores WHERE area_id = 24)
 WHERE id = 24;

COMMIT;

-- ── Verificación posterior ──────────────────────────────────────────────────
-- SELECT v.nivel, v.id, a.nombre AS area_efectiva, i.clave, i.nivel_mir
-- FROM v_mml_niveles v
-- JOIN indicadores i ON i.id = v.indicador_id
-- LEFT JOIN areas a ON a.id = v.area_responsable_id
-- WHERE v.anio=2027 AND v.programa_id=5
--   AND i.clave IN ('E7-IMM-C5-01','E7-IMM-A5.1-01')
-- ORDER BY i.clave;
