-- ============================================================
-- SEED PILOTO 024 — contenido 2026 del módulo MML
-- Fuente principal: "6. 024 INFRAESTRUCTURA Y EQUIPAMIENTO PARA EL DESARROLLO
-- URBANO.pdf" (32 páginas). Fuente secundaria para valores de variables
-- (ver anomalía E, resuelta): el .xlsx del mismo programa (hojas F1/P1/C1/
-- C2/C1A1-C1A6/C2A1-C2A5), que sí trae la tabla de Variables con Alcanzada/
-- Meta que el PDF no incluye.
-- Script SQL revisable (NO migración) — programa_id = 6 (clave '024'), anio = 2026
-- Mismo método que 005/012/018/021: pdfjs-dist + clustering por coordenadas x/y
-- para el PDF; exceljs (instalado y desinstalado temporalmente) para el .xlsx.
--
-- Los 15 indicadores (ids 47-61) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que programas previos).
--
-- Estructura muy limpia (la más consistente vista hasta ahora): 2
-- Componentes con 6/5 Actividades = 11 total, árbol del problema mapea
-- perfecto 1:1 (2 causas primarias con 6/5 subcausas cada una) y el árbol
-- de objetivos reproduce exactamente los 15 nombres de indicador de la
-- página de resumen (PP-FM-03) y de Acciones/Alternativas — verificado
-- con self-join tras aplicar.
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  A) Diagnóstico (PP-FM-03): la columna "Situación Actual" trae 5 filas
--     numeradas (1-5) pero "Transformación Deseada" trae 6 (1-6). Por
--     contenido semántico, la fila 4 de Transformación ("Ampliación de la
--     cobertura de servicios básicos con criterios de calidad y eficiencia
--     en toda la ciudad.") no tiene una Situación pareja — las filas 4 y 5
--     de Situación ("Movilidad urbana no sustentable...", "Parquímetros
--     ineficientes...") en realidad casan mejor con las Transformación 5 y
--     6 ("Incorporar un modelo de movilidad urbana sustentable...",
--     "Modernización tecnológica de los parquímetros..."). Se sembraron 5
--     filas con el emparejamiento SEMÁNTICO (no el numérico literal) y se
--     omitió la fila huérfana de Transformación #4 (no se inventó una
--     Situación para ella). Pendiente que Hugo decida si esa fila huérfana
--     debe agregarse como diagnóstico #6 con una Situación propia.
--  B) Árbol del Problema (PP-FM-04): uno de los 5 "Efectos" queda truncado
--     a media frase — "Pérdida de imagen urbana y riesgo al" (falta el
--     final). Completado usando el texto espejo del "Fin" correspondiente
--     en el Árbol de Objetivos (misma estructura, mismo documento): "Mejor
--     imagen urbana y fortalecimiento del entorno público." → efecto
--     reconstruido como "Pérdida de imagen urbana y riesgo al entorno
--     público." (mismo método que la anomalía W del piloto 021 / G del 005).
--  C) Matriz de Indicadores (PP-FM-0E), ficha del Componente 1 (id=49,
--     "Porcentaje de obras de rehabilitación y modernización..."): el
--     campo Medios de Verificación trae una URL ajena al tema —
--     "https://www.saludtlax.gob.mx/portal/index.php/programa-operativo-
--     anual/#1675224338-1-19" (dominio de Salud de Tlaxcala, no de Obras
--     Públicas) — descartada por ser evidentemente bleed de otro
--     documento; se sembró solo "Expedientes de obra; actas de
--     entrega-recepción." (la parte coherente de la misma celda).
--  D) unidad_medida de indicador_variables corregida a la real cuando la
--     ficha usa "Porcentaje" para conteos absolutos (Obras, Calles,
--     Espacios, Mercados, Luminarias, Acciones, etc.) — mismo criterio ya
--     decidido en programas previos (D/H de 003/005), documentado por
--     transparencia.
--  E) [RESUELTA con el .xlsx, 2026-07-27] La ficha de indicador del PDF
--     (FORMATO NO. 7 / MIR, páginas 13-15) es un formato de GRÁFICA + tabla
--     Programado/Real/Línea base por mes — NO trae una tabla de "Variables"
--     con Alcanzada/Meta como las de programas anteriores (003/005/012/018/
--     021). El .xlsx del mismo programa SÍ la trae (una hoja por indicador:
--     F1, P1, C1, C2, C1A1-C1A6, C2A1-C2A5), confirmando exactamente los
--     mismos 15 nombres de indicador, fórmulas y metas anuales ya sembradas.
--     Se reemplazaron los valores por los reales del .xlsx:
--       · FIN (id=47, hoja F1): "Alcanzada 2023" (año así etiquetado en el
--         Excel; el PDF llama a este mismo valor "Línea Base 2023") CS=27280,
--         TE=60084; Meta 2026 CS=29460, TE=62018 (29460/62018=47.5%, cuadra
--         con meta_anual_2026).
--       · PROPOSITO (id=48, hoja P1): el Excel etiqueta esta columna
--         "Alcanzada 2024" (el PDF la llama "Línea Base 2023" — mismo valor,
--         año distinto entre los 2 documentos, no se intentó reconciliar)
--         SCC=TSB=9200; Meta 2026 SCC=TSB=9350.
--       · 2 Componentes y 11 Actividades (ids 49-61): el Excel deja
--         "Alcanzada 2025" en blanco para los 13 (mismo patrón que el PDF —
--         áreas/metas nuevas del ejercicio 2026, sin histórico), así que
--         valor_alcanzado sigue NULL, fiel a la fuente; valor_meta SÍ trae
--         numerador=denominador=meta_anual_2026 en 12 de los 13 (confirma el
--         patrón ya visto en el piloto 012: el Resultado del Indicador que
--         calcula el propio Excel da 100% en esos casos), salvo el
--         Componente 2 (id=50, hoja C2, fórmula de tasa de crecimiento
--         ((EA-EAB)/EAB)×100): Equipamiento actual Meta=2, año base Meta=1
--         (values distintos, único caso donde numerador≠denominador).
--     Ningún valor fue inventado: donde el Excel deja la celda vacía
--     (Alcanzada de los 13 Componentes/Actividades), se sembró NULL.
--  F) "Línea Base" con año+valor solo aparece explícita en la ficha para
--     FIN (id=47: 45.4, año 2023) y PROPOSITO (id=48: 9,200.0, año 2023);
--     para los 2 Componentes y las 11 Actividades el recuadro de Línea
--     Base aparece vacío en las 32 páginas (consistente con ser metas de
--     obra/equipamiento nuevas del ejercicio 2026, sin histórico previo,
--     mismo patrón que Componentes/Actividades del piloto 021). Se
--     sembró linea_base/linea_base_anio solo en 47 y 48; el resto queda
--     NULL, fiel a la fuente.
--  G) "Interpretación" NO es un campo que traiga esta ficha (a diferencia
--     de programas previos donde sí existía, aunque a veces contaminado).
--     Se redactó una interpretación breve por indicador a partir de su
--     propio objetivo + método de cálculo (síntesis editorial de SIMA,
--     no un dato de la fuente) — documentado por transparencia.
--  H) Análisis de Involucrados (PP-FM-05): grilla de 4 categorías con
--     texto disperso en columnas x/y que se solapan parcialmente (mismo
--     reto que 005/012). Reconstrucción de mejor esfuerzo por clustering
--     de coordenadas; confianza alta en Ejecutores/Beneficiarios, media en
--     Opositores/Indiferentes por la superposición de columnas.
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
-- Ver anomalía A: emparejamiento semántico, fila huérfana de Transformación
-- #4 omitida (no inventada).
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(6, 2026, 1,
  'Infraestructura urbana deteriorada y servicios públicos con baja cobertura, calidad y eficiencia.',
  'Contar con infraestructura urbana moderna, eficiente y servicios públicos de calidad que respondan a las necesidades de la población.'),
