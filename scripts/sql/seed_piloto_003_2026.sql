-- ============================================================
-- SEED PILOTO 003 — contenido 2026 del módulo MML
-- Fuente: "1. 003 PROCURACIÒN Y DEFENSA DE LOS INTERESES MPALES.pdf"
--   (POA 2026\PROGRAMATICOS PRESUPUESTO TESORERIA)
-- Script SQL revisable (NO migración) — paso 4 de docs/DISENO_MIGRACION_MML.md
-- programa_id = 1 (clave '003'), anio = 2026
--
-- ANOMALÍAS CONOCIDAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  A) PP-FM-08 (Acciones) y PP-FM-09 (Alternativas) del PDF oficial contienen
--     contenido de OTRO programa (Presidencia/Comunicación Social: difusión a
--     medios, acercamiento a zonas prioritarias), no de Sindicatura/Jurídico.
--     Hugo decidió (2026-07-22): sembrar tal cual dice el PDF, fiel a la fuente
--     oficial, a corregir después con Sindicatura antes de captura 2027.
--  B) Indicador con nombre duplicado entre Rastro y Obras Públicas
--     (E2-RAS-A1.2-01 / E3-OP-A1.2-01) — no relacionado a 003, sin resolver,
--     no bloquea este seed.
--  C) La ficha individual de "Disminución de Laudos laborales" (FIN) marca
--     Sentido=Descendente; la tabla-resumen MIR del mismo PDF dice Ascendente.
--     Se usa Descendente (ficha individual + lógica: menos laudos = mejor).
--  D) unidad_medida en indicador_variables: el PDF usa "Porcentaje" hasta para
--     conteos absolutos (ej. "Número de laudos"). Se corrige a la unidad REAL
--     por diseño explícito (DISENO_MIGRACION_MML.md §2.3) — no es alteración
--     de datos, es la corrección que esa tabla existe para hacer.
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada)
VALUES (
  1, 2026, 1,
  'En el Municipio de Apizaco Tlaxcala Existe un incremento de las demandas Jurisdiccionales, Laborales y administrativas, que afectan las finanzas y el patrimonio del Municipio.',
  'El Municipio de Apizaco Tlaxcala promueve la disminución de los laudos y sentencias en contra del H. Ayuntamiento mediante acciones que eviten estas situaciones, así como la delimitación del Territorio Municipal y la actualización del inventario de los bienes patrimoniales del Municipio.'
);

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (1, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Deficiente atención institucional por parte de las dependencias e instancias de la administración municipal')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Mayor riesgo de sanciones y pérdidas legales para el municipio.'
  FROM central
  RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Procesos administrativos y judiciales ineficaces.'),
    (2, 'Baja confianza ciudadana en la administración municipal.'),
    (3, 'Problemas en la ejecución y validez de actos de gobierno.'),
    (4, 'Deterioro de la gobernabilidad y legitimidad municipal.'),
    (5, 'Incremento de costos legales y administrativos.'),
    (6, 'Menor capacidad institucional para atraer inversión y programas.'),
    (7, 'Percepción negativa y desgaste institucional ante la ciudadanía.')
  ) AS v(orden, texto)
  RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', central.id, 1,
    'Débil cultura de legalidad y desconocimiento de atribuciones'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', central.id, 2,
    'Escasa profesionalización del personal jurídico municipal.'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', central.id, 3,
    'Insuficiente normatividad actualizada y mecanismos internos de control.'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', central.id, 4,
    'Limitada articulación con instancias federales y estatales en materia jurídica.'
  FROM central RETURNING id
),
subcausa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', causa1.id, 1,
    'Falta de procedimientos institucionalizados para la defensa jurídica.'
  FROM causa1 RETURNING id
),
subcausa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', causa2.id, 1,
    'Capacitación insuficiente para servidores públicos en normatividad municipal.'
  FROM causa2 RETURNING id
),
subcausa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'PROBLEMA', 'CAUSA', causa3.id, 1,
    'Insuficiente sistematización y resguardo de expedientes legales.'
  FROM causa3 RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 1, 2026, 'PROBLEMA', 'CAUSA', causa4.id, 1,
  'Deficiente coordinación entre dependencias para la gestión jurídica.'
