-- ============================================================
-- Integración de MOVILIDAD Y TRANSPORTE al Eje 3 / Programa Presupuestal 024
-- Ejercicio 2027 — Expediente MML
-- programa_id = 6 (clave '024'), eje_id = 3 (E3), anio = 2027
--
-- Parte 1 (YA APLICADA en producción el 2026-08-27): alta del área en el
--   catálogo. Se deja documentada aquí, comentada, para trazabilidad.
-- Parte 2 (PENDIENTE DE APROBACIÓN DE HUGO): Componente 3 propio del área en
--   el Árbol de Objetivos 2027 + su Causa espejo en el Árbol del Problema +
--   los 5 indicadores (1 Componente + 4 Actividades) vinculados.
--
-- ORIGEN DE LA NARRATIVA DE LA PARTE 2: es una PROPUESTA redactada a partir
--   del material que ya existe en el propio expediente 2027 del 024 — NO viene
--   de un documento oficial del área. Base usada:
--     · diagnostico_programa id=80 (anio 2027, orden 4): "Movilidad urbana no
--       sustentable y rezago en planeación urbana." -> "Incorporar un modelo de
--       movilidad urbana sustentable con ordenamiento territorial actualizado
--       y normativas modernas."  <- es la ÚNICA fila del diagnóstico 2027 sin
--       Causa/Medio que la atienda en el árbol; de ahí cuelga este Componente.
--     · Efecto 734 / Fin 754 ya existentes: "Reducción / Incremento en la
--       movilidad y conectividad urbana" — el Componente nuevo alimenta ese
--       Fin, por eso NO se agrega Efecto ni Fin nuevo.
--   Hugo debe sustituir los textos por los oficiales del área antes de aplicar,
--   o confirmar la propuesta tal cual (después son editables en pantalla).
--
-- Convenciones respetadas (verificadas contra los ids 47-61 ya sembrados):
--   · clave de indicador: E3-{AREA}-C{n}-01 / E3-{AREA}-A{n}.{m}-01.
--     OP = Obras Públicas, IU = Imagen Urbana -> MT = Movilidad y Transporte.
--   · Componente: frecuencia Trimestral; Actividad: Mensual.
--     Ambos: Gestión / Eficacia / Regular / Porcentaje.
--   · El `texto` de Medios y Actividades NUNCA lleva número — el renderer del
--     PDF/Excel lo antepone solo (regla del piloto 021).
--   · area_responsable_id solo en el Componente; las Actividades la heredan
--     vía get_area_efectiva_nodo() (fase_mml_09).
--   · Sin filas en `metas`: el POA 2027 lo captura el enlace del área.
-- ============================================================

-- ── Parte 1 — YA APLICADA (2026-08-27), no re-ejecutar ──────────────────────
-- INSERT INTO areas (nombre, eje_id, programa_id, num_indicadores_mir, activo)
-- VALUES ('Movilidad y Transporte', 3, 6, 0, true);   -- -> id = 37

-- ── Parte 2 — PENDIENTE ─────────────────────────────────────────────────────
BEGIN;

-- 1) Indicadores del Componente 3 y sus 4 Actividades.
INSERT INTO indicadores
  (clave, nombre, nivel_mir, area_id, programa_id, unidad_medida, frecuencia,
   tipo_indicador, dimension, sentido, medios_verificacion, interpretacion, activo)
VALUES
  ('E3-MT-C3-01',
   'Porcentaje de acciones de movilidad urbana sustentable ejecutadas respecto a las programadas.',
   'Componente 3', 37, 6, 'Porcentaje', 'Trimestral',
   'Gestión', 'Eficacia', 'Regular',
   'Programa Operativo Anual de Movilidad y Transporte; informes trimestrales de la Coordinación; evidencias fotográficas.',
   'Mide el avance del conjunto de acciones de movilidad urbana sustentable ejecutadas en el ejercicio respecto a las programadas.',
   true),
  ('E3-MT-A3.1-01',
   'Porcentaje de señalamientos viales instalados o rehabilitados respecto al total programado.',
   'Actividad 3.1', 37, 6, 'Porcentaje', 'Mensual',
   'Gestión', 'Eficacia', 'Regular',
   'Inventario de señalización vial; órdenes de trabajo; evidencias fotográficas.',
   'Evalúa la cobertura de señalización vial horizontal y vertical atendida respecto a la programada en el ejercicio.',
   true),
  ('E3-MT-A3.2-01',
   'Porcentaje de operativos de ordenamiento vial y de transporte realizados respecto a los programados.',
   'Actividad 3.2', 37, 6, 'Porcentaje', 'Mensual',
   'Gestión', 'Eficacia', 'Regular',
   'Bitácoras de operativos; reportes de la Coordinación de Movilidad y Transporte; actas de coordinación con Seguridad Pública.',
   'Mide el cumplimiento del programa de operativos de ordenamiento del transporte público y del uso de la vía pública.',
   true),
  ('E3-MT-A3.3-01',
   'Porcentaje de avance en la elaboración del Programa Municipal de Movilidad Urbana Sustentable.',
   'Actividad 3.3', 37, 6, 'Porcentaje', 'Mensual',
   'Gestión', 'Eficacia', 'Regular',
   'Documento del Programa Municipal de Movilidad; minutas de trabajo; publicación en la Gaceta Municipal.',
   'Refleja el grado de avance en la formulación del instrumento de planeación de la movilidad urbana del municipio.',
   true),
  ('E3-MT-A3.4-01',
   'Porcentaje de acciones de educación y cultura vial realizadas respecto a las programadas.',
   'Actividad 3.4', 37, 6, 'Porcentaje', 'Mensual',
   'Gestión', 'Eficacia', 'Regular',
   'Listas de asistencia; programa de capacitación; evidencias fotográficas y reportes de la Coordinación.',
   'Mide el cumplimiento del programa de campañas y talleres de educación vial dirigidos a la población.',
   true);

