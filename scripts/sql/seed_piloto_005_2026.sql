-- ============================================================
-- SEED PILOTO 005 — contenido 2026 del módulo MML
-- Fuente: "2. 005 SEGURIDAD PUBLICA Y TRANSITO VIAL.pdf" (42 páginas)
--   (POA 2026\PROGRAMATICOS PRESUPUESTO TESORERIA)
-- Script SQL revisable (NO migración) — programa_id = 2 (clave '005'), anio = 2026
-- Reconstruido con pdfjs-dist (sin poppler en esta máquina) + clustering por
-- coordenadas x/y para separar columnas de texto que la extracción lineal
-- mezclaba (árbol del problema, involucrados).
--
-- Arquitectura vigente (post 2026-07-23): la MIR se deriva de arbol_nodos, ya
-- no se escribe en mir_niveles. indicador_id/supuestos/medios_verificacion
-- van directo en los nodos OBJETIVO/FIN-top/MEDIO de primer y segundo nivel.
-- Los 24 indicadores (ids 1-24) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script solo enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
--
-- presupuesto_programa: fuera de alcance (mismo criterio que 003 — no se
-- sembró ahí tampoco; son datos de prueba de Hugo en anio=2027, no tocados).
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  E) Ficha individual de la actividad 3.2 (id=15): su campo "Nombre" dice
--     "Porcentaje de cámaras de videovigilancia operando" (copiado de la
--     ficha de 3.3), pero su Fórmula y Variables (IAP/IR, Incidencias
--     atendidas en plazo/Incidencias registradas) sí corresponden a 3.2. Se
--     usa el nombre correcto ya existente en el catálogo de indicadores
--     (id=15, "...incidencias atendidas dentro del SLA") y las variables
--     reales de esa misma ficha.
--  F) Ficha de la actividad 1.2 (id=9): su primera variable dice "Policías
--     certificados" (copiado de la ficha 1.1) debiendo decir "capacitados en
--     proximidad" — se corrige el nombre de la variable, no el valor (10).
--  G) 2 de los 4 "Fines" del Árbol de Objetivos venían truncados a media
--     frase en el PDF fuente ("...cultura", "...pacífica y"). Hugo dictó el
--     texto completo 2026-07-24: "Fortalecimiento de la cohesión social y
--     cultura de la legalidad." / "Convivencia comunitaria pacífica y
--     resiliente."
--  H) unidad_medida en indicador_variables: el PDF pone "Porcentaje" incluso
--     para conteos absolutos (policías, casos, cámaras, etc.) — se corrige a
--     la unidad real, mismo criterio que la anomalía D de 003
--     (DISENO_MIGRACION_MML.md §2.3).
--  I) Componentes y Actividades (ids 3-24): sus fichas solo traen la columna
--     "Alcanzada 2025" con valor; la columna "Meta 2026" de la tabla de
--     variables viene vacía en el PDF (a diferencia de Fin/Propósito que sí
--     traen ambas). Se siembra valor_meta = NULL para esos 22 indicadores,
--     fiel a lo que dice la fuente — la meta real ya vive en `metas`
--     (ya sembrada) e `indicadores.meta_anual_2026` (ya sembrado).
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(2, 2026, 1,
  'Altos niveles de inseguridad y desconfianza ciudadana debido a capacidades institucionales limitadas, infraestructura deficiente y baja participación comunitaria.',
  'Consolidar un municipio seguro, con instituciones de justicia confiables y cercanas a la ciudadanía, donde prevalezcan la legalidad, la transparencia y la participación comunitaria.'),
(2, 2026, 2,
  'Personal policial con limitada capacitación técnica y operativa. Escasez de recursos humanos y materiales para la prevención y reacción del delito.',
  'Profesionalización integral y permanente de los cuerpos policiales, ampliación de recursos humanos y materiales, y fortalecimiento de la proximidad social.'),
(2, 2026, 3,
  'Procesos de justicia cívica ineficaces y poco accesibles para la población.',
  'Implementación de un modelo de justicia cívica ágil, accesible y transparente que resuelva conflictos comunitarios de manera efectiva.'),