(6, 2026, 2,
  'Vías públicas en mal estado y espacios públicos deteriorados.',
  'Rehabilitación de vialidades y modernización de espacios públicos para mejorar la movilidad y el entorno urbano.'),
(6, 2026, 3,
  'Infraestructura obsoleta para el manejo de residuos sólidos.',
  'Implementación de un sistema moderno de gestión integral de residuos sólidos con equipamiento actualizado.'),
(6, 2026, 4,
  'Movilidad urbana no sustentable y rezago en planeación urbana.',
  'Incorporar un modelo de movilidad urbana sustentable con ordenamiento territorial actualizado y normativas modernas.'),
(6, 2026, 5,
  'Parquímetros ineficientes y falta de tecnología aplicada a la gestión de servicios.',
  'Modernización tecnológica de los parquímetros y digitalización de la gestión de servicios públicos.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (6, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Infraestructura urbana deteriorada y servicios públicos con baja cobertura, calidad y eficiencia en el municipio de Apizaco.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Insatisfacción ciudadana con los servicios municipales'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Reducción en la movilidad y conectividad urbana'),
    (2, 'Riesgos a la salud y al medio ambiente por mala gestión de residuos de la ciudadanía'),
    (3, 'Mala organización al desarrollo económico y comercial local'),
    (4, 'Baja recaudación de ingresos de servicios'),
    -- anomalía B: completado con el texto espejo del Fin correspondiente.
    (5, 'Pérdida de imagen urbana y riesgo al entorno público.')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Infraestructura deficiente'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Falta de mantenimiento y deterioro de la imagen urbana municipal'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Vías públicas en mal estado'),
    (2, 'Rastro municipal obsoleto'),
    (3, 'Áreas deportivas obsoletas o insuficientes'),
    (4, 'Poca infraestructura para la difusión de temas culturales'),
    (5, 'Mercados o centros de abasto en mal estado u obsoletos'),
    (6, 'Falta de coordinación operativa entre áreas ejecutoras')
  ) AS v(orden, texto) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 6, 2026, 'PROBLEMA', 'CAUSA', causa2.id, v.orden, v.texto
