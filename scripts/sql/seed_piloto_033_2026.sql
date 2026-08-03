-- ============================================================
-- SEED PILOTO 033 — contenido 2026 del módulo MML
-- Fuente principal: "8. 033 APOYO A LAS POLITICAS GUBERNAMENTALES.pdf"
-- (30 páginas). Fuente secundaria para valores de variables (ver anomalía
-- E, resuelta): el .xlsx del mismo programa (hojas F1/P1/C1-C6/C1A1-C6A1),
-- que sí trae la tabla de Variables con Alcanzada/Meta que el PDF no
-- incluye (mismo caso que el piloto 024 — ficha "FORMATO NO. 7").
-- Script SQL revisable (NO migración) — programa_id = 8 (clave '033'), anio = 2026
-- Método: pdfjs-dist (instalado y desinstalado temporalmente) + clustering
-- por coordenadas x/y para el PDF; exceljs (ya dependencia real del
-- proyecto) para el .xlsx.
--
-- Los 14 indicadores (ids 147-160) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que programas previos).
--
-- Estructura: 6 Componentes con 1 Actividad cada uno = 6 actividades total
-- (único piloto con esta proporción 1:1 Componente:Actividad). Árbol de
-- Objetivos mapea exacto 1:1 con los 14 indicadores (verificado con
-- self-join). Árbol del Problema: 6 causas con 1 subcausa cada una, cuadra
-- 1:1 con las 6 actividades (ver anomalía B para cómo se construyó el
-- contenido).
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  A) Diagnóstico (PP-FM-03): en la columna "Transformación Deseada" hay
--     un fragmento huérfano "Limitada rendición de cuentas." intercalado
--     entre los pares 2 y 3, sin Situación Actual correspondiente y sin
--     encajar gramaticalmente con el texto que lo rodea — se omitió (no se
--     inventó su Situación pareja), mismo criterio que la anomalía A del
--     piloto 024. También se corrigió un punto suelto de salto de línea en
--     el par 4 ("percepción ciudadana. informada..." → "percepción
--     ciudadana informada...", limpieza trivial de formato, no anomalía
--     de contenido.
--  B) [LA ANOMALÍA MÁS RELEVANTE DE ESTE PILOTO] El PDF contiene DOS
--     narrativas distintas e inconsistentes entre sí para los Componentes
--     1 y 5, y para las 6 Actividades completas:
--       · "Set A" (Ficha de Proyecto página 2, Matriz de Indicadores
--         PP-FM-0E páginas 11-12, y el .xlsx — las 3 fuentes coinciden
--         entre sí Y coinciden con los nombres de los 14 indicadores ya
--         sembrados en la BD): ej. Actividad 1.1 = "Martes Ciudadano.-
--         Seguir impulsando los programas de martes ciudadano..."
--       · "Set B" (páginas de Árbol del Problema/Objetivos, Acciones y
--         Alternativas — PP-FM-04/07/08/09): usa para las Actividades un
--         texto genérico de "mecanismos" sin relación temática con los
--         indicadores reales, ej. Actividad 1.1 = "Existen mecanismos de
--         acercamiento de la población con zonas prioritarias" (nada que
--         ver con "Martes Ciudadano"). Para Componentes, Set B coincide
--         con Set A en C2/C3/C4/C6, pero difiere en C1 y C5.
--     Se usó Set A para todo el contenido de Componentes/Actividades
--     enlazado a indicador_id (medio1-6, act1-6), por estar corroborado
--     por 3 fuentes independientes. El Árbol del Problema (que no lleva
--     indicador_id) se construyó espejando Set A en negativo para
--     mantener coherencia temática con el Árbol de Objetivos — se usó el
--     texto negativo NATIVO del PDF cuando coincidía con Set A (causas
--     2/3/4/6 y subcausa 6), y se redactó el espejo negativo manualmente
--     para causa 1, causa 5 y subcausas 1-5 (donde el PDF solo ofrecía el
--     texto negativo de Set B, no de Set A). Pendiente que Hugo revise
--     esta decisión — Set B no se descartó por error, sino por no
--     corresponder a ningún indicador real de este programa.
--  C) La página 7 (Árbol de Objetivos / mirror positivo) trae en su pie de
--     página el mismo código de formato que la página 6 ("PP-FM-04-00" en
--     vez de un código propio) — error de plantilla del documento oficial,
--     informativo, sin impacto en los datos sembrados.
--  D) unidad_medida de indicador_variables corregida de "Porcentaje" (el
--     .xlsx la usa para TODAS las variables, incluso conteos absolutos) a
--     la unidad real de cada variable (Ciudadanos, Trámites, Metas,
--     Personas, Convenios, Proyectos, Programas, Procesos, Peticiones,
--     Gestiones, Compromisos, Seguidores) — mismo criterio ya decidido en
--     programas previos.
--  E) [RESUELTA con el .xlsx] La ficha de indicador del PDF (FORMATO NO. 7,
--     páginas 13-15) es un formato de gráfica + tabla Programado/Real por
--     mes, sin tabla de "Variables" con Alcanzada/Meta (igual que el
--     piloto 024). El .xlsx del mismo programa sí la trae (hojas F1, P1,
--     C1-C6, C1A1-C6A1), confirmando los mismos 14 nombres de indicador,
--     fórmulas y metas anuales ya sembradas. Se reemplazaron los NULL por
--     los valores reales del .xlsx:
--       · FIN (id=147, hoja F1): Alcanzada CS=27290.34/TE=60084.42; Meta
--         CS=30080/TE=62018 (decimales tal cual el Excel, sin redondear).
--       · PROPOSITO y los 6 Componentes y 5 de las 6 Actividades (ids
--         148-158, 160): el Excel deja "Alcanzada" en blanco (metas
--         nuevas del ejercicio 2026 sin histórico) — valor_alcanzado
--         queda NULL, fiel a la fuente; valor_meta sí trae el valor real
--         (numerador=denominador=meta_anual_2026 en todos los casos,
--         Resultado del Indicador=100% calculado por el propio Excel).
--       · Actividad 5.1 (id=159, hoja C5A1): caso especial — la fórmula
--         compara "Número de seguidores 2025" (21000) contra "Número de
--         seguidores 2026" (23000), dos valores puntuales de crecimiento,
--         no un par Alcanzada/Meta tradicional. Se sembraron ambos en
--         valor_meta (21000 y 23000 respectivamente) con valor_alcanzado
--         NULL, mismo patrón que el Componente 2 (equipamiento) del
--         piloto 032.
--  F) Sentido del PROPOSITO (id=148): la Matriz de Indicadores (PP-FM-0E,
--     página 11) marca "Descendente", pero la ficha individual (FORMATO
--     NO. 7, página 13) marca "Ascendente" para el MISMO indicador —
--     inconsistencia interna del propio documento. Se usó Ascendente
--     (coincide con la ficha individual Y con la lógica: más trámites
--     atendidos en tiempo y forma es mejor), mismo criterio que la
--     anomalía C del piloto 003. Pendiente que Hugo confirme.
--  G) Actividad 5.1 (id=159): el texto original dice "...recopilar,
--     procesar y izar la información..." — "izar" (alzar una bandera) no
--     tiene sentido gramatical en este contexto; se sembró como
--     "difundir" (lectura más plausible), documentado como corrección
--     editorial menor, no un dato de la fuente.
--  H) Análisis de Involucrados (PP-FM-05): layout en cruz (Indiferentes
--     arriba, Ejecutores izquierda, Beneficiarios derecha, Opositores
--     abajo, igual que el piloto 032), reconstruido por clustering de
--     coordenadas x/y. Confianza alta en general.
--  I) Unidad de Medida de la ficha individual del PROPOSITO (FORMATO NO.7)
--     dice "Documento" para un indicador de porcentaje — no se usó; se
--     aplicó la unidad real de sus variables (Trámites).
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
-- Ver anomalía A: fragmento huérfano "Limitada rendición de cuentas."
-- omitido.
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(8, 2026, 1,
  'Limitada articulación interinstitucional con las áreas operativas. Existen canales de comunicación insuficientes, falta de seguimiento a los acuerdos estratégicos y débil sistematización de la información que permita evaluar resultados de gestión.',
  'Presidencia Municipal fortalecida institucionalmente, con mecanismos claros de coordinación, gestión basada en evidencia y toma de decisiones informadas.'),
