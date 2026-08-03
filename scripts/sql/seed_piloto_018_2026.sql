-- ============================================================
-- SEED PILOTO 018 — contenido 2026 del módulo MML
-- Fuente: "4. 018 FORTALECIMIENTO A LA CALIDAD EDUCATIVA DESARROLLO SOCIAL,
--   CULTURAL Y DEPORTIVA.pdf" (39 páginas)
-- Script SQL revisable (NO migración) — programa_id = 4 (clave '018'), anio = 2026
-- Mismo método que 005/012: pdfjs-dist + clustering por coordenadas x/y.
--
-- Los 22 indicadores (ids 25-46) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que 003/005/012).
--
-- Este PDF es el MÁS LIMPIO de los 3 revisados hasta ahora: el árbol del
-- problema mapea perfecto 1 a 1 con las 14 actividades reales (2,2,1,2,3,4
-- por causa = exactamente igual a los componentes 1-6), y casi todas las
-- fichas de indicador coinciden con su propio tema. Solo 3 anomalías reales:
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  R) Ficha de la actividad 6.2 (id=44, "Articular los programas sociales
--     bajo un sistema de gestión integrada"): su Fórmula, Variables
--     ("Comités activos / Comités constituidos" = 35/35) e Interpretación
--     ("...mecanismos de seguridad comunitaria") no tienen relación con el
--     tema de la actividad — contenido copiado de otro indicador (posible
--     bleed de otro programa). Se reconstruyó desde la fórmula real de la
--     Matriz de Riesgos: "(Programas sociales integrados / Total de
--     programas sociales) × 100", valor = meta_anual_2026 (6/6).
--  S) Falta por completo la ficha individual de la actividad 5.3 ("Dotación
--     de despensas alimentarias", id=42) — el PDF salta de la ficha 5.2
--     directo a la de 6.1. Reconstruida desde la Matriz de Riesgos + POA
--     (despensas entregadas/total programado = 1200/1200).
--  T) Ficha de la actividad 5.1 (id=40): su propia variable numerador se
--     llama "Apoyos funcionales programados", pero la fórmula del mismo
--     indicador es (Apoyos Funcionales Entregados/Total Programado) — se
--     corrigió el nombre a "Apoyos funcionales entregados" (mismo valor).
--  U) Uno de los 7 "Fines" del Árbol de Objetivos queda incompleto en el PDF
--     ("Atención prioritaria y digna a adultos mayores, personas con
--     discapacidad y grupos ___.") — se completó como "grupos vulnerables."
--     (mejor conjetura razonable, no hay más texto en la fuente).
--  V) Fin (id=25) y Propósito (id=26) muestran años de línea base distintos
--     entre sí en su propia ficha (Alcanzada 2025 vs Alcanzada 2024) — se
--     sembró cada uno con el año que su propia ficha indica, sin forzarlos
--     a coincidir.
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(4, 2026, 1,
  'Desigualdad en el acceso a servicios básicos, salud, educación, inclusión y bienestar social.',
  'Garantizar el acceso pleno a derechos sociales, salud, educación, deporte e inclusión para reducir la pobreza y mejorar la calidad de vida.'),
(4, 2026, 2,
  'Infraestructura educativa, deportiva y social insuficiente o en deterioro.',
  'Rehabilitación y construcción de infraestructura básica de bienestar, con instalaciones adecuadas y accesibles para toda la población.'),
(4, 2026, 3,
  'Cobertura médica limitada en comunidades marginadas y con servicios de baja calidad.',
  'Ampliación de la cobertura médica y asistencial, con servicios oportunos y de calidad en todas las colonias.'),
(4, 2026, 4,
  'Escasa coordinación de programas sociales y diagnósticos poco actualizados.',
  'Fortalecimiento de programas sociales con diagnósticos actualizados, alineados a los ejes del Plan Municipal de Desarrollo.'),
(4, 2026, 5,
  'Baja inclusión de grupos vulnerables y falta de políticas efectivas para juventudes y migrantes.',
  'Políticas públicas inclusivas que atiendan a juventudes, migrantes, adultos mayores y personas con discapacidad, con enfoque de equidad.'),