(2, 2026, 4,
  'Infraestructura y tecnología de seguridad obsoleta o insuficiente (patrullas, videovigilancia, sistemas de control).',
  'Modernización de infraestructura y tecnología: renovación de patrullas, instalación de cámaras de videovigilancia y sistemas digitales integrados de control.'),
(2, 2026, 5,
  'Escasa coordinación interinstitucional y participación comunitaria débil en la prevención del delito.',
  'Fortalecimiento de la coordinación entre dependencias, consolidación de comités vecinales y promoción de la cultura de la denuncia.'),
(2, 2026, 6,
  'Comunidades con baja resiliencia ante emergencias y riesgos, así como poca cultura de la legalidad.',
  'Desarrollo de programas de prevención, capacitación comunitaria en emergencias y fortalecimiento de la cultura de la legalidad en la ciudadanía.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (2, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Niveles altos de percepción de inseguridad, baja participación comunitaria debido a la falta de capacitaciones institucionales, equipo e infraestructura deficiente.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Alto indice de percepción de inseguridad de la población'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Incremento en la incidencia delictiva'),
    (2, 'Baja confianza en las instituciones de seguridad y justicia.'),
    (3, 'Mayor vulnerabilidad ante situaciones de riesgo y desastres'),
    (4, 'Reducción de la cohesión social y participación ciudadana.')
  ) AS v(orden, texto)
  RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Capacidades institucionales limitadas'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Deficiencias en el sistema de justicia cívica'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', central.id, 3, 'Infraestructura y tecnología obsoleta'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', central.id, 4, 'Escasa coordinación interinstitucional y comunitaria'
  FROM central RETURNING id
),
causa5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', central.id, 5, 'Baja resiliencia y prevención en comunidades'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Falta de capacitación técnica y operativa integral al personal.'),
    (2, 'Escaso desarrollo de competencias para la prevención del delito.'),
    (3, 'Recursos humanos y materiales insuficientes')
  ) AS v(orden, texto) RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', causa2.id, v.orden, v.texto
  FROM causa2, (VALUES
    (1, 'Falta de infraestructura para implementar un modelo integral de justicia cívica.'),
    (2, 'Mediación y conciliación lenta y poco eficaz.'),
    (3, 'Incorrecta aplicación de la normatividad')
  ) AS v(orden, texto) RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', causa3.id, v.orden, v.texto
  FROM causa3, (VALUES
    (1, 'Equipamiento insuficiente o desactualizado'),
    (2, 'Sistemas de información fragmentados o poco integrados'),
    (3, 'Deficiencias en infraestructura física.')
  ) AS v(orden, texto) RETURNING id
),
sub4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'PROBLEMA', 'CAUSA', causa4.id, v.orden, v.texto
  FROM causa4, (VALUES
    (1, 'Falta de protocolos claros de colaboración entre dependencias'),
    (2, 'Débil participación ciudadana en redes de vigilancia y prevención.'),
    (3, 'Ausencia de canales efectivos de comunicación entre gobierno y comunidad')
  ) AS v(orden, texto) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 2, 2026, 'PROBLEMA', 'CAUSA', causa5.id, v.orden, v.texto