FROM causa4;

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (1, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Gestión jurídica eficiente y representación efectiva de los intereses municipales.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Reducción del riesgo jurídico y fortalecimiento de la defensa legal del municipio.'
  FROM central
  RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Procesos administrativos y judiciales eficientes y transparentes.'),
    (2, 'Incremento de la confianza ciudadana en la administración municipal.'),
    (3, 'Legalidad y validez institucional en los actos de gobierno.'),
    (4, 'Gobernabilidad y legitimidad fortalecidas.'),
    (5, 'Reducción de costos legales y administrativos.'),
    (6, 'Mayor capacidad institucional para atraer inversión y programas.'),
    (7, 'Imagen positiva y confiable del gobierno municipal.')
  ) AS v(orden, texto)
  RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Cultura de legalidad fortalecida entre autoridades y ciudadanía'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Profesionalización permanente del personal jurídico del municipio'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Marco normativo actualizado y mecanismos internos de control efectivos'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Articulación sólida con instancias federales, estatales y sociales en materia jurídica'
  FROM central RETURNING id
),
submedio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, 1,
    'Existen mecanismos de acercamiento de la población con zonas prioritarias.'
  FROM medio1 RETURNING id
),
submedio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, 1,
    'Cultura del servidor publico en temas de atención, falta de cursos.'
  FROM medio2 RETURNING id
),
submedio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, 1,
    'Existen mecanismo de acuerdos.'
  FROM medio3 RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 1, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, 1,
  'Existen los mecanismos suficientes de participación ciudadana.'
FROM medio4;

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (1, 2026, 'BENEFICIARIO', 'H. Ayuntamiento de Apizaco Tlaxcala', 1),
  (1, 2026, 'BENEFICIARIO', 'Habitantes del Municipio', 2),
  (1, 2026, 'EJECUTOR', 'Síndico Municipal', 1),
  (1, 2026, 'EJECUTOR', 'Jurídico', 2),
  (1, 2026, 'OPOSITOR', 'Municipios Colindantes', 1),
  (1, 2026, 'OPOSITOR', 'Actores de los juicios', 2),
  (1, 2026, 'OPOSITOR', 'Sectores políticos opositores', 3),
  (1, 2026, 'INDIFERENTE', 'Empresas', 1),
  (1, 2026, 'INDIFERENTE', 'Ciudadanos que tiene propiedades pero no radican aquí', 2);

