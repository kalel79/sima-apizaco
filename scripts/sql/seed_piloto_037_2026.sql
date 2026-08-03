-- ============================================================
-- SEED PILOTO 037 — contenido 2026 del módulo MML
-- Fuente principal: "9. 037 FISCALIZAR CONTROLAR Y EVALUAR LA GESTIÒN.pdf"
-- (47 páginas, el más largo de los 9 programas). Fuente secundaria para
-- valores de variables (ver anomalía E, resuelta): el .xlsx del mismo
-- programa (hojas F1/P1/C1-C6/C1A1-C6A3), que sí trae la tabla de Variables
-- con Alcanzada/Meta que el PDF no incluye (mismo caso que 024/033 —
-- ficha "FORMATO NO. 7").
-- Script SQL revisable (NO migración) — programa_id = 9 (clave '037'), anio = 2026
-- Método: pdfjs-dist (instalado y desinstalado temporalmente) + clustering
-- por coordenadas x/y para el PDF; exceljs (ya dependencia real del
-- proyecto) para el .xlsx.
--
-- Los 26 indicadores (ids 88-113) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que programas previos).
--
-- Es el ÚLTIMO de los 9 programas del municipio (cierra el ciclo de
-- pilotos 003/005/012/018/021/024/032/033/037).
--
-- Estructura: 6 Componentes con 3 Actividades cada uno = 18 total.
-- Árbol de Objetivos mapea exacto 1:1 con los 26 indicadores (central=
-- Propósito id89, fin_top=Fin id88, 6 Medios=Componentes id90-95, 18
-- actividades=id96-113; verificado con self-join contra la Matriz de
-- Indicadores PP-FM-0E, que confirma cada Medio/Actividad numerado con su
-- indicador). Árbol del Problema: ver anomalía A (corregido a 18
-- subcausas, cuadra 1:1 con las 18 actividades).
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  A) Árbol del Problema (PP-FM-04): la Causa 3 ("Deficiencias en
--     transparencia") solo traía 2 subcausas en el PDF ("Procesos de
--     acceso a la información deficientes", "Falta de cultura
--     institucional de rendición de cuentas"), mientras su Medio espejo
--     (Componente 3, Transparencia) sí tiene 3 Actividades en el Árbol de
--     Objetivos (mismo patrón ya visto en los pilotos 032 y 033). Siguiendo
--     el criterio ya establecido por Hugo, se completó desde el inicio (sin
--     esperar una segunda vuelta) con una 3ª subcausa espejo de la
--     Actividad 3.3 ("Publicación proactiva de datos abiertos y reportes
--     financieros."): "Falta de publicación proactiva de datos abiertos y
--     reportes financieros." Árbol del Problema ahora: 3+3+3+3+3+3 = 18
--     subcausas, cuadra 1:1 con las 18 actividades del Árbol de Objetivos.
--  B) Alternativas (PP-FM-09, página 12): la Actividad 1.3 aparece con
--     texto contaminado de OTRO programa — "Crear un sistema de evaluación
--     del desempeño policial con indicadores de calidad y resultados."
--     (bleed evidente del piloto 005, Seguridad Pública). No se usó; el
--     texto real de la Actividad 1.3 ("Establecimiento de protocolos de
--     coordinación entre áreas.") se tomó de las páginas de Acciones
--     (PP-FM-08) y de la Matriz de Indicadores (PP-FM-0E), consistentes
--     entre sí.
--  C) Sentido del PROPÓSITO (id=89): la Matriz de Indicadores (PP-FM-0E,
--     página 13) marca "Descendente" para "Porcentaje de servicios
--     administrativos digitalizados y transparentes" — contraintuitivo
--     (más trámites digitalizados es mejor). Se usó "Ascendente", mismo
--     criterio ya aplicado en los pilotos 012/021/033 ante indicadores con
--     Sentido ilógico en la fuente. Pendiente que Hugo lo confirme.
--  D) unidad_medida de indicador_variables corregida de "Porcentaje" (el
--     .xlsx la usa para TODAS las variables, incluso conteos absolutos y
--     montos) a la unidad real de cada variable (Trámites, Mecanismos,
--     Plataformas, Solicitudes, Programas, Requisiciones, Cuentas,
--     Auditorías, Funcionarios, Protocolos, Equipos, Sistemas,
--     Obligaciones, Bases de datos, Manuales, Bienes, Conciliaciones,
--     Puestos, Campañas, Pesos) — mismo criterio ya decidido en programas
--     previos.
--  E) [RESUELTA con el .xlsx] La ficha de indicador del PDF (FORMATO NO. 7,
--     páginas 16+) es un formato de gráfica + tabla Programado/Real por
--     mes, sin tabla de "Variables" con Alcanzada/Meta (igual que 024/033).
--     El .xlsx del mismo programa sí la trae (hojas F1, P1, C1-C6,
--     C1A1-C6A3), confirmando los mismos 26 nombres de indicador, fórmulas
--     y metas anuales ya sembradas (24 de 26 casos con
--     numerador=denominador=meta_anual_2026, Resultado=100% calculado por
--     el propio Excel). Se sembraron los valores reales del .xlsx:
--       · FIN (id=88, hoja F1): Alcanzada 2023 CS=27290.34/TE=60084.42;
--         Meta 2026 CS=29769.06/TE=62018.
--       · PROPÓSITO y los 6 Componentes y 18 Actividades (ids 89-113): el
--         Excel deja "Alcanzada" en blanco para los 25 restantes (mismo
--         patrón de metas nuevas del ejercicio 2026 sin histórico visto en
--         los demás pilotos) — valor_alcanzado queda NULL, fiel a la
--         fuente; valor_meta sí trae el valor real de cada hoja.
--  F) Discrepancia puntual: la hoja "C3A2" del .xlsx (Actividad 3.2,
--     id=103, "Porcentaje de obligaciones de transparencia publicadas en
--     portales oficiales") trae Meta 2026 = 5/5 para sus 2 variables, pero
--     `indicadores.meta_anual_2026` (ya sembrado en el backfill previo, no
--     modificado por este script) tiene 4 para ese mismo indicador. No se
--     concilian: se sembró el valor real de la hoja del Excel (5/5) en
--     `indicador_variables_valores`, documentando la discrepancia para que
--     Hugo la revise (puede ser un ajuste posterior al backfill original).
--  G) Análisis de Involucrados (PP-FM-05): layout en cruz (Indiferentes
--     arriba, Ejecutores izquierda, Beneficiarios derecha, Opositores
--     abajo, mismo patrón que 032/033), reconstruido por clustering de
--     coordenadas x/y. Confianza alta en Ejecutores/Opositores/Indiferentes;
--     confianza media en 2 entradas del lado derecho — "Algunos sectores
--     académicos" y "Academia y estudiantes" aparecen como 2 renglones
--     separados en coordenadas distintas (podrían ser la misma idea
--     duplicada por el layout del documento, se sembraron ambas tal cual)
--     y "Medios de comunicación locales" con posición ambigua entre
--     Beneficiario/Indiferente — se sembró como Beneficiario por cercanía
--     de coordenadas.
--  H) Ficha del Componente 5 (id=94, "Control de requisiciones"): el
--     supuesto en la Matriz de Indicadores trae una construcción gramatical
--     extraña en la fuente ("Recursos material proporcionen de manera
--     eficiente los recursos materiales y servicios.") — sembrado tal cual,
--     sin corregir redacción (mismo criterio que anomalías similares en
--     pilotos previos: no alterar el contenido de la fuente en silencio).
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(9, 2026, 1,
  'Deficiencias en la gobernanza municipal, baja innovación tecnológica y limitaciones en transparencia y rendición de cuentas.',
  'Consolidar un gobierno municipal innovador, transparente y confiable, con instituciones fortalecidas que promuevan la participación ciudadana y la rendición de cuentas.'),
(9, 2026, 2,
  'Mecanismos de control interno poco robustos y escasa capacitación técnica del personal.',
  'Fortalecimiento de capacidades institucionales y consolidación de sistemas de control interno eficaces y confiables.'),
(9, 2026, 3,
  'Infraestructura tecnológica obsoleta y bajo nivel de digitalización de trámites municipales.',
  'Modernización de la infraestructura tecnológica, con digitalización integral de trámites y servicios municipales.'),
(9, 2026, 4,
  'Procesos de acceso a la información lentos, incompletos y con poca transparencia.',
  'Consolidación de un sistema eficiente de transparencia y acceso a la información, garantizando rendición de cuentas permanente.'),
(9, 2026, 5,
  'Ausencia de evaluaciones integrales de programas y poca actualización de información estadística.',
  'Implementación de evaluaciones integrales y generación de información estadística confiable para la toma de decisiones.'),
(9, 2026, 6,
  'Baja participación ciudadana en procesos de planeación y fiscalización.',
  'Impulso a mecanismos de participación ciudadana que fortalezcan la gobernanza democrática y la corresponsabilidad social.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
-- Ver anomalía A: Causa 3 con su 3ª subcausa completada (espejo de la
-- Actividad 3.3), siguiendo el criterio ya establecido con Hugo.
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (9, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Deficiencias en la coordinación de las áreas administrativas y operativas que conforman el ayuntamiento, lo que dificulta la gobernanza municipal, baja inversión en tecnología y limitaciones en transparencia y rendición de cuentas.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Bajo logro de objetivos y metas'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Aumento en la percepción de corrupción y desconfianza ciudadana'),
    (2, 'Falta en la digitalización de trámites y servicios'),
    (3, 'Baja eficiencia en la administración de recursos públicos'),
    (4, 'Procesos de planeación y evaluación poco efectivos'),
    (5, 'Disminución en la participación ciudadana'),
    (6, 'Pérdida de competitividad institucional')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Gestión institucional limitada'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Innovación tecnológica insuficiente'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', central.id, 3, 'Deficiencias en transparencia'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', central.id, 4, 'Planeación y evaluación débil'
  FROM central RETURNING id
),
causa5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', central.id, 5, 'Deficiencia en la gestión de recursos materiales y humanos'
  FROM central RETURNING id
),
causa6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', central.id, 6, 'Falta de documentación que avale los trámites que realicen los contribuyentes'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Mecanismos de control interno poco robustos'),
    (2, 'Falta de capacitación técnica y normativa en el personal'),
    (3, 'Escasa coordinación entre áreas')
  ) AS v(orden, texto) RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', causa2.id, v.orden, v.texto
  FROM causa2, (VALUES
    (1, 'Infraestructura tecnológica deficiente'),
    (2, 'Necesidad de digitalización de trámites'),
    (3, 'Insuficientes sistemas integrados de información')
  ) AS v(orden, texto) RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', causa3.id, v.orden, v.texto
  FROM causa3, (VALUES
    (1, 'Procesos de acceso a la información deficientes'),
    (2, 'Falta de cultura institucional de rendición de cuentas'),
    -- anomalía A: espejo de la Actividad 3.3 (completado desde el inicio).
    (3, 'Falta de publicación proactiva de datos abiertos y reportes financieros')
  ) AS v(orden, texto) RETURNING id
),
sub4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', causa4.id, v.orden, v.texto
  FROM causa4, (VALUES
    (1, 'Ausencia de evaluaciones integrales a programas municipales y del desempeño'),
    (2, 'No están documentados los procesos'),
    (3, 'Escaza información estadística')
  ) AS v(orden, texto) RETURNING id
),
sub5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'PROBLEMA', 'CAUSA', causa5.id, v.orden, v.texto
  FROM causa5, (VALUES
    (1, 'Deficiente control de inventarios y activos municipales'),
    (2, 'Retrasos en la conciliación de gastos y comprobaciones'),
    (3, 'Duplicidad de funciones o esfuerzos administrativos')
  ) AS v(orden, texto) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 9, 2026, 'PROBLEMA', 'CAUSA', causa6.id, v.orden, v.texto
