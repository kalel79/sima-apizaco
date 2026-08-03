-- ============================================================
-- SEED PILOTO 032 — contenido 2026 del módulo MML
-- Fuente: "7. 032 PROTECCIÒN AL AMBIENTE.pdf" (36 páginas). A diferencia del
-- piloto 024, este PDF SÍ trae fichas individuales de indicador ("FICHA DE
-- INDICADOR DE RESULTADOS", páginas 18-36) con tabla de Variables
-- Alcanzada/Meta para los 18 indicadores — no fue necesario consultar el
-- .xlsx.
-- Script SQL revisable (NO migración) — programa_id = 7 (clave '032'), anio = 2026
-- Método: pdfjs-dist (instalado y desinstalado temporalmente) + clustering
-- por coordenadas x/y para reconstruir Árbol del Problema/Objetivos e
-- Involucrados (el PDF mezcla columnas en la extracción lineal).
--
-- Los 18 indicadores (ids 114-131) y sus metas mensuales YA EXISTÍAN en
-- producción (backfill previo) — este script enriquece: tipo/dimensión/
-- sentido/medios_verificacion/línea_base/interpretación + variables.
-- presupuesto_programa: fuera de alcance (mismo criterio que programas previos).
--
-- Estructura: 4 Componentes con 3/3/2/4 Actividades = 12 total. Árbol de
-- Objetivos mapea exacto 1:1 con los 18 indicadores (verificado con
-- self-join). Árbol del Problema: ver anomalía F (corregida a pedido de
-- Hugo 2026-07-27, ya cuadra 1:1 con 12 subcausas).
--
-- ANOMALÍAS EN LA FUENTE (documentadas, no corregidas silenciosamente):
--  A) Diagnóstico (PP-FM-03): a diferencia de programas previos, esta hoja
--     NO trae numeración — es un párrafo corrido de "Situación Actual" y
--     otro de "Transformación Deseada" sin marcadores de fila. Se
--     reconstruyeron 5 pares agrupando semánticamente las oraciones sueltas
--     de cada columna (cobertura/reforestación; energía; cultura/
--     participación; coordinación institucional; consecuencias/impacto
--     esperado). Pendiente que Hugo confirme el agrupamiento.
--  B) Contaminación cruzada con el programa 024 (Obras Públicas) en varios
--     campos FUERA de nuestro esquema (no se sembraron): página 1 (Ficha de
--     Proyecto) trae "Unidad Responsable: Dirección de Cultura y Deporte";
--     la ficha de la Actividad 4.1 (id=128) trae "Nombre: Porcentaje de
--     espacios deportivos rehabilitados o modernizados" y "Resultado
--     Esperado en el Proyecto: Mejorar la cobertura, calidad y eficiencia de
--     la infraestructura urbana" (texto literal del piloto 024); la ficha
--     del Componente 4 (id=119) trae "Clave programática: 2 2 1 16 024 006"
--     en vez de la clave real del programa. Ninguno de estos 3 campos existe
--     en nuestro esquema de indicadores/nodos, así que no hay impacto en los
--     datos sembrados — se documenta por transparencia. El campo "Nombre"
--     real usado para el indicador 128 es el que ya existía en la BD
--     (correcto), no el bleed.
--  C) "Entidad: #¡REF!" — error de fórmula de Excel visible en casi todas
--     las páginas del cuerpo del documento (2-17). Informativo, campo fuera
--     de nuestro esquema.
--  D) Fichas de las Actividades 4.1-4.4 (páginas 32-35): el campo "Fuente de
--     Información" de la ficha individual en realidad repite el texto del
--     Supuesto (ej. "Se mantiene operativa la infraestructura y se asegura
--     financiamiento para mantenimiento."), no un medio de verificación. Se
--     usó el medio de verificación real de la Matriz de Indicadores
--     (PP-FM-0E, páginas 11-12) para estas 4 actividades en vez del de la
--     ficha individual.
--  E) unidad_medida de indicador_variables corregida de "Porcentaje" (la
--     ficha lo usa para TODAS las variables, incluyendo conteos absolutos)
--     a la unidad real inferida del nombre de cada variable — mismo
--     criterio ya decidido en programas previos. Para las variables de
--     "superficie" (FIN, Actividad 1.1, Actividad 1.3) se asumió
--     Metros²/Hectáreas por el contexto semántico, no porque la fuente lo
--     especifique; para el Componente 3 se usó "Ciudadanos" tal como nombra
--     la propia variable, aunque la magnitud (24 al año) sugiere que en
--     realidad cuenta campañas/eventos, no personas — no se corrigió esa
--     posible imprecisión de nombre, pendiente que Hugo lo revise.
--  F) [RESUELTA 2026-07-27] Árbol del Problema (PP-FM-04) traía MENOS
--     subcausas que el Árbol de Objetivos tiene actividades: Causa 1
--     ("Deficiencias en áreas verdes") y Causa 2 ("Energía no sustentable")
--     solo traían 2 subcausas cada una en el PDF (total árbol del problema:
--     2+2+2+4=10 nodos), mientras sus Medios espejo (Componente 1 y 2) sí
--     tienen 3 Actividades cada uno en el Árbol de Objetivos (total: 12).
--     Hugo confirmó que el Árbol de Objetivos es el correcto y pidió
--     completar las 2 subcausas faltantes en el Árbol del Problema. Se
--     agregó una 3ª subcausa a Causa 1 y a Causa 2, espejo (en clave de
--     problema) de la 3ª Actividad de su Medio correspondiente:
--       · Causa 1, sub 3: "Falta de mantenimiento preventivo y correctivo
--         en las áreas verdes públicas" — espejo de la Actividad 1.3 "Dar
--         mantenimiento preventivo y correctivo a áreas verdes públicas."
--       · Causa 2, sub 3: "Falta de proyectos piloto de eficiencia
--         energética y ahorro de recursos" — espejo de la Actividad 2.3
--         "Generar proyectos piloto de eficiencia energética y ahorro de
--         recursos."
--     Árbol del Problema ahora: Causa1=3, Causa2=3, Causa3=2, Causa4=4 =
--     12 subcausas, cuadra 1:1 con las 12 Actividades del Árbol de
--     Objetivos.
--  G) FIN (id=114): los valores de variables de la ficha ("Superficie actual
--     de áreas verdes" Alcanzada=0/Meta=18; "Superficie año base"
--     Alcanzada=46/Meta=46.25) no reconcilian aritméticamente con el
--     "Resultado del Indicador" que la misma ficha muestra (0.00%/38.92%)
--     aplicando la fórmula declarada ((SAAV-SAB)/SAB)×100. Se sembraron los
--     valores tal cual la ficha, sin forzar el cuadre (mismo criterio que la
--     anomalía AB del piloto 021).
--  H) Análisis de Involucrados (PP-FM-05): layout en cruz (Indiferentes
--     arriba, Ejecutores izquierda, Beneficiarios derecha, Opositores
--     abajo), reconstruido por clustering de coordenadas x/y. Confianza alta
--     en Opositores/Indiferentes; confianza media en "Organizaciones civiles
--     y ambientales" (asignada a Beneficiarios por columna x, pese a que su
--     altura y coincide más con la fila de Opositores) y en "Dirección de
--     Obras Públicas"/"CAPAMA" (asignadas a Ejecutores por columna x).
--  I) Tipo de indicador: el PDF marca "Estratégico" con bleed inconsistente
--     en algunos Componentes (C2 y C4 aparecen como "Estratégico" en el
--     gráfico de la ficha resumen, páginas 14-15, contradiciendo su propio
--     nivel MIR de Componente) — se aplicó la convención estándar ya usada
--     en pilotos previos (Fin/Propósito=Estratégico, Componentes/
--     Actividades=Gestión), mismo criterio que la anomalía Z del piloto 021.
-- ============================================================