-- ---------- 5. acciones_alternativas (PP-FM-08/09) ----------
-- ANOMALÍA A: contenido literal del PDF, no corresponde temáticamente a
-- Sindicatura/Jurídico (ver encabezado). medio_id = NULL: no hay un MEDIO
-- correspondiente en el árbol de objetivos real de 003 (los "medios" de este
-- formato pertenecen a un objetivo distinto, "Eficiente atención institucional
-- por parte de las dependencias..."). seleccionada = true en las 5: el PDF
-- presenta una sola alternativa combinando las 5 (no hay alternativas rivales).
INSERT INTO public.acciones_alternativas (programa_id, anio, medio_id, texto, seleccionada, justificacion, orden) VALUES
  (1, 2026, NULL::numeric,'Existen mecanismos de acercamiento de la población con zonas prioritarias', true, NULL, 1),
  (1, 2026, NULL::numeric,'Cultura del servidor publico en temas de atención, falta de cursos.', true, NULL, 2),
  (1, 2026, NULL::numeric,'Existen mecanismo de acuerdos.', true, NULL, 3),
  (1, 2026, NULL::numeric,'Existen los mecanismos suficientes de participación ciudadana.', true, NULL, 4),
  (1, 2026, NULL::numeric,'Aprovechamiento de los medios de difusión', true, NULL, 5);

-- ---------- 6. mir_niveles — resumen_narrativo + supuestos (PP-FM-0E) ----------
UPDATE public.mir_niveles SET
  resumen_narrativo = 'Gobernabilidad y legitimidad fortalecidas a través de una gestión jurídica eficiente y transparente.',
  supuestos = 'Los intereses del municipio se ven afectados por el alto número de Laudos Laborales Municipal.'
WHERE id = 70;

UPDATE public.mir_niveles SET
  resumen_narrativo = 'Gestión jurídica eficiente y representación efectiva de los intereses municipales.',
  supuestos = 'Las demandas jurisdiccionales, laborales y administrativas no son condenatarias para el Municipio'
WHERE id = 71;

UPDATE public.mir_niveles SET
  resumen_narrativo = '1. Programa de capacitación y difusión en materia de atribuciones y facultades municipales implementado.',
  supuestos = 'El personal y la ciudadanía muestran disposición para participar en las capacitaciones.'
WHERE id = 98;

UPDATE public.mir_niveles SET
  resumen_narrativo = '2. Plan anual de formación jurídica continua para el personal de la Sindicatura ejecutado.',
  supuestos = 'Se cuenta con recursos presupuestales y disponibilidad del personal.'
WHERE id = 99;

UPDATE public.mir_niveles SET
  resumen_narrativo = '3. Marco normativo actualizado y difundido a todas las áreas del Ayuntamiento.',
  supuestos = 'El Cabildo y dependencias municipales aprueban las actualizaciones normativas sin retrasos.'
WHERE id = 100;

UPDATE public.mir_niveles SET
  resumen_narrativo = '4. Convenios de colaboración jurídica con instancias federales, estatales y sociales formalizados.',
  supuestos = 'Las contrapartes institucionales mantienen disposición para colaborar con el municipio.'
WHERE id = 101;

UPDATE public.mir_niveles SET
  resumen_narrativo = '1.1 Realizar talleres y campañas informativas sobre normatividad y facultades municipales.',
  supuestos = 'Se mantiene la participación de las áreas operativas y de Comunicación Social.'
WHERE id = 160;

UPDATE public.mir_niveles SET
  resumen_narrativo = '2.1 Implementar cursos, diplomados o asesorías jurídicas especializadas.',
  supuestos = 'Las instituciones formadoras o ponentes mantienen disponibilidad y cobertura.'
WHERE id = 161;

UPDATE public.mir_niveles SET
  resumen_narrativo = '3.1 Revisar, actualizar y publicar reglamentos y manuales jurídicos municipales.',
  supuestos = 'Las áreas jurídicas cuentan con tiempo y apoyo técnico para la revisión normativa.'
WHERE id = 162;

UPDATE public.mir_niveles SET
  resumen_narrativo = '4.1 Gestionar y dar seguimiento a convenios de colaboración jurídica con dependencias externas.',
  supuestos = 'Las instituciones firmantes mantienen voluntad de cooperación y cumplimiento de compromisos.'
WHERE id = 163;

-- ---------- 7. indicadores — columnas nuevas (fichas PP-FM-0F individuales) ----------
-- FIN id=161: Sentido=Descendente por ficha individual (ver anomalía C).
UPDATE public.indicadores SET
  tipo_indicador = 'Estratégico', dimension = 'Eficiencia', sentido = 'Descendente',
  medios_verificacion = 'Número de expedientes de Laudos.',
  linea_base_anio = 2025,
  interpretacion = 'Mide la reducción de conflictos laborales judicializados en contra del municipio. Refleja la efectividad en la prevención, atención oportuna y resolución extrajudicial de controversias laborales.'
WHERE id = 161;

UPDATE public.indicadores SET
  tipo_indicador = 'Estratégico', dimension = 'Eficiencia', sentido = 'Ascendente',
  medios_verificacion = 'En el registro contable de la Hacienda Municipal, Expedientes internos.',
  linea_base_anio = 2025,
  interpretacion = 'Evalúa la reducción de demandas, denuncias o procedimientos legales interpuestos contra el Ayuntamiento. Mide la capacidad institucional para actuar conforme a la normativa y prevenir responsabilidades jurídicas.'
WHERE id = 162;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Listas de asistencia, materiales didácticos, reportes de evaluación, evidencias fotográficas.',
  linea_base_anio = 2025,
  interpretacion = 'Mide el cumplimiento del plan anual de formación jurídica. Indica avance en profesionalización del personal en temas normativos, legales y administrativos.'
WHERE id = 163;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Registros de capacitación, constancias de participación, plan de formación anual.',
  linea_base_anio = 2025,
  interpretacion = 'Evalúa cuántos servidores públicos recibieron capacitación jurídica en comparación con lo programado. Mide fortalecimiento institucional y disminución de errores legales.'
WHERE id = 164;

UPDATE public.indicadores SET
  tipo_indicador = 'Estratégico', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Publicaciones oficiales, actas de aprobación, registros en el portal institucional.',
  linea_base_anio = 2025,
  interpretacion = 'Mide el avance en la actualización normativa del municipio. Evalúa el proceso de modernización jurídica y armonización con leyes estatales y federales.'
WHERE id = 165;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.',
  linea_base_anio = 2025,
  interpretacion = 'Evalúa la capacidad del municipio para concretar acuerdos interinstitucionales o jurídicos conforme a la planeación anual. Refleja gestión y articulación institucional.'
WHERE id = 166;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Reportes de actividades, registros fotográficos, materiales de difusión.',
  linea_base_anio = 2025,
  interpretacion = 'Mide la difusión y educación ciudadana en temas legales, derechos, obligaciones o procedimientos. Evalúa alcance y cumplimiento del plan de comunicación jurídica.'
WHERE id = 167;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Constancias, informes de capacitación, materiales de apoyo.',
  linea_base_anio = 2025,
  interpretacion = NULL
WHERE id = 168;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Gaceta municipal, actas de aprobación, portal web del Ayuntamiento.',
  linea_base_anio = 2025,
  interpretacion = 'Evalúa el avance en la creación, revisión técnica y publicación oficial de leyes, reglamentos, lineamientos o manuales. Refleja orden jurídico y transparencia normativa.'
WHERE id = 169;

UPDATE public.indicadores SET
  tipo_indicador = 'Gestión', dimension = 'Eficacia', sentido = 'Regular',
  medios_verificacion = 'Informes de seguimiento, oficios de coordinación, reportes de evaluación semestral.',
  linea_base_anio = 2025,
  interpretacion = 'Mide el nivel de avance de los convenios que están en proceso de trámite, firma o ejecución. Evalúa gestión jurídica activa y cumplimiento institucional.'
WHERE id = 170;

-- ---------- 8. indicador_variables + indicador_variables_valores ----------
-- Unidad de medida corregida a la unidad REAL (diseño §2.3, ver anomalía D).
-- NULL::numeric explícito en valor_alcanzado: sin el cast, Postgres infiere el
-- NULL como texto dentro de un UNION ALL y falla contra la columna numeric(15,4).

-- FIN (id=161)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (161, 'Número de laudos o sentencias condenatorias atendidas', 'NLSCA', 'Laudos', 'Número de expedientes de Laudos.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (161, 'Número de laudos o sentencias programados', 'NLSP', 'Laudos', 'Número de expedientes de Laudos.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 25, 27.00 FROM v1
UNION ALL
SELECT v2.id, 2026, 25, 27 FROM v2;

-- PROPOSITO (id=162)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (162, 'Procedimientos legales ejecutados', 'PLE', 'Procedimientos', 'En el registro contable de la Hacienda Municipal, Expedientes internos.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (162, 'Procedimientos legales programados', 'PLP', 'Procedimientos', 'En el registro contable de la Hacienda Municipal, Expedientes internos.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,100 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,100 FROM v2;

-- C1 (id=163)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (163, 'Número de talleres o capacitaciones realizados', 'NTCR', 'Talleres', 'Listas de asistencia, materiales didácticos, reportes de evaluación, evidencias fotográficas.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (163, 'Total de talleres o capacitaciones programados', 'TTCP', 'Talleres', 'Listas de asistencia, materiales didácticos, reportes de evaluación, evidencias fotográficas.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,2 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,2 FROM v2;

-- C2 (id=164)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (164, 'Número de servidores públicos capacitados', 'NSPC', 'Servidores públicos', 'Registros de capacitación, constancias de participación, plan de formación anual.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (164, 'Total de servidores públicos del área jurídica', 'TSPAJ', 'Servidores públicos', 'Registros de capacitación, constancias de participación, plan de formación anual.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,7 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,7 FROM v2;

-- C3 (id=165)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (165, 'Reglamentos y manuales actualizados', 'RMA', 'Reglamentos y manuales', 'Publicaciones oficiales, actas de aprobación, registros en el portal institucional.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (165, 'Total de reglamentos y manuales vigentes', 'TRMV', 'Reglamentos y manuales', 'Publicaciones oficiales, actas de aprobación, registros en el portal institucional.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,2 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,2 FROM v2;

-- C4 (id=166)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (166, 'Número de convenios firmados', 'NCF', 'Convenios', 'Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (166, 'Total de convenios previstos', 'TCP', 'Convenios', 'Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,100 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,100 FROM v2;

-- A1.1 (id=167)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (167, 'Número de talleres y campañas realizadas', 'NTCR', 'Talleres y campañas', 'Reportes de actividades, registros fotográficos, materiales de difusión.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (167, 'Total de talleres y campañas programadas', 'TTCP', 'Talleres y campañas', 'Reportes de actividades, registros fotográficos, materiales de difusión.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,2.00 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,2.00 FROM v2;

-- A2.1 (id=168)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (168, 'Número de cursos realizados', 'NCR', 'Cursos', 'Constancias, informes de capacitación, materiales de apoyo.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (168, 'Total de cursos programados', 'TCP', 'Cursos', 'Constancias, informes de capacitación, materiales de apoyo.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,4 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,4 FROM v2;

-- A3.1 (id=169) — nombres corregidos: la fórmula del PDF dice "cursos" por
-- copy-paste de A2.1, pero el indicador es de instrumentos normativos.
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (169, 'Instrumentos normativos publicados', 'INP', 'Instrumentos normativos', 'Gaceta municipal, actas de aprobación, portal web del Ayuntamiento.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (169, 'Total de instrumentos normativos programados', 'TINP', 'Instrumentos normativos', 'Gaceta municipal, actas de aprobación, portal web del Ayuntamiento.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,2 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,2 FROM v2;

-- A4.1 (id=170)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (170, 'Número de convenios en ejecución', 'NCE', 'Convenios', 'Informes de seguimiento, oficios de coordinación, reportes de evaluación semestral.', 1)
  RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (170, 'Total de convenios firmados', 'TCF', 'Convenios', 'Informes de seguimiento, oficios de coordinación, reportes de evaluación semestral.', 2)
  RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric,9 FROM v1
UNION ALL
SELECT v2.id, 2026, NULL::numeric,9 FROM v2;

COMMIT;
