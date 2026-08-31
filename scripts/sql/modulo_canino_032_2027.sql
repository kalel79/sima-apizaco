-- ============================================================
-- Integración de la COORDINACIÓN DEL MÓDULO CANINO
-- Eje Transversal A / Programa Presupuestal 032 "Protección al Ambiente"
-- Ejercicio 2027 — Expediente MML
-- eje_id = 6 (TA), programa_id = 7 (clave '032'), anio = 2027
--
-- ALCANCE (aprobado por Hugo 2026-08-28): 1 Componente + 2 Actividades.
--
-- ORIGEN DE LA NARRATIVA: es una PROPUESTA redactada con los temas estándar de
--   un módulo canino municipal (esterilización, vacunación antirrábica, control
--   de población en situación de calle, adopción y tenencia responsable),
--   siguiendo el estilo y las convenciones del propio expediente 2027 del 032.
--   NO proviene de un documento oficial del área. Hugo debe sustituir los textos
--   por los oficiales antes de aplicar, o confirmarlos tal cual — después son
--   editables desde la pantalla del Expediente MML.
--
-- Convenciones respetadas (verificadas contra los ids 114-131 ya sembrados):
--   · clave de indicador: E{eje}-{AREA}-C{n}-01 / E{eje}-{AREA}-A{n}.{m}-01.
--     ECO = Ecología, SM = Servicios Municipales -> MC = Módulo Canino.
--     El eje es el 6 (TA), de ahí el prefijo E6-.
--   · Componente: frecuencia Trimestral; Actividad: Mensual.
--     Ambos: Porcentaje / Gestión / Eficacia / Regular.
--   · El `texto` de Medios y Actividades NUNCA lleva número — el renderer del
--     PDF/Excel lo antepone solo (regla del piloto 021).
--   · area_responsable_id solo en el Componente; las Actividades la heredan
--     vía get_area_efectiva_nodo() / v_mml_niveles (fase_mml_09).
--   · Sin filas en `metas`: el POA 2027 lo captura el enlace del área.
--
-- El área se referencia por nombre, no por id fijo, para que el script sea
-- atómico (el id que le tocará es el 38).
-- ============================================================

BEGIN;

-- 1) Alta del área en el catálogo.
INSERT INTO areas (nombre, eje_id, programa_id, num_indicadores_mir, activo)
VALUES ('Coordinación del Módulo Canino', 6, 7, 3, true);

-- 2) Indicadores del Componente 5 y sus 2 Actividades.
INSERT INTO indicadores
  (clave, nombre, nivel_mir, area_id, programa_id, unidad_medida, frecuencia,
   tipo_indicador, dimension, sentido, medios_verificacion, interpretacion, activo)
SELECT v.clave, v.nombre, v.nivel,
       (SELECT id FROM areas WHERE nombre = 'Coordinación del Módulo Canino'),
       7, 'Porcentaje', v.frecuencia,
       'Gestión', 'Eficacia', 'Regular', v.mv, v.interpretacion, true
FROM (VALUES
  ('E6-MC-C5-01',
   'Porcentaje de acciones de control y bienestar animal ejecutadas respecto a las programadas.',
   'Componente 5', 'Trimestral',
   'Programa Operativo Anual de la Coordinación del Módulo Canino; informes trimestrales; bitácoras de servicio y evidencias fotográficas.',
   'Mide el avance del conjunto de acciones de control y bienestar animal ejecutadas en el ejercicio respecto a las programadas.'),
  ('E6-MC-A5.1-01',
   'Porcentaje de esterilizaciones y vacunaciones antirrábicas caninas y felinas aplicadas respecto a las programadas.',
   'Actividad 5.1', 'Mensual',
   'Bitácoras de campaña; registros de vacunación antirrábica; reportes al sector salud; evidencias fotográficas.',
   'Evalúa la cobertura alcanzada por las campañas de esterilización y vacunación antirrábica respecto a la meta programada en el ejercicio.'),
  ('E6-MC-A5.2-01',
   'Porcentaje de acciones de control de población animal en situación de calle y de tenencia responsable realizadas respecto a las programadas.',
   'Actividad 5.2', 'Mensual',
   'Bitácoras de captura y resguardo; registros de adopción; listas de asistencia de las campañas de tenencia responsable; reportes de atención a denuncias.',
   'Mide el cumplimiento del programa de captura, resguardo, adopción y difusión de la tenencia responsable de animales de compañía.')
) AS v(clave, nombre, nivel, frecuencia, mv, interpretacion);

-- 3) Árbol de Objetivos: Componente 5 (MEDIO hijo directo del Objetivo central
--    id=793) con área responsable = Coordinación del Módulo Canino.
WITH comp AS (
  INSERT INTO arbol_nodos
    (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
     area_responsable_id, supuestos, medios_verificacion)
  SELECT 7, 2027, 'OBJETIVOS', 'MEDIO',
         (SELECT id FROM arbol_nodos WHERE programa_id=7 AND anio=2027
            AND arbol='OBJETIVOS' AND tipo='OBJETIVO' AND padre_id IS NULL),
         5,
         'Control y bienestar animal atendido mediante el Módulo Canino municipal',
         (SELECT id FROM indicadores WHERE clave='E6-MC-C5-01'),
         (SELECT id FROM areas WHERE nombre='Coordinación del Módulo Canino'),
         'Se mantiene la coordinación con las autoridades estatales de salud para el abasto de biológico e insumos; la población acude a las campañas convocadas.',
         'Programa Operativo Anual de la Coordinación del Módulo Canino; informes trimestrales; bitácoras de servicio y evidencias fotográficas.'
  RETURNING id
)
INSERT INTO arbol_nodos
  (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
   area_responsable_id, supuestos, medios_verificacion)