(4, 2026, 6,
  'Débil cultura de prevención y limitado acceso a programas de desarrollo comunitario.',
  'Impulso a campañas de prevención, educación comunitaria y programas de asistencia social integral.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (4, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Insuficiente cobertura de la garantía de los derechos sociales y de bienestar, en el municipio de Apizaco.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Aumento en la vulnerabilidad de grupos prioritarios (adultos mayores, personas con discapacidad, etc.)'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Baja calidad de vida en comunidades marginadas'),
    (2, 'Persistencia de pobreza y exclusión social'),
    (3, 'Incremento en enfermedades físicas y psicoemocional'),
    (4, 'Migración irregular por falta de oportunidades locales, de espacios de recreación, deportiva y cultural.'),
    (5, 'Bajo nivel educativo, deportivo y de atención de niñas, niños y jóvenes'),
    (6, 'Bajo acceso a los servicios de bienestar social'),
    (7, 'Baja cobertura de la suficiencia alimentaria.')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Espacios públicos para el desarrollo social insuficientes'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Insuficiente infraestructura deportiva funcional y accesible para la población.'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', central.id, 3, 'Cobertura limitada'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', central.id, 4, 'Insuficiente cobertura de servicios médicos preventivos y de atención primaria en el municipio de Apizaco.'
  FROM central RETURNING id
),
causa5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', central.id, 5, 'Bajo acceso a servicios asistenciales'
  FROM central RETURNING id
),
causa6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', central.id, 6, 'Falta de coordinación'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Falta de espacios públicos en zonas marginadas'),
    (2, 'Rastro municipal obsoleto')
  ) AS v(orden, texto) RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', causa2.id, v.orden, v.texto
  FROM causa2, (VALUES
    (1, 'Areas deportivas obsoletas o insuficientes'),
    (2, 'Débil articulación institucional para la promoción del deporte y la actividad física.')
  ) AS v(orden, texto) RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', causa3.id, 1, 'Pocas políticas de juventud, educación, deporte y desarrollo social.'
  FROM causa3 RETURNING id
),
sub4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', causa4.id, v.orden, v.texto
  FROM causa4, (VALUES
    (1, 'Limitada coordinación interinstitucional entre el municipio, sector salud estatal y programas federales.'),
    (2, 'Cobertura limitada de brigadas, consultas y campañas de salud en zonas vulnerables.')
  ) AS v(orden, texto) RETURNING id
),
sub5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'PROBLEMA', 'CAUSA', causa5.id, v.orden, v.texto
  FROM causa5, (VALUES
    (1, 'Insuficientes aparatos funcionales'),
    (2, 'Escasez de productos lácteos'),
    (3, 'Carencia alimentaria')
  ) AS v(orden, texto) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 4, 2026, 'PROBLEMA', 'CAUSA', causa6.id, v.orden, v.texto
