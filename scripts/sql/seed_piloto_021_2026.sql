-- ============================================================
-- SEED PILOTO 021 — contenido 2026 del módulo MML
-- Fuente: "5. 021 DESARROLLO INTEGRAL DE LA FAMILIA.pdf" (30 páginas)
-- Script SQL revisable (NO migración) — programa_id = 5 (clave '021'), anio = 2026
-- Mismo método que 005/012/018: pdfjs-dist + clustering por coordenadas x/y.
--
-- Los 15 indicadores (ids 132-146) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que programas previos).
--
-- Estructura muy limpia: 4 Componentes con 3/3/2/1 Actividades = 9 total,
-- y el árbol del problema mapea perfecto 1:1 (4 causas primarias con 3/3/2/1
-- subcausas cada una), verificado con self-join tras aplicar.
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  W) 3 de los 9 "Efectos" del Árbol del Problema quedan truncados a media
--     frase en el PDF (columnas G/H/I: "...vulnerabilidad económica,
--     emocional,", "Aumento del consumo de sustancias psicoactivas",
--     "Incremento de riesgo de contraer enfermedades") — se completaron
--     usando el texto espejo de los "Fines" correspondientes del Árbol de
--     Objetivos (misma página, mismas columnas x, mismo PDF), que sí traen
--     el texto completo: "...física y patrimonial de las mujeres.",
--     "...en mujeres en situación de violencia.", "...de transmisión sexual
--     entre mujeres en situación de vulnerabilidad." — no es una
--     reconstrucción libre, es la misma frase invertida (Persistencia/
--     Aumento/Incremento ↔ Disminución/Reducción) que ya usa el propio
--     documento en las otras 6 columnas.
--  X) Ficha del Componente 4 (id=137, "Oportunidades económicas para
--     mujeres"): su Interpretación ("...gestión ambiental.") y Fuente de
--     Información ("Inventarios de Servicios Públicos y Ecología...") no
--     tienen relación con el tema (mujeres/empleo) — contenido de otro
--     programa (aparente bleed de Protección al Ambiente). Se usó la
--     Interpretación/Medios de verificación coherentes de la Matriz de
--     Riesgos (mismo documento, página de Riesgos): "Las mujeres participan
--     activamente en los programas; los recursos se ejercen con
--     oportunidad." / "Padrón de beneficiarias; informes de Desarrollo
--     Económico; actas de entrega de financiamiento."
--  Y) Ficha de la actividad 1.3 (id=140): su tabla de Variables muestra un
--     valor genérico "100/100" (100%) en vez de la meta real (4, ver
--     cronograma POA pág. 15 y `indicadores.meta_anual_2026`) — se usó el
--     valor real (4/4) en vez del placeholder de la ficha.
--  Z) "Tipo de indicador" en las fichas de los Componentes es inconsistente:
--     C1 marca Gestión (correcto por convención MIR) pero C2/C3/C4 marcan
--     Estratégico — se aplicó la convención estándar (Fin/Propósito=
--     Estratégico, todo lo demás=Gestión) para los 4 Componentes y las 9
--     Actividades, igual que en 012/018.
--  AA) Sentido del indicador Propósito (id=133, "Porcentaje de programas de
--      igualdad sustantiva implementados con cobertura efectiva") venía
--      marcado como Descendente en la Matriz de Riesgos — contraintuitivo
--      para un indicador de cobertura (más cobertura = mejor). Hugo
--      confirmó explícitamente cambiarlo a Ascendente (mismo criterio que
--      la anomalía P del piloto 012).
--  AB) Ficha del Fin (id=132) trae variables internamente inconsistentes:
--      "Casos registrados año base": Alcanzada2025=2, Meta2026=2.47;
--      "Casos registrados año actual": Meta2026=1.24 (sin Alcanzada2025);
--      con esos valores la fórmula ((CRAB-CRAA)/CRAB)×100 no reproduce el
--      resultado que la misma ficha declara (Alcanzada2025=2.47 [=línea
--      base real, coincide con MIR], Meta2026=1.23 [=meta_anual_2026 real
--      en BD]). Se sembraron las 2 variables tal cual aparecen en la fuente
--      (documentado, no corregido en silencio, mismo criterio que la
--      anomalía A de 003).
--  AC) [Corrección post-ejecución 2026-07-24] Los textos de los 4 Medios y
--      9 Actividades se habían sembrado con el número ya incluido (p. ej.
--      "1. Institucionalización..." / "1.1 Creación...", copiado tal cual
--      de la página "METAS" del PDF) — a diferencia de 003/005/012/018,
--      donde el texto se guarda limpio porque el generador de PDF antepone
--      su propio número (`numerarComponentesActividades`). Esto producía
--      doble numeración ("1. 1. ...") en Acciones/Alternativas. Corregido
--      en producción y en este script quitando el prefijo numérico de los
--      13 nodos.
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(5, 2026, 1,
  'Persistencia de desigualdad sustantiva y violencia de género que limita la participación plena y segura de mujeres y grupos vulnerables.',
  'Construir un municipio inclusivo, con igualdad de derechos y oportunidades para mujeres y grupos vulnerables, libre de violencia y discriminación.'),