BEGIN;

-- ---------- 1. diagnostico_programa (PP-FM-03) ----------
-- Ver anomalía A: párrafo corrido sin numeración, reconstruido en 5 pares
-- semánticos.
INSERT INTO public.diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES
(7, 2026, 1,
  'Cobertura insuficiente y deterioro de áreas verdes. Escasa reforestación y mantenimiento.',
  'Incrementar en un 10% la cobertura de áreas verdes urbanas en 3 años. Programas permanentes de reforestación y mantenimiento.'),
(7, 2026, 2,
  'Alto consumo energético de fuentes no renovables. Falta de infraestructura para energías limpias.',
  'Transición a energías limpias en al menos un 10% de instalaciones municipales. Implementación de proyectos de eficiencia energética.'),
(7, 2026, 3,
  'Cultura ambiental limitada en la población. Bajo nivel de participación comunitaria.',
  'Campañas de concientización ambiental en escuelas, empresas y colonias. Programas de reciclaje y uso responsable del agua y energía.'),
(7, 2026, 4,
  'Gestión ambiental fragmentada y débil coordinación interinstitucional.',
  'Consolidación de la coordinación entre dependencias. Creación de un sistema de monitoreo ecológico para evaluar avances.'),
(7, 2026, 5,
  'Consecuencias: baja calidad de vida, contaminación, vulnerabilidad al cambio climático, pérdida de atractivo urbano.',
  'Impacto esperado: municipio verde, resiliente y sustentable, con equilibrio ambiental y bienestar social.');