FROM causa2, (VALUES
  (1, 'Espacios públicos deteriorados'),
  (2, 'Falta de insumos para alumbrado público'),
  (3, 'Infraestructura urbana envejecida y con mantenimiento limitado'),
  (4, 'Débil coordinación interinstitucional entre áreas responsables de obras, servicios, movilidad e imagen urbana'),
  (5, 'Calles, banquetas en condiciones físicas deficientes.')
) AS v(orden, texto);

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (6, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Garantizar la cobertura, eficiencia y modernización de la infraestructura y servicios públicos municipales mediante la planeación urbana integral, la inversión en equipamiento y el fortalecimiento de la gestión de residuos, alumbrado y vialidades.',
    48,
    'Las áreas operativas mantienen registros confiables y los servicios no se interrumpen por causas externas mayores (clima extremo, fallas regionales).',
    'Informes anuales de Imagen Urbana, Obras Públicas y Servicios Municipales.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 6, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Satisfacción ciudadana con servicios públicos eficientes.',
    47,
    'La ciudadanía responde de forma representativa; el municipio cuenta con recursos para aplicar encuestas.',
    'Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 6, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Incremento en la movilidad y conectividad urbana.'),
    (2, 'Disminución de riesgos a la salud y al medio ambiente.'),
    (3, 'Impulso al desarrollo económico y comercial'),
    (4, 'Incremento de la recaudación municipal por servicios públicos.'),
    (5, 'Mejor imagen urbana y fortalecimiento del entorno público.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 6, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Mejora de la infraestructura urbana', 49,
    'El presupuesto de obra se ejerce en tiempo; las obras no se retrasan por conflictos sociales o falta de insumos.',
    -- anomalía C: URL ajena (Salud Tlaxcala) descartada de la fuente.
    'Expedientes de obra; actas de entrega-recepción.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 6, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Fortalecimiento de la imagen urbana municipal', 50,
    'Los procesos de licitación se realizan en tiempo; no existen recortes presupuestales.',
    'Inventarios de Servicios Públicos y Obras Públicas; reportes de adquisiciones.'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 6, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Rehabilitación y modernización de vías públicas.', 51,
       'El presupuesto se libera en tiempo y no hay conflictos sociales o climáticos que retrasen las obras.',
       'Expedientes de obra, reportes de supervisión, actas de entrega-recepción.'),
    (2, 'Modernización del rastro municipal para mejorar condiciones sanitarias.', 52,
       'Se mantiene el financiamiento; se cumplen normas sanitarias.',
       'Reportes de avance físico-financiero; actas de entrega-recepción.'),
    (3, 'Modernización de áreas deportivas', 53,
       'Los espacios deportivos se mantienen disponibles y la comunidad los usa.',
       'Inventarios actualizados; actas de entrega-recepción'),
    (4, 'Infraestructura cultural construida y habilitada.', 54,
       'Los espacios se destinan efectivamente a actividades culturales.',
       'Reportes de obras; inventario de espacios culturales.'),
    (5, 'Mercados o centros de abasto rehabilitados', 55,
       'Disponibilidad oportuna de recursos presupuestales; condiciones técnicas y estructurales adecuadas para la rehabilitación; coordinación entre las áreas responsables (Obras Públicas, Desarrollo Económico, Mercados); aceptación y colaboración de los comerciantes.',
       'Programas y proyectos de obra pública; expedientes técnicos de rehabilitación; actas de entrega–recepción de obra; reportes fotográficos antes y después; informes trimestrales y anuales de obra pública.'),
    (6, 'Coordinación operativa interinstitucional fortalecida para la ejecución de infraestructura municipal', 56,
       'Voluntad institucional de coordinación; definición clara de responsabilidades; comunicación permanente entre áreas.',
       'Minutas de reuniones interinstitucionales; programas y cronogramas conjuntos; informes de avance; acuerdos internos.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 6, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
FROM medio2, (VALUES
  (1, 'Rescate y mantenimiento de espacios públicos.', 57,
     'La comunidad hace uso adecuado de los espacios y se garantiza el mantenimiento posterior',
     'Actas de entrega, reportes de Obras Públicas, evidencias fotográficas.'),
  (2, 'Dotación de insumos para alumbrado público', 58,
     'Se garantiza disponibilidad de insumos y continuidad en los contratos de suministro.',
     'Inventario de luminarias, reportes de la Dirección de Alumbrado Público.'),
  (3, 'Infraestructura urbana rehabilitada y con mantenimiento programado.', 59,
     'Disponibilidad de personal operativo y equipo; condiciones climáticas favorables; abasto oportuno de combustible y herramientas; coordinación entre áreas responsables.',
     'Programa anual de mantenimiento de áreas verdes; bitácoras de trabajo del área de Servicios Municipales; reportes de campo; evidencia fotográfica antes y después; reportes de uso de maquinaria y camiones.'),
  (4, 'Coordinación interinstitucional efectiva entre Obras Públicas, Servicios Municipales, Movilidad e Imagen Urbana', 60,
     'Voluntad y compromiso de las áreas involucradas; claridad en responsabilidades institucionales; comunicación efectiva entre dependencias; estabilidad administrativa durante el ejercicio fiscal.',
     'Minutas de reuniones interinstitucionales; convenios o acuerdos internos; programas y cronogramas conjuntos; informes de avance interáreas; reportes del Comité de Planeación Municipal.'),
  (5, 'Calles, banquetas en condiciones físicas óptimas.', 61,
     'Disponibilidad de recursos presupuestales y materiales; condiciones climáticas favorables para ejecución de obra; coordinación interinstitucional entre Obras Públicas, Servicios Municipales y Movilidad; no ocurrencia de daños extraordinarios por desastres naturales o siniestros.',
     'Inventario municipal de vialidades y banquetas; dictámenes técnicos de obra pública; reportes de supervisión y mantenimiento; cédulas de evaluación de infraestructura urbana; evidencia fotográfica y georreferenciada; informes trimestrales y anuales de obra pública.')
) AS v(orden, texto, indicador_id, supuestos, medios_verificacion);

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
-- Ver anomalía H: grilla reconstruida por clustering de coordenadas.
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (6, 2026, 'BENEFICIARIO', 'Ciudadanía en general', 1),
  (6, 2026, 'BENEFICIARIO', 'Comunidades marginadas y rurales', 2),
  (6, 2026, 'BENEFICIARIO', 'Niñas, niños y jóvenes', 3),
  (6, 2026, 'BENEFICIARIO', 'Comerciantes y empresarios locales', 4),
  (6, 2026, 'BENEFICIARIO', 'Adultos mayores y personas con discapacidad', 5),
  (6, 2026, 'EJECUTOR', 'Dirección de Obras Públicas', 1),
  (6, 2026, 'EJECUTOR', 'Dirección de Imagen Urbana', 2),
  (6, 2026, 'EJECUTOR', 'Comisión de Agua Potable y Alcantarillado de Apizaco', 3),
  (6, 2026, 'EJECUTOR', 'Dependencias estatales y federales vinculadas', 4),
  (6, 2026, 'OPOSITOR', 'Grupos vecinales inconformes', 1),
  (6, 2026, 'OPOSITOR', 'Actores políticos opositores', 2),
  (6, 2026, 'OPOSITOR', 'Comerciantes afectados temporalmente', 3),
  (6, 2026, 'OPOSITOR', 'Organizaciones ambientalistas', 4),
  (6, 2026, 'INDIFERENTE', 'Sector académico local', 1),
  (6, 2026, 'INDIFERENTE', 'Instituciones privadas de servicios urbanos', 2),
  (6, 2026, 'INDIFERENTE', 'Ciudadanos de colonias con buena infraestructura', 3),
  (6, 2026, 'INDIFERENTE', 'Medios de comunicación', 4);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo: Estratégico (Fin/Propósito) / Gestión (Componentes/Actividades), sin
-- inconsistencias en la fuente (a diferencia de la anomalía Z de 021).
-- Dimensión/Sentido/Frecuencia/Fórmula/Medios/Supuestos: de la Matriz de
-- Indicadores (PP-FM-0E), tabla limpia, ver anomalía C para el único ajuste.
-- Línea base: ver anomalía F (solo Fin/Propósito la traen).
-- Interpretación: ver anomalía G (sintetizada, la ficha no trae ese campo).
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).',
  linea_base=45.4, linea_base_anio=2023,
  interpretacion='Mide el nivel de satisfacción ciudadana con los servicios públicos municipales, reflejando la percepción social sobre la calidad y eficiencia de la infraestructura urbana.'