SELECT 7, 2027, 'OBJETIVOS', 'MEDIO', comp.id, v.orden, v.texto,
       (SELECT id FROM indicadores WHERE clave = v.clave),
       NULL, v.supuestos, v.mv
FROM comp, (VALUES
  (1, 'Campañas permanentes de esterilización y vacunación antirrábica canina y felina', 'E6-MC-A5.1-01',
      'Se cuenta con el abasto de biológico, material quirúrgico y personal médico veterinario; las jornadas se realizan en las fechas convocadas.',
      'Bitácoras de campaña; registros de vacunación antirrábica; reportes al sector salud; evidencias fotográficas.'),
  (2, 'Población animal en situación de calle controlada y cultura de tenencia responsable promovida', 'E6-MC-A5.2-01',
      'La ciudadanía reporta y participa en los programas de adopción; se dispone de espacio de resguardo en condiciones adecuadas.',
      'Bitácoras de captura y resguardo; registros de adopción; listas de asistencia de las campañas de tenencia responsable; reportes de atención a denuncias.')
) AS v(orden, texto, clave, supuestos, mv);

-- 4) Árbol del Problema: Causa 5 espejo (hija del problema central id=771) con
--    sus 2 subcausas — espejo negativo de los Medios de arriba.
WITH causa AS (
  INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2027, 'PROBLEMA', 'CAUSA',
         (SELECT id FROM arbol_nodos WHERE programa_id=7 AND anio=2027
            AND arbol='PROBLEMA' AND tipo='CENTRAL' AND padre_id IS NULL),
         5, 'Sobrepoblación de animales de compañía en situación de calle sin control sanitario'
  RETURNING id
)
INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 7, 2027, 'PROBLEMA', 'CAUSA', causa.id, v.orden, v.texto
FROM causa, (VALUES
  (1, 'Cobertura insuficiente de esterilización y de vacunación antirrábica'),
  (2, 'Ausencia de control de la población animal en situación de calle y escasa cultura de tenencia responsable')
) AS v(orden, texto);

-- 5) Diagnóstico 2027 del programa: la fila orden=5 es el resumen de
--    "Consecuencias / Impacto esperado", así que se recorre a 6 y la nueva
--    problemática temática entra como orden 5.
UPDATE diagnostico_programa SET orden = 6
 WHERE programa_id = 7 AND anio = 2027 AND orden = 5;

INSERT INTO diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada)
VALUES (7, 2027, 5,
  'Sobrepoblación de animales de compañía en situación de calle, con cobertura limitada de esterilización y vacunación antirrábica y escasa cultura de tenencia responsable.',
  'Operación permanente del Módulo Canino con campañas de esterilización y vacunación antirrábica, control de la población animal en situación de calle y promoción de la adopción y la tenencia responsable.');

COMMIT;

-- ============================================================
-- PARTE OPCIONAL — etiquetado de área de los Componentes 1-4 ya existentes.
--
-- Hoy NINGÚN nodo del árbol 2027 del 032 tiene area_responsable_id, y tanto el
-- reporte de avance de captura MML (v_avance_mml_areas / v_mml_captura_nivel)
-- como el permiso de edición del enlace en la pantalla se resuelven por ese
-- campo. Sin esto, tras aplicar lo de arriba el Módulo Canino aparecerá en el
-- reporte por área pero Ecología y Servicios Municipales seguirán sin aparecer.
-- No cambia ningún texto del expediente: solo asigna responsable.
-- ============================================================

-- BEGIN;
-- UPDATE arbol_nodos SET area_responsable_id = 22
--  WHERE programa_id=7 AND anio=2027 AND arbol='OBJETIVOS' AND id IN (796, 798, 799);  -- C1, C2, C3 -> Ecología
-- UPDATE arbol_nodos SET area_responsable_id = 23
--  WHERE programa_id=7 AND anio=2027 AND arbol='OBJETIVOS' AND id = 801;               -- C4 -> Servicios Municipales
-- COMMIT;

-- ── Verificación posterior ──────────────────────────────────────────────────
-- SELECT n.id, n.arbol, n.tipo, n.padre_id, n.orden, n.texto, i.clave, i.nivel_mir, a.nombre AS area
-- FROM arbol_nodos n
-- LEFT JOIN indicadores i ON i.id = n.indicador_id
-- LEFT JOIN areas a ON a.id = n.area_responsable_id
-- WHERE n.programa_id=7 AND n.anio=2027 AND n.id > 814 ORDER BY n.arbol DESC, n.id;