-- ---------- 2. arbol_nodos — Árbol del Problema (PP-FM-04) ----------
-- Ver anomalía F: Causa 1 y Causa 2 con su 3ª subcausa completada (espejo
-- de la Actividad 3 de su Medio correspondiente), a pedido de Hugo.
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  VALUES (7, 2026, 'PROBLEMA', 'CENTRAL', NULL, 0,
    'Deterioro ambiental y baja sostenibilidad ecológica, que impactan además en el cambio climático, en el municipio de Apizaco.')
  RETURNING id
),
efecto_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'EFECTO', central.id, 0,
    'Reducción de la calidad de vida por disminución de áreas verdes'
  FROM central RETURNING id
),
efectos AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'EFECTO', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Incremento de la contaminación atmosférica y de suelos.'),
    (2, 'Desperdicio energético y aumento de costos.'),
    (3, 'Menor atractivo urbano y pérdida de biodiversidad local.'),
    (4, 'Mayor vulnerabilidad ante el cambio climático.')
  ) AS v(orden, texto) RETURNING id
),
causa1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', central.id, 1, 'Deficiencias en áreas verdes'
  FROM central RETURNING id
),
causa2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', central.id, 2, 'Energía no sustentable'
  FROM central RETURNING id
),
causa3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', central.id, 3, 'Gestión ambiental limitada'
  FROM central RETURNING id
),
causa4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', central.id, 4, 'Servicios insuficientes'
  FROM central RETURNING id
),
sub1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', causa1.id, v.orden, v.texto
  FROM causa1, (VALUES
    (1, 'Insuficiente cobertura arbórea y mantenimiento de áreas verdes'),
    (2, 'Escasa reforestación en zonas urbanas y comunitarias'),
    -- anomalía F: espejo de la Actividad 1.3 (completado a pedido de Hugo).
    (3, 'Falta de mantenimiento preventivo y correctivo en las áreas verdes públicas')
  ) AS v(orden, texto) RETURNING id
),
sub2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', causa2.id, v.orden, v.texto
  FROM causa2, (VALUES
    (1, 'Alto consumo energético de fuentes no renovables'),
    (2, 'Falta de infraestructura para energías limpias'),
    -- anomalía F: espejo de la Actividad 2.3 (completado a pedido de Hugo).
    (3, 'Falta de proyectos piloto de eficiencia energética y ahorro de recursos')
  ) AS v(orden, texto) RETURNING id
),
sub3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'PROBLEMA', 'CAUSA', causa3.id, v.orden, v.texto
  FROM causa3, (VALUES
    (1, 'Falta de cultura ecológica en la población'),
    (2, 'Escasa coordinación interinstitucional para proyectos ambientales')
  ) AS v(orden, texto) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
SELECT 7, 2026, 'PROBLEMA', 'CAUSA', causa4.id, v.orden, v.texto
FROM causa4, (VALUES
  (1, 'Baja eficiencia en la recolección de residuos'),
  (2, 'Infraestructura obsoleta para residuos sólidos'),
  (3, 'Falta de insumos para alumbrado publico'),
  (4, 'Escasez de material para realizar los bacheos')
) AS v(orden, texto);