WHERE id=47;

UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Informes anuales de Imagen Urbana, Obras Públicas y Servicios Municipales.',
  linea_base=9200.0, linea_base_anio=2023,
  interpretacion='Evalúa la cobertura y continuidad efectiva de los servicios públicos municipales (alumbrado, vialidades, espacios públicos), como resultado directo de la modernización de la infraestructura urbana.'
WHERE id=48;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Expedientes de obra; actas de entrega-recepción.',
  interpretacion='Mide el avance físico de las obras de rehabilitación y modernización de infraestructura urbana concluidas respecto a lo programado en el ejercicio.'
WHERE id=49;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios de Servicios Públicos y Obras Públicas; reportes de adquisiciones.',
  interpretacion='Evalúa el incremento del equipamiento operativo municipal (vehículos, maquinaria, luminarias) respecto al inventario del año base, reflejando la capacidad instalada para operar los servicios.'
WHERE id=50;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Expedientes de obra, reportes de supervisión, actas de entrega-recepción.',
  interpretacion='Mide el avance en la rehabilitación y modernización de vías públicas respecto a lo programado, como componente central de la mejora de la infraestructura urbana.'
WHERE id=51;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de avance físico-financiero; actas de entrega-recepción.',
  interpretacion='Evalúa el avance físico-financiero de la modernización del rastro municipal, orientado a mejorar sus condiciones sanitarias.'
