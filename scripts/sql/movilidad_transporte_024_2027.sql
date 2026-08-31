-- ============================================================
-- Integración de MOVILIDAD Y TRANSPORTE al Eje 3 / Programa Presupuestal 024
-- Ejercicio 2027 — Expediente MML
-- programa_id = 6 (clave '024'), eje_id = 3 (E3), anio = 2027, area_id = 37
--
-- Parte 1 (YA APLICADA en producción el 2026-08-27): alta del área en el
--   catálogo. Se deja documentada aquí, comentada, para trazabilidad.
-- Parte 2 (YA APLICADA en producción el 2026-08-31, aprobada por Hugo):
--   Componente 3 propio del área en el Árbol de Objetivos 2027 + su Causa
--   espejo en el Árbol del Problema + los 4 indicadores (1 Componente +
--   3 Actividades) vinculados. NO RE-EJECUTAR.
--   ids resultantes: indicadores 187-190; arbol_nodos 867 (Componente 3),
--   868-870 (Actividades 3.1-3.3), 871 (Causa 3), 872-874 (subcausas).
--
-- ORIGEN DE LA NARRATIVA (2026-08-31): documento OFICIAL del área,
--   "MML_Programa_Movilidad_Apizaco.xlsx", hoja única "MML":
--     "Matriz de Marco Lógico (MML) — Programa: Movilidad Urbana Sostenible de
--      Apizaco — Metas al cierre del ejercicio 2027"
--   con 1 Componente y 3 Actividades. Resumen narrativo, indicador, fórmula,
--   medios de verificación y supuestos se toman VERBATIM de ese archivo.
--   (Esta versión SUSTITUYE la propuesta anterior de 1 Componente + 4
--    Actividades que yo había redactado el 2026-08-27 y que nunca se aplicó.)
--
-- ADAPTACIONES respecto al Excel (únicos cambios al texto oficial):
--   a) RENUMERACIÓN. El Excel numera "COMPONENTE 1 / ACTIVIDAD 1.1-1.3" porque
--      está aislado. Dentro del 024 los Componentes 1 y 2 ya están tomados
--      (1 = Obras Públicas, nodo 753; 2 = Imagen Urbana, nodo 755), así que al
--      área le corresponde el Componente 3 y las Actividades 3.1 a 3.3.
--   b) La fórmula del Componente en el Excel es una copia literal del nombre
--      del indicador; se redacta como cociente para que la Ficha de Indicador
--      tenga una fórmula real.
--   c) En la fórmula de la Actividad 1.3 el Excel trae la palabra suelta
--      "campaña" al final ("Número de mesas de trabajo realizadas. campaña");
--      se omite por ser evidente errata de captura.
--   d) La "Meta 2027" del Excel no se siembra en `metas` (el POA lo captura el
--      enlace del área); se conserva escrita dentro de `interpretacion` para
--      que no se pierda.
--
-- PENDIENTE QUE ESTE EXPEDIENTE NO CIERRA: el renglón 4 del diagnóstico 2027
--   (diagnostico_programa id=80) pide además "ordenamiento territorial
--   actualizado y normativas modernas"; la MML oficial del área no lo cubre.
--   Queda sin Causa/Medio que lo atienda.
--
-- Convenciones respetadas (verificadas contra los ids 47-61 y 114-131):
--   · clave de indicador: E3-{AREA}-C{n}-01 / E3-{AREA}-A{n}.{m}-01.
--     OP = Obras Públicas, IU = Imagen Urbana -> MT = Movilidad y Transporte.
--   · Componente: frecuencia Trimestral; Actividad: Mensual.
--     Todos: Gestión / Eficacia / Regular.
--   · unidad_medida sigue al indicador oficial: el Componente es Porcentaje;
--     las tres Actividades son conteos absolutos, así que usan unidad singular
--     ('Parada', 'Acción', 'Mesa de trabajo') igual que los 'Documento' /
--     'Reunión' / 'Evento' que ya existen en el catálogo.
--   · El `texto` de Medios y Actividades NUNCA lleva número — el renderer del
--     PDF/Excel lo antepone solo (regla del piloto 021).
--   · area_responsable_id solo en el Componente; las Actividades la heredan
--     vía get_area_efectiva_nodo() / v_mml_niveles (fase_mml_09).
--   · No se agrega FIN ni EFECTO: el Fin 754 "Incremento en la movilidad y
--     conectividad urbana" (y su Efecto espejo 734) ya existen y son a los que
--     alimenta este Componente.
-- ============================================================