(8, 2026, 2,
  'Procesos administrativos poco digitalizados y retrasos en la gestión documental, lo que impacta en la atención al ciudadano y el control normativo de los actos de gobierno. Los procesos de archivo, actas y acuerdos carecen de herramientas tecnológicas que garanticen trazabilidad y consulta oportuna.',
  'Digitalización de trámites y archivo histórico, garantizando la transparencia, legalidad y trazabilidad de los actos administrativos.'),
(8, 2026, 3,
  'Limitada capacidad operativa y presupuestal, lo que impide atender de forma integral las demandas ciudadanas. Existen carencias en equipamiento, conectividad y capacitación administrativa, así como una débil integración a los mecanismos municipales de planeación.',
  'Capacitación continua, equipamiento básico y participación activa en el sistema de planeación.'),
(8, 2026, 4,
  'Mantiene una presencia digital y mediática fragmentada, con estrategias reactivas más que preventivas. No existe una planeación comunicacional basada en objetivos ni en indicadores de impacto, lo que limita la evaluación de resultados.',
  'Implementar una política integral de comunicación pública basada en resultados, con indicadores de alcance, interacción y percepción ciudadana informada y una administración transparente.'),
(8, 2026, 5,
  'Enfrenta problemas de saturación operativa, derivada de una atención constante a conflictos vecinales, sociales y administrativos. Falta de protocolos estandarizados para conciliación, prevención de conflictos y coordinación con Seguridad Pública.',
  'Consolidar un modelo de gobernanza preventiva y participativa, con protocolos claros de mediación, registro de incidentes y atención ciudadana.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
-- Ver anomalía B: causa1/causa5 y subcausa1-5 construidas como espejo
-- negativo de Set A (texto nativo del PDF no usado por corresponder a Set
-- B, narrativa sin relación con los indicadores reales).
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (8, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Deficiente atención institucional por parte de las dependencias e instancias de la administración municipal.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Mala percepción ciudadana en el que hacer gubernamental de la administración municipal.'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Bajo nivel de satisfacción de los servicios que ofrece el municipio por parte de la población.'),
    (2, 'Baja percepción del trabajo municipal.'),
    (3, 'Insatisfacción por parte de la ciudadanía, al no tener una respuesta favorable por parte del Municipio.'),
    (4, 'Poca credibilidad de la información.'),
    (5, 'Poco alcance de las acciones de las dependencias e instancias de la administración municipal.'),
    (6, 'Desconfianza en las acciones del Municipio.'),
    (7, 'Baja participación de la población en programas y acciones que ofrece el municipio.'),
    (8, 'Mala percepción sobre las acciones que realiza el gobierno municipal.'),
    (9, 'Difusión de contenidos de poco o nulo impacto para los habitantes.')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', central.id, 1,
    'Deficiente gestión de las políticas gubernamentales por el desempeño limitado de los servidores públicos.'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', central.id, 2,
    'Desconocimiento de las atribuciones y facultades del Gobierno Municipal, por parte los servidores públicos y los ciudadanos.'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', central.id, 3,
    'Insuficientes acuerdos vinculatorios con entidades de órdenes de Gobierno Federal y Estatal, así como entidades privadas de la sociedad civil.'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', central.id, 4,
    'Poca Cooperación entre Sociedad Y Gobierno.'
  FROM central RETURNING id
),
causa5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', central.id, 5,
    'Deficiente comunicación social del municipio, sin coordinación de programas de información por los canales adecuados sobre las actividades del H. Ayuntamiento, la Presidencia Municipal y sus Dependencias o Unidades Administrativas.'
  FROM central RETURNING id
),
causa6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', central.id, 6,
    'Falta de procesos estandarizados para la atención ciudadana y gestión administrativa en las Presidencias de Comunidad.'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', causa1.id, 1,
    'Estancamiento del programa Martes Ciudadano, sin incorporación de nuevas herramientas tecnológicas.'
  FROM causa1 RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', causa2.id, 1,
    'Deficiente atención con calidad y calidez humana a la población.'
  FROM causa2 RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', causa3.id, 1,
    'Falta de convenios y acuerdos con instituciones públicas y privadas para la ejecución de obras y acciones.'
  FROM causa3 RETURNING id
),
sub4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', causa4.id, 1,
    'Desarrollo inoportuno e ineficiente de los compromisos del Plan Municipal de Desarrollo.'
  FROM causa4 RETURNING id
),
sub5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'PROBLEMA', 'CAUSA', causa5.id, 1,
    'Deficiente recopilación y procesamiento de la información institucional útil para las Autoridades Municipales y la comunidad.'
  FROM causa5 RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 8, 2026, 'PROBLEMA', 'CAUSA', causa6.id, 1,
  'Ausencia de mecanismos sistemáticos de registro, control y seguimiento de trámites y servicios realizados por la Presidencia de Comunidad.'