WHERE id=52;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios actualizados; actas de entrega-recepción',
  interpretacion='Mide el avance en la rehabilitación o modernización de áreas deportivas municipales.'
WHERE id=53;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de obras; inventario de espacios culturales.',
  interpretacion='Evalúa el avance en la construcción o rehabilitación de espacios culturales programados en el POA.'
WHERE id=54;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programas y proyectos de obra pública; expedientes técnicos de rehabilitación; actas de entrega–recepción de obra; reportes fotográficos antes y después; informes trimestrales y anuales de obra pública.',
  interpretacion='Mide el avance en la rehabilitación de mercados o centros de abasto municipales.'
WHERE id=55;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Minutas de reuniones interinstitucionales; programas y cronogramas conjuntos; informes de avance; acuerdos internos.',
  interpretacion='Evalúa la proporción de acciones de infraestructura ejecutadas con participación coordinada de dos o más áreas municipales.'
WHERE id=56;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de entrega, reportes de Obras Públicas, evidencias fotográficas.',
  interpretacion='Mide la proporción de espacios públicos rescatados y formalizados con acta de entrega, como parte del fortalecimiento de la imagen urbana.'
WHERE id=57;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario de luminarias, reportes de la Dirección de Alumbrado Público.',
  interpretacion='Evalúa la renovación de luminarias respecto al inventario total, reflejando el avance en la modernización del alumbrado público.'