-- ---------- 3. arbol_nodos — Árbol de Objetivos (PP-FM-07), con MIR ----------
WITH central AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  VALUES (7, 2026, 'OBJETIVOS', 'OBJETIVO', NULL, 0,
    'Fortalecer la gestión ambiental del municipio mediante programas de reforestación, transición energética, educación ecológica y modernización administrativa, promoviendo una cultura sustentable e innovadora.',
    115,
    'Se asigna presupuesto suficiente y las áreas operativas coordinan esfuerzos.',
    'Informes de programas; POA; reportes de ejecución de la Dirección de Ecología.')
  RETURNING id
),
fin_top AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'FIN', central.id, 0,
    'Consolidar un municipio sustentable y resiliente, con equilibrio ecológico, reducción de la contaminación y uso eficiente de los recursos naturales, que garantice mejor calidad de vida y menor vulnerabilidad al cambio climático.',
    114,
    'Las áreas reforestadas se mantienen; no ocurren fenómenos climáticos extremos que reduzcan cobertura.',
    'Informes de la Dirección de Ecología; imágenes satelitales; actas de reforestación.'
  FROM central RETURNING id
),
fines AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto)
  SELECT 7, 2026, 'OBJETIVOS', 'FIN', central.id, v.orden, v.texto
  FROM central, (VALUES
    (1, 'Incremento de áreas verdes y biodiversidad local.'),
    (2, 'Reducción de la contaminación atmosférica y de suelos.'),
    (3, 'Mayor resiliencia frente al cambio climático.'),
    (4, 'Mejora en la imagen urbana y atractivo del municipio.')
  ) AS v(orden, texto) RETURNING id
),
medio1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', central.id, 1,
    'Fortalecimiento de áreas verdes y reforestación urbana', 116,
    'Las brigadas reciben apoyo comunitario y el clima permite la supervivencia de los árboles.',
    'Reportes de brigadas de reforestación; monitoreo fotográfico.'
  FROM central RETURNING id
),
medio2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', central.id, 2,
    'Transición energética hacia energías limpias', 117,
    'El presupuesto se ejerce en tiempo; los sistemas se mantienen en funcionamiento.',
    'Inventarios municipales; facturas de adquisición; reportes técnicos de instalación.'
  FROM central RETURNING id
),
medio3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', central.id, 3,
    'Promoción de cultura ecológica y participación ciudadana', 118,
    'La ciudadanía muestra interés en participar y se garantiza continuidad de las campañas.',
    'Listas de asistencia; reportes de difusión en medios; encuestas de impacto.'
  FROM central RETURNING id
),
medio4 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', central.id, 4,
    'Ampliación y eficiencia de los servicios públicos', 119,
    'Se dispone de recursos suficientes; la infraestructura permite la ampliación del servicio.',
    'Padrón de colonias atendidas; reportes de cobertura de Servicios Municipales y CAPAMA.'
  FROM central RETURNING id
),
act1 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', medio1.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio1, (VALUES
    (1, 'Incrementar la cobertura arbórea en zonas urbanas y comunitarias.', 120,
       'Se dispone de terrenos adecuados; la población participa en campañas de reforestación.',
       'Informes de brigadas de reforestación; reportes de la Dirección de Ecología; imágenes satelitales.'),
    (2, 'Implementar programas permanentes de reforestación en colonias y escuelas.', 121,
       'Las escuelas y colonias aceptan participar; se garantiza la dotación de plantas.',
       'Reportes de escuelas y colonias; listas de asistencia; convenios con instituciones educativas.'),
    (3, 'Dar mantenimiento preventivo y correctivo a áreas verdes públicas.', 122,
       'Se cuenta con personal y presupuesto operativo constante.',
       'Reportes de cuadrillas; bitácoras de mantenimiento; evidencias fotográficas.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act2 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', medio2.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio2, (VALUES
    (1, 'Reducir el consumo de energías no renovables en instalaciones municipales.', 123,
       'La transición a energías limpias no se ve interrumpida por recortes presupuestales.',
       'Facturación de energía eléctrica municipal; reportes de consumo de CFE.'),
    (2, 'Implementar infraestructura de energías limpias en edificios públicos.', 124,
       'El equipo se adquiere en tiempo y se mantiene en funcionamiento.',
       'Inventario municipal; contratos de instalación; reportes técnicos.'),
    (3, 'Generar proyectos piloto de eficiencia energética y ahorro de recursos.', 125,
       'Se garantiza financiamiento y aceptación ciudadana para pruebas piloto.',
       'Informes técnicos; reportes de Innovación y TI.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
),
act3 AS (
  INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
  SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', medio3.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
  FROM medio3, (VALUES
    (1, 'Implementar campañas de educación ambiental en escuelas y comunidades.', 126,
       'El sector educativo se involucra; los programas son bien recibidos.',
       'Listas de asistencia; convenios educativos; reportes de la Dirección de Ecología.'),
    (2, 'Desarrollar talleres y foros ciudadanos de cuidado ambiental.', 127,
       'La comunidad muestra interés en participar; se dispone de espacios para su desarrollo.',
       'Actas de reunión; reportes de talleres; registros fotográficos.')
  ) AS v(orden, texto, indicador_id, supuestos, medios_verificacion) RETURNING id
)
INSERT INTO public.arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion)
SELECT 7, 2026, 'OBJETIVOS', 'MEDIO', medio4.id, v.orden, v.texto, v.indicador_id, v.supuestos, v.medios_verificacion
FROM medio4, (VALUES
  (1, 'Renovación de infraestructura para gestión de residuos sólidos.', 128,
     'Se mantiene operativa la infraestructura y se asegura financiamiento para mantenimiento.',
     'Registros de la Dirección de Servicios Públicos; reportes de plantas de transferencia y rellenos sanitarios.'),
  (2, 'Incremento de la eficiencia en la recolección y disposición de residuos.', 129,
     'Se cuenta con unidades en buen estado y suficiente personal operativo.',
     'Bitácoras de rutas, GPS de camiones recolectores, reportes de supervisión.'),
  (3, 'Adquisición y mantenimiento de maquinaria para bacheo y obras.', 130,
     'El presupuesto de adquisiciones se libera y no hay retrasos en procesos de licitación.',
     'Inventarios municipales; actas de entrega; reportes de mantenimiento.'),
  (4, 'Incremento y mantenimiento de vehículos para recolección de residuos.', 131,
     'Los vehículos son operados con mantenimiento preventivo y se contrata personal suficiente.',
     'Inventario de vehículos de recolección; reportes de circulación; bitácoras de uso.')
) AS v(orden, texto, indicador_id, supuestos, medios_verificacion);

-- ---------- 4. involucrados_programa (PP-FM-05) ----------
-- Ver anomalía H: grilla reconstruida por clustering de coordenadas.
INSERT INTO public.involucrados_programa (programa_id, anio, categoria, actor, orden) VALUES
  (7, 2026, 'BENEFICIARIO', 'Ciudadanía en general', 1),
  (7, 2026, 'BENEFICIARIO', 'Comunidades y colonias', 2),
  (7, 2026, 'BENEFICIARIO', 'Empresas locales', 3),
  (7, 2026, 'BENEFICIARIO', 'Organizaciones civiles y ambientales', 4),
  (7, 2026, 'EJECUTOR', 'Dirección de Ecología y Medio Ambiente', 1),
  (7, 2026, 'EJECUTOR', 'Dirección de Servicios Públicos', 2),
  (7, 2026, 'EJECUTOR', 'Dirección de Obras Públicas', 3),
  (7, 2026, 'EJECUTOR', 'CAPAMA', 4),
  (7, 2026, 'OPOSITOR', 'Empresas con prácticas contaminantes', 1),
  (7, 2026, 'OPOSITOR', 'Transportistas o autos mal regulados', 2),
  (7, 2026, 'OPOSITOR', 'Personas que realizan tiradero clandestino', 3),
  (7, 2026, 'OPOSITOR', 'Grupos políticos adversos', 4),
  (7, 2026, 'INDIFERENTE', 'Ciudadanía no involucrada en actividades ambientales', 1),
  (7, 2026, 'INDIFERENTE', 'Dependencias municipales sin atribuciones ambientales', 2),
  (7, 2026, 'INDIFERENTE', 'Sectores económicos sin impacto ecológico relevante', 3),
  (7, 2026, 'INDIFERENTE', 'Personas sin participación comunitaria o vecinal', 4);

-- ---------- 5. indicadores — tipo/dimensión/sentido/medios/línea base/interpretación ----------
-- Tipo: Estratégico (Fin/Propósito) / Gestión (Componentes/Actividades) — ver
-- anomalía I para el bleed corregido. Dimensión/Sentido/Medios/Supuestos: de
-- la Matriz de Indicadores (PP-FM-0E), tabla limpia salvo anomalía D (Fuente
-- de las Actividades 4.1-4.4). Línea base: ver anomalía G (solo Fin la trae,
-- y con inconsistencia aritmética documentada). Interpretación: de la ficha
-- individual de cada indicador (páginas 18-35).
UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Informes de la Dirección de Ecología; imágenes satelitales; actas de reforestación.',
  linea_base=46.25, linea_base_anio=2025,
  interpretacion='Mide el crecimiento de zonas verdes y espacios con vegetación o ecosistemas municipales. Evalúa avances en conservación ambiental, salud urbana y calidad del aire.'
WHERE id=114;

UPDATE public.indicadores SET
  tipo_indicador='Estratégico', dimension='Eficiencia', sentido='Ascendente',
  medios_verificacion='Informes de programas; POA; reportes de ejecución de la Dirección de Ecología.',
  interpretacion='Indica cuántos programas ambientales operan realmente y con impacto medible. Evalúa eficiencia y alcance de las políticas ambientales.'
WHERE id=115;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de brigadas de reforestación; monitoreo fotográfico.',
  interpretacion='Mide la efectividad real de las acciones de reforestación. Refleja permanencia, cuidado y mantenimiento adecuado de los árboles plantados.'
WHERE id=116;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios municipales; facturas de adquisición; reportes técnicos de instalación.',
  interpretacion='Evalúa la transición del municipio hacia tecnologías sostenibles como paneles solares o calentadores solares. Mide reducción de impactos ambientales y modernización energética.'
WHERE id=117;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; reportes de difusión en medios; encuestas de impacto.',
  interpretacion='Mide el alcance poblacional de las acciones de sensibilización ambiental. Evalúa la efectividad de la estrategia educativa y de comunicación.'
WHERE id=118;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Padrón de colonias atendidas; reportes de cobertura de Servicios Municipales y CAPAMA.',
  interpretacion='Evalúa qué tanto el municipio reduce la desigualdad territorial al extender servicios básicos como agua potable, drenaje, luz, pavimento y alumbrado. Su avance beneficia directamente a poblaciones con mayor marginación.'
WHERE id=119;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes de brigadas de reforestación; reportes de la Dirección de Ecología; imágenes satelitales.',
  interpretacion='Evalúa la recuperación de áreas verdes urbanas mediante plantación de árboles en calles, parques y espacios públicos.'
WHERE id=120;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de escuelas y colonias; listas de asistencia; convenios con instituciones educativas.',
  interpretacion='Mide el cumplimiento de metas de reforestación establecidas en el plan anual. Refleja capacidad operativa y compromiso ambiental.'
WHERE id=121;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Reportes de cuadrillas; bitácoras de mantenimiento; evidencias fotográficas.',
  interpretacion='Indica el nivel de conservación y cuidado de parques, jardines y camellones. Evalúa cumplimiento del plan de mantenimiento.'
WHERE id=122;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Facturación de energía eléctrica municipal; reportes de consumo de CFE.',
  interpretacion='Mide la disminución del uso de energías fósiles. Evalúa avances hacia la eficiencia energética y la sostenibilidad.'
WHERE id=123;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario municipal; contratos de instalación; reportes técnicos.',
  interpretacion='Evalúa la cantidad de edificios públicos que ya operan con energías limpias. Refleja modernización ecológica y reducción de huella de carbono.'
WHERE id=124;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Informes técnicos; reportes de Innovación y TI.',
  interpretacion='Mide el desarrollo de proyectos innovadores en temas ambientales. Evalúa experimentación, innovación y capacidad de prueba e implementación.'
WHERE id=125;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Listas de asistencia; convenios educativos; reportes de la Dirección de Ecología.',
  interpretacion='Indica el nivel de cobertura de programas ambientales en instituciones educativas. Evalúa educación ambiental temprana y participación escolar.'
WHERE id=126;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Actas de reunión; reportes de talleres; registros fotográficos.',
  interpretacion='Mide la inclusión y participación social en actividades ambientales. Refleja gobernanza, corresponsabilidad y creación de cultura ambiental.'
WHERE id=127;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Registros de la Dirección de Servicios Públicos; reportes de plantas de transferencia y rellenos sanitarios.',
  interpretacion='Mide la capacidad del municipio para procesar residuos en instalaciones actualizadas tecnológica y sanitariamente. Un aumento refleja cumplimiento normativo, eficiencia ambiental y reducción de impactos sobre la salud.'
WHERE id=128;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Bitácoras de rutas, GPS de camiones recolectores, reportes de supervisión.',
  interpretacion='Mide el nivel de cumplimiento de la calendarización de recolección de residuos. Refleja eficiencia operativa, calidad del servicio y capacidad para evitar acumulación de basura en la vía pública.'
WHERE id=129;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventarios municipales; actas de entrega; reportes de mantenimiento.',
  interpretacion='Mide la capacidad del municipio para dotar a su personal de vehículos y equipos necesarios para limpieza, mantenimiento, vigilancia y servicios públicos. Su avance incrementa la eficiencia y rapidez de respuesta institucional.'
WHERE id=130;

UPDATE public.indicadores SET
  tipo_indicador='Gestión', dimension='Eficacia', sentido='Regular',
  medios_verificacion='Inventario de vehículos de recolección; reportes de circulación; bitácoras de uso.',
  interpretacion='Mide la disponibilidad real de las unidades destinadas a la recolección de basura. Su incremento indica mejor capacidad de servicio, reducción de fallas y cumplimiento del calendario de recolección.'
WHERE id=131;

-- ---------- 6. indicador_variables + valores reales de la ficha individual ----------
-- unidad_medida corregida a la real (ver anomalía E). Valores tomados de la
-- ficha individual de cada indicador (páginas 18-35); ver anomalía G para la
-- inconsistencia aritmética del FIN, sembrada tal cual la fuente.

-- id=114 FIN
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (114, 'Superficie actual de áreas verdes', 'SAAV', 'Hectáreas', 'Informes de la Dirección de Ecología; imágenes satelitales; actas de reforestación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (114, 'Superficie año base', 'SAB', 'Hectáreas', 'Informes de la Dirección de Ecología; imágenes satelitales; actas de reforestación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, 0, 18 FROM v1
UNION ALL SELECT v2.id, 2026, 46, 46.25 FROM v2;

-- id=115 PROPOSITO
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (115, 'Programas implementados', 'PI', 'Programas', 'Informes de programas; POA; reportes de ejecución de la Dirección de Ecología.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (115, 'Programas programados', 'PP', 'Programas', 'Informes de programas; POA; reportes de ejecución de la Dirección de Ecología.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1 FROM v2;

-- id=116 C1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (116, 'Arboles sobrevivientes', 'AS', 'Árboles', 'Reportes de brigadas de reforestación; monitoreo fotográfico.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (116, 'Arboles plantados', 'AP', 'Árboles', 'Reportes de brigadas de reforestación; monitoreo fotográfico.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 5000 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 5000 FROM v2;

-- id=117 C2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (117, 'Edificios con energía renovable', 'ECER', 'Edificios', 'Inventarios municipales; facturas de adquisición; reportes técnicos de instalación.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (117, 'Total de edificios municipales', 'TEM', 'Edificios', 'Inventarios municipales; facturas de adquisición; reportes técnicos de instalación.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1000 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1000 FROM v2;

-- id=118 C3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (118, 'Ciudadanos participantes o alcanzados', 'CPA', 'Ciudadanos', 'Listas de asistencia; reportes de difusión en medios; encuestas de impacto.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (118, 'Población objetivo estimada', 'POE', 'Ciudadanos', 'Listas de asistencia; reportes de difusión en medios; encuestas de impacto.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 24 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 24 FROM v2;

-- id=119 C4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (119, 'Colonias con servicios ampliados', 'CSA', 'Colonias', 'Padrón de colonias atendidas; reportes de cobertura de Servicios Municipales y CAPAMA.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (119, 'Colonias identificadas con rezago', 'CIR', 'Colonias', 'Padrón de colonias atendidas; reportes de cobertura de Servicios Municipales y CAPAMA.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=120 A1.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (120, 'Superficie reforestada', 'SR', 'Hectáreas', 'Informes de brigadas de reforestación; reportes de la Dirección de Ecología; imágenes satelitales.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (120, 'Superficie urbana total programada', 'SUTP', 'Hectáreas', 'Informes de brigadas de reforestación; reportes de la Dirección de Ecología; imágenes satelitales.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 1.69 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 1.69 FROM v2;

-- id=121 A1.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (121, 'Campañas ejecutadas', 'CE', 'Campañas', 'Reportes de escuelas y colonias; listas de asistencia; convenios con instituciones educativas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (121, 'Campañas programadas', 'CP', 'Campañas', 'Reportes de escuelas y colonias; listas de asistencia; convenios con instituciones educativas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 32 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 32 FROM v2;

-- id=122 A1.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (122, 'Superficie en mantenimiento', 'SCM', 'Hectáreas', 'Reportes de cuadrillas; bitácoras de mantenimiento; evidencias fotográficas.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (122, 'Superficie total de áreas verdes', 'STAV', 'Hectáreas', 'Reportes de cuadrillas; bitácoras de mantenimiento; evidencias fotográficas.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=123 A2.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (123, 'Consumo base', 'CB', 'kWh', 'Facturación de energía eléctrica municipal; reportes de consumo de CFE.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (123, 'Consumo actual', 'CA', 'kWh', 'Facturación de energía eléctrica municipal; reportes de consumo de CFE.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 100 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 100 FROM v2;

-- id=124 A2.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (124, 'Instalaciones equipadas', 'IE', 'Instalaciones', 'Inventario municipal; contratos de instalación; reportes técnicos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (124, 'Total de instalaciones municipales', 'TIM', 'Instalaciones', 'Inventario municipal; contratos de instalación; reportes técnicos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=125 A2.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (125, 'Proyectos implementados', 'PI', 'Proyectos', 'Informes técnicos; reportes de Innovación y TI.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (125, 'Proyectos planificados', 'PP', 'Proyectos', 'Informes técnicos; reportes de Innovación y TI.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=126 A3.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (126, 'Escuelas atendidas', 'EA', 'Escuelas', 'Listas de asistencia; convenios educativos; reportes de la Dirección de Ecología.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (126, 'Escuelas programadas', 'EP', 'Escuelas', 'Listas de asistencia; convenios educativos; reportes de la Dirección de Ecología.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 41 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 41 FROM v2;

-- id=127 A3.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (127, 'Eventos realizados', 'ER', 'Eventos', 'Actas de reunión; reportes de talleres; registros fotográficos.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (127, 'Eventos planificados', 'EP', 'Eventos', 'Actas de reunión; reportes de talleres; registros fotográficos.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 4 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 4 FROM v2;

-- id=128 A4.1
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (128, 'Toneladas manejadas en infraestructura modernizada', 'TMEIM', 'Toneladas', 'Registros de la Dirección de Servicios Públicos; reportes de plantas de transferencia y rellenos sanitarios.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (128, 'Toneladas totales recolectadas', 'TTR', 'Toneladas', 'Registros de la Dirección de Servicios Públicos; reportes de plantas de transferencia y rellenos sanitarios.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 120 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 120 FROM v2;

-- id=129 A4.2
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (129, 'Rutas cumplidas en tiempo', 'RCEN', 'Rutas', 'Bitácoras de rutas, GPS de camiones recolectores, reportes de supervisión.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (129, 'Total de rutas programadas', 'TRP', 'Rutas', 'Bitácoras de rutas, GPS de camiones recolectores, reportes de supervisión.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2400 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2400 FROM v2;

-- id=130 A4.3
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (130, 'Unidades adquiridas y operativas', 'UAO', 'Unidades', 'Inventarios municipales; actas de entrega; reportes de mantenimiento.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (130, 'Total programado', 'TP', 'Unidades', 'Inventarios municipales; actas de entrega; reportes de mantenimiento.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 2 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 2 FROM v2;

-- id=131 A4.4
WITH v1 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (131, 'Camiones recolectores operativos', 'CRO', 'Camiones', 'Inventario de vehículos de recolección; reportes de circulación; bitácoras de uso.', 1) RETURNING id
), v2 AS (
  INSERT INTO public.indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
  VALUES (131, 'Total programado', 'TP', 'Camiones', 'Inventario de vehículos de recolección; reportes de circulación; bitácoras de uso.', 2) RETURNING id
)
INSERT INTO public.indicador_variables_valores (variable_id, anio, valor_alcanzado, valor_meta)
SELECT v1.id, 2026, NULL::numeric, 120 FROM v1
UNION ALL SELECT v2.id, 2026, NULL::numeric, 120 FROM v2;

COMMIT;