FROM causa6;

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (8, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Eficiente atención institucional por parte de las dependencias e instancias de la administración municipal.',
    148,
    'Las dependencias cuentan con personal y recursos suficientes para cumplir los tiempos de atención establecidos.',
    'Bitácoras de atención ciudadana, registros administrativos de dependencias, reportes de seguimiento del OIC.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Buena percepción ciudadana en el que hacer gubernamental de las dependencias e instancias de la administración municipal.',
    147,
    'La ciudadanía responde de forma representativa; el municipio cuenta con recursos para aplicar encuestas.',
    'Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 8, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Alto nivel de satisfacción de los servicios que ofrece el municipio por parte de la población.'),
    (2, 'Alta percepción del trabajo municipal.'),
    (3, 'Confianza en las acciones del Municipio.'),
    (4, 'Alta credibilidad de la información.'),
    (5, 'Suficiente alcance de las acciones del gobierno municipal.'),
    (6, 'Satisfacción por parte de la ciudadanía.'),
    (7, 'Alta participación de la población en programas y acciones que ofrece el municipio.'),
    (8, 'Buena percepción sobre las acciones que realiza el gobierno municipal.'),
    (9, 'Difusión de contenidos de impacto para los habitantes.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Eficiente gestión de las políticas gubernamentales mediante el desempeño de los servidores públicos.', 149,
    'Las áreas municipales reportan sus avances de manera oportuna y con base en los indicadores aprobados.',
    'Programas Operativos Anuales (POA), informes trimestrales y anuales de dependencias, evidencias documentales de resultados.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Conocimiento de las atribuciones y facultades del Gobierno Municipal, por parte los servidores públicos y los ciudadanos.', 150,
    'Los participantes muestran disposición y continuidad en los procesos de capacitación y difusión.',
    'Listas de asistencia a talleres, registros fotográficos, material de difusión, constancias de participación.'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Suficientes acuerdos vinculatorios con entidades de órdenes de Gobierno Federal y Estatal, así como entidades privadas de la sociedad civil.', 151,
    'Las entidades externas mantienen interés en colaborar y los procesos de aprobación administrativa no se retrasan.',
    'Convenios registrados, oficios de colaboración, actas de sesión de Cabildo, informes de vinculación institucional.'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Alta Cooperación entre Sociedad Y Gobierno.', 152,
    'La ciudadanía mantiene disposición para integrarse en actividades colaborativas y existe acompañamiento institucional.',
    'Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.'
  FROM central RETURNING id
),
medio5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', central.id, 5,
    'Comunicación Social del Municipio.- Coordinar los programas de información por los canales de comunicación adecuados, sobre las actividades del H. Ayuntamiento, de la Presidencia Municipal y sus Dependencias o Unidades Administrativas.', 153,
    'Los medios de comunicación locales y digitales mantienen disponibilidad para difundir las acciones del municipio.',
    'Programas de comunicación, publicaciones oficiales, reportes de difusión en medios, bitácoras de actividades.'
  FROM central RETURNING id
),
medio6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', central.id, 6,
    'Implementación de procesos estandarizados para la atención ciudadana y gestión administrativa en las Presidencias de Comunidad.', 154,
    'Las autoridades auxiliares adoptan los procesos sin resistencia. Se cuenta con capacitación básica por parte del Ayuntamiento. Los manuales y formatos se mantienen actualizados y accesibles.',
    'Manual institucional de procedimientos. Formatos homologados validados por Secretaría del Ayuntamiento / Dirección de Gobernación. Actas de supervisión mensual. Evidencias fotográficas o documentales de aplicación.'
  FROM central RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 8, 2026, 'OBJETIVOS', 'MEDIO', m.padre_id, 1, m.texto, m.indicador_id, m.supuestos, m.medios_verificacion