-- 2) Árbol de Objetivos: Componente 3 (MEDIO hijo directo del Objetivo central
--    id=751) con área responsable = Movilidad y Transporte (37).
WITH comp AS (
  INSERT INTO arbol_nodos
    (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
     area_responsable_id, supuestos, medios_verificacion)
  SELECT 6, 2027, 'OBJETIVOS', 'MEDIO',
         (SELECT id FROM arbol_nodos WHERE programa_id=6 AND anio=2027
            AND arbol='OBJETIVOS' AND tipo='OBJETIVO' AND padre_id IS NULL),
         3,
         'Movilidad urbana ordenada y sustentable en el municipio',
         (SELECT id FROM indicadores WHERE clave='E3-MT-C3-01'),
         37,
         'Se mantiene la coordinación con las autoridades estatales de movilidad y transporte; no existen recortes presupuestales.',
         'Programa Operativo Anual de Movilidad y Transporte; informes trimestrales de la Coordinación; evidencias fotográficas.'
  RETURNING id
)
INSERT INTO arbol_nodos
  (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
   area_responsable_id, supuestos, medios_verificacion)
SELECT 6, 2027, 'OBJETIVOS', 'MEDIO', comp.id, v.orden, v.texto,
       (SELECT id FROM indicadores WHERE clave = v.clave),
       NULL, v.supuestos, v.mv
FROM comp, (VALUES
  (1, 'Señalización vial horizontal y vertical instalada y con mantenimiento', 'E3-MT-A3.1-01',
      'Se cuenta con el suministro de materiales en tiempo y las vías permanecen transitables para su intervención.',
      'Inventario de señalización vial; órdenes de trabajo; evidencias fotográficas.'),
  (2, 'Ordenamiento del transporte público y del uso de la vía pública', 'E3-MT-A3.2-01',
      'Los concesionarios y usuarios de la vía pública atienden las disposiciones municipales; hay respaldo de Seguridad Pública en los operativos.',
      'Bitácoras de operativos; reportes de la Coordinación de Movilidad y Transporte; actas de coordinación con Seguridad Pública.'),
  (3, 'Programa Municipal de Movilidad Urbana Sustentable elaborado', 'E3-MT-A3.3-01',
      'Se dispone de la información técnica y territorial necesaria; las áreas involucradas participan en la formulación.',
      'Documento del Programa Municipal de Movilidad; minutas de trabajo; publicación en la Gaceta Municipal.'),
  (4, 'Cultura vial y educación para la movilidad promovida en la población', 'E3-MT-A3.4-01',
      'La población y los centros escolares participan en las campañas convocadas.',
      'Listas de asistencia; programa de capacitación; evidencias fotográficas y reportes de la Coordinación.')
) AS v(orden, texto, clave, supuestos, mv);

-- 3) Árbol del Problema: Causa 3 espejo (hija del problema central id=731) con
--    sus 4 subcausas — espejo negativo de los Medios de arriba.
WITH causa AS (
  INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2027, 'PROBLEMA', 'CAUSA',
         (SELECT id FROM arbol_nodos WHERE programa_id=6 AND anio=2027
            AND arbol='PROBLEMA' AND tipo='CENTRAL' AND padre_id IS NULL),
         3, 'Movilidad urbana desordenada y no sustentable'
  RETURNING id
)
INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 6, 2027, 'PROBLEMA', 'CAUSA', causa.id, v.orden, v.texto
FROM causa, (VALUES
  (1, 'Señalización vial insuficiente o deteriorada'),
  (2, 'Transporte público y uso de la vía pública sin ordenamiento'),
  (3, 'Ausencia de un Programa Municipal de Movilidad Urbana Sustentable'),
  (4, 'Escasa cultura vial en la población')
) AS v(orden, texto);

-- 4) Conteo denormalizado del catálogo de áreas (1 Componente + 4 Actividades).
UPDATE areas SET num_indicadores_mir = 5 WHERE id = 37;

COMMIT;

-- ── Verificación posterior ──────────────────────────────────────────────────
-- SELECT n.id, n.tipo, n.padre_id, n.orden, n.texto, i.clave, a.nombre AS area
-- FROM arbol_nodos n
-- LEFT JOIN indicadores i ON i.id = n.indicador_id
-- LEFT JOIN areas a ON a.id = n.area_responsable_id
-- WHERE n.programa_id=6 AND n.anio=2027 AND i.clave LIKE 'E3-MT-%' ORDER BY n.id;