(5, 2026, 2,
  'Escasa implementación de espacios y entornos seguros en comunidades, transporte y comercios.',
  'Ampliar y consolidar los espacios seguros en escuelas, transporte, presidencias de comunidad y áreas públicas, garantizando protección y accesibilidad.'),
(5, 2026, 3,
  'Pocas oportunidades de autonomía económica para mujeres. Bajo acceso a capacitación y redes de apoyo.',
  'Impulsar programas de capacitación y apoyo al emprendimiento femenino, promoviendo autonomía económica y participación laboral activa.'),
(5, 2026, 4,
  'Deficiencia en la educación con perspectiva de género y falta de sensibilización comunitaria.',
  'Incorporar de manera transversal la perspectiva de género en la educación y campañas comunitarias de sensibilización contra la violencia.'),
(5, 2026, 5,
  'Escasa articulación institucional para prevenir y atender la violencia de género.',
  'Fortalecer la coordinación interinstitucional con programas de prevención y atención integral a víctimas de violencia.'),
(5, 2026, 6,
  'Limitada asignación de recursos a programas con perspectiva de género.',
  'Asignar recursos suficientes y sostenibles a programas de igualdad sustantiva, asegurando continuidad y evaluación de resultados.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (5, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Persisten las brechas de desigualdad de género y la violencia contra mujeres y niñas en el municipio de Apizaco, limitando su participación plena y su acceso a oportunidades.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Feminicidio en grado de tentativa'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Continuidad de altos índices de violencia de género.'),
    (2, 'Participación reducida de las mujeres en el ámbito económico'),
    (3, 'Poca confianza de las mujeres en las dependencias que imparten justicia y seguridad.'),
    (4, 'Persistencia de estereotipos y prácticas discriminatorias.'),
    (5, 'Constante represión en el ámbito político social'),
    (6, 'Daño psicosocial en el entorno familiar.'),
    (7, 'Persistencia en la vulnerabilidad económica, emocional, física y patrimonial de las mujeres.'),
    (8, 'Aumento del consumo de sustancias psicoactivas en mujeres en situación de violencia.'),
    (9, 'Incremento de riesgo de contraer enfermedades de transmisión sexual entre mujeres en situación de vulnerabilidad.')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Débil institucionalización de la perspectiva de género'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Insuficiente capacidad institucional y operativa'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', central.id, 3, 'Limitaciones en recursos y gestión pública'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', central.id, 4, 'Desigualdad estructural en el acceso a oportunidades'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Falta de incorporación efectiva de la perspectiva de género en el sistema educativo municipal.'),
    (2, 'Escasa sensibilización en escuelas y comunidad sobre igualdad y derechos humanos.'),
    (3, 'Falta de interés de los servidores públicos en los talleres de capacitación de igualdad sustantiva.')
  ) AS v(orden, texto) RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', causa2.id, v.orden, v.texto
  FROM causa2, (VALUES
    (1, 'Insuficiente capacitación a los elementos de seguridad pública y protección civil en protocolos de atención.'),
    (2, 'Insuficiente atención integral a víctimas de violencia de género.'),
    (3, 'Deficiencias en la habilitación de espacios seguros en comunidades y presidencias.')
  ) AS v(orden, texto) RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'PROBLEMA', 'CAUSA', causa3.id, v.orden, v.texto
  FROM causa3, (VALUES
    (1, 'Recursos financieros limitados para programas de igualdad sustantiva.'),
    (2, 'Carencia de seguimiento y evaluación de los programas de igualdad sustantiva.')
  ) AS v(orden, texto) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 5, 2026, 'PROBLEMA', 'CAUSA', causa4.id, 1, 'Limitadas oportunidades económicas para mujeres'