FROM causa6, (VALUES
  (1, 'Inexistencia de controles administrativos'),
  (2, 'Insuficiente recaudación de ingresos'),
  (3, 'Inadecuado ejercicio del presupuesto')
) AS v(orden, texto);

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (9, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Fortalecer la gestión pública municipal mediante la innovación tecnológica, la transparencia, la rendición de cuentas y la mejora en la planeación y evaluación de programas, garantizando servicios públicos confiables y oportunos.',
    89,
    'Existen recursos tecnológicos y humanos para mantener los servicios en línea; los usuarios adoptan las plataformas.',
    'Inventario de trámites; reportes de la Dirección de Innovación y Transparencia.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Consolidar una gobernanza municipal moderna, eficiente y transparente que fortalezca la confianza ciudadana, eleve la competitividad institucional y asegure la correcta administración de los recursos públicos.',
    88,
    'La ciudadanía responde de forma representativa; los resultados no se ven distorsionados por factores externos nacionales.',
    'Encuestas municipales de percepción; ENCIG (INEGI).'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 9, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Mayor eficiencia en la administración de recursos públicos.'),
    (2, 'Mayor confianza ciudadana en la gestión municipal.'),
    (3, 'Disminución en la percepción de corrupción.'),
    (4, 'Acceso oportuno a información pública confiable.'),
    (5, 'Procesos de planeación y evaluación con base en evidencia.'),
    (6, 'Digitalización de servicios para mayor cercanía con la ciudadanía.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Gestión institucional fortalecida', 90,
    'Las áreas municipales atienden las quejas y sugerencias de la ciudadanía, fortaleciento la atención y gestión administrativa.',
    'Actas de Apertura de buzones de quejas y sugerencias instalados en las areas del Municipio y seguimiento para turnarlas a las áreas involucradas.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Innovación tecnológica para la gestión municipal', 91,
    'La población cuenta con acceso a internet; los sistemas se mantienen sin interrupciones graves.',
    'Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Transparencia y rendición de cuentas fortalecida', 92,
    'Los titulares de área colaboran con la entrega de información; no hay cambios regulatorios que retrasen procesos.',
    'Plataforma Nacional de Transparencia; informes de la Unidad de Transparencia.'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Planeación y evaluación municipal eficiente', 93,
    'Las áreas proporcionan información confiable; se garantiza financiamiento para evaluaciones externas.',
    'Informes de evaluación; documentos de Planeación y Evaluación.'
  FROM central RETURNING id
),
medio5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', central.id, 5,
    'Suministrar de manera adecuada los recursos materiales y servicios en apego al presupuesto programado en el ejercicio.', 94,
    -- ver anomalía H: redacción extraña en la fuente, sembrada tal cual.
    'Recursos material proporcionen de manera eficiente los recursos materiales y servicios.',
    'Expediente de requisiciones.'
  FROM central RETURNING id
),
medio6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', central.id, 6,
    'Existencia de documentación que avale los trámites que realicen los contribuyentes', 95,
    'Se administran los recursos públicos de acuerdo a los proyectos programados.',
    'Oficio de entrega de Cuenta pública.'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Implementar mecanismos de control interno más robustos.', 96,
       'Las dependencias aceptan auditorías.',
       'Reportes de contraloría.'),
    (2, 'Capacitación técnica y normativa continua del personal.', 97,
       'El personal tendrá las herramientas necesarias para aplicar la normatividad vigente.',
       'Listas de asistencia; constancias.'),
    (3, 'Establecimiento de protocolos de coordinación entre áreas.', 98,
       'Se establece la coordinación entre las áreas para el alcance de los objetivos, a través de las mesas de trabajo.',
       'Documentos aprobados; mesas de trabajo, actas.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio2, (VALUES
    (1, 'Ampliación de la infraestructura tecnológica (hardware y software).', 99,
       'El equipo es funcional y se mantiene.',
       'Inventarios de Tecnologías de la Información y Comunicación; actas de entrega.'),
    (2, 'Digitalización de trámites y servicios municipales.', 100,
       'Los usuarios adoptan el sistema digital.',
       'Reportes de Tecnologías de la Información y Comunicación.'),
    (3, 'Desarrollo de sistemas integrados de información para la gestión.', 101,
       'Las áreas utilizan efectivamente los sistemas.',
       'Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio3, (VALUES
    (1, 'Mejorar los procesos de acceso a la información pública.', 102,
       'Los titulares responden con información completa.',
       'Plataforma de Transparencia; reportes.'),
    (2, 'Promover la cultura institucional de rendición de cuentas.', 103,
       'El cabildo aprueba su publicación.',
       'Informes en portales oficiales.'),
    (3, 'Publicación proactiva de datos abiertos y reportes financieros.', 104,
       'La información es validada y actualizada.',
       'Plataforma de datos abiertos.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio4, (VALUES
    (1, 'Realizar evaluaciones integrales a programas y desempeño institucional.', 105,
       'Las áreas entregan información en tiempo.',
       'Informes de evaluación.'),
    (2, 'Documentar procesos administrativos clave.', 106,
       'El personal aplica lo documentado.',
       'Manuales aprobados; periodico oficial.'),
    (3, 'Generar y actualizar bases de datos estadísticos municipales.', 107,
       'Las áreas aportan datos confiables.',
       'Repositorio de Planeación y Evaluación.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', medio5.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio5, (VALUES
    (1, 'Control de inventarios y activos municipales.', 108,
       'Los responsables de área actualizan de manera oportuna la información patrimonial y se cuenta con herramientas digitales adecuadas.',
       'Reportes de inventario, actas de verificación, sistema de control patrimonial, listas de activos actualizadas.'),
    (2, 'Oportuna conciliación de gastos y comprobaciones.', 109,
       'Las áreas responsables entregan en tiempo la documentación comprobatoria y no existen retrasos por falta de firmas o autorizaciones.',
       'Estados financieros, reportes de tesorería, comprobaciones firmadas, cédulas de gasto.'),
    (3, 'Adecuada estructura orgánica.', 110,
       'Se mantiene actualizada la plantilla laboral y se autoriza la cobertura de vacantes conforme a las necesidades del área.',
       'Manual de organización vigente, nómina institucional, dictamen de estructura orgánica.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 9, 2026, 'OBJETIVOS', 'MEDIO', medio6.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
FROM medio6, (VALUES
  (1, 'Existencia de controles administrativos.', 111,
     'Presentar la cuenta publica con la normativa vigente, respetando los lineamientos establecidos en la ley.',
     'Cuenta pública y sus anexos.'),
  (2, 'Suficiente recaudación de ingresos.', 112,
     'Que la ciudadania participe y contribuya a la recaudación mediante el pago de sus contribuciones.',
     'Oficios y cartas de invitación a los contribuyentes.'),
  (3, 'Adecuado ejercicio del presupuesto.', 113,
     'Ejercer los recursos conforme a lo programado, de forma transparente, eficaz y controlado.',
     'Presupuesto de egresos, ejercicio presupuestal y cuenta pública.')
) AS v(orden, texto, indicador_id, supuestos, medios_verificacion);

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
-- Ver anomalía G: layout en cruz reconstruido por clustering de coordenadas.
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (9, 2026, 'BENEFICIARIO', 'Ciudadanía en general', 1),
  (9, 2026, 'BENEFICIARIO', 'Empresarios y emprendedores locales', 2),
  (9, 2026, 'BENEFICIARIO', 'Algunos sectores académicos', 3),
  (9, 2026, 'BENEFICIARIO', 'Academia y estudiantes', 4),
  (9, 2026, 'BENEFICIARIO', 'Organizaciones de la sociedad civil', 5),
  (9, 2026, 'BENEFICIARIO', 'Medios de comunicación locales', 6),
  (9, 2026, 'EJECUTOR', 'Órgano Interno de Control', 1),
  (9, 2026, 'EJECUTOR', 'Dirección de Planeación y Evaluación', 2),
  (9, 2026, 'EJECUTOR', 'Transparencia', 3),
  (9, 2026, 'EJECUTOR', 'Secretaría del Ayuntamiento', 4),
  (9, 2026, 'OPOSITOR', 'Funcionarios con prácticas tradicionales', 1),
  (9, 2026, 'OPOSITOR', 'Sectores políticos opositores', 2),
  (9, 2026, 'OPOSITOR', 'Sindicatos o grupos internos', 3),
  (9, 2026, 'OPOSITOR', 'Proveedores o contratistas', 4),
  (9, 2026, 'INDIFERENTE', 'Ciudadanía poco organizada', 1),
  (9, 2026, 'INDIFERENTE', 'Pequeños comerciantes informales', 2);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo: Estratégico (Fin/Propósito) / Gestión (Componentes/Actividades).
-- Dimensión/Sentido/Frecuencia/Fórmula/Medios/Supuestos: de la Matriz de
-- Indicadores (PP-FM-0E, páginas 13-15). Sentido: ver anomalía C para el
-- Propósito. Línea base: solo Fin la trae explícita (45.4/2023) — el resto
-- queda NULL, fiel a la fuente. Interpretación: del .xlsx (fila
-- "Interpretación" de cada hoja), texto limpio sin contaminación.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Encuestas municipales de percepción; ENCIG (INEGI). https://www.inegi.org.mx/contenidos/programas/encig/2023/doc/29_tlaxcala.pdf',
  linea_base=45.4, linea_base_anio=2023,
  interpretacion='Mide la percepción ciudadana sobre la calidad y eficiencia de los servicios públicos. Permite evaluar la efectividad del gobierno en atender necesidades básicas.'
WHERE id=88;

-- Ver anomalía C: Sentido Descendente en la Matriz vs lógica del indicador
-- (más trámites digitalizados es mejor) — se usó Ascendente.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Inventario de trámites; reportes de la Dirección de Innovación y Transparencia.',
  interpretacion='Evalúa el avance de la modernización administrativa y la accesibilidad de trámites digitales. Refleja eficiencia, transparencia y reducción de tiempos administrativos.'
WHERE id=89;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de Apertura de buzones de quejas y sugerencias instalados en las areas del Municipio y seguimiento para turnarlas a las áreas involucradas.',
  interpretacion='Indica el nivel de coordinación entre áreas municipales y con otras instituciones. Mide gobernanza, articulación y capacidad para ejecutar políticas públicas.'
WHERE id=90;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.',
  interpretacion='Mide la adopción ciudadana y administrativa de plataformas digitales. Refleja avance en gobierno digital y accesibilidad tecnológica.'
WHERE id=91;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Plataforma Nacional de Transparencia; informes de la Unidad de Transparencia.',
  interpretacion='Evalúa el cumplimiento de las leyes de transparencia. Refleja apertura gubernamental y eficiencia en la respuesta ciudadana.'
WHERE id=92;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de evaluación; documentos de Planeación y Evaluación.',
  interpretacion='Mide el nivel de institucionalización del enfoque PBR en el municipio. Indica profesionalización, seguimiento y control de desempeño.'
WHERE id=93;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Expediente de requisiciones.',
  interpretacion='Mide la trazabilidad, cumplimiento y orden administrativo en el proceso de requisiciones. Refleja eficiencia y control interno.'
WHERE id=94;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Oficio de entrega de Cuenta pública.',
  interpretacion='Evalúa la integridad, oportunidad y transparencia de la información financiera municipal. Refleja disciplina fiscal y rendición de cuentas.'
WHERE id=95;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de contraloría.',
  interpretacion='Mide el cumplimiento del programa anual de auditoría. Refleja control interno, prevención de riesgos y apego normativo.'
WHERE id=96;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; constancias.',
  interpretacion='Evalúa el fortalecimiento de capacidades del personal municipal. Refleja profesionalización y cumplimiento normativo.'
WHERE id=97;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Documentos aprobados; mesas de trabajo, actas.',
  interpretacion='Mide el grado de institucionalización de procedimientos interáreas. Refleja orden administrativo y estandarización de procesos.'
WHERE id=98;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios de Tecnologías de la Información y Comunicación; actas de entrega.',
  interpretacion='Evalúa la disponibilidad y funcionalidad del equipamiento tecnológico. Refleja capacidad institucional para operar digitalmente.'
WHERE id=99;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de Tecnologías de la Información y Comunicación.',
  interpretacion='Mide el avance en la digitalización de servicios y trámites. Refleja modernización administrativa y facilidad para el ciudadano.'
WHERE id=100;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.',
  interpretacion='Evalúa la integración tecnológica entre áreas. Refleja eficiencia, interoperabilidad y reducción de duplicidades.'
WHERE id=101;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Plataforma de Transparencia; reportes.',
  interpretacion='Mide cumplimiento de plazos legales de respuesta. Refleja transparencia activa y responsabilidad institucional.'
WHERE id=102;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes en portales oficiales.',
  interpretacion='Evalúa el grado de cumplimiento con la Ley de Transparencia. Refleja apertura gubernamental y acceso a información pública.'
WHERE id=103;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Plataforma de datos abiertos.',
  interpretacion='Mide el nivel de disponibilidad de información pública actualizada. Refleja claridad, transparencia y gobierno abierto.'
WHERE id=104;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de evaluación.',
  interpretacion='Mide cuántos programas se evalúan bajo el enfoque PBR. Refleja seguimiento, control y mejora continua.'
WHERE id=105;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Manuales aprobados; periodico oficial.',
  interpretacion='Evalúa el orden administrativo y actualización normativa interna. Refleja mejora en procesos y profesionalización.'
WHERE id=106;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Repositorio de Planeación y Evaluación.',
  interpretacion='Mide la calidad, actualización y vigencia de la información institucional. Refleja control administrativo y transparencia.'
WHERE id=107;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de inventario, actas de verificación, sistema de control patrimonial, listas de activos actualizadas.',
  interpretacion='Evalúa el control patrimonial municipal. Refleja administración eficiente y prevención de pérdidas o anomalías.'
WHERE id=108;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Estados financieros, reportes de tesorería, comprobaciones firmadas, cédulas de gasto.',
  interpretacion='Mide el cumplimiento de procesos contables y administrativos. Refleja disciplina financiera y control interno.'
WHERE id=109;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Manual de organización vigente, nómina institucional, dictamen de estructura orgánica.',
  interpretacion='Evalúa si las áreas y funciones operan según el organigrama y manual vigente. Refleja orden institucional y legalidad.'
WHERE id=110;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Cuenta pública y sus anexos.',
  interpretacion='Mide el cumplimiento en tiempo y forma de la presentación oficial de cuentas. Refleja responsabilidad financiera y transparencia.'
WHERE id=111;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Oficios y cartas de invitación a los contribuyentes.',
  interpretacion='Mide la ejecución de actividades destinadas a promover el pago de contribuciones municipales. Refleja eficiencia recaudatoria y comunicación gubernamental.'
WHERE id=112;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Presupuesto de egresos, ejercicio presupuestal y cuenta pública.',
  interpretacion='Evalúa la proporción del presupuesto asignado que realmente se ejecutó. Refleja eficiencia en el gasto público y cumplimiento de metas.'
WHERE id=113;

-- ---------- 6. indicador_variables + valores reales del .xlsx (ver anomalía E) ----------

-- id=88 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (88, 'No. de ciudadanos satisfechos', 'CS', 'Ciudadanos', 'Encuestas municipales de percepción; ENCIG (INEGI).', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (88, 'No. total de encuestados', 'TE', 'Ciudadanos', 'Encuestas municipales de percepción; ENCIG (INEGI).', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 27290.34, 29769.06 FROM v1
UNION ALL SELECT v2.id, 2026, 60084.42, 62018 FROM v2;

-- id=89 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (89, 'No. de trámites digitalizados', 'NTD', 'Trámites', 'Inventario de trámites; reportes de la Dirección de Innovación y Transparencia.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (89, 'No. total de trámites identificados', 'NTI', 'Trámites', 'Inventario de trámites; reportes de la Dirección de Innovación y Transparencia.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1 FROM v2;

-- id=90 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (90, 'Mecanismos implementados', 'MI', 'Mecanismos', 'Actas de Apertura de buzones de quejas y sugerencias instalados en las areas del Municipio y seguimiento para turnarlas a las áreas involucradas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (90, 'Total programado', 'TP', 'Mecanismos', 'Actas de Apertura de buzones de quejas y sugerencias instalados en las areas del Municipio y seguimiento para turnarlas a las áreas involucradas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 444 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 444 FROM v2;

-- id=91 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (91, 'Uso actual', 'UA', 'Plataformas', 'Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (91, 'Uso base', 'UB', 'Plataformas', 'Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 3 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 3 FROM v2;

-- id=92 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (92, 'Solicitudes atendidas dentro del plazo', 'SADP', 'Solicitudes', 'Plataforma Nacional de Transparencia; informes de la Unidad de Transparencia.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (92, 'Total de solicitudes recibidas', 'TSR', 'Solicitudes', 'Plataforma Nacional de Transparencia; informes de la Unidad de Transparencia.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=93 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (93, 'Programas evaluados', 'PE', 'Programas', 'Informes de evaluación; documentos de Planeación y Evaluación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (93, 'Total de programas municipales', 'TPM', 'Programas', 'Informes de evaluación; documentos de Planeación y Evaluación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 7 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 7 FROM v2;

-- id=94 C5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (94, 'Total de requisiciones atendidas', 'TRA', 'Requisiciones', 'Expediente de requisiciones.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (94, 'Total de requisiciones recibidas', 'TRR', 'Requisiciones', 'Expediente de requisiciones.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1536 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1536 FROM v2;

-- id=95 C6
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (95, 'Cuentas públicas entregadas en tiempo y forma', 'CPETF', 'Cuentas', 'Oficio de entrega de Cuenta pública.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (95, 'Total de cuentas públicas programadas', 'TCPP', 'Cuentas', 'Oficio de entrega de Cuenta pública.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=96 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (96, 'Auditorías aplicadas', 'AA', 'Auditorías', 'Reportes de contraloría.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (96, 'Total de auditorías planificadas', 'TAP', 'Auditorías', 'Reportes de contraloría.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 3 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 3 FROM v2;

-- id=97 A1.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (97, 'Funcionarios capacitados', 'FC', 'Funcionarios', 'Listas de asistencia; constancias.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (97, 'Total de funcionarios programados', 'TFP', 'Funcionarios', 'Listas de asistencia; constancias.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=98 A1.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (98, 'Protocolos formalizados', 'PF', 'Protocolos', 'Documentos aprobados; mesas de trabajo, actas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (98, 'Total programado', 'TP2', 'Protocolos', 'Documentos aprobados; mesas de trabajo, actas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 3 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 3 FROM v2;

-- id=99 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (99, 'Equipos y sistemas funcionales', 'ESF', 'Equipos', 'Inventarios de Tecnologías de la Información y Comunicación; actas de entrega.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (99, 'Total de equipos adquiridos', 'TEA', 'Equipos', 'Inventarios de Tecnologías de la Información y Comunicación; actas de entrega.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=100 A2.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (100, 'Trámites digitalizados y disponibles', 'TDD', 'Trámites', 'Reportes de Tecnologías de la Información y Comunicación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (100, 'Total de trámites identificados', 'TTI', 'Trámites', 'Reportes de Tecnologías de la Información y Comunicación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 8 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 8 FROM v2;

-- id=101 A2.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (101, 'Sistemas interconectados', 'SI', 'Sistemas', 'Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (101, 'Total de sistemas programados', 'TSP', 'Sistemas', 'Registros de proyectos; reportes de Tecnologías de la Información y Comunicación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=102 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (102, 'Solicitudes atendidas en tiempo', 'SAT', 'Solicitudes', 'Plataforma de Transparencia; reportes.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (102, 'Total de solicitudes recibidas', 'TSR2', 'Solicitudes', 'Plataforma de Transparencia; reportes.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 99.6 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 99.6 FROM v2;

-- id=103 A3.2 (ver anomalía F: Meta del Excel=5 difiere de meta_anual_2026=4)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (103, 'Obligaciones publicadas', 'OP', 'Obligaciones', 'Informes en portales oficiales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (103, 'Total de obligaciones requeridas', 'TOR', 'Obligaciones', 'Informes en portales oficiales.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 5 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 5 FROM v2;

-- id=104 A3.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (104, 'Bases de datos publicadas y actualizadas', 'BDPA', 'Bases de datos', 'Plataforma de datos abiertos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (104, 'Total de bases de datos planificadas', 'TBDP', 'Bases de datos', 'Plataforma de datos abiertos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=105 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (105, 'Programas evaluados', 'PE2', 'Programas', 'Informes de evaluación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (105, 'Total de programas municipales', 'TPM2', 'Programas', 'Informes de evaluación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 84 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 84 FROM v2;

-- id=106 A4.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (106, 'Manuales actualizados', 'MA', 'Manuales', 'Manuales aprobados; periodico oficial.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (106, 'Total de manuales programados', 'TMP', 'Manuales', 'Manuales aprobados; periodico oficial.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=107 A4.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (107, 'Bases de datos actualizadas', 'BDA', 'Bases de datos', 'Repositorio de Planeación y Evaluación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (107, 'Total de bases de datos municipales', 'TBDM', 'Bases de datos', 'Repositorio de Planeación y Evaluación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 28 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 28 FROM v2;

-- id=108 A5.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (108, 'Bienes registrados en sistema', 'BRS', 'Bienes', 'Reportes de inventario, actas de verificación, sistema de control patrimonial, listas de activos actualizadas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (108, 'Bienes identificados físicamente', 'BIF', 'Bienes', 'Reportes de inventario, actas de verificación, sistema de control patrimonial, listas de activos actualizadas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=109 A5.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (109, 'Conciliaciones efectuadas dentro del periodo', 'CEDP', 'Conciliaciones', 'Estados financieros, reportes de tesorería, comprobaciones firmadas, cédulas de gasto.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (109, 'Conciliaciones programadas', 'CP', 'Conciliaciones', 'Estados financieros, reportes de tesorería, comprobaciones firmadas, cédulas de gasto.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 12 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 12 FROM v2;

-- id=110 A5.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (110, 'Puestos ocupados conforme al manual', 'POCM', 'Puestos', 'Manual de organización vigente, nómina institucional, dictamen de estructura orgánica.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (110, 'Total de puestos establecidos', 'TPE', 'Puestos', 'Manual de organización vigente, nómina institucional, dictamen de estructura orgánica.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=111 A6.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (111, 'Cuentas públicas entregadas en tiempo y forma', 'CPETF2', 'Cuentas', 'Cuenta pública y sus anexos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (111, 'Total de cuentas públicas programadas', 'TCPP2', 'Cuentas', 'Cuenta pública y sus anexos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 12 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 12 FROM v2;

-- id=112 A6.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (112, 'Campañas realizadas por el pago de contribuciones', 'CRPC', 'Campañas', 'Oficios y cartas de invitación a los contribuyentes.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (112, 'Total de campañas programadas', 'TCP', 'Campañas', 'Oficios y cartas de invitación a los contribuyentes.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 6 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 6 FROM v2;

-- id=113 A6.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (113, 'Presupuesto ejercido', 'PEj', 'Pesos', 'Presupuesto de egresos, ejercicio presupuestal y cuenta pública.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (113, 'Presupuesto programado autorizado', 'PPA', 'Pesos', 'Presupuesto de egresos, ejercicio presupuestal y cuenta pública.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

COMMIT;
