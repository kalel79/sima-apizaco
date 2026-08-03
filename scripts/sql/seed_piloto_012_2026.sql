-- ============================================================
-- SEED PILOTO 012 — contenido 2026 del módulo MML
-- Fuente: "3. 012 FOMENTO A LA PRODUCCIÒN Y COMERCIALIZACIÒN.pdf" (46 páginas)
-- Script SQL revisable (NO migración) — programa_id = 3 (clave '012'), anio = 2026
-- Mismo método que 005: pdfjs-dist + clustering por coordenadas x/y (sin
-- poppler en esta máquina).
--
-- Los 26 indicadores (ids 62-87) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que 003/005).
--
-- ANOMALÍAS EN LA FUENTE — este PDF viene MÁS corrupto que el de 005
-- (documentadas, no corregidas silenciosamente):
--  J) Fichas de actividad 1.1/1.2/1.3 (ids 72-74): sus "Variables" están
--     corridas una posición hacia adelante (la ficha de 1.1 trae las
--     variables reales de 1.2, la de 1.2 trae las de 1.3, la de 1.3 trae
--     las de 2.1). Se reconstruyeron los nombres de variable reales desde
--     la fórmula de cada indicador en la Matriz de Riesgos (páginas 13-14,
--     confiable) en vez de confiar en el campo "Variables" de cada ficha.
--  K) Ficha de la actividad 2.1 (id=75): su "Nombre" repite el texto del
--     objetivo en vez del nombre del indicador, y sus "Variables" son
--     literalmente los datos de la actividad 8.1 (Parquímetros). Se ignoró
--     por completo y se reconstruyó desde la Matriz de Riesgos.
--  L) Ficha de la actividad 8.1 (id=87): sus campos "Resultado Esperado" y
--     "Clave programática" traen contenido copiado del programa 005
--     (Seguridad Pública — "Seguridad Pública Eficiente", "13.1.17.171.05");
--     su "Interpretación" y "Fuente de Información" son idénticas
--     (incorrectas) a las de la ficha 2.1. Se escribió una interpretación
--     propia para 2.1 y 8.1, fiel al tema real de cada una.
--  M) El texto de la actividad 4.1 en las listas METAS/Acciones traía
--     pegada la frase "estatales y federales de seguridad" (contaminación
--     cruzada del programa 005, evidente por el tema — una campaña de
--     turismo no tiene relación con dependencias de seguridad). Se
--     eliminó esa frase del texto del nodo.
--  N) Ficha de la actividad 6.1 (id=84): su "Nombre" repite el texto del
--     objetivo en vez del nombre real del indicador (que sí está correcto
--     en el catálogo); sus Variables sí son correctas, se usaron tal cual.
--  O) Ficha de C7 (id=70): sus "Variables" dicen "Proyectos apoyados /
--     Total de proyectos programados" (copiadas de C1), pero la fórmula
--     real de C7 en la Matriz de Riesgos es "Convenios o acuerdos
--     firmados / Convenios programados" — se usaron los nombres reales.
--  P) Propósito (id=63): la Matriz de Riesgos marca Sentido=Descendente
--     para un indicador de "incremento en empleos formales", lo cual es
--     contraintuitivo (más empleo = mejor = normalmente Ascendente). A
--     diferencia de la anomalía C de 003 (donde se respetó la fuente tal
--     cual), aquí Hugo pidió explícitamente corregirlo — se sembró
--     Sentido=Ascendente, no lo que dice el PDF.
--  Q) Valores de indicador_variables en Componentes/Actividades (ids 64-87):
--     igual que en 005 (anomalía I), no se pudieron usar los valores de
--     cada ficha porque están corridos/corruptos — se usó
--     `indicadores.meta_anual_2026` (ya sembrado, confirmado contra el POA)
--     como Alcanzada Y Meta, consistente con que casi todos los
--     indicadores de este documento muestran Resultado=100%.
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(3, 2026, 1,
  'Desigualdad en el crecimiento económico local y baja competitividad de los sectores productivos.',
  'Consolidar un modelo de desarrollo económico equitativo, con sectores productivos fortalecidos y mayor competitividad local.'),