FROM (
  SELECT medio1.id AS padre_id,
    'Martes Ciudadano.- Seguir impulsando los programas de martes ciudadano con la incorporación de las nuevas herramientas tecnológicas.' AS texto,
    155 AS indicador_id,
    'La ciudadanía acude y utiliza el programa Martes Ciudadano. Las dependencias municipales cuentan con capacidad de atención. Existe un registro confiable y estándar de las personas atendidas. Se mantiene continuidad del programa por parte del gobierno municipal.' AS supuestos,
    'Listas de asistencia. Registros de atención por dependencia. Sistema de Gestión de Atención Ciudadana. Reporte operativo de Martes Ciudadano. Informes de seguimiento mensual.' AS medios_verificacion
  FROM medio1
  UNION ALL
  SELECT medio2.id,
    'Atender con calidad y calidez humana a la población.',
    156,
    'Las acciones que se realizan es con la participación de la población, de esta forma se logra el desarrollo económico y social de los habitantes del municipio, con la finalidad de mejorar la calidad de vida.',
    'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.'
  FROM medio2
  UNION ALL
  SELECT medio3.id,
    'Celebrar convenios y acuerdos con instituciones públicas y privadas, para la ejecución de obras y acciones.',
    157,
    'Las acciones que se realizan es con la participación de la población, de esta forma se logra el desarrollo económico y social de los habitantes del municipio, con la finalidad de mejorar la calidad de vida.',
    'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.'
  FROM medio3
  UNION ALL
  SELECT medio4.id,
    'Desarrollo de forma oportuna y eficiente de los compromisos del Plan Municipal de Desarrollo.',
    158,
    'El municipio genera los productos y servicios que ofrece de calidad; la ciudadanía elige a sus autoridades y espera lo mejor de ellas, para que el municipio sobresalga económica, política y socialmente.',
    'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, encuestas con la ciudadanía, reportes de avance físico-financiero y avance de metas e indicadores.'
  FROM medio4
  UNION ALL
  SELECT medio5.id,
    'Información Institucional. Recopilar, procesar y difundir la información que resulte de utilidad, tanto para las Autoridades Municipales como para la comunidad.',
    159,
    'Los usuarios de redes sociales siguen las páginas del municipio por el beneficio que les representa.',
    'Seguidores de páginas oficiales e interacciones.'
  FROM medio5
  UNION ALL
  SELECT medio6.id,
    'Establecimiento de un sistema uniforme de registro y control de trámites y servicios en las Presidencias de Comunidad.',
    160,
    'Los presidentes de comunidad y auxiliares realizan registros completos y oportunos. Se les proporciona capacitación para el llenado de formatos. El Ayuntamiento centraliza y consolida la información adecuadamente.',
    'Bitácoras de trámites. Reportes quincenales enviados a Secretaría del Ayuntamiento. Copias de los formatos oficiales utilizados. Comparativo entre reportes y registros internos.'
  FROM medio6
) AS m;

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
-- Ver anomalía H: layout en cruz reconstruido por clustering de coordenadas.
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (8, 2026, 'BENEFICIARIO', 'Ciudadanía en situación de vulnerabilidad', 1),
  (8, 2026, 'BENEFICIARIO', 'Instituciones académicas de nivel medio o superior sin convenios vigentes', 2),
  (8, 2026, 'BENEFICIARIO', 'Instituciones Educativas y Centros Comunitarios', 3),
  (8, 2026, 'BENEFICIARIO', 'Comités Vecinales y de Participación Ciudadana', 4),
  (8, 2026, 'BENEFICIARIO', 'Organizaciones Civiles y Asociaciones Locales', 5),
  (8, 2026, 'EJECUTOR', 'Presidencia Municipal', 1),
  (8, 2026, 'EJECUTOR', 'Secretaría del Ayuntamiento', 2),
  (8, 2026, 'EJECUTOR', 'Regidores y Presidentes de comunidad', 3),
  (8, 2026, 'EJECUTOR', 'Comunicación Social', 4),
  (8, 2026, 'EJECUTOR', 'Gobernación', 5),
  (8, 2026, 'OPOSITOR', 'Ciudadanos inconformes o no beneficiados', 1),
  (8, 2026, 'OPOSITOR', 'Sectores políticos opositores', 2),
  (8, 2026, 'OPOSITOR', 'Medios de comunicación críticos', 3),
  (8, 2026, 'OPOSITOR', 'Sindicatos o grupos laborales', 4),
  (8, 2026, 'INDIFERENTE', 'Empresas privadas no vinculadas a programas sociales', 1),
  (8, 2026, 'INDIFERENTE', 'Ciudadanos de zonas no prioritarias', 2);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo: Estratégico (Fin/Propósito) / Gestión (Componentes/Actividades).