-- ── Parte 1 — YA APLICADA (2026-08-27), no re-ejecutar ──────────────────────
-- INSERT INTO areas (nombre, eje_id, programa_id, num_indicadores_mir, activo)
-- VALUES ('Movilidad y Transporte', 3, 6, 0, true);   -- -> id = 37

-- ── Parte 2 — YA APLICADA (2026-08-31), no re-ejecutar ──────────────────────
BEGIN;

-- 1) Indicadores del Componente 3 y sus 3 Actividades (Excel oficial).
INSERT INTO indicadores
  (clave, nombre, nivel_mir, area_id, programa_id, unidad_medida, frecuencia,
   tipo_indicador, dimension, sentido, formula, medios_verificacion,
   interpretacion, activo)
SELECT v.clave, v.nombre, v.nivel, 37, 6, v.unidad, v.frecuencia,
       'Gestión', 'Eficacia', 'Regular', v.formula, v.mv, v.interpretacion, true
FROM (VALUES
  ('E3-MT-C3-01',
   'Porcentaje de acciones para el fortalecimiento de la movilidad urbana realizadas.',
   'Componente 3', 'Porcentaje', 'Trimestral',
   '(Acciones para el fortalecimiento de la movilidad urbana realizadas / Acciones programadas) x 100',
   'Informes de actividades, reportes de campo, evidencia fotográfica, publicaciones, listas de asistencia, minutas y reportes de seguimiento.',
   'Mide el avance del conjunto de acciones de movilidad urbana y seguridad vial realizadas respecto a las programadas. Meta al cierre del ejercicio 2027: 100% de las acciones programadas.'),
  ('E3-MT-A3.1-01',
   'Número de paradas de transporte público señalizadas.',
   'Actividad 3.1', 'Parada', 'Mensual',
   'Número de paradas de transporte público con señalización vertical y/o horizontal implementada.',
   'Inventario de paradas, reportes de campo, evidencia fotográfica, bitácoras de trabajo y reportes de señalización.',
   'Cuantifica las paradas de transporte público que quedaron señalizadas en el ejercicio. Meta al cierre del ejercicio 2027: 20 paradas señalizadas.'),
  ('E3-MT-A3.2-01',
   'Número de acciones de fomento de cultura vial realizadas.',
   'Actividad 3.2', 'Acción', 'Mensual',
   'Número de pláticas y campañas de difusión realizadas.',
   'Listas de asistencia, fotografías, materiales de difusión, publicaciones en redes sociales, estadísticas de alcance y reportes de actividades.',
   'Cuantifica las pláticas de sensibilización y campañas de difusión en materia de cultura vial realizadas en el ejercicio. Meta al cierre del ejercicio 2027: 12 acciones de cultura vial.'),
  ('E3-MT-A3.3-01',
   'Número de mesas de trabajo realizadas con concesionarios.',
   'Actividad 3.3', 'Mesa de trabajo', 'Mensual',
   'Número de mesas de trabajo realizadas.',
   'Convocatorias, listas de asistencia, minutas, acuerdos, fotografías y reportes de seguimiento.',
   'Cuantifica las mesas de trabajo celebradas con concesionarios y prestadores del servicio de transporte público. Meta al cierre del ejercicio 2027: 3 mesas de trabajo.')
) AS v(clave, nombre, nivel, unidad, frecuencia, formula, mv, interpretacion);

-- 2) Árbol de Objetivos: Componente 3 (MEDIO hijo directo del Objetivo central
--    id=751) con área responsable = Movilidad y Transporte (37), y sus 3
--    Actividades colgando de él. Resumen narrativo y supuestos: Excel oficial.
WITH comp AS (
  INSERT INTO arbol_nodos
    (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
     area_responsable_id, supuestos, medios_verificacion)
  SELECT 6, 2027, 'OBJETIVOS', 'MEDIO',
         (SELECT id FROM arbol_nodos WHERE programa_id=6 AND anio=2027
            AND arbol='OBJETIVOS' AND tipo='OBJETIVO' AND padre_id IS NULL),
         3,
         'Contribuir al fortalecimiento de la movilidad urbana y la seguridad vial mediante el mejoramiento de la señalización de paradas, el fomento de una cultura vial y la coordinación con concesionarios del transporte público.',
         (SELECT id FROM indicadores WHERE clave='E3-MT-C3-01'),
         37,
         'Disponibilidad de recursos y participación de ciudadanía, transportistas y concesionarios en las acciones programadas.',
         'Informes de actividades, reportes de campo, evidencia fotográfica, publicaciones, listas de asistencia, minutas y reportes de seguimiento.'
  RETURNING id
)
INSERT INTO arbol_nodos
  (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id,
   area_responsable_id, supuestos, medios_verificacion)