WHERE id=58;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Programa anual de mantenimiento de áreas verdes; bitácoras de trabajo del área de Servicios Municipales; reportes de campo; evidencia fotográfica antes y después; reportes de uso de maquinaria y camiones.',
  interpretacion='Mide el cumplimiento de las acciones de mantenimiento integral de áreas verdes y espacios públicos conforme al programa anual.'
WHERE id=59;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Minutas de reuniones interinstitucionales; convenios o acuerdos internos; programas y cronogramas conjuntos; informes de avance interáreas; reportes del Comité de Planeación Municipal.',
  interpretacion='Evalúa la proporción de acciones de imagen urbana ejecutadas con coordinación interinstitucional efectiva entre las áreas responsables.'
WHERE id=60;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario municipal de vialidades y banquetas; dictámenes técnicos de obra pública; reportes de supervisión y mantenimiento; cédulas de evaluación de infraestructura urbana; evidencia fotográfica y georreferenciada; informes trimestrales y anuales de obra pública.',
  interpretacion='Mide el avance en la rehabilitación de calles y banquetas municipales hasta alcanzar condiciones físicas óptimas.'
WHERE id=61;

-- ---------- 6. indicador_variables + valores reales del .xlsx (ver anomalía E) ----------
-- unidad_medida corregida a la real (ver anomalía D). valor_alcanzado y
-- valor_meta vienen del .xlsx (hojas F1/P1/C1/C2/C1A1-C1A6/C2A1-C2A5);
-- donde el Excel deja la celda vacía se siembra NULL::numeric, fiel a la
-- fuente (ver anomalía E para el detalle completo por indicador).