-- Dimensión/Frecuencia/Fórmula/Medios/Supuestos: de la Matriz de
-- Indicadores (PP-FM-0E, páginas 11-12). Sentido: ver anomalía F para el
-- Propósito. Línea base: solo Fin (45.4/2023) y Actividad 5.1 (21000/2025)
-- la traen explícita, ver anomalía E. Interpretación: del .xlsx (fila
-- "Interpretación" de cada hoja), texto limpio sin contaminación.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).',
  linea_base=45.4, linea_base_anio=2023,
  interpretacion='Mide la percepción ciudadana sobre la calidad de los servicios públicos municipales. Evalúa la efectividad del gobierno para atender necesidades básicas y mejorar la calidad de vida.'
WHERE id=147;

-- Ver anomalía F: Sentido Descendente en Matriz de Riesgos vs Ascendente en
-- ficha individual — se usó Ascendente.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Bitácoras de atención ciudadana, registros administrativos de dependencias, reportes de seguimiento del OIC.',
  interpretacion='Evalúa la eficiencia administrativa y calidad del servicio prestado. Mide el cumplimiento de tiempos de respuesta establecidos para trámites y servicios municipales.'
WHERE id=148;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programas Operativos Anuales (POA), informes trimestrales y anuales de dependencias, evidencias documentales de resultados.',
  interpretacion='Indica el grado de avance en el cumplimiento de los objetivos establecidos por las áreas municipales. Mide eficiencia operativa y capacidad de gestión.'