(3, 2026, 2,
  'Escasa diversificación económica y débil impulso a sectores emergentes y estratégicos.',
  'Fomentar la diversificación económica con programas de inversión e impulso a sectores innovadores y estratégicos.'),
(3, 2026, 3,
  'MIPYMES y emprendedores con bajo acceso a financiamiento y capacitación.',
  'Impulso a emprendedores y MIPYMES mediante capacitación, financiamiento accesible y fortalecimiento de capacidades empresariales.'),
(3, 2026, 4,
  'Alta informalidad económica y ausencia de incentivos para la formalización.',
  'Implementación de censos, diagnósticos e incentivos para la formalización, regulando la economía informal de manera justa.'),
(3, 2026, 5,
  'Turismo subaprovechado por falta de infraestructura y promoción limitada.',
  'Consolidar a Apizaco como destino turístico atractivo, con infraestructura adecuada y estrategias de promoción territorial.'),
(3, 2026, 6,
  'Sector agropecuario rezagado y con baja productividad.',
  'Modernizar el sector agropecuario con innovación tecnológica, capacitación y organización para incrementar su productividad.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (3, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Desigualdad en el crecimiento económico local y baja competitividad de los sectores productivos del municipio de Apizaco, además de falta de desarrollo turístico y cultural.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'EFECTO', central.id, 0, 'Baja recaudación e inversión municipal'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Crecimiento económico desigual entre sectores'),
    (2, 'Falta de empleo digno y sostenible'),
    (3, 'Migración por falta de oportunidades'),
    (4, 'Persistencia de la informalidad'),
    (5, 'Turismo subaprovechado'),
    (6, 'Perdida de diversidad cultural')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Débil diversificación económica'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Limitaciones a MIPYMES y emprendedores'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 3, 'Informalidad sin regulación'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 4, 'Subaprovechamiento turístico'
  FROM central RETURNING id
),
causa5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 5, 'Sector agropecuario rezagado'
  FROM central RETURNING id
),
causa6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 6, 'Ámbito cultural subvalorado'
  FROM central RETURNING id
),
causa7 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 7, 'Desorganizacion administrativa entre las áreas'
  FROM central RETURNING id
),
causa8 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', central.id, 8, 'Operación ineficiente y desactualizada del sistema de parquímetros municipales'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Falta de impulso a sectores emergentes y estratégicos'),
    (2, 'Débil promoción de la inversión local')
  ) AS v(orden, texto) RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa2.id, 1, 'Escasa capacitación técnica y empresarial'
  FROM causa2 RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa3.id, v.orden, v.texto
  FROM causa3, (VALUES
    (1, 'Falta de censos y diagnóstico de la economía informal'),
    (2, 'Ausencia de incentivos para la formalización')
  ) AS v(orden, texto) RETURNING id
),
sub4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa4.id, v.orden, v.texto
  FROM causa4, (VALUES
    (1, 'Marca territorial débil'),
    (2, 'Infraestructura turística limitada'),
    (3, 'Poca promoción de Apizaco como destino')
  ) AS v(orden, texto) RETURNING id
),
sub5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa5.id, v.orden, v.texto
  FROM causa5, (VALUES
    (1, 'Baja productividad rural'),
    (2, 'Falta de modernización tecnológica y organizativa')
  ) AS v(orden, texto) RETURNING id
),
sub6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa6.id, v.orden, v.texto
  FROM causa6, (VALUES
    (1, 'Poca infraestructura para la difusión de temas culturales'),
    (2, 'Baja difusión de los eventos culturales')
  ) AS v(orden, texto) RETURNING id
),
sub7 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa7.id, 1, 'Falta coordinación entre las áreas'
  FROM causa7 RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 3, 2026, 'PROBLEMA', 'CAUSA', causa8.id, 1, 'Parquímetros ineficientes o desactualizados'