-- id=47 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (47, 'Ciudadanos satisfechos', 'CS', 'Ciudadanos', 'Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (47, 'Total de encuestados', 'TE', 'Ciudadanos', 'Encuestas municipales de percepción; informes de INEGI (ENCIG, ENSU).', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "F1"), Alcanzada 2023 / Meta 2026.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 27280, 29460 FROM v1
UNION ALL SELECT v2.id, 2026, 60084, 62018 FROM v2;

-- id=48 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (48, 'Servicios con cobertura continua', 'SCC', 'Servicios', 'Informes anuales de Imagen Urbana, Obras Públicas y Servicios Municipales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (48, 'Total de servicios básicos', 'TSB', 'Servicios', 'Informes anuales de Imagen Urbana, Obras Públicas y Servicios Municipales.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "P1"), Alcanzada 2024 / Meta 2026.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 9200, 9350 FROM v1
UNION ALL SELECT v2.id, 2026, 9200, 9350 FROM v2;

-- id=49 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (49, 'Obras concluidas', 'OC', 'Obras', 'Expedientes de obra; actas de entrega-recepción.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (49, 'Obras programadas', 'OP', 'Obras', 'Expedientes de obra; actas de entrega-recepción.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1"): Alcanzada 2025 en blanco en la fuente, Meta 2026=35.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 35 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 35 FROM v2;

-- id=50 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (50, 'Equipamiento actual', 'EA', 'Unidades', 'Inventarios de Servicios Públicos y Obras Públicas; reportes de adquisiciones.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (50, 'Equipamiento año base', 'EAB', 'Unidades', 'Inventarios de Servicios Públicos y Obras Públicas; reportes de adquisiciones.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C2"): Equipamiento actual Meta=2, año base Meta=1
-- (única ficha donde numerador≠denominador, consistente con la fórmula de tasa
-- de crecimiento ((EA-EAB)/EAB)×100 = 100%). Alcanzada 2025 en blanco en la fuente.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1 FROM v2;

-- id=51 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (51, 'Calles rehabilitadas', 'CR', 'Calles', 'Expedientes de obra, reportes de supervisión, actas de entrega-recepción.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (51, 'Total de calles programadas', 'TCP', 'Calles', 'Expedientes de obra, reportes de supervisión, actas de entrega-recepción.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1A1"): Alcanzada 2025 en blanco, Meta 2026=15.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 15 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 15 FROM v2;

-- id=52 A1.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (52, 'Avance físico-financiero alcanzado', 'AFA', 'Porcentaje', 'Reportes de avance físico-financiero; actas de entrega-recepción.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (52, 'Avance programado', 'AP', 'Porcentaje', 'Reportes de avance físico-financiero; actas de entrega-recepción.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1A2"): Alcanzada 2025 en blanco, Meta 2026=100.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=53 A1.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (53, 'Espacios deportivos rehabilitados o modernizados', 'EDR', 'Espacios', 'Inventarios actualizados; actas de entrega-recepción', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (53, 'Total de espacios programados', 'TEP', 'Espacios', 'Inventarios actualizados; actas de entrega-recepción', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1A3"): Alcanzada 2025 en blanco, Meta 2026=3.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 3 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 3 FROM v2;

-- id=54 A1.4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (54, 'Espacios culturales concluidos', 'ECC', 'Espacios', 'Reportes de obras; inventario de espacios culturales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (54, 'Total programado en el POA', 'TPP', 'Espacios', 'Reportes de obras; inventario de espacios culturales.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1A4"): Alcanzada 2025 en blanco, Meta 2026=2.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=55 A1.5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (55, 'Mercados o centros de abasto rehabilitados', 'MCAR', 'Mercados', 'Programas y proyectos de obra pública; expedientes técnicos de rehabilitación; actas de entrega–recepción de obra; reportes fotográficos antes y después; informes trimestrales y anuales de obra pública.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (55, 'Mercados o centros de abasto programados para rehabilitación', 'MCAP', 'Mercados', 'Programas y proyectos de obra pública; expedientes técnicos de rehabilitación; actas de entrega–recepción de obra; reportes fotográficos antes y después; informes trimestrales y anuales de obra pública.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1A5"): Alcanzada 2025 en blanco, Meta 2026=1.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1 FROM v2;

-- id=56 A1.6
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (56, 'Acciones ejecutadas con participación de dos o más áreas', 'AECI', 'Acciones', 'Minutas de reuniones interinstitucionales; programas y cronogramas conjuntos; informes de avance; acuerdos internos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (56, 'Total de acciones de infraestructura programadas', 'TAIP', 'Acciones', 'Minutas de reuniones interinstitucionales; programas y cronogramas conjuntos; informes de avance; acuerdos internos.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C1A6"): Alcanzada 2025 en blanco, Meta 2026=100.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=57 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (57, 'Espacios públicos recuperados con acta', 'EPRA', 'Espacios', 'Actas de entrega, reportes de Obras Públicas, evidencias fotográficas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (57, 'Total programado', 'TP', 'Espacios', 'Actas de entrega, reportes de Obras Públicas, evidencias fotográficas.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C2A1"): Alcanzada 2025 en blanco, Meta 2026=48.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 48 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 48 FROM v2;

-- id=58 A2.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (58, 'Luminarias renovadas', 'LR', 'Luminarias', 'Inventario de luminarias, reportes de la Dirección de Alumbrado Público.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (58, 'Total de luminarias en inventario', 'TLI', 'Luminarias', 'Inventario de luminarias, reportes de la Dirección de Alumbrado Público.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C2A2"): Alcanzada 2025 en blanco, Meta 2026=3192.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 3192 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 3192 FROM v2;

-- id=59 A2.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (59, 'Acciones de mantenimiento integral ejecutadas', 'AMIE', 'Acciones', 'Programa anual de mantenimiento de áreas verdes; bitácoras de trabajo del área de Servicios Municipales; reportes de campo; evidencia fotográfica antes y después; reportes de uso de maquinaria y camiones.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (59, 'Total de acciones de mantenimiento programadas', 'TAMP', 'Acciones', 'Programa anual de mantenimiento de áreas verdes; bitácoras de trabajo del área de Servicios Municipales; reportes de campo; evidencia fotográfica antes y después; reportes de uso de maquinaria y camiones.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C2A3"): Alcanzada 2025 en blanco, Meta 2026=12.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 12 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 12 FROM v2;

-- id=60 A2.4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (60, 'Acciones ejecutadas de manera coordinada', 'AEC', 'Acciones', 'Minutas de reuniones interinstitucionales; convenios o acuerdos internos; programas y cronogramas conjuntos; informes de avance interáreas; reportes del Comité de Planeación Municipal.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (60, 'Total de acciones programadas de imagen urbana', 'TAPIU', 'Acciones', 'Minutas de reuniones interinstitucionales; convenios o acuerdos internos; programas y cronogramas conjuntos; informes de avance interáreas; reportes del Comité de Planeación Municipal.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C2A4"): Alcanzada 2025 en blanco, Meta 2026=8.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 8 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 8 FROM v2;

-- id=61 A2.5
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (61, 'Calles y banquetas rehabilitadas', 'CBR', 'Tramos', 'Inventario municipal de vialidades y banquetas; dictámenes técnicos de obra pública; reportes de supervisión y mantenimiento; cédulas de evaluación de infraestructura urbana; evidencia fotográfica y georreferenciada; informes trimestrales y anuales de obra pública.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (61, 'Total de calles y banquetas programadas', 'TCBP', 'Tramos', 'Inventario municipal de vialidades y banquetas; dictámenes técnicos de obra pública; reportes de supervisión y mantenimiento; cédulas de evaluación de infraestructura urbana; evidencia fotográfica y georreferenciada; informes trimestrales y anuales de obra pública.', 2) RETURNING id
)
-- Valores reales del .xlsx (hoja "C2A5"): Alcanzada 2025 en blanco, Meta 2026=15.
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 15 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 15 FROM v2;

COMMIT;