FROM causa6, (VALUES
  (1, 'Falta de comunicación entre las áreas'),
  (2, 'Desarticulación entre programas sociales'),
  (3, 'Diagnósticos poco actualizados'),
  (4, 'Falta de estrategias para atender la migración')
) AS v(orden, texto);

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (4, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Ampliar la cobertura y mejorar la calidad de los servicios sociales, educativos, de salud, culturales, deportivos y de asistencia, promoviendo la inclusión y el bienestar integral de todas y todos.',
    26,
    'Los programas sociales mantienen continuidad y financiamiento. Las dependencias generan y publican registros confiables. La población beneficiaria participa activamente en los programas.',
    'Indicadores de la pobreza en Mexico y sus municipios, CONEVAL.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Garantizar el bienestar social y la cobertura efectiva de los derechos básicos en el municipio de Apizaco, reduciendo la pobreza y la exclusión social.',
    25,
    'El CONEVAL actualiza periódicamente la información. La metodología de medición de pobreza se mantiene estable. La información censal es confiable y accesible.',
    'Fichas municipales de CONEVAL. Informe de Pobreza Multidimensional Municipal 2020. INEGI, Censo de Población y Vivienda 2020. Plataforma DataMéxico.'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 4, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Incremento en la calidad de vida de comunidades marginadas.'),
    (2, 'Reducción de la pobreza y la exclusión social.'),
    (3, 'Disminución de enfermedades físicas y psicoemocionales'),
    (4, 'Reducción de la migración irregular mediante oportunidades locales.'),
    (5, 'Mayor nivel educativo, deportivo y cultural en niñas, niños y jóvenes.'),
    -- Anomalía U: texto incompleto en el PDF fuente, completado con "grupos vulnerables."
    (6, 'Atención prioritaria y digna a adultos mayores, personas con discapacidad y grupos vulnerables.'),
    (7, 'Cobertura plena de servicios de bienestar social y suficiencia alimentaria.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Ampliar los espacios públicos para el bienestar', 27,
    'El presupuesto se aprueba y libera a tiempo; las obras se ejecutan conforme al plan',
    'Actas de entrega-recepcion, galeria fotografica.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Mejorar la infraestructura deportiva municipal para garantizar espacios funcionales, accesibles y seguros.', 28,
    'Disponibilidad presupuestal suficiente, condiciones técnicas adecuadas y continuidad administrativa en la ejecución de obras',
    'Inventario municipal de infraestructura deportiva, actas de entrega–recepción, reportes de obra, evidencia fotográfica'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Inclusión social', 29,
    'Se asigna financiamiento suficiente; las dependencias coordinan esfuerzos; los programas cuentan con participación comunitaria.',
    'Informes de la Dirección de Desarrollo Social y Salud; reportes de programas'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Suficiente cobertura de servicios médicos preventivos y de atención primaria en el municipio de Apizaco.', 30,
    'Disponibilidad de personal médico; participación comunitaria; no ocurrencia de emergencias de gran escala que limiten la cobertura.',
    'Programas anuales de brigadas, reportes de actividades, listas de asistencia, evidencias fotográficas.'
  FROM central RETURNING id
),
medio5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', central.id, 5,
    'Incrementar el acceso a servicios asistenciales para grupos prioritarios.', 31,
    'Los beneficiarios se registran adecuadamente; DIF y Desarrollo Social cuentan con recursos.',
    'Padrón de beneficiarios; reportes de atención'
  FROM central RETURNING id
),
medio6 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', central.id, 6,
    'Asistencia social y coordinación de programas', 32,
    'Las instituciones externas aceptan colaborar; se da continuidad administrativa; existe interés ciudadano en participar.',
    'Actas municipales; convenios firmados; reportes de seguimiento.'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Habilitación o rehabilitación de espacios públicos en zonas marginadas', 33,
       'Se asigna presupuesto y la obra es aceptada por la comunidad.', 'Actas de entrega-recepción, evidencia fotografica.'),
    (2, 'Modernización del rastro municipal para mejorar condiciones sanitarias.', 34,
       'Se mantiene el financiamiento; se cumplen normas sanitarias.', 'Reportes de avance físico-financiero; actas de entrega-recepción.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio2, (VALUES
    (1, 'Modernización de áreas deportivas', 35,
       'Los espacios deportivos se mantienen disponibles y la comunidad los usa.', 'Inventarios actualizados; actas de entrega-recepción'),
    (2, 'Fortalecer la coordinación interinstitucional para la promoción de la cultura física y el deporte', 36,
       'Existencia de voluntad institucional de colaboración y coincidencia de objetivos entre las partes', 'Convenios firmados, actas de colaboración, registros administrativos, informes del área')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, 1,
    'Diseñar políticas integrales para juventud, educación, deporte y desarrollo social.', 37,
    'Los programas son adoptados oficialmente; las áreas colaboran.', 'Documentos de diseño de políticas; actas de aprobación.'
  FROM medio3 RETURNING id
),
act4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio4, (VALUES
    (1, 'Ampliar la cobertura de servicios de salud en colonias apartadas mediante ferias de salud', 38,
       'La población participa; se cuenta con personal médico suficiente.', 'Listas de asistencia; reportes de ferias de salud.'),
    (2, 'Fortalecer la coordinación interinstitucional entre el municipio, la Secretaría de Salud estatal y programas federales.', 39,
       'Disponibilidad de autoridades estatales y federales; continuidad administrativa.', 'Minutas, listas de asistencia, acuerdos.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act5 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', medio5.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio5, (VALUES
    (1, 'Incremetar la entrega de apoyos funcionales', 40,
       'Se dispone de presupuesto suficiente para la adquisición de apoyos. Los proveedores entregan en tiempo y forma los productos requeridos. Las solicitudes son verificadas y autorizadas por los responsables del programa.',
       'Actas de entrega-recepción. Padrón de beneficiarios del DIF. Reportes mensuales de la Coordinación de Asistencia Social. Fotografías y evidencia documental del apoyo otorgado.'),
    (2, 'Productos lacteos suficientes', 41,
       'Se garantiza el abasto continuo de productos lácteos. El sistema de distribución es eficiente y transparente. Los beneficiarios acuden puntualmente a los puntos de entrega.',
       'Listas de distribución. Padrón de beneficiarios del Programa Alimentario. Informes de entrega mensual. Facturas o comprobantes de adquisición del producto.'),
    (3, 'Dotación de despensas alimentarias', 42,
       'El recurso financiero asignado se ejerce sin retrasos. Los insumos se adquieren con calidad e inocuidad garantizada. No se presentan contingencias que limiten la distribución (climáticas, logísticas, etc.).',
       'Padrón de beneficiarios actualizado. Actas de entrega firmadas por los receptores. Reportes fotográficos y bitácoras de entrega. Informes de control de inventario del almacén DIF.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 4, 2026, 'OBJETIVOS', 'MEDIO', medio6.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
FROM medio6, (VALUES
  (1, 'Establecer mecanismos de comunicación y coordinación entre áreas municipales.', 43,
     'Las instituciones participan; hay voluntad de coordinación.', 'Actas de reuniones; convenios; minutas.'),
  (2, 'Articular los programas sociales bajo un sistema de gestión integrada.', 44,
     'Se dispone de tecnología; las áreas aceptan unificar criterios.', 'Reportes del sistema integrado; listas de programas.'),
  (3, 'Elaborar y actualizar diagnósticos sociales y de migración.', 45,
     'Acceso a información estadística; colaboración de comunidades.', 'Documentos técnicos; oficios de validación.'),
  (4, 'Implementar estrategias específicas para atender la migración y apoyar a juventudes migrantes.', 46,
     'Se asignan recursos; migrantes y juventudes participan en las acciones.', 'Programas implementados; padrones de beneficiarios.')
) AS v(orden, texto, indicador_id, supuestos, medios_verificacion);

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (4, 2026, 'BENEFICIARIO', 'Familias en situación de pobreza y rezago social', 1),
  (4, 2026, 'BENEFICIARIO', 'Adultos mayores, personas con discapacidad y mujeres en situación de vulnerabilidad', 2),
  (4, 2026, 'BENEFICIARIO', 'Niñas, niños y adolescentes', 3),
  (4, 2026, 'BENEFICIARIO', 'Comunidades marginadas y rurales', 4),
  (4, 2026, 'BENEFICIARIO', 'Migrantes y juventudes migrantes', 5),
  (4, 2026, 'EJECUTOR', 'Dirección de Desarrollo Social', 1),
  (4, 2026, 'EJECUTOR', 'Dirección de Salud', 2),
  (4, 2026, 'EJECUTOR', 'Algunas instituciones educativas o de salud', 3),
  (4, 2026, 'EJECUTOR', 'Medios de comunicación locales', 4),
  (4, 2026, 'EJECUTOR', 'Dependencias estatales y federales', 5),
  (4, 2026, 'EJECUTOR', 'Sistema DIF Municipal', 6),
  (4, 2026, 'OPOSITOR', 'Grupos de interés económico', 1),
  (4, 2026, 'OPOSITOR', 'Funcionarios o servidores públicos sin sensibilización en temas de inclusión', 2),
  (4, 2026, 'OPOSITOR', 'Prestadores de servicios privados de salud o educación', 3),
  (4, 2026, 'OPOSITOR', 'Sectores políticos opositores', 4),
  (4, 2026, 'INDIFERENTE', 'Sector empresarial no socialmente responsable', 1),
  (4, 2026, 'INDIFERENTE', 'Ciudadanía joven no organizada', 2);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo por convención MIR estándar: Fin/Propósito=Estratégico, resto=Gestión.
-- Dimensión/Sentido vienen de un renglón único y legible en la Matriz de
-- Riesgos: FIN=Eficiencia/Descendente, PROPOSITO=Eficiencia/Ascendente
-- (ambos coherentes con su propio indicador, sin anomalía tipo 012), todos
-- los Componentes/Actividades=Eficacia/Regular.
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Descendente',
  medios_verificacion='Fichas municipales de CONEVAL. Informe de Pobreza Multidimensional Municipal 2020. INEGI, Censo de Población y Vivienda 2020. Plataforma DataMéxico.',
  linea_base_anio=2025,
  interpretacion='Mide el nivel de carencias económicas y sociales que afectan a la población del municipio. Su comportamiento permite evaluar si las acciones municipales contribuyen a mejorar el bienestar social, reducir desigualdades y orientar recursos a los grupos más necesitados. Una disminución del indicador refleja mayor efectividad en las políticas de inclusión, desarrollo económico y programas sociales.'
WHERE id=25;

UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Indicadores de la pobreza en Mexico y sus municipios, CONEVAL.',
  linea_base_anio=2024,
  interpretacion='Evalúa el grado en que la población carece de servicios básicos para su desarrollo integral. Permite valorar la pertinencia de programas que atienden salud preventiva, capacitación, educación, deporte y cultura. Su reducción indica mayor cobertura y acceso a servicios esenciales.'
WHERE id=26;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de entrega-recepcion, galeria fotografica.',
  linea_base_anio=2025,
  interpretacion='Mide el nivel de cumplimiento de metas de infraestructura social establecidas en el POA. Permite verificar si los espacios públicos programados se están construyendo, rehabilitando o finalizando conforme al plan anual, lo cual incide directamente en la calidad de vida y cohesión comunitaria.'
WHERE id=27;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario municipal de infraestructura deportiva, actas de entrega–recepción, reportes de obra, evidencia fotográfica',
  linea_base_anio=2025,
  interpretacion='Mide el avance en la mejora física y funcional de la infraestructura deportiva municipal. Un mayor porcentaje indica mayor disponibilidad de espacios seguros, accesibles y adecuados para la práctica deportiva y recreativa.'
WHERE id=28;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de la Dirección de Desarrollo Social y Salud; reportes de programas',
  linea_base_anio=2025,
  interpretacion='Indica el grado de ejecución y alcance real de los programas dirigidos a poblaciones vulnerables. Permite evaluar si los apoyos de salud, asistencia social y prevención se están aplicando y documentando correctamente. Un mayor porcentaje refleja eficiencia en la entrega y focalización de servicios.'
WHERE id=29;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programas anuales de brigadas, reportes de actividades, listas de asistencia, evidencias fotográficas.',
  linea_base_anio=2025,
  interpretacion='Mide la cobertura territorial de acciones de salud en el municipio. Evalúa la capacidad del gobierno para llevar servicios médicos básicos, campañas de prevención, detecciones y orientación a la población, especialmente a zonas prioritarias. Refleja el impacto directo en el bienestar de la ciudadanía y en la disminución de riesgos a la salud.'
WHERE id=30;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Padrón de beneficiarios; reportes de atención',
  linea_base_anio=2025,
  interpretacion='Mide la cobertura efectiva de los servicios de asistencia social. Indica qué proporción de la población objetivo fue atendida, permitiendo valorar la calidad, suficiencia y pertinencia de los apoyos otorgados a grupos vulnerables.'
WHERE id=31;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas municipales; convenios firmados; reportes de seguimiento.',
  linea_base_anio=2025,
  interpretacion='Evalúa la capacidad del gobierno municipal para coordinarse con instituciones públicas, privadas y sociales. Un mayor porcentaje refleja un funcionamiento adecuado de mecanismos de gobernanza compartida y mejora la efectividad de programas sociales y comunitarios.'
WHERE id=32;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de entrega-recepción, evidencia fotografica.',
  linea_base_anio=2025,
  interpretacion='Mide la intervención municipal en áreas con rezago social. Permite evaluar si la inversión en infraestructura básica está dirigida a las zonas de mayor necesidad. Su incremento refleja mejoras en accesibilidad, seguridad y calidad urbana.'
WHERE id=33;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de avance físico-financiero; actas de entrega-recepción.',
  linea_base_anio=2025,
  interpretacion='Evalúa el progreso en la mejora de infraestructura, equipamiento y procesos del rastro. El indicador refleja avances en sanidad, seguridad alimentaria y cumplimiento normativo, particularmente en materia de sacrificio, manejo y procesamiento de productos cárnicos.'
WHERE id=34;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios actualizados; actas de entrega-recepción',
  linea_base_anio=2025,
  interpretacion='Mide el avance de proyectos para promover la actividad física, convivencia y desarrollo comunitario. Permite valorar el cumplimiento de metas físicas y la mejora de instalaciones deportivas del municipio.'
WHERE id=35;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Convenios firmados, actas de colaboración, registros administrativos, informes del área',
  linea_base_anio=2025,
  interpretacion='Mide el nivel de articulación del municipio con instituciones educativas, sociales y privadas para impulsar la cultura física y el deporte. Un mayor valor indica mejor gestión colaborativa y aprovechamiento de recursos compartidos.'
WHERE id=36;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Documentos de diseño de políticas; actas de aprobación.',
  linea_base_anio=2025,
  interpretacion='Evalúa la capacidad institucional para formular políticas articuladas con múltiples áreas del Ayuntamiento. Mide tanto el diseño como la implementación, reflejando el grado de avance en planificación estratégica y operativa.'
WHERE id=37;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; reportes de ferias de salud.',
  linea_base_anio=2025,
  interpretacion='Mide el alcance poblacional de acciones preventivas y de promoción a la salud. Permite identificar si las campañas están llegando efectivamente a las comunidades y contribuyendo a reducir riesgos sanitarios.'
WHERE id=38;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Minutas, listas de asistencia, acuerdos.',
  linea_base_anio=2025,
  interpretacion='Mide el nivel de articulación, seguimiento y trabajo conjunto entre dependencias municipales, sector salud y autoridades sanitarias. Evalúa la eficacia de la coordinación para implementar políticas, estrategias preventivas y acciones de vigilancia sanitaria. Un mayor porcentaje indica mejor gobernanza y eficiencia institucional.'
WHERE id=39;

-- Anomalía T: nombre de la variable numerador corregido (ver sección 6).
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de entrega-recepción. Padrón de beneficiarios del DIF. Reportes mensuales de la Coordinación de Asistencia Social. Fotografías y evidencia documental del apoyo otorgado.',
  linea_base_anio=2025,
  interpretacion='Mide la eficacia en la entrega de dispositivos, apoyos o herramientas funcionales para personas con discapacidad o limitaciones. Indica qué tanto las acciones atienden efectivamente las necesidades detectadas en población vulnerable.'
WHERE id=40;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de distribución. Padrón de beneficiarios del Programa Alimentario. Informes de entrega mensual. Facturas o comprobantes de adquisición del producto.',
  linea_base_anio=2025,
  interpretacion='Mide la cobertura y continuidad de la entrega de productos lácteos a la población objetivo, reflejando la capacidad de abasto y distribución del programa alimentario municipal.'
WHERE id=41;

-- Anomalía S: sin ficha propia en el PDF, reconstruida desde Matriz de Riesgos + POA.
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Padrón de beneficiarios actualizado. Actas de entrega firmadas por los receptores. Reportes fotográficos y bitácoras de entrega. Informes de control de inventario del almacén DIF.',
  linea_base_anio=2025,
  interpretacion='Mide la cobertura de la entrega de despensas alimentarias a familias en situación de vulnerabilidad, reflejando la capacidad de respuesta del programa de asistencia alimentaria municipal.'
WHERE id=42;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de reuniones; convenios; minutas.',
  linea_base_anio=2025,
  interpretacion='Mide la consolidación de mecanismos formales de colaboración entre niveles de gobierno e instituciones. Un mayor porcentaje demuestra mejor articulación institucional y fortalecimiento de políticas sociales con alcance regional.'
WHERE id=43;

-- Anomalía R: ficha con contenido no relacionado (fórmula/variables/
-- interpretación de otro indicador); reconstruida desde la Matriz de Riesgos.
UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes del sistema integrado; listas de programas.',
  linea_base_anio=2025,
  interpretacion='Mide el grado de integración de los programas sociales municipales bajo criterios y sistemas comunes de gestión, favoreciendo la eficiencia administrativa y la coordinación entre áreas.'
WHERE id=44;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Documentos técnicos; oficios de validación.',
  linea_base_anio=2025,
  interpretacion='Mide la disponibilidad y actualización de información estratégica para la toma de decisiones. Su avance indica que las políticas públicas están basadas en datos y análisis confiable, mejorando la pertinencia de los programas.'
WHERE id=45;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programas implementados; padrones de beneficiarios.',
  linea_base_anio=2025,
  interpretacion='Evalúa el nivel de cumplimiento del catálogo de programas destinados a migrantes y jóvenes. Indica qué tanto la política pública está respondiendo a las necesidades de estos dos grupos prioritarios en el municipio.'
WHERE id=46;

-- ---------- 6. indicador_variables + indicador_variables_valores ----------
-- Alcanzada/Meta tomados directamente de cada ficha (en su mayoría confiables
-- en este documento, a diferencia de 012); solo id=42 (sin ficha, anomalía S)
-- e id=44 (ficha corrupta, anomalía R) usan meta_anual_2026 como respaldo.
-- unidad_medida corregida a la real (mismo criterio que 003/005/012).

-- id=25 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (25, 'Población en situación de pobreza', 'PEP', 'Personas', 'Fichas municipales de CONEVAL.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (25, 'Población total', 'PT', 'Personas', 'Fichas municipales de CONEVAL.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 36252, 39819 FROM v1
UNION ALL SELECT v2.id, 2026, 82018, 93698 FROM v2;

-- id=26 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (26, 'Población con acceso efectivo a servicios sociales básicos', 'PAESSB', 'Personas', 'Indicadores de la pobreza en Mexico y sus municipios, CONEVAL.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (26, 'Población total', 'PT', 'Personas', 'Indicadores de la pobreza en Mexico y sus municipios, CONEVAL.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 19584, 19865 FROM v1
UNION ALL SELECT v2.id, 2026, 82018, 93698 FROM v2;

-- id=27 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (27, 'Espacios públicos concluidos', 'EPC', 'Espacios', 'Actas de entrega-recepcion, galeria fotografica.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (27, 'Total de espacios públicos programados en el POA', 'TEPP', 'Espacios', 'Actas de entrega-recepcion, galeria fotografica.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=28 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (28, 'Espacios deportivos modernizados o rehabilitados', 'NEDM', 'Espacios', 'Inventario municipal de infraestructura deportiva, actas de entrega–recepción, reportes de obra, evidencia fotográfica', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (28, 'Total de espacios deportivos municipales identificados', 'TEDMI', 'Espacios', 'Inventario municipal de infraestructura deportiva, actas de entrega–recepción, reportes de obra, evidencia fotográfica', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 100, 100 FROM v1
UNION ALL SELECT v2.id, 2026, 100, 100 FROM v2;

-- id=29 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (29, 'Programas implementados', 'PI', 'Programas', 'Informes de la Dirección de Desarrollo Social y Salud; reportes de programas', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (29, 'Programas programados', 'PP', 'Programas', 'Informes de la Dirección de Desarrollo Social y Salud; reportes de programas', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 5, 5 FROM v1
UNION ALL SELECT v2.id, 2026, 5, 5 FROM v2;

-- id=30 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (30, 'Colonias o comunidades atendidas', 'CCA', 'Colonias', 'Programas anuales de brigadas, reportes de actividades, listas de asistencia, evidencias fotográficas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (30, 'Colonias o comunidades programadas', 'CCP', 'Colonias', 'Programas anuales de brigadas, reportes de actividades, listas de asistencia, evidencias fotográficas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 7, 7 FROM v1
UNION ALL SELECT v2.id, 2026, 7, 7 FROM v2;

-- id=31 C5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (31, 'Beneficiarios atendidos', 'BA', 'Beneficiarios', 'Padrón de beneficiarios; reportes de atención', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (31, 'Beneficiarios programados', 'BP', 'Beneficiarios', 'Padrón de beneficiarios; reportes de atención', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 804, 804 FROM v1
UNION ALL SELECT v2.id, 2026, 804, 804 FROM v2;

-- id=32 C6
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (32, 'Comités y convenios activos', 'CCA', 'Comités y convenios', 'Actas municipales; convenios firmados; reportes de seguimiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (32, 'Total programados', 'TP', 'Comités y convenios', 'Actas municipales; convenios firmados; reportes de seguimiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 10, 10 FROM v1
UNION ALL SELECT v2.id, 2026, 10, 10 FROM v2;

-- id=33 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (33, 'Espacios públicos concluidos en zonas marginadas', 'EPCZM', 'Espacios', 'Actas de entrega-recepción, evidencia fotografica.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (33, 'Total programado', 'TP', 'Espacios', 'Actas de entrega-recepción, evidencia fotografica.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 3, 3 FROM v1
UNION ALL SELECT v2.id, 2026, 3, 3 FROM v2;

-- id=34 A1.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (34, 'Avance físico-financiero alcanzado', 'AFFA', 'Porcentaje', 'Reportes de avance físico-financiero; actas de entrega-recepción.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (34, 'Avance programado', 'AP', 'Porcentaje', 'Reportes de avance físico-financiero; actas de entrega-recepción.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 100, 100 FROM v1
UNION ALL SELECT v2.id, 2026, 100, 100 FROM v2;

-- id=35 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (35, 'Espacios deportivos rehabilitados o modernizados', 'EDRM', 'Espacios', 'Inventarios actualizados; actas de entrega-recepción', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (35, 'Total de espacios programados', 'TEP', 'Espacios', 'Inventarios actualizados; actas de entrega-recepción', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 3, 3 FROM v1
UNION ALL SELECT v2.id, 2026, 3, 3 FROM v2;

-- id=36 A2.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (36, 'Convenios o mecanismos de coordinación vigentes', 'CMCV', 'Convenios', 'Convenios firmados, actas de colaboración, registros administrativos, informes del área', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (36, 'Convenios o mecanismos planificados', 'CMP', 'Convenios', 'Convenios firmados, actas de colaboración, registros administrativos, informes del área', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 4, 4 FROM v1
UNION ALL SELECT v2.id, 2026, 4, 4 FROM v2;

-- id=37 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (37, 'Políticas diseñadas y operativas', 'PDO', 'Políticas', 'Documentos de diseño de políticas; actas de aprobación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (37, 'Total programado', 'TP', 'Políticas', 'Documentos de diseño de políticas; actas de aprobación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 3, 3 FROM v1
UNION ALL SELECT v2.id, 2026, 3, 3 FROM v2;

-- id=38 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (38, 'Población atendida en ferias de salud', 'PAFS', 'Personas', 'Listas de asistencia; reportes de ferias de salud.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (38, 'Población objetivo', 'PB', 'Personas', 'Listas de asistencia; reportes de ferias de salud.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 12, 12 FROM v1
UNION ALL SELECT v2.id, 2026, 12, 12 FROM v2;

-- id=39 A4.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (39, 'Número de reuniones de coordinación realizadas', 'NRCR', 'Reuniones', 'Minutas, listas de asistencia, acuerdos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (39, 'Número de reuniones de coordinación programadas', 'NRCP', 'Reuniones', 'Minutas, listas de asistencia, acuerdos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 12, 12 FROM v1
UNION ALL SELECT v2.id, 2026, 12, 12 FROM v2;

-- id=40 A5.1 — anomalía T: variable renombrada a "entregados" (coincide con
-- la fórmula AFE/TP del propio indicador).
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (40, 'Apoyos funcionales entregados', 'AFE', 'Apoyos', 'Actas de entrega-recepción.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (40, 'Total programado', 'TP', 'Apoyos', 'Actas de entrega-recepción.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 120, 120 FROM v1
UNION ALL SELECT v2.id, 2026, 120, 120 FROM v2;

-- id=41 A5.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (41, 'Beneficiarios que reciben productos lácteos', 'BRPL', 'Beneficiarios', 'Listas de distribución.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (41, 'Beneficiarios programados', 'BP', 'Beneficiarios', 'Listas de distribución.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 180, 180 FROM v1
UNION ALL SELECT v2.id, 2026, 180, 180 FROM v2;

-- id=42 A5.3 — anomalía S: sin ficha propia, valores desde meta_anual_2026.
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (42, 'Despensas entregadas', 'DE', 'Despensas', 'Padrón de beneficiarios actualizado.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (42, 'Total programado', 'TP', 'Despensas', 'Padrón de beneficiarios actualizado.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 1200, 1200 FROM v1
UNION ALL SELECT v2.id, 2026, 1200, 1200 FROM v2;

-- id=43 A6.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (43, 'Reuniones y acuerdos documentados', 'RAD', 'Reuniones', 'Actas de reuniones; convenios; minutas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (43, 'Total programado', 'TP', 'Reuniones', 'Actas de reuniones; convenios; minutas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 6, 6 FROM v1
UNION ALL SELECT v2.id, 2026, 6, 6 FROM v2;

-- id=44 A6.2 — anomalía R: ficha corrupta, valores desde meta_anual_2026.
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (44, 'Programas sociales integrados', 'PSI', 'Programas', 'Reportes del sistema integrado; listas de programas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (44, 'Total de programas sociales', 'TPS', 'Programas', 'Reportes del sistema integrado; listas de programas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 6, 6 FROM v1
UNION ALL SELECT v2.id, 2026, 6, 6 FROM v2;

-- id=45 A6.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (45, 'Diagnósticos elaborados o actualizados', 'DEA', 'Diagnósticos', 'Documentos técnicos; oficios de validación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (45, 'Total programado', 'TP', 'Diagnósticos', 'Documentos técnicos; oficios de validación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 1, 1 FROM v1
UNION ALL SELECT v2.id, 2026, 1, 1 FROM v2;

-- id=46 A6.4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (46, 'Programas implementados', 'PI', 'Programas', 'Programas implementados; padrones de beneficiarios.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (46, 'Total de programas planificados', 'TPP', 'Programas', 'Programas implementados; padrones de beneficiarios.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 3, 3 FROM v1
UNION ALL SELECT v2.id, 2026, 3, 3 FROM v2;

COMMIT;