WHERE id=149;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia a talleres, registros fotográficos, material de difusión, constancias de participación.',
  interpretacion='Mide el nivel de conocimiento institucional y ciudadano sobre funciones, competencias y servicios del gobierno municipal. Refleja transparencia, gobernanza y fortalecimiento institucional.'
WHERE id=150;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Convenios registrados, oficios de colaboración, actas de sesión de Cabildo, informes de vinculación institucional.',
  interpretacion='Evalúa la capacidad del municipio para establecer alianzas, acuerdos y acciones coordinadas con otras instituciones. Refleja gestión interinstitucional.'
WHERE id=151;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.',
  interpretacion='Mide el nivel de involucramiento ciudadano en la toma de decisiones y ejecución de proyectos. Refleja gobernanza participativa y corresponsabilidad social.'
WHERE id=152;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programas de comunicación, publicaciones oficiales, reportes de difusión en medios, bitácoras de actividades.',
  interpretacion='Evalúa la capacidad del gobierno para comunicar acciones, programas y resultados a la población. Refleja transparencia y cumplimiento del plan de comunicación institucional.'
WHERE id=153;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Manual institucional de procedimientos. Formatos homologados validados por Secretaría del Ayuntamiento / Dirección de Gobernación. Actas de supervisión mensual. Evidencias fotográficas o documentales de aplicación.',
  interpretacion='Mide el nivel de institucionalización y mejora de procesos en las Presidencias de Comunidad. Evalúa eficiencia operativa y calidad del servicio a la ciudadanía.'