FROM causa4;

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (5, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Fortalecer las capacidades institucionales, educativas, sociales y comunitarias para garantizar la igualdad sustantiva, prevenir la violencia de género y generar oportunidades que promuevan la participación plena de las mujeres en Apizaco.',
    133,
    'El presupuesto se libera en tiempo; las dependencias municipales colaboran en la ejecución.',
    'Informes de programas; actas de Cabildo; reportes de la Dirección de Planeación y Evaluación.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Reducción de la violencia de género y feminicidios en grado de tentativa.',
    132,
    'Las denuncias se registran correctamente; las instituciones de seguridad y justicia actúan de manera coordinada.',
    'Informes de la Dirección de Seguridad Pública; Fiscalía General del Estado; reportes del INEGI.'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 5, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Disminución de los índices de violencia de género.'),
    (2, 'Incremento de la participación de las mujeres en actividades económicas y productivas'),
    (3, 'Mayor confianza de las mujeres en las instituciones de justicia y seguridad.'),
    (4, 'Disminución de estereotipos y prácticas discriminatorias en la sociedad'),
    (5, 'Ampliación de la participación libre y equitativa de las mujeres en los espacios político-sociales.'),
    (6, 'Mejora del bienestar psicosocial en las familias, promoviendo entornos libres de violencia.'),
    (7, 'Disminución de la vulnerabilidad económica, emocional, física y patrimonial de las mujeres.'),
    (8, 'Reducción en el consumo de sustancias psicoactivas en mujeres en situación de violencia.'),
    (9, 'Disminución del riesgo de contraer enfermedades de transmisión sexual entre mujeres en situación de vulnerabilidad.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Institucionalización de la perspectiva de género', 134,
    'Existe voluntad política; se destinan recursos humanos y financieros suficientes.',
    'Actas de creación; nombramientos oficiales; informes de funcionamiento.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Capacitación y sensibilización en igualdad', 135,
    'El personal asiste a las capacitaciones y aplica los conocimientos adquiridos.',
    'Listas de asistencia; constancias de capacitación; reportes del área de Recursos Humanos.'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Fortalecimiento de la gestión y recursos para igualdad', 136,
    'No existen recortes presupuestales ni desvíos de recursos.',
    'Informes financieros; reportes de Tesorería; auditorías internas.'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Oportunidades económicas para mujeres', 137,
    'Las mujeres participan activamente en los programas; los recursos se ejercen con oportunidad.',
    'Padrón de beneficiarias; informes de Desarrollo Económico; actas de entrega de financiamiento.'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Creación y fortalecimiento de unidades de género en dependencias municipales.', 138,
       'Existe voluntad política y recursos humanos para su sostenimiento.', 'Actas de creación; nombramientos oficiales; informes de operación.'),
    (2, 'Platicas de sensibilización en escuelas y comunidades.', 139,
       'La comunidad muestra interés y disposición para participar.', 'Listas de asistencia; registros fotográficos.'),
    (3, 'Implementación de programas de capacitación continua en igualdad sustantiva para funcionarios', 140,
       'El personal acude y aplica los conocimientos adquiridos.', 'Listas de asistencia; constancias; reportes de capacitación')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio2, (VALUES
    (1, 'Capacitación a elementos de seguridad pública y protección civil en protocolos de atención a víctimas.', 141,
       'Los policías aplican los protocolos en sus labores cotidianas.', 'Constancias de capacitación; listas de asistencia.'),
    (2, 'Instalación de centros de atención integral para víctimas.', 142,
       'Se asigna presupuesto suficiente para su sostenimiento.', 'Actas de inauguración; reportes de operación.'),
    (3, 'Instalación de módulos de denuncia segura en presidencias y comunidades.', 143,
       'Las mujeres confían en utilizarlos.', 'Inventario de instalaciones; informes de Seguridad Pública.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio3, (VALUES
    (1, 'Transparencia en el uso de recursos destinados a igualdad.', 144,
       'La información es actualizada y accesible.', 'Portal de transparencia; informes oficiales.'),
    (2, 'Creación de sistemas de evaluación y seguimiento con indicadores de género.', 145,
       'Se asigna presupuesto suficiente para el diseño y operación de los sistemas. El personal técnico y administrativo cuenta con capacitación en perspectiva de género y gestión por resultados. Existe coordinación interinstitucional para integrar la información de distintas áreas. Los sistemas se mantienen actualizados y en funcionamiento continuo.',
       'Actas de Cabildo donde se apruebe la creación de los sistemas. Documentación técnica de los sistemas (manuales, lineamientos, plataformas digitales). Informes de la Dirección de Planeación y Evaluación. Reportes de seguimiento de programas municipales con indicadores de género.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 5, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, 1,
  'Vinculación laboral de mujeres con empresas locales y regionales.', 146,
  'Las empresas cumplen con las contrataciones.', 'Informes de convenios; registros de empresas.'
FROM medio4;

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (5, 2026, 'BENEFICIARIO', 'Mujeres del municipio', 1),
  (5, 2026, 'BENEFICIARIO', 'Niñas y adolescentes', 2),
  (5, 2026, 'BENEFICIARIO', 'Organizaciones de mujeres y colectivos feministas', 3),
  (5, 2026, 'BENEFICIARIO', 'Personas en situación de vulnerabilidad', 4),
  (5, 2026, 'EJECUTOR', 'Instituto Municipal de la Mujer', 1),
  (5, 2026, 'EJECUTOR', 'SIPINNA', 2),
  (5, 2026, 'EJECUTOR', 'Dirección de Seguridad Pública', 3),
  (5, 2026, 'EJECUTOR', 'Dirección de Desarrollo Económico', 4),
  (5, 2026, 'OPOSITOR', 'Grupos con visiones tradicionales', 1),
  (5, 2026, 'OPOSITOR', 'Algunos funcionarios públicos', 2),
  (5, 2026, 'OPOSITOR', 'Sectores políticos opositores', 3),
  (5, 2026, 'OPOSITOR', 'Ciudadanía que minimiza la problemática de la violencia de género', 4),
  (5, 2026, 'INDIFERENTE', 'Ciudadanos sin contacto directo con situaciones de desigualdad', 1),
  (5, 2026, 'INDIFERENTE', 'Medios de comunicación locales', 2),
  (5, 2026, 'INDIFERENTE', 'Pequeños comerciantes y empresas locales', 3),
  (5, 2026, 'INDIFERENTE', 'Instituciones académicas tradicionales', 4);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo: convención MIR estándar (Fin/Propósito=Estratégico, resto=Gestión) —
-- ver anomalía Z. Dimensión: de la Matriz de Riesgos (prosa, confiable).
-- Sentido: de la Matriz de Riesgos — ver anomalía AA (Propósito=Descendente,
-- pendiente de confirmar con Hugo).
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Descendente',
  medios_verificacion='Informes de la Dirección de Seguridad Pública; Fiscalía General del Estado; reportes del INEGI.',
  linea_base_anio=2025,
  interpretacion='Mide la reducción de casos de feminicidio en el municipio. Refleja la eficacia de políticas preventivas, atención a las mujeres y acciones de seguridad con perspectiva de género.'
WHERE id=132;

UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Informes de programas; actas de Cabildo; reportes de la Dirección de Planeación y Evaluación.',
  linea_base_anio=2025,
  interpretacion='Evalúa qué tantos programas de igualdad operan de manera real y alcanzan a su población objetivo. Refleja el compromiso institucional para reducir brechas de desigualdad.'
WHERE id=133;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de creación; nombramientos oficiales; informes de funcionamiento.',
  linea_base_anio=2025,
  interpretacion='Mide el grado de institucionalización de la perspectiva de género dentro del gobierno municipal. Evidencia cuántas áreas cuentan con estructura y funciones activas en temas de género.'
WHERE id=134;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; constancias de capacitación; reportes del área de Recursos Humanos.',
  linea_base_anio=2025,
  interpretacion='Mide el avance en la formación del personal municipal para prevenir violencia, atender casos y aplicar políticas con enfoque de género.'
WHERE id=135;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes financieros; reportes de Tesorería; auditorías internas.',
  linea_base_anio=2025,
  interpretacion='Evalúa si los recursos destinados a igualdad se ejecutan correctamente. Refleja disciplina financiera y priorización de acciones para las mujeres.'
WHERE id=136;

-- Anomalía X: interpretación/fuente contaminadas en la ficha, reconstruidas desde Riesgos.
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Padrón de beneficiarias; informes de Desarrollo Económico; actas de entrega de financiamiento.',
  linea_base_anio=2025,
  interpretacion='Mide la cobertura de mujeres beneficiadas con programas de empleo y financiamiento, reflejando el avance en autonomía económica y participación laboral femenina.'
WHERE id=137;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de creación; nombramientos oficiales; informes de operación.',
  linea_base_anio=2025,
  interpretacion='Evalúa la creación formal y operación de unidades de género en el municipio. Mide avance institucional en transversalización del enfoque de género.'
WHERE id=138;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; registros fotográficos.',
  linea_base_anio=2025,
  interpretacion='Mide la cobertura de acciones de prevención, concientización y educación sobre igualdad y no violencia.'
WHERE id=139;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; constancias; reportes de capacitación',
  linea_base_anio=2025,
  interpretacion='Evalúa la actualización permanente del personal en materia de derechos humanos, igualdad y prevención de violencia. Refleja profesionalización institucional.'
WHERE id=140;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Constancias de capacitación; listas de asistencia.',
  linea_base_anio=2025,
  interpretacion='Mide la capacidad técnica del personal operativo para atender incidentes, denuncias y emergencias con enfoque de género.'
WHERE id=141;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de inauguración; reportes de operación.',
  linea_base_anio=2025,
  interpretacion='Mide la disponibilidad de espacios seguros para atención psicológica, legal y social para mujeres víctimas de violencia.'
WHERE id=142;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario de instalaciones; informes de Seguridad Pública.',
  linea_base_anio=2025,
  interpretacion='Evalúa la accesibilidad y funcionamiento de puntos de denuncia diseñados para proteger a mujeres y grupos en riesgo.'
WHERE id=143;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Portal de transparencia; informes oficiales.',
  linea_base_anio=2025,
  interpretacion='Mide el nivel de transparencia y rendición de cuentas respecto al presupuesto dirigido a igualdad y prevención de violencia.'
WHERE id=144;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de Cabildo donde se apruebe la creación de los sistemas. Documentación técnica de los sistemas. Informes de la Dirección de Planeación y Evaluación.',
  linea_base_anio=2025,
  interpretacion='Evalúa la capacidad institucional para monitorear programas, resultados y políticas desde el enfoque de género.'
WHERE id=145;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de convenios; registros de empresas.',
  linea_base_anio=2025,
  interpretacion='Mide cuántas mujeres acceden a empleo formal mediante alianzas municipales, incentivos o esquemas de vinculación. Refleja mejora en autonomía económica y empleabilidad.'
WHERE id=146;

-- ---------- 6. indicador_variables + indicador_variables_valores ----------
-- unidad_medida corregida a la real (la ficha dice "Porcentaje" hasta para
-- conteos absolutos, mismo criterio D/H de programas previos). La mayoría
-- de Componentes/Actividades no traen "Alcanzada 2025" (área nueva, Instituto
-- Municipal de la Mujer sin operación previa) — se sembró valor_alcanzado
-- NULL donde la ficha no trae dato, y el valor real de meta_anual_2026 donde
-- la ficha muestra un placeholder no confiable (anomalía Y, id=140).

-- id=132 FIN — anomalía AB: variables tal cual la fuente (inconsistentes entre sí).
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (132, 'Casos registrados año base', 'CRAB', 'Casos', 'Informes de la Dirección de Seguridad Pública; Fiscalía General del Estado; reportes del INEGI.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (132, 'Casos registrados año actual', 'CRAA', 'Casos', 'Informes de la Dirección de Seguridad Pública; Fiscalía General del Estado; reportes del INEGI.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2, 2.47 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1.24 FROM v2;

-- id=133 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (133, 'Programas implementados', 'PI', 'Programas', 'Informes de programas; actas de Cabildo; reportes de la Dirección de Planeación y Evaluación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (133, 'Programas programados en el POA', 'PPP', 'Programas', 'Informes de programas; actas de Cabildo; reportes de la Dirección de Planeación y Evaluación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=134 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (134, 'Dependencias con unidad de género operativa', 'DCUDGO', 'Dependencias', 'Actas de creación; nombramientos oficiales; informes de funcionamiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (134, 'Total de dependencias municipales', 'TDM', 'Dependencias', 'Actas de creación; nombramientos oficiales; informes de funcionamiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=135 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (135, 'Funcionarios capacitados', 'FC', 'Funcionarios', 'Listas de asistencia; constancias de capacitación; reportes del área de Recursos Humanos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (135, 'Funcionarios programados a capacitar', 'FPC', 'Funcionarios', 'Listas de asistencia; constancias de capacitación; reportes del área de Recursos Humanos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=136 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (136, 'Presupuesto ejercido', 'PE', 'Reportes', 'Informes financieros; reportes de Tesorería; auditorías internas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (136, 'Presupuesto asignado', 'PA', 'Reportes', 'Informes financieros; reportes de Tesorería; auditorías internas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=137 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (137, 'Mujeres beneficiadas con apoyo', 'MBA', 'Mujeres', 'Padrón de beneficiarias; informes de Desarrollo Económico; actas de entrega de financiamiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (137, 'Mujeres programadas para apoyo', 'MPA', 'Mujeres', 'Padrón de beneficiarias; informes de Desarrollo Económico; actas de entrega de financiamiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=138 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (138, 'Unidades de género operando', 'UGO', 'Unidades', 'Actas de creación; nombramientos oficiales; informes de operación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (138, 'Total de dependencias municipales', 'TDM', 'Unidades', 'Actas de creación; nombramientos oficiales; informes de operación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=139 A1.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (139, 'Pláticas realizadas', 'PR', 'Pláticas', 'Listas de asistencia; registros fotográficos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (139, 'Pláticas programadas', 'PP', 'Pláticas', 'Listas de asistencia; registros fotográficos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 74 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 74 FROM v2;

-- id=140 A1.3 — anomalía Y: valor real (4/4) en vez del placeholder 100/100 de la ficha.
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (140, 'Funcionarios capacitados', 'FC', 'Funcionarios', 'Listas de asistencia; constancias; reportes de capacitación', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (140, 'Funcionarios programados', 'FP', 'Funcionarios', 'Listas de asistencia; constancias; reportes de capacitación', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=141 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (141, 'Elementos capacitados', 'EC', 'Elementos', 'Constancias de capacitación; listas de asistencia.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (141, 'Total de elementos programados', 'TEP', 'Elementos', 'Constancias de capacitación; listas de asistencia.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 6 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 6 FROM v2;

-- id=142 A2.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (142, 'Centros instalados y operativos', 'CIO', 'Centros', 'Actas de inauguración; reportes de operación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (142, 'Total de centros programados', 'TCP', 'Centros', 'Actas de inauguración; reportes de operación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1 FROM v2;

-- id=143 A2.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (143, 'Módulos instalados y operativos', 'MIO', 'Módulos', 'Inventario de instalaciones; informes de Seguridad Pública.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (143, 'Total de módulos programados', 'TMP', 'Módulos', 'Inventario de instalaciones; informes de Seguridad Pública.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 6 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 6 FROM v2;

-- id=144 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (144, 'Reportes públicos emitidos', 'RPE', 'Reportes', 'Portal de transparencia; informes oficiales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (144, 'Reportes programados', 'RP', 'Reportes', 'Portal de transparencia; informes oficiales.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=145 A3.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (145, 'Sistemas implementados', 'SI', 'Sistemas', 'Actas de Cabildo; documentación técnica de los sistemas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (145, 'Sistemas programados', 'SP', 'Sistemas', 'Actas de Cabildo; documentación técnica de los sistemas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 12 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 12 FROM v2;

-- id=146 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (146, 'Mujeres vinculadas laboralmente', 'MVL', 'Mujeres', 'Informes de convenios; registros de empresas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (146, 'Mujeres registradas en programas', 'MRP', 'Mujeres', 'Informes de convenios; registros de empresas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 12 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 12 FROM v2;

COMMIT;