FROM causa8;

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (3, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Lograr un desarrollo económico equitativo y sostenible en Apizaco, que incremente la competitividad local, reduzca la desigualdad entre sectores y mejore las oportunidades de empleo digno y productivo',
    63,
    'La iniciativa privada mantiene dinamismo; no se presentan cierres masivos de negocios por factores externos.',
    'IMSS; Secretaría del Trabajo y Previsión Social; registros municipales de licencias comerciales.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Incremento de la recaudación e inversión municipal.',
    62,
    'El contexto nacional y estatal no entra en crisis prolongada; existen condiciones macroeconómicas favorables.',
    'INEGI – Cuentas de Crecimiento Económico Regional; DataMéxico.'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 3, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Mayor equidad en el crecimiento económico entre sectores.'),
    (2, 'Incremento en el empleo formal y digno.'),
    (3, 'Reducción de la migración por falta de oportunidades.'),
    (4, 'Disminución de la economía informal.'),
    (5, 'Aprovechamiento del turismo como motor económico.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Gestión institucional fortalecida', 64,
    'Existe interés empresarial; se cuenta con recursos técnicos y financieros.',
    'Informes de la Dirección de Desarrollo Económico; convenios de colaboración.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Impulso a MiPyMEs y emprendedores', 65,
    'El sector emprendedor participa activamente; los recursos financieros se ejercen en tiempo.',
    'Padrón de beneficiarios; informes de programas; actas de entrega de financiamiento.'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Regulación e integración de la economía informal', 66,
    'Los comerciantes aceptan participar en programas de formalización; se ofrecen incentivos atractivos.',
    'Censos municipales; actas de otorgamiento de permisos; registros de Tesorería.'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Aprovechamiento del potencial turístico', 67,
    'No se presentan crisis de seguridad o sanitarias que limiten el turismo; la oferta cultural es atractiva.',
    'Informes de la Dirección de Turismo Municipal; estadísticas de SECTUR estatal.'
  FROM central RETURNING id
),
medio5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 5,
    'Modernización del sector agropecuario', 68,
    'Productores participan y aplican lo aprendido.',
    'Listas de asistencia; convenios con asociaciones rurales; informes de Desarrollo Agropecuario.'
  FROM central RETURNING id
),
medio6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 6,
    'Fortalecimiento del ámbito cultural municipal.', 69,
    'El presupuesto asignado se libera en tiempo; la infraestructura es utilizada por la ciudadanía',
    'Expedientes de obra; reportes de la Dirección de Cultura y Obras Públicas; actas de entrega.'
  FROM central RETURNING id
),
medio7 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 7,
    'Consolidación de la coordinación administrativa y operativa entre áreas municipales.', 70,
    'Las áreas municipales muestran disposición a colaborar y dar continuidad a los acuerdos.',
    'Actas de instalación; minutas de reuniones; convenios registrados.'
  FROM central RETURNING id
),
medio8 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', central.id, 8,
    'Sistema de parquímetros municipales operando de manera eficiente, transparente y continua.', 71,
    'Existencia de proveedores y personal capacitado',
    'Bitácoras de mantenimiento, reportes técnicos'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Impulso a sectores emergentes y estratégicos', 72,
       'Los sectores responden positivamente a los estímulos', 'Informes de proyectos; convenios.'),
    (2, 'Programas de atracción y promoción de inversión local.', 73,
       'Clima político y económico estable.', 'Registros de inversión; licencias y permisos.'),
    (3, 'Estrategias de innovación tecnológica y digitalización empresarial.', 74,
       'Las empresas adoptan las tecnologías.', 'Reportes de capacitación; convenios con instituciones.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, 1,
    'Programas de capacitación técnica y empresarial', 75,
    'La asistencia es constante y efectiva.', 'Listas de asistencia; evaluaciones de cursos.'
  FROM medio2 RETURNING id
),
act3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio3, (VALUES
    (1, 'Censos municipales de economía informal', 76,
       'Los comerciantes se registran voluntariamente.', 'Padrón municipal.'),
    (2, 'Campañas de información sobre beneficios de la formalidad', 77,
       'La ciudadanía recibe y comprende los beneficios.', 'Evidencias de difusión; materiales impresos.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio4, (VALUES
    -- Anomalía M: texto original traía pegada la frase "estatales y
    -- federales de seguridad" (contaminación del programa 005), se quitó.
    (1, 'Campañas de promoción de Apizaco como destino turístico.', 78,
       'La promoción es atractiva y llega al público objetivo.', 'Materiales, reportes de difusión.'),
    (2, 'Desarrollo del programa "Descubre Apizaco: Barrio Mágico".', 79,
       'Se mantiene el reconocimiento del programa.', 'Informes de eventos; registro de participantes.'),
    (3, 'Mejoramiento de la infraestructura turística (plazas, paraderos, señalética)', 80,
       'Presupuesto aprobado y ejecutado.', 'Expedientes de obra; actas de entrega.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio5.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio5, (VALUES
    (1, 'Programas de capacitación en prácticas agrícolas modernas.', 81,
       'Productores participan y aplican lo aprendido.', 'Listas de asistencia; reportes técnicos.'),
    (2, 'Incorporación de tecnologías (de riego)', 82,
       'Disponibilidad de equipos e insumos.', 'Reportes técnicos; convenios con productores.'),
    (3, 'Impulso a la organización de productores rurales.', 83,
       'Los productores se integran y mantienen activa su organización.', 'Actas de constitución; convenios.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio6.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio6, (VALUES
    (1, 'Infraestructura cultural construida y habilitada.', 84,
       'Los espacios se destinan efectivamente a actividades culturales.', 'Reportes de obras; inventario de espacios culturales.'),
    (2, 'Estrategias de difusión cultural aplicadas.', 85,
       'Los medios locales apoyan la difusión; la ciudadanía tiene acceso a la información.', 'Materiales de difusión; informes de Comunicación Social.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act7 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio7.id, 1,
    'Comités y mesas de coordinación interinstitucional en operación.', 86,
    'Las áreas convocadas participan de forma activa y continua.', 'Actas de reunión; reportes de seguimiento.'
  FROM medio7 RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 3, 2026, 'OBJETIVOS', 'MEDIO', medio8.id, 1,
  'Modernización tecnológica de los parquímetros', 87,
  'Se cuenta con proveedores confiables y los usuarios adoptan el sistema modernizado.',
  'Inventarios del área de Movilidad y Transporte, reportes de funcionamiento.'
FROM medio8;

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (3, 2026, 'BENEFICIARIO', 'Micro, pequeñas y medianas empresas (MiPyMEs)', 1),
  (3, 2026, 'BENEFICIARIO', 'Comerciantes y prestadores de servicios', 2),
  (3, 2026, 'BENEFICIARIO', 'Productores agrícolas, artesanos y emprendedores', 3),
  (3, 2026, 'BENEFICIARIO', 'Consumidores locales', 4),
  (3, 2026, 'EJECUTOR', 'Dirección de Desarrollo Económico', 1),
  (3, 2026, 'EJECUTOR', 'Cámaras empresariales y asociaciones de comerciantes', 2),
  (3, 2026, 'EJECUTOR', 'Dependencias estatales y federales', 3),
  (3, 2026, 'EJECUTOR', 'Organismos financieros', 4),
  (3, 2026, 'OPOSITOR', 'Comerciantes informales no regulados', 1),
  (3, 2026, 'OPOSITOR', 'Competidores externos', 2),
  (3, 2026, 'OPOSITOR', 'Sectores políticos opositores', 3),
  (3, 2026, 'OPOSITOR', 'Empresas que incumplen normativas', 4),
  (3, 2026, 'INDIFERENTE', 'Ciudadanía con empleo estable fuera del municipio', 1),
  (3, 2026, 'INDIFERENTE', 'Inversionistas privados externos', 2);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo por convención MIR estándar: Fin/Propósito=Estratégico, resto=Gestión
-- (mismo criterio que 003/005; el texto junto a los cuadros de la Matriz de
-- Riesgos de este PDF en particular no es confiable para leer Tipo — se
-- mezcla con las gráficas). Dimensión/Sentido sí vienen de un renglón único
-- y legible en la Matriz de Riesgos. Línea base: Fin/Propósito=2024
-- (así lo marca su ficha), resto=2025.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='INEGI – Cuentas de Crecimiento Económico Regional; DataMéxico.',
  linea_base_anio=2024,
  interpretacion='Mide la dinámica económica local y el crecimiento.'
WHERE id=62;

-- Anomalía P: la fuente marca Sentido=Descendente para este indicador de
-- incremento en empleo formal (contraintuitivo) — Hugo pidió corregirlo a
-- Ascendente (más empleo formal = mejor).
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='IMSS; Secretaría del Trabajo y Previsión Social; registros municipales de licencias comerciales.',
  linea_base_anio=2024,
  interpretacion='Mide el impacto de estrategias municipales en el empleo formal.'
WHERE id=63;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de la Dirección de Desarrollo Económico; convenios de colaboración.',
  linea_base_anio=2025,
  interpretacion='Evalúa el impulso municipal a sectores nuevos o emergentes.'
WHERE id=64;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Padrón de beneficiarios; informes de programas; actas de entrega de financiamiento.',
  linea_base_anio=2025,
  interpretacion='Mide la eficacia del apoyo empresarial municipal.'
WHERE id=65;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Censos municipales; actas de otorgamiento de permisos; registros de Tesorería.',
  linea_base_anio=2025,
  interpretacion='Mide la eficiencia del municipio para reducir la informalidad.'
WHERE id=66;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de la Dirección de Turismo Municipal; estadísticas de SECTUR estatal.',
  linea_base_anio=2025,
  interpretacion='Evalúa el impacto del turismo municipal.'
WHERE id=67;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; convenios con asociaciones rurales; informes de Desarrollo Agropecuario.',
  linea_base_anio=2025,
  interpretacion='Mide el avance en prácticas sostenibles del campo.'
WHERE id=68;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Expedientes de obra; reportes de la Dirección de Cultura y Obras Públicas; actas de entrega.',
  linea_base_anio=2025,
  interpretacion='Evalúa la expansión de espacios culturales.'
WHERE id=69;

-- Anomalía O: nombre de variables corregido (ver sección 6); interpretación
-- usa el texto real de C7 (coordinación interinstitucional), no el copiado.
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de instalación; minutas de reuniones; convenios registrados.',
  linea_base_anio=2025,
  interpretacion='Mide la coordinación del municipio con instituciones.'
WHERE id=70;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Bitácoras de mantenimiento, reportes técnicos',
  linea_base_anio=2025,
  interpretacion='Evalúa la capacidad operativa del municipio para garantizar la funcionalidad del sistema de parquímetros.'
WHERE id=71;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de proyectos; convenios.',
  linea_base_anio=2025,
  interpretacion='Mide la capacidad de impulsar proyectos productivos.'
WHERE id=72;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Registros de inversión; licencias y permisos.',
  linea_base_anio=2025,
  interpretacion='Evalúa la atracción de inversión privada.'
WHERE id=73;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de capacitación; convenios con instituciones.',
  linea_base_anio=2025,
  interpretacion='Mide la modernización empresarial municipal.'
WHERE id=74;

-- Anomalía K: ficha corrupta (Nombre y Variables de otra actividad),
-- interpretación propia fiel al tema real (capacitación técnica/empresarial).
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; evaluaciones de cursos.',
  linea_base_anio=2025,
  interpretacion='Mide la participación efectiva del personal en los cursos de capacitación técnica y empresarial ofrecidos, respecto a los cupos programados.'
WHERE id=75;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Padrón municipal.',
  linea_base_anio=2025,
  interpretacion='Mide la efectividad del gobierno en promoción del empleo.'
WHERE id=76;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Evidencias de difusión; materiales impresos.',
  linea_base_anio=2025,
  interpretacion='Evalúa impacto real en la economía de los beneficiarios.'
WHERE id=77;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Materiales, reportes de difusión.',
  linea_base_anio=2025,
  interpretacion='Mide aceptación social y pertinencia de eventos.'
WHERE id=78;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de eventos; registro de participantes.',
  linea_base_anio=2025,
  interpretacion='Evalúa eficiencia recaudatoria y dinamismo económico.'
WHERE id=79;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Expedientes de obra; actas de entrega.',
  linea_base_anio=2025,
  interpretacion='Mide avance de infraestructura turística.'
WHERE id=80;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; reportes técnicos.',
  linea_base_anio=2025,
  interpretacion='Evalúa activación de espacios comerciales.'
WHERE id=81;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes técnicos; convenios con productores.',
  linea_base_anio=2025,
  interpretacion='Mide modernización agrícola local.'
WHERE id=82;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de constitución; convenios.',
  linea_base_anio=2025,
  interpretacion='Mide eficiencia de comunicación institucional.'
WHERE id=83;

-- Anomalía N: Nombre de ficha repetía el objetivo, no el indicador (ya
-- correcto en catálogo); Variables sí eran correctas.
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de obras; inventario de espacios culturales.',
  linea_base_anio=2025,
  interpretacion='Evalúa avance en infraestructura cultural.'
WHERE id=84;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Materiales de difusión; informes de Comunicación Social.',
  linea_base_anio=2025,
  interpretacion='Mide visibilidad cultural municipal.'
WHERE id=85;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de reunión; reportes de seguimiento.',
  linea_base_anio=2025,
  interpretacion='Evalúa articulación y gobernanza institucional.'
WHERE id=86;

-- Anomalía L: ficha con contenido copiado de otro programa (005) y de la
-- ficha 2.1; interpretación propia fiel al tema real (parquímetros).
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios del área de Movilidad y Transporte, reportes de funcionamiento.',
  linea_base_anio=2025,
  interpretacion='Mide el avance en la modernización tecnológica del sistema de parquímetros municipales, evaluando cuántos quedan instalados y operando respecto a lo programado.'
WHERE id=87;

-- ---------- 6. indicador_variables + indicador_variables_valores ----------
-- Nombres de variable reconstruidos desde la fórmula de cada indicador en la
-- Matriz de Riesgos (confiable) — ver anomalías J, K y O. Valores = meta_anual_2026
-- (ya sembrado, confirmado contra el POA) usado como Alcanzada Y Meta — ver
-- anomalía Q. unidad_medida corregida a la real (mismo criterio que 003/005).

-- id=62 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (62, 'ITAEE actual', 'ITAEEA', 'Índice', 'INEGI – Cuentas de Crecimiento Económico Regional; DataMéxico.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (62, 'ITAEE base', 'ITAEEB', 'Índice', 'INEGI – Cuentas de Crecimiento Económico Regional; DataMéxico.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 0, 1.7 FROM v1
UNION ALL SELECT v2.id, 2026, 1.2, 1.2 FROM v2;

-- id=63 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (63, 'Empleos actuales', 'EA', 'Empleos', 'IMSS; Secretaría del Trabajo y Previsión Social; registros municipales de licencias comerciales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (63, 'Empleos base', 'EB', 'Empleos', 'IMSS; Secretaría del Trabajo y Previsión Social; registros municipales de licencias comerciales.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 15566 FROM v1
UNION ALL SELECT v2.id, 2026, 14166, 14166 FROM v2;

-- id=64 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (64, 'Sectores apoyados', 'SA', 'Sectores', 'Informes de la Dirección de Desarrollo Económico; convenios de colaboración.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (64, 'Total de sectores identificados', 'TSI', 'Sectores', 'Informes de la Dirección de Desarrollo Económico; convenios de colaboración.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 420, 420 FROM v1
UNION ALL SELECT v2.id, 2026, 420, 420 FROM v2;

-- id=65 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (65, 'Beneficiarios atendidos', 'BA', 'Beneficiarios', 'Padrón de beneficiarios; informes de programas; actas de entrega de financiamiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (65, 'Total de MiPyMEs registradas', 'TMPYMESR', 'MiPyMEs', 'Padrón de beneficiarios; informes de programas; actas de entrega de financiamiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=66 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (66, 'Comerciantes formalizados', 'CF', 'Comerciantes', 'Censos municipales; actas de otorgamiento de permisos; registros de Tesorería.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (66, 'Comerciantes informales registrados', 'CIR', 'Comerciantes', 'Censos municipales; actas de otorgamiento de permisos; registros de Tesorería.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=67 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (67, 'Visitantes actuales', 'VA', 'Visitantes', 'Informes de la Dirección de Turismo Municipal; estadísticas de SECTUR estatal.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (67, 'Visitantes base', 'VB', 'Visitantes', 'Informes de la Dirección de Turismo Municipal; estadísticas de SECTUR estatal.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2000, 2000 FROM v1
UNION ALL SELECT v2.id, 2026, 2000, 2000 FROM v2;

-- id=68 C5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (68, 'Productores capacitados', 'PC', 'Productores', 'Listas de asistencia; convenios con asociaciones rurales; informes de Desarrollo Agropecuario.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (68, 'Total de productores en padrón', 'TPP', 'Productores', 'Listas de asistencia; convenios con asociaciones rurales; informes de Desarrollo Agropecuario.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 12, 12 FROM v1
UNION ALL SELECT v2.id, 2026, 12, 12 FROM v2;

-- id=69 C6
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (69, 'Espacios habilitados o rehabilitados', 'EHR', 'Espacios', 'Expedientes de obra; reportes de la Dirección de Cultura y Obras Públicas; actas de entrega.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (69, 'Total programado en el POA', 'TP', 'Espacios', 'Expedientes de obra; reportes de la Dirección de Cultura y Obras Públicas; actas de entrega.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 100, 100 FROM v1
UNION ALL SELECT v2.id, 2026, 100, 100 FROM v2;

-- id=70 C7 — anomalía O: nombres reales (Convenios), no "Proyectos apoyados"
-- copiado de C1.
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (70, 'Convenios o acuerdos firmados', 'CAF', 'Convenios', 'Actas de instalación; minutas de reuniones; convenios registrados.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (70, 'Convenios programados', 'CP', 'Convenios', 'Actas de instalación; minutas de reuniones; convenios registrados.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2, 2 FROM v1
UNION ALL SELECT v2.id, 2026, 2, 2 FROM v2;

-- id=71 C8
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (71, 'Parquímetros con mantenimiento realizado', 'PMR', 'Parquímetros', 'Bitácoras de mantenimiento, reportes técnicos', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (71, 'Total de parquímetros instalados', 'TPI', 'Parquímetros', 'Bitácoras de mantenimiento, reportes técnicos', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 100, 100 FROM v1
UNION ALL SELECT v2.id, 2026, 100, 100 FROM v2;

-- id=72 A1.1 — anomalía J: nombres reales desde la fórmula (no "Monto
-- registrado" que trae la ficha, copiado de 1.2).
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (72, 'Proyectos apoyados', 'PA', 'Proyectos', 'Informes de proyectos; convenios.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (72, 'Total de proyectos programados', 'TPP', 'Proyectos', 'Informes de proyectos; convenios.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 1, 1 FROM v1
UNION ALL SELECT v2.id, 2026, 1, 1 FROM v2;

-- id=73 A1.2 — anomalía J
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (73, 'Monto registrado', 'MR', 'Pesos', 'Registros de inversión; licencias y permisos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (73, 'Monto meta programado', 'MMP', 'Pesos', 'Registros de inversión; licencias y permisos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 1, 1 FROM v1
UNION ALL SELECT v2.id, 2026, 1, 1 FROM v2;

-- id=74 A1.3 — anomalía J
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (74, 'Empresas capacitadas o digitalizadas', 'ECD', 'Empresas', 'Reportes de capacitación; convenios con instituciones.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (74, 'Total de empresas meta', 'TEM', 'Empresas', 'Reportes de capacitación; convenios con instituciones.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 420, 420 FROM v1
UNION ALL SELECT v2.id, 2026, 420, 420 FROM v2;

-- id=75 A2.1 — anomalía K: ficha totalmente corrupta, reconstruido desde
-- la Matriz de Riesgos.
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (75, 'Asistentes a cursos', 'AC', 'Personas', 'Listas de asistencia; evaluaciones de cursos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (75, 'Cupos programados', 'CP', 'Personas', 'Listas de asistencia; evaluaciones de cursos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2, 2 FROM v1
UNION ALL SELECT v2.id, 2026, 2, 2 FROM v2;

-- id=76 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (76, 'Metas cumplidas', 'MC', 'Metas', 'Padrón municipal.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (76, 'Metas programadas', 'MP', 'Metas', 'Padrón municipal.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 12, 12 FROM v1
UNION ALL SELECT v2.id, 2026, 12, 12 FROM v2;

-- id=77 A3.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (77, 'Ingreso promedio actual', 'IPA', 'Pesos', 'Evidencias de difusión; materiales impresos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (77, 'Ingreso promedio base', 'IPB', 'Pesos', 'Evidencias de difusión; materiales impresos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=78 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (78, 'Participantes en eventos', 'PE', 'Personas', 'Materiales, reportes de difusión.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (78, 'Total de ciudadanos invitados', 'TCI', 'Personas', 'Materiales, reportes de difusión.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=79 A4.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (79, 'Recaudación actual', 'RA', 'Pesos', 'Informes de eventos; registro de participantes.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (79, 'Recaudación base', 'RB', 'Pesos', 'Informes de eventos; registro de participantes.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=80 A4.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (80, 'Obras concluidas', 'OC', 'Obras', 'Expedientes de obra; actas de entrega.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (80, 'Obras programadas', 'OP', 'Obras', 'Expedientes de obra; actas de entrega.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=81 A5.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (81, 'Mercados o asociaciones activas', 'MAA', 'Mercados', 'Listas de asistencia; reportes técnicos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (81, 'Total de mercados meta', 'TMM', 'Mercados', 'Listas de asistencia; reportes técnicos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 12, 12 FROM v1
UNION ALL SELECT v2.id, 2026, 12, 12 FROM v2;

-- id=82 A5.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (82, 'Hectáreas tecnologías de riego programadas', 'HTRP', 'Hectáreas', 'Reportes técnicos; convenios con productores.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (82, 'Hectáreas totales', 'HT', 'Hectáreas', 'Reportes técnicos; convenios con productores.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 10, 10 FROM v1
UNION ALL SELECT v2.id, 2026, 10, 10 FROM v2;

-- id=83 A5.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (83, 'Boletines, circulares o plataformas activas', 'BCPA', 'Mecanismos', 'Actas de constitución; convenios.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (83, 'Total de mecanismos planificados', 'TMP', 'Mecanismos', 'Actas de constitución; convenios.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 48, 48 FROM v1
UNION ALL SELECT v2.id, 2026, 48, 48 FROM v2;

-- id=84 A6.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (84, 'Espacios concluidos', 'EC', 'Espacios', 'Reportes de obras; inventario de espacios culturales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (84, 'Total programado en el POA', 'TPP', 'Espacios', 'Reportes de obras; inventario de espacios culturales.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2, 2 FROM v1
UNION ALL SELECT v2.id, 2026, 2, 2 FROM v2;

-- id=85 A6.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (85, 'Eventos difundidos', 'ED', 'Eventos', 'Materiales de difusión; informes de Comunicación Social.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (85, 'Total de eventos programados', 'TEP', 'Eventos', 'Materiales de difusión; informes de Comunicación Social.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 26, 26 FROM v1
UNION ALL SELECT v2.id, 2026, 26, 26 FROM v2;

-- id=86 A7.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (86, 'Reuniones realizadas', 'RR', 'Reuniones', 'Actas de reunión; reportes de seguimiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (86, 'Reuniones programadas', 'RP', 'Reuniones', 'Actas de reunión; reportes de seguimiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2, 2 FROM v1
UNION ALL SELECT v2.id, 2026, 2, 2 FROM v2;

-- id=87 A8.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (87, 'Parquímetros instalados y operativos', 'PIO', 'Parquímetros', 'Inventarios del área de Movilidad y Transporte, reportes de funcionamiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (87, 'Total programado', 'TP', 'Parquímetros', 'Inventarios del área de Movilidad y Transporte, reportes de funcionamiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 29, 29 FROM v1
UNION ALL SELECT v2.id, 2026, 29, 29 FROM v2;

COMMIT;