WHERE id=154;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia. Registros de atención por dependencia. Sistema de Gestión de Atención Ciudadana. Reporte operativo de Martes Ciudadano. Informes de seguimiento mensual.',
  interpretacion='Mide la eficiencia y capacidad de respuesta del Gobierno Municipal para atender a la ciudadanía durante las jornadas de Martes Ciudadano. Un mayor porcentaje indica una gestión más efectiva, una atención más completa de la demanda y un mejor acercamiento del gobierno con la población.'
WHERE id=155;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.',
  interpretacion='Mide la calidad del servicio brindado en términos de orientación, solución de trámites y atención a demandas ciudadanas.'
WHERE id=156;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.',
  interpretacion='Mide la proporción de acuerdos o convenios identificados como necesarios que fueron formalmente solicitados. Evalúa gestión institucional y capacidad de articulación.'
WHERE id=157;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, encuestas con la ciudadanía, reportes de avance físico-financiero y avance de metas e indicadores.',
  interpretacion='Mide la capacidad del municipio para entregar, gestionar o coordinar apoyos destinados a la ciudadanía. Refleja capacidad operativa y eficacia institucional.'
WHERE id=158;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Seguidores de páginas oficiales e interacciones.',
  linea_base=21000, linea_base_anio=2025,
  interpretacion='Evalúa el nivel de segmentación y efectividad en la comunicación digital del gobierno municipal. Mide capacidad para informar a grupos específicos mediante redes sociales.'
WHERE id=159;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Bitácoras de trámites. Reportes quincenales enviados a Secretaría del Ayuntamiento. Copias de los formatos oficiales utilizados. Comparativo entre reportes y registros internos.',
  interpretacion='Mide el cumplimiento de los procedimientos administrativos establecidos y la correcta documentación de trámites en Presidencias de Comunidad. Refleja orden, control y eficiencia administrativa.'
WHERE id=160;

-- ---------- 6. indicador_variables + valores reales del .xlsx (ver anomalía E) ----------