FROM causa5, (VALUES
  (1, 'Escasa preparación ante emergencias y desastres'),
  (2, 'Falta de mapeo y atención en zonas de riesgo.'),
  (3, 'Las comunidades no reciben visitas periódicas de verificación preventiva'),
  (4, 'Las notificaciones no se entregan de manera sistemática, o no generan acciones correctivas'),
  (5, 'Los dictámenes técnicos no se elaboran con enfoque preventivo, sino reactivo')
) AS v(orden, texto);

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
-- Objetivo central = Propósito (indicador_id=2). fin_top = Fin (indicador_id=1).
-- Cada Medio de primer nivel = un Componente (indicador_id=3..7). Cada
-- submedio = una Actividad (indicador_id=8..24). supuestos/medios_verificacion
-- tomados de la Matriz de Riesgos (PP-FM-0E, páginas 4-6) y de cada ficha.
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (2, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Reducir la inseguridad y fortalecer la confianza ciudadana en las instituciones municipales de seguridad y justicia.',
    2,
    'El registro de delitos es confiable y se mantiene la colaboración con autoridades estatales y federales para transparentar datos.',
    'SESNSP – Incidencia Delictiva Estatal (datos abiertos)')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Consolidar un municipio seguro, con instituciones confiables, donde prevalezcan la legalidad, la justicia y la transparencia.',
    1,
    'La percepción ciudadana de seguridad no se ve afectada por factores externos como la violencia regional o nacional fuera del control municipal.',
    'Encuesta Nacional de Seguridad Pública Urbana (ENSU – INEGI); DataMéxico'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 2, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Reducción de la incidencia delictiva y de las conductas antisociales'),
    (2, 'Mayor confianza ciudadana en la seguridad pública municipal.'),
    -- Anomalía G: texto truncado en el PDF, completado por Hugo 2026-07-24.
    (3, 'Fortalecimiento de la cohesión social y cultura de la legalidad.'),
    (4, 'Convivencia comunitaria pacífica y resiliente.')
  ) AS v(orden, texto)
  RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Fortalecimiento de capacidades institucionales', 3,
    '• Se aprueban y liberan a tiempo los recursos para capacitación y certificación. • Disponibilidad de academias acreditadas y evaluadores externos. • Baja rotación y ausentismo del personal operativo para completar los cursos. • Marco normativo y sindical permite ajustes de turnos para asistir a la formación.',
    'Registros de capacitación y certificación de la Dirección de Seguridad Pública Municipal'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Justicia cívica y mediación comunitaria', 4,
    '• Marco legal y reglamentos municipales de justicia cívica están vigentes y operables. • Suficiente personal (jueces cívicos, mediadores) y sistemas de gestión de casos funcionando. • Colaboración de las partes para someterse a mediación y cumplir acuerdos. • Coordinación con policía y áreas operativas para ejecutar medidas y notificaciones. • No se generan cargas extraordinarias (paros, contingencias) que saturen los juzgados.',
    'Actas de los Juzgados Cívicos Municipales'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Modernización de la infraestructura y equipamiento', 5,
    '• Procesos de adquisición (licitación/contratación) se realizan en tiempo y sin impugnaciones. • Se garantiza mantenimiento preventivo y correctivo (contratos vigentes, refacciones). • Infraestructura eléctrica y de datos disponible para operar cámaras y sistemas. • Cumplimiento de normas de protección de datos y lineamientos de videovigilancia. • No hay vandalismo o robo de equipo que reduzca la cobertura instalada.',
    'Inventarios oficiales de patrullas, cámaras y sistemas digitales de seguridad'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Coordinación interinstitucional y participación ciudadana', 6,
    '• Voluntad de colaboración de dependencias estatales/federales para firmar y operar convenios. • Participación ciudadana suficiente para integrar y sostener comités vecinales. • Continuidad administrativa (no cambios bruscos) que respalde convenios y comités. • Recursos mínimos (logística, materiales) para sesiones y seguimiento. • Condiciones de seguridad que permitan reuniones presenciales en colonias.',
    'Actas de instalación de comités; convenios registrados en Secretaría del Ayuntamiento'
  FROM central RETURNING id
),
medio5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', central.id, 5,
    'Prevención social y resiliencia comunitaria', 7,
    '• Interés y disponibilidad de escuelas, colonias y organizaciones para recibir capacitación. • Formadores acreditados y materiales didácticos disponibles. • Espacios adecuados (aulas/salones) y agenda compatible con el calendario escolar/comunitario. • No hay contingencias sanitarias o de protección civil que suspendan actividades. • Capacidad institucional para registrar a los participantes y validar evidencias.',
    'Listas de asistencia de la Coordinación de Protección Civil'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Implementar un programa de profesionalización y certificación continua para policías.', 8,
       'Existen recursos estatales/federales suficientes para la certificación y disponibilidad de academias acreditadas',
       'Registros de capacitación, constancias y padrones de certificación (Dirección de Seguridad Pública/RH)'),
    (2, 'Incrementar el número de elementos capacitados en proximidad social y prevención del delito', 9,
       'Los policías asisten y concluyen la capacitación sin rotación excesiva de personal.',
       'Listas de asistencia, constancias, reportes de cursos'),
    (3, 'Crear un sistema de evaluación del desempeño policial con indicadores de calidad y resultados.', 10,
       'La evaluación es aplicada con criterios objetivos y con participación de órganos externos para dar legitimidad.',
       'Reportes de evaluación de desempeño, expedientes de RH')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio2, (VALUES
    (1, 'Fortalecer los juzgados cívicos municipales con procesos ágiles y accesibles.', 11,
       'Los juzgados cívicos cuentan con recursos humanos y materiales suficientes para agilizar los procesos.',
       'Actas y sistema de gestión de juzgados cívicos'),
    (2, 'Establecer mecanismos de mediación y resolución de conflictos vecinales', 12,
       'Las partes en conflicto aceptan voluntariamente someterse a mediación.',
       'Expedientes de mediación, minutas y acuerdos.'),
    (3, 'Implementar campañas de cultura de la legalidad y solución pacífica de conflictos', 13,
       'La ciudadanía participa activamente en las campañas y existe colaboración con escuelas y barrios.',
       'Programas, evidencias fotográficas, informes de difusión')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio3, (VALUES
    (1, 'Renovar el parque vehicular y equipo policial para garantizar mayor operatividad.', 14,
       'El presupuesto destinado para equipamiento es liberado y ejercido en tiempo.',
       'Inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial.'),
    (2, 'Implementar plataformas digitales de control y seguimiento de incidencias.', 15,
       'Existe mantenimiento preventivo y soporte técnico continuo que asegure su funcionamiento',
       'Reportes del sistema, bitácoras de atención'),
    (3, 'Instalar y mantener sistemas de videovigilancia en puntos estratégicos del municipio.', 16,
       'La ciudadanía utiliza el sistema y los operadores registran oportunamente los incidentes.',
       'Dashboard/bitácoras del C2/C4, reportes de TI.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio4, (VALUES
    (1, 'Consolidar protocolos de colaboración con dependencias estatales y federales de seguridad.', 17,
       'Las instancias estatales y federales están dispuestas a colaborar y firmar convenios con el municipio.',
       'Convenios registrados, oficios de validación.'),
    (2, 'Crear y fortalecer comités vecinales de vigilancia en colonias y comunidades.', 18,
       'La ciudadanía acepta participar y los líderes vecinales mantienen continuidad en su función.',
       'Actas de instalación, padrones de comités, minutas.'),
    (3, 'Diseñar campañas de cultura de la denuncia y autocuidado en escuelas y barrios', 19,
       'Los medios de comunicación y redes sociales locales permiten difundir efectivamente los mensajes.',
       'Reportes de comunicación social/prevención, materiales, listas.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 2, 2026, 'OBJETIVOS', 'MEDIO', medio5.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
FROM medio5, (VALUES
  (1, 'Capacitar a la población en prevención y atención de emergencias.', 20,
     'La población está dispuesta a participar en las capacitaciones y se cuenta con espacios adecuados.',
     'Listas de asistencia'),
  (2, 'Actualizar el atlas municipal de riesgos', 21,
     'Las comunidades permiten el acceso a información y colaboran en el levantamiento de datos.',
     'Informes técnico y/o documento oficial'),
  (3, 'Implementar programa sistemático de verificaciones preventivas.', 22,
     'Se dispone de transporte y rutas accesibles.',
     'Informe'),
  (4, 'Establecer mecanismo estandarizado de entrega y seguimiento de notificaciones.', 23,
     'Autoridades y delegados reciben y reconocen notificaciones.',
     'Informe'),
  (5, 'Elaborar dictámenes técnicos con enfoque preventivo.', 24,
     'Personal técnico disponible y capacitado.',
     'Informe')
) AS v(orden, texto, indicador_id, supuestos, medios_verificacion);

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (2, 2026, 'BENEFICIARIO', 'Ciudadanía en general', 1),
  (2, 2026, 'BENEFICIARIO', 'Comerciantes y empresarios locales', 2),
  (2, 2026, 'BENEFICIARIO', 'Comunidades escolares y juveniles', 3),
  (2, 2026, 'EJECUTOR', 'Ministerio Público y Poder Judicial Estatal', 1),
  (2, 2026, 'EJECUTOR', 'Dirección de Seguridad Pública Municipal', 2),
  (2, 2026, 'EJECUTOR', 'Coordinación de Protección Civil Municipal', 3),
  (2, 2026, 'EJECUTOR', 'Juzgado Cívico Municipal', 4),
  (2, 2026, 'OPOSITOR', 'Grupos delictivos locales', 1),
  (2, 2026, 'OPOSITOR', 'Servidores públicos que incurren en prácticas de corrupción', 2),
  (2, 2026, 'OPOSITOR', 'Líderes comunitarios o actores políticos', 3),
  (2, 2026, 'INDIFERENTE', 'Comerciantes y empresarios que operan en zonas con baja incidencia delictiva', 1),
  (2, 2026, 'INDIFERENTE', 'Ciudadanía que no ha sido afectada', 2);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo por convención MIR estándar (mismo criterio que 003): Fin y Propósito
-- son Estratégico; Componentes y Actividades son de Gestión. Dimensión/Sentido
-- tomados de la Matriz de Riesgos (páginas 4-6, valor único legible, no
-- checkbox). Línea base: Fin/Propósito=2024 (así lo marca su ficha), resto=2025.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Descendente',
  medios_verificacion='Encuesta Nacional de Seguridad Pública Urbana (ENSU – INEGI); DataMéxico',
  linea_base_anio=2024,
  interpretacion='Mide la proporción de habitantes que se sienten inseguros en su entorno. Permite evaluar la efectividad de las políticas de prevención y proximidad social. Una disminución indica mejora en la confianza ciudadana.'
WHERE id=1;

UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Descendente',
  medios_verificacion='SESNSP – Incidencia Delictiva Estatal (datos abiertos)',
  linea_base_anio=2024,
  interpretacion='Evalúa la cantidad de delitos registrados por cada 100 adultos, mostrando la frecuencia delictiva en la población. Una reducción refleja el impacto de la acción policial y la prevención del delito.'
WHERE id=2;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Registros de capacitación y certificación de la Dirección de Seguridad Pública Municipal',
  linea_base_anio=2025,
  interpretacion='Refleja el grado de profesionalización del cuerpo policial. Un porcentaje alto implica mayor capacidad institucional para brindar seguridad y justicia con apego a derechos humanos.'
WHERE id=3;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de los Juzgados Cívicos Municipales',
  linea_base_anio=2025,
  interpretacion='Mide la eficiencia del sistema de justicia cívica al resolver conflictos de manera pronta, reduciendo la carga judicial y fortaleciendo la paz comunitaria.'
WHERE id=4;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios oficiales de patrullas, cámaras y sistemas digitales de seguridad',
  linea_base_anio=2025,
  interpretacion='Determina el avance en la ampliación de la infraestructura de seguridad (patrullas, cámaras, radios). Un aumento indica mejor capacidad operativa y preventiva.'
WHERE id=5;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de instalación de comités; convenios registrados en Secretaría del Ayuntamiento',
  linea_base_anio=2025,
  interpretacion='Evalúa el nivel de participación ciudadana en seguridad y la coordinación institucional. Un alto valor refleja cohesión social y gobernanza colaborativa.'
WHERE id=6;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia de la Coordinación de Protección Civil',
  linea_base_anio=2025,
  interpretacion='Indica la proporción de población que ha recibido formación para prevenir riesgos y fortalecer su capacidad de respuesta ante emergencias o violencia.'
WHERE id=7;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Registros de capacitación, constancias y padrones de certificación (Dirección de Seguridad Pública/RH)',
  linea_base_anio=2025,
  interpretacion='Mide el cumplimiento de la normativa que exige evaluación y certificación del personal de seguridad. Un indicador alto asegura confianza y profesionalismo.'
WHERE id=8;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia, constancias, reportes de cursos',
  linea_base_anio=2025,
  interpretacion='Evalúa la adopción del modelo de policía de proximidad, centrado en la interacción positiva con la comunidad para prevenir delitos.'
WHERE id=9;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de evaluación de desempeño, expedientes de RH',
  linea_base_anio=2025,
  interpretacion='Indica la proporción de elementos que cumplen con estándares de desempeño y ética en el servicio, clave para mantener la confianza ciudadana.'
WHERE id=10;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas y sistema de gestión de juzgados cívicos',
  linea_base_anio=2025,
  interpretacion='Permite medir la eficiencia general en la atención de denuncias y conflictos, mostrando capacidad de respuesta institucional.'
WHERE id=11;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Expedientes de mediación, minutas y acuerdos.',
  linea_base_anio=2025,
  interpretacion='Mide la proporción de conflictos que se resuelven mediante mecanismos alternativos, fortaleciendo la cultura de paz y evitando procesos judiciales.'
WHERE id=12;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programas, evidencias fotográficas, informes de difusión',
  linea_base_anio=2025,
  interpretacion='Evalúa la promoción de valores cívicos y de respeto a la ley entre la ciudadanía. Un incremento mejora la corresponsabilidad social.'
WHERE id=13;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial.',
  linea_base_anio=2025,
  interpretacion='Mide la disponibilidad real del parque vehicular y equipamiento operativo, reflejando capacidad de respuesta.'
WHERE id=14;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes del sistema, bitácoras de atención',
  linea_base_anio=2025,
  interpretacion='Determina la eficiencia en la atención oportuna de reportes e incidencias registradas en las plataformas digitales de control.'
WHERE id=15;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Dashboard/bitácoras del C2/C4, reportes de TI.',
  linea_base_anio=2025,
  interpretacion='Mide la disponibilidad operativa del sistema de videovigilancia instalado en puntos estratégicos del municipio.'
WHERE id=16;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Convenios registrados, oficios de validación.',
  linea_base_anio=2025,
  interpretacion='Refleja la coordinación entre dependencias de seguridad y justicia. Un incremento indica fortalecimiento institucional y colaboración transversal.'
WHERE id=17;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de instalación, padrones de comités, minutas.',
  linea_base_anio=2025,
  interpretacion='Evalúa el grado de organización social y la sostenibilidad de los mecanismos de seguridad comunitaria.'
WHERE id=18;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de comunicación social/prevención, materiales, listas.',
  linea_base_anio=2025,
  interpretacion='Mide la eficacia en la ejecución de acciones preventivas y de sensibilización planificadas en el POA.'
WHERE id=19;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia',
  linea_base_anio=2025,
  interpretacion='Indica el nivel de preparación ciudadana ante riesgos naturales o humanos. Contribuye a la resiliencia municipal.'
WHERE id=20;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes técnico y/o documento oficial',
  linea_base_anio=2025,
  interpretacion='Mide el cumplimiento en la actualización de instrumentos técnicos para la gestión del riesgo. Garantiza decisiones basadas en evidencia.'
WHERE id=21;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informe',
  linea_base_anio=2025,
  interpretacion='Evalúa la cobertura de acciones de inspección y verificación preventiva en comunidades. Ayuda a reducir vulnerabilidades.'
WHERE id=22;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informe',
  linea_base_anio=2025,
  interpretacion='Mide el nivel de cumplimiento y trazabilidad de las acciones derivadas de inspecciones preventivas.'
WHERE id=23;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informe',
  linea_base_anio=2025,
  interpretacion='Evalúa la eficiencia administrativa y técnica en la emisión de dictámenes oportunos para prevenir riesgos y daños.'
WHERE id=24;

-- ---------- 6. indicador_variables + indicador_variables_valores ----------
-- unidad_medida corregida a la unidad real (anomalía H). valor_meta = NULL
-- en Componentes/Actividades (anomalía I) — NULL::numeric explícito por el
-- mismo motivo que en 003 (UNION ALL sin cast infiere texto y choca con
-- numeric(15,4)).

-- id=1 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (1, 'Personas que se sienten inseguras', 'PSI', 'Personas', 'Encuesta Nacional de Seguridad Pública Urbana (ENSU – INEGI); DataMéxico', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (1, 'Total encuestadas', 'TE', 'Personas', 'Encuesta Nacional de Seguridad Pública Urbana (ENSU – INEGI); DataMéxico', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 37251, 37757 FROM v1
UNION ALL SELECT v2.id, 2026, 60739, 62018 FROM v2;

-- id=2 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (2, 'Delitos registrados', 'DR', 'Delitos', 'SESNSP – Incidencia Delictiva Estatal (datos abiertos)', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (2, 'Población ≥18 años', 'PM18', 'Habitantes', 'SESNSP – Incidencia Delictiva Estatal (datos abiertos)', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 21509, 19699 FROM v1
UNION ALL SELECT v2.id, 2026, 60739, 62018 FROM v2;

-- id=3 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (3, 'Policías certificados y capacitados', 'PCC', 'Policías', 'Registros de capacitación y certificación de la Dirección de Seguridad Pública Municipal', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (3, 'Total de elementos de Seguridad Pública y Vialidad', 'TE', 'Policías', 'Registros de capacitación y certificación de la Dirección de Seguridad Pública Municipal', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 44, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 210, NULL::numeric FROM v2;

-- id=4 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (4, 'Casos resueltos en menos de 30 días', 'CR30', 'Casos', 'Actas de los Juzgados Cívicos Municipales', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (4, 'Total de casos recibidos', 'TCR', 'Casos', 'Actas de los Juzgados Cívicos Municipales', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 62, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 62, NULL::numeric FROM v2;

-- id=5 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (5, 'Unidades operativas año actual', 'UOAA', 'Unidades', 'Inventarios oficiales de patrullas, cámaras y sistemas digitales de seguridad', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (5, 'Unidades año base', 'UAB', 'Unidades', 'Inventarios oficiales de patrullas, cámaras y sistemas digitales de seguridad', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 63, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 58, NULL::numeric FROM v2;

-- id=6 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (6, 'Comités y convenios activos', 'CCA', 'Comités y convenios', 'Actas de instalación de comités; convenios registrados en Secretaría del Ayuntamiento', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (6, 'Total programados', 'TP', 'Comités y convenios', 'Actas de instalación de comités; convenios registrados en Secretaría del Ayuntamiento', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 26, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 26, NULL::numeric FROM v2;

-- id=7 C5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (7, 'Personas capacitadas', 'PC', 'Personas', 'Listas de asistencia de la Coordinación de Protección Civil', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (7, 'Total programado a capacitar', 'TPC', 'Personas', 'Listas de asistencia de la Coordinación de Protección Civil', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 250, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 250, NULL::numeric FROM v2;

-- id=8 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (8, 'Policías certificados', 'PC', 'Policías', 'Registros de capacitación, constancias y padrones de certificación (Dirección de Seguridad Pública/RH)', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (8, 'Total de policías', 'TP', 'Policías', 'Registros de capacitación, constancias y padrones de certificación (Dirección de Seguridad Pública/RH)', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 55, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 55, NULL::numeric FROM v2;

-- id=9 A1.2 — anomalía F: 1ª variable renombrada (la ficha copió "Policías
-- certificados" de 1.1; el valor 10 sí corresponde a esta actividad).
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (9, 'Policías capacitados en proximidad', 'PCP', 'Policías', 'Listas de asistencia, constancias, reportes de cursos', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (9, 'Total de policías', 'TP', 'Policías', 'Listas de asistencia, constancias, reportes de cursos', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 10, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 10, NULL::numeric FROM v2;

-- id=10 A1.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (10, 'Policías con evaluación ≥ criterio', 'PEC', 'Policías', 'Reportes de evaluación de desempeño, expedientes de RH', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (10, 'Total evaluados', 'TE', 'Policías', 'Reportes de evaluación de desempeño, expedientes de RH', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 35, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 35, NULL::numeric FROM v2;

-- id=11 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (11, 'Casos resueltos en menos de 30 días', 'CR30', 'Casos', 'Actas y sistema de gestión de juzgados cívicos', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (11, 'Total de casos', 'TC', 'Casos', 'Actas y sistema de gestión de juzgados cívicos', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 12, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 12, NULL::numeric FROM v2;

-- id=12 A2.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (12, 'Conflictos con acuerdo de mediación', 'CAM', 'Conflictos', 'Expedientes de mediación, minutas y acuerdos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (12, 'Total de conflictos', 'TC', 'Conflictos', 'Expedientes de mediación, minutas y acuerdos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 5, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 5, NULL::numeric FROM v2;

-- id=13 A2.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (13, 'Campañas realizadas', 'CR', 'Campañas', 'Programas, evidencias fotográficas, informes de difusión', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (13, 'Campañas programadas', 'CP', 'Campañas', 'Programas, evidencias fotográficas, informes de difusión', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 4, NULL::numeric FROM v2;

-- id=14 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (14, 'Parque vehicular-equipo policial operativas', 'PVEP', 'Unidades', 'Inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (14, 'Total de parque vehicular-equipo policial', 'TPVEP', 'Unidades', 'Inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 425, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 425, NULL::numeric FROM v2;

-- id=15 A3.2 — anomalía E: la ficha de esta actividad traía el Nombre de la
-- 3.3 pegado por error; se usa el nombre correcto ya en el catálogo (id=15) y
-- las variables reales de su propia ficha (IAP/IR).
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (15, 'Incidencias atendidas en plazo', 'IAP', 'Incidencias', 'Reportes del sistema, bitácoras de atención', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (15, 'Incidencias registradas', 'IR', 'Incidencias', 'Reportes del sistema, bitácoras de atención', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 740, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 740, NULL::numeric FROM v2;

-- id=16 A3.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (16, 'Cámaras operando', 'CO', 'Cámaras', 'Dashboard/bitácoras del C2/C4, reportes de TI.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (16, 'Total instaladas', 'TI', 'Cámaras', 'Dashboard/bitácoras del C2/C4, reportes de TI.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 40, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 40, NULL::numeric FROM v2;

-- id=17 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (17, 'Convenios formalizados', 'CF', 'Convenios', 'Convenios registrados, oficios de validación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (17, 'Convenios programados', 'CP', 'Convenios', 'Convenios registrados, oficios de validación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 6, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 6, NULL::numeric FROM v2;

-- id=18 A4.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (18, 'Comités activos', 'CA', 'Comités', 'Actas de instalación, padrones de comités, minutas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (18, 'Comités constituidos', 'CC', 'Comités', 'Actas de instalación, padrones de comités, minutas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 35, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 35, NULL::numeric FROM v2;

-- id=19 A4.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (19, 'Campañas implementadas', 'CI', 'Campañas', 'Reportes de comunicación social/prevención, materiales, listas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (19, 'Campañas programadas', 'CP', 'Campañas', 'Reportes de comunicación social/prevención, materiales, listas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 13, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 13, NULL::numeric FROM v2;

-- id=20 A5.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (20, 'Personas capacitadas', 'PC', 'Personas', 'Listas de asistencia', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (20, 'Total programado', 'TP', 'Personas', 'Listas de asistencia', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 20, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 20, NULL::numeric FROM v2;

-- id=21 A5.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (21, 'Diagnósticos/atlas actualizados', 'DAA', 'Diagnósticos', 'Informes técnico y/o documento oficial', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (21, 'Total programados', 'TP', 'Diagnósticos', 'Informes técnico y/o documento oficial', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 1, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 1, NULL::numeric FROM v2;

-- id=22 A5.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (22, 'Comunidades verificadas', 'CV', 'Comunidades', 'Informe', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (22, 'Comunidades programadas', 'CP', 'Comunidades', 'Informe', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2250, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 2250, NULL::numeric FROM v2;

-- id=23 A5.4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (23, 'Notificaciones con seguimiento', 'NCS', 'Notificaciones', 'Informe', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (23, 'Notificaciones emitidas', 'NE', 'Notificaciones', 'Informe', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 900, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 900, NULL::numeric FROM v2;

-- id=24 A5.5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (24, 'Dictámenes emitidos dentro del plazo', 'DEDP', 'Dictámenes', 'Informe', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (24, 'Dictámenes solicitados', 'DS', 'Dictámenes', 'Informe', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 2250, NULL::numeric FROM v1
UNION ALL SELECT v2.id, 2026, 2250, NULL::numeric FROM v2;

COMMIT;