SELECT 6, 2027, 'OBJETIVOS', 'MEDIO', comp.id, v.orden, v.texto,
       (SELECT id FROM indicadores WHERE clave = v.clave),
       NULL, v.supuestos, v.mv
FROM comp, (VALUES
  (1, 'Implementar señalización vertical y horizontal en paradas de transporte público para facilitar su identificación, ordenar el ascenso y descenso de usuarios y contribuir a una movilidad más segura para la ciudadanía.',
      'E3-MT-A3.1-01',
      'Disponibilidad de materiales, condiciones físicas adecuadas y coordinación con las áreas municipales involucradas.',
      'Inventario de paradas, reportes de campo, evidencia fotográfica, bitácoras de trabajo y reportes de señalización.'),
  (2, 'Fomentar una cultura vial responsable en la ciudadanía y entre los transportistas mediante pláticas de sensibilización y difusión de contenidos relacionados con seguridad vial, respeto a las normas y convivencia entre los usuarios de la vía.',
      'E3-MT-A3.2-01',
      'Participación de ciudadanía y transportistas, así como disponibilidad de espacios y medios para realizar las actividades.',
      'Listas de asistencia, fotografías, materiales de difusión, publicaciones en redes sociales, estadísticas de alcance y reportes de actividades.'),
  (3, 'Coordinar mesas de trabajo con concesionarios y prestadores del servicio de transporte público para identificar problemáticas, establecer acuerdos y promover acciones de mejora en la operación del servicio.',
      'E3-MT-A3.3-01',
      'Participación y disposición de concesionarios y prestadores del servicio para establecer acuerdos.',
      'Convocatorias, listas de asistencia, minutas, acuerdos, fotografías y reportes de seguimiento.')
) AS v(orden, texto, clave, supuestos, mv);

-- 3) Árbol del Problema: Causa 3 espejo (hija del problema central id=731) con
--    sus 3 subcausas — espejo negativo de los Medios de arriba.
WITH causa AS (
  INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2027, 'PROBLEMA', 'CAUSA',
         (SELECT id FROM arbol_nodos WHERE programa_id=6 AND anio=2027
            AND arbol='PROBLEMA' AND tipo='CENTRAL' AND padre_id IS NULL),
         3,
         'Movilidad urbana y seguridad vial debilitadas por señalización deficiente de paradas, escasa cultura vial y falta de coordinación con los concesionarios del transporte público.'
  RETURNING id
)
INSERT INTO arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 6, 2027, 'PROBLEMA', 'CAUSA', causa.id, v.orden, v.texto
FROM causa, (VALUES
  (1, 'Paradas de transporte público sin señalización vertical ni horizontal, lo que dificulta su identificación y desordena el ascenso y descenso de usuarios.'),
  (2, 'Escasa cultura vial en la ciudadanía y entre los transportistas.'),
  (3, 'Falta de coordinación con concesionarios y prestadores del servicio de transporte público.')
) AS v(orden, texto);

-- 4) Conteo denormalizado del catálogo de áreas (1 Componente + 3 Actividades).
UPDATE areas SET num_indicadores_mir = 4 WHERE id = 37;

COMMIT;

-- ── Verificación posterior ──────────────────────────────────────────────────
-- SELECT n.id, n.arbol, n.tipo, n.padre_id, n.orden, n.texto, i.clave,
--        i.unidad_medida, i.formula, a.nombre AS area
-- FROM arbol_nodos n
-- LEFT JOIN indicadores i ON i.id = n.indicador_id
-- LEFT JOIN areas a ON a.id = n.area_responsable_id
-- WHERE n.programa_id=6 AND n.anio=2027
--   AND (i.clave LIKE 'E3-MT-%' OR n.texto ILIKE '%movilidad urbana y seguridad vial%')
-- ORDER BY n.arbol, n.id;