-- id=147 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (147, 'Número de ciudadanos satisfechos', 'CS', 'Ciudadanos', 'Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (147, 'Total de encuestados', 'TE', 'Ciudadanos', 'Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 27290.34, 30080 FROM v1
UNION ALL SELECT v2.id, 2026, 60084.42, 62018 FROM v2;

-- id=148 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (148, 'Número de trámites o servicios atendidos dentro del plazo', 'NTSADPE', 'Trámites', 'Bitácoras de atención ciudadana, registros administrativos de dependencias, reportes de seguimiento del OIC.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (148, 'Total de trámites o servicios solicitados', 'TTSS', 'Trámites', 'Bitácoras de atención ciudadana, registros administrativos de dependencias, reportes de seguimiento del OIC.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 600 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 600 FROM v2;

-- id=149 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (149, 'Metas cumplidas', 'MC', 'Metas', 'Programas Operativos Anuales (POA), informes trimestrales y anuales de dependencias, evidencias documentales de resultados.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (149, 'Total de metas programadas', 'TMP', 'Metas', 'Programas Operativos Anuales (POA), informes trimestrales y anuales de dependencias, evidencias documentales de resultados.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1 FROM v2;

-- id=150 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (150, 'Número de participantes capacitados o informados', 'NPCI', 'Personas', 'Listas de asistencia a talleres, registros fotográficos, material de difusión, constancias de participación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (150, 'Total de servidores públicos y ciudadanos meta', 'TSPCM', 'Personas', 'Listas de asistencia a talleres, registros fotográficos, material de difusión, constancias de participación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 854 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 854 FROM v2;

-- id=151 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (151, 'Número de convenios firmados', 'NCF', 'Convenios', 'Convenios registrados, oficios de colaboración, actas de sesión de Cabildo, informes de vinculación institucional.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (151, 'Total de convenios planificados', 'TCP', 'Convenios', 'Convenios registrados, oficios de colaboración, actas de sesión de Cabildo, informes de vinculación institucional.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=152 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (152, 'Número de proyectos con participación ciudadana', 'NPCPC', 'Proyectos', 'Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (152, 'Total de proyectos desarrollados', 'TPD', 'Proyectos', 'Actas de reuniones de comités vecinales, reportes de participación social, evidencias fotográficas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=153 C5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (153, 'Número de programas o campañas ejecutadas', 'NPCE', 'Programas', 'Programas de comunicación, publicaciones oficiales, reportes de difusión en medios, bitácoras de actividades.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (153, 'Total de programas o campañas programadas', 'TPCP', 'Programas', 'Programas de comunicación, publicaciones oficiales, reportes de difusión en medios, bitácoras de actividades.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 84 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 84 FROM v2;

-- id=154 C6
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (154, 'Número de procesos estandarizados implementados', 'NPEI', 'Procesos', 'Manual institucional de procedimientos. Formatos homologados validados por Secretaría del Ayuntamiento / Dirección de Gobernación. Actas de supervisión mensual. Evidencias fotográficas o documentales de aplicación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (154, 'Total de procesos identificados', 'TDPI', 'Procesos', 'Manual institucional de procedimientos. Formatos homologados validados por Secretaría del Ayuntamiento / Dirección de Gobernación. Actas de supervisión mensual. Evidencias fotográficas o documentales de aplicación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 6 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 6 FROM v2;

-- id=155 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (155, 'Número de personas atendidas en Martes Ciudadano', 'NPAMC', 'Personas', 'Listas de asistencia. Registros de atención por dependencia. Sistema de Gestión de Atención Ciudadana. Reporte operativo de Martes Ciudadano. Informes de seguimiento mensual.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (155, 'Total de personas solicitantes o programadas', 'TPSP', 'Personas', 'Listas de asistencia. Registros de atención por dependencia. Sistema de Gestión de Atención Ciudadana. Reporte operativo de Martes Ciudadano. Informes de seguimiento mensual.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 3920 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 3920 FROM v2;

-- id=156 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (156, 'Seguimiento a peticiones ciudadanas', 'SPC', 'Peticiones', 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (156, 'Total de peticiones ciudadanas', 'TPC', 'Peticiones', 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 95 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 95 FROM v2;

-- id=157 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (157, 'Gestión de apoyos y proyectos', 'GAP', 'Gestiones', 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (157, 'Total de gestiones programadas', 'TGP', 'Gestiones', 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 6 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 6 FROM v2;

-- id=158 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (158, 'Compromisos realizados', 'CR', 'Compromisos', 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, encuestas con la ciudadanía, reportes de avance físico-financiero y avance de metas e indicadores.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (158, 'Total de compromisos programados', 'TCPr', 'Compromisos', 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, encuestas con la ciudadanía, reportes de avance físico-financiero y avance de metas e indicadores.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 155 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 155 FROM v2;

-- id=159 A5.1 (ver anomalía E: caso especial, 2 valores puntuales de crecimiento)
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (159, 'Número de seguidores 2025', 'NS25', 'Seguidores', 'Seguidores de páginas oficiales e interacciones.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (159, 'Número de seguidores 2026', 'NS26', 'Seguidores', 'Seguidores de páginas oficiales e interacciones.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 21000 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 23000 FROM v2;

-- id=160 A6.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (160, 'Número de trámites en formatos oficiales', 'NTFO', 'Trámites', 'Bitácoras de trámites. Reportes quincenales enviados a Secretaría del Ayuntamiento. Copias de los formatos oficiales utilizados. Comparativo entre reportes y registros internos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (160, 'Total de trámites realizados', 'TTR', 'Trámites', 'Bitácoras de trámites. Reportes quincenales enviados a Secretaría del Ayuntamiento. Copias de los formatos oficiales utilizados. Comparativo entre reportes y registros internos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 252 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 252 FROM v2;

COMMIT;
