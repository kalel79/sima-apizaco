-- ============================================================
-- FASE MML 22 — Avance de captura del Expediente MML por área
-- ------------------------------------------------------------
-- Equivalente de v_avance_captura_areas (captura mensual de avances) pero para
-- el Expediente MML de un ejercicio: cuánto lleva capturado cada área de la
-- MIR, la Matriz de Riesgos, la Ficha de Indicador y las Metas (POA).
--
-- ── Qué cuenta como capturado ──────────────────────────────────────────────
-- Cada nivel de la MIR (Componente o Actividad) exige 22 datos:
--   MIR      1  → arbol_nodos.indicador_id (indicador vinculado)
--   RIESGOS  2  → arbol_nodos.supuestos, .medios_verificacion
--   FICHA    7  → indicadores: definicion, formula, tipo_indicador, dimension,
--                 sentido, linea_base_anio, interpretacion
--   METAS   12  → metas (anio, mes 1..12) con valor no nulo
--
-- Se excluyen a propósito de FICHA los campos `frecuencia` y `unidad_medida`:
-- son NOT NULL con default ('Mensual' / 'Porcentaje'), así que están llenos
-- desde que nace el indicador y contarlos inflaría el avance. Tampoco se
-- exigen `indicador_variables` (las variables de la fórmula): no está definido
-- que todo indicador deba tenerlas.
-- Las cadenas vacías no cuentan como capturadas (nullif(btrim(x), '')).
--
-- ── Granularidad ───────────────────────────────────────────────────────────
-- El área sale de la misma regla que get_area_efectiva_nodo() y
-- derivarNivelesMIR(): la propia del Componente, heredada por sus Actividades
-- salvo override. Fin y Propósito NO tienen área — son del programa completo —
-- así que van en una vista aparte (v_avance_mml_programas) y no se le cargan
-- ni se le acreditan a ninguna área.
-- La Ficha del Proyecto (ficha_proyecto) es UNIQUE (programa_id, anio), un
-- documento por programa: tampoco es repartible entre áreas y queda fuera.
--
-- SECURITY INVOKER: es una herramienta de supervisión para admin/planeación, y
-- ambos roles están dentro de la política arbol_select (fase_mml_06), así que
-- no hace falta la excepción de derechos que sí necesitó v_indicador_anio.
-- ============================================================

-- ---------- Derivación de la MIR desde el Árbol de Objetivos ----------
-- Espejo exacto de derivarNivelesMIR() (src/lib/mml.js): Objetivo raíz =
-- Propósito; FIN_GENERAL hijo directo (o, sin él, el FIN de menor orden) =
-- Fin; cada MEDIO hijo directo del Objetivo = Componente; cada MEDIO que
-- cuelga de un Componente = Actividad.

CREATE OR REPLACE VIEW public.v_mml_niveles
WITH (security_invoker = true) AS
WITH objetivo AS (
  SELECT n.id, n.programa_id, n.anio
  FROM   public.arbol_nodos n
  WHERE  n.arbol = 'OBJETIVOS' AND n.tipo = 'OBJETIVO' AND n.padre_id IS NULL
),
componentes AS (
  SELECT n.id, n.programa_id, n.anio, n.area_responsable_id,
         n.indicador_id, n.supuestos, n.medios_verificacion, n.texto
  FROM   public.arbol_nodos n
  JOIN   objetivo o ON o.id = n.padre_id
  WHERE  n.arbol = 'OBJETIVOS' AND n.tipo = 'MEDIO'
)
SELECT 'COMPONENTE'::text AS nivel, c.id, c.programa_id, c.anio,
       c.area_responsable_id, c.indicador_id, c.supuestos, c.medios_verificacion, c.texto
FROM   componentes c
UNION ALL
SELECT 'ACTIVIDAD', n.id, n.programa_id, n.anio,
       COALESCE(n.area_responsable_id, c.area_responsable_id),
       n.indicador_id, n.supuestos, n.medios_verificacion, n.texto
FROM   public.arbol_nodos n
JOIN   componentes c ON c.id = n.padre_id
WHERE  n.arbol = 'OBJETIVOS' AND n.tipo = 'MEDIO'
UNION ALL
-- Propósito: el Objetivo central. Sin área.
SELECT 'PROPOSITO', o.id, o.programa_id, o.anio,
       NULL::integer, n.indicador_id, n.supuestos, n.medios_verificacion, n.texto
FROM   objetivo o
JOIN   public.arbol_nodos n ON n.id = o.id
UNION ALL
-- Fin: FIN_GENERAL hijo directo del Objetivo; sin él, el FIN de menor orden.
-- Va envuelto en subconsulta a propósito: el ORDER BY que exige DISTINCT ON se
-- parsearía como el orden del UNION completo si se dejara suelto.
SELECT f.nivel, f.id, f.programa_id, f.anio,
       f.area_responsable_id, f.indicador_id, f.supuestos, f.medios_verificacion, f.texto
FROM (
  SELECT DISTINCT ON (o.id)
         'FIN'::text AS nivel, n.id, o.programa_id, o.anio,
         NULL::integer AS area_responsable_id,
         n.indicador_id, n.supuestos, n.medios_verificacion, n.texto
  FROM   objetivo o
  JOIN   public.arbol_nodos n
         ON n.padre_id = o.id AND n.arbol = 'OBJETIVOS'
  WHERE  n.tipo IN ('FIN_GENERAL', 'FIN')
  ORDER  BY o.id, (n.tipo = 'FIN_GENERAL') DESC, n.orden NULLS LAST, n.id
) f;

COMMENT ON VIEW public.v_mml_niveles IS
  'Niveles de la MIR (Fin, Proposito, Componentes, Actividades) derivados del '
  'Arbol de Objetivos, con el area efectiva ya resuelta. Espejo en SQL de '
  'derivarNivelesMIR() (src/lib/mml.js). Fin y Proposito no tienen area.';


-- ---------- Conteo de los 22 datos por nivel ----------
CREATE OR REPLACE VIEW public.v_mml_captura_nivel
WITH (security_invoker = true) AS
SELECT
  n.nivel, n.id AS nodo_id, n.programa_id, n.anio, n.area_responsable_id AS area_id,
  n.indicador_id,
  -- clave/nombre van embebidos a propósito: PostgREST no infiere relaciones
  -- sobre vistas, así que un embed indicadores(...) desde el front fallaría.
  i.clave  AS indicador_clave,
  i.nombre AS indicador_nombre,
  n.texto  AS resumen_narrativo,

  (n.indicador_id IS NOT NULL)::int AS d_mir,

  (nullif(btrim(n.supuestos), '')            IS NOT NULL)::int
  + (nullif(btrim(n.medios_verificacion), '') IS NOT NULL)::int AS d_riesgos,

  (nullif(btrim(i.definicion), '')      IS NOT NULL)::int
  + (nullif(btrim(i.formula), '')        IS NOT NULL)::int
  + (nullif(btrim(i.tipo_indicador), '') IS NOT NULL)::int
  + (nullif(btrim(i.dimension), '')      IS NOT NULL)::int
  + (nullif(btrim(i.sentido), '')        IS NOT NULL)::int
  + (i.linea_base_anio                   IS NOT NULL)::int
  + (nullif(btrim(i.interpretacion), '') IS NOT NULL)::int AS d_ficha,

  coalesce(mt.meses, 0) AS d_metas
FROM public.v_mml_niveles n
LEFT JOIN public.indicadores i ON i.id = n.indicador_id
LEFT JOIN LATERAL (
  SELECT count(*) AS meses
  FROM   public.metas m
  WHERE  m.indicador_id = n.indicador_id
    AND  m.anio = n.anio
    AND  m.mes BETWEEN 1 AND 12
    AND  m.valor IS NOT NULL
) mt ON true;

COMMENT ON VIEW public.v_mml_captura_nivel IS
  'Un renglon por nivel de la MIR con cuantos de sus 22 datos estan capturados, '
  'partidos en los 4 bloques: MIR (1), Riesgos (2), Ficha (7) y Metas (12).';


-- ---------- Avance por ÁREA (Componentes y Actividades) ----------
CREATE OR REPLACE VIEW public.v_avance_mml_areas
WITH (security_invoker = true) AS
WITH anios AS (
  SELECT DISTINCT anio FROM public.arbol_nodos
),
agg AS (
  SELECT area_id, anio,
         count(*)      AS total_niveles,
         sum(d_mir)    AS d_mir,
         sum(d_riesgos) AS d_riesgos,
         sum(d_ficha)  AS d_ficha,
         sum(d_metas)  AS d_metas
  FROM   public.v_mml_captura_nivel
  WHERE  area_id IS NOT NULL          -- Fin/Proposito van en la vista de programas
  GROUP  BY area_id, anio
),
base AS (
  SELECT
    ar.id      AS area_id,
    ar.nombre  AS area,
    e.codigo   AS eje_codigo,
    y.anio,
    coalesce(a.total_niveles, 0) AS total_niveles,
    coalesce(a.d_mir,     0) AS mir_capturados,
    coalesce(a.d_riesgos, 0) AS riesgos_capturados,
    coalesce(a.d_ficha,   0) AS ficha_capturados,
    coalesce(a.d_metas,   0) AS metas_capturados,
    coalesce(a.total_niveles, 0)      AS mir_esperados,
    coalesce(a.total_niveles, 0) * 2  AS riesgos_esperados,
    coalesce(a.total_niveles, 0) * 7  AS ficha_esperados,
    coalesce(a.total_niveles, 0) * 12 AS metas_esperados
  FROM public.areas ar
  CROSS JOIN anios y
  LEFT JOIN public.ejes e ON e.id = ar.eje_id
  LEFT JOIN agg a ON a.area_id = ar.id AND a.anio = y.anio
  WHERE ar.activo
),
pct AS (
  SELECT b.*,
         b.mir_capturados + b.riesgos_capturados + b.ficha_capturados + b.metas_capturados AS total_capturados,
         b.mir_esperados  + b.riesgos_esperados  + b.ficha_esperados  + b.metas_esperados  AS total_esperados
  FROM base b
)
SELECT
  area_id, area, eje_codigo, anio, total_niveles,
  mir_capturados,     mir_esperados,
  riesgos_capturados, riesgos_esperados,
  ficha_capturados,   ficha_esperados,
  metas_capturados,   metas_esperados,
  total_capturados,   total_esperados,
  CASE WHEN mir_esperados     > 0 THEN round(mir_capturados::numeric     / mir_esperados     * 100, 1) END AS pct_mir,
  CASE WHEN riesgos_esperados > 0 THEN round(riesgos_capturados::numeric / riesgos_esperados * 100, 1) END AS pct_riesgos,
  CASE WHEN ficha_esperados   > 0 THEN round(ficha_capturados::numeric   / ficha_esperados   * 100, 1) END AS pct_ficha,
  CASE WHEN metas_esperados   > 0 THEN round(metas_capturados::numeric   / metas_esperados   * 100, 1) END AS pct_metas,
  CASE WHEN total_esperados   > 0 THEN round(total_capturados::numeric   / total_esperados   * 100, 1) END AS pct_global,
  -- Mismo vocabulario de estados que v_avance_captura_areas, para que la
  -- pantalla reutilice los badges que ya existen.
  CASE
    WHEN total_niveles = 0                        THEN 'SIN NIVELES'
    WHEN total_capturados = 0                     THEN 'PENDIENTE'
    WHEN total_capturados >= total_esperados      THEN 'COMPLETO'
    ELSE 'EN PROGRESO'
  END AS estado_captura
FROM pct
ORDER BY area;

COMMENT ON VIEW public.v_avance_mml_areas IS
  'Avance de captura del Expediente MML por area y ejercicio: MIR, Riesgos, '
  'Ficha de Indicador y Metas (POA). Muestra SIEMPRE todas las areas activas, '
  'incluidas las que van en cero, porque el objetivo es detectar quien no ha '
  'capturado. Fin y Proposito no entran aqui: ver v_avance_mml_programas.';


-- ---------- Avance por PROGRAMA (incluye Fin y Propósito, que no tienen área) ----------
CREATE OR REPLACE VIEW public.v_avance_mml_programas
WITH (security_invoker = true) AS
WITH agg AS (
  SELECT programa_id, anio,
         count(*)                                         AS total_niveles,
         count(*) FILTER (WHERE nivel IN ('FIN','PROPOSITO')) AS niveles_sin_area,
         sum(d_mir) AS d_mir, sum(d_riesgos) AS d_riesgos,
         sum(d_ficha) AS d_ficha, sum(d_metas) AS d_metas
  FROM   public.v_mml_captura_nivel
  GROUP  BY programa_id, anio
),
base AS (
  SELECT
    p.id AS programa_id, p.clave, p.nombre AS programa, a.anio,
    a.total_niveles, a.niveles_sin_area,
    a.d_mir AS mir_capturados,     a.total_niveles      AS mir_esperados,
    a.d_riesgos AS riesgos_capturados, a.total_niveles * 2  AS riesgos_esperados,
    a.d_ficha AS ficha_capturados,     a.total_niveles * 7  AS ficha_esperados,
    a.d_metas AS metas_capturados,     a.total_niveles * 12 AS metas_esperados
  FROM agg a
  JOIN public.programas p ON p.id = a.programa_id
)
SELECT
  b.*,
  (mir_capturados + riesgos_capturados + ficha_capturados + metas_capturados) AS total_capturados,
  (mir_esperados  + riesgos_esperados  + ficha_esperados  + metas_esperados)  AS total_esperados,
  CASE WHEN mir_esperados     > 0 THEN round(mir_capturados::numeric     / mir_esperados     * 100, 1) END AS pct_mir,
  CASE WHEN riesgos_esperados > 0 THEN round(riesgos_capturados::numeric / riesgos_esperados * 100, 1) END AS pct_riesgos,
  CASE WHEN ficha_esperados   > 0 THEN round(ficha_capturados::numeric   / ficha_esperados   * 100, 1) END AS pct_ficha,
  CASE WHEN metas_esperados   > 0 THEN round(metas_capturados::numeric   / metas_esperados   * 100, 1) END AS pct_metas,
  CASE WHEN (mir_esperados + riesgos_esperados + ficha_esperados + metas_esperados) > 0
       THEN round((mir_capturados + riesgos_capturados + ficha_capturados + metas_capturados)::numeric
                  / (mir_esperados + riesgos_esperados + ficha_esperados + metas_esperados) * 100, 1) END AS pct_global,
  -- ¿Ya existe la Ficha del Proyecto del programa? Es por programa+anio, no
  -- repartible entre areas, asi que se reporta aqui como un si/no.
  EXISTS (SELECT 1 FROM public.ficha_proyecto f
          WHERE f.programa_id = b.programa_id AND f.anio = b.anio) AS tiene_ficha_proyecto
FROM base b
ORDER BY b.clave, b.anio;

COMMENT ON VIEW public.v_avance_mml_programas IS
  'Avance de captura del Expediente MML por programa y ejercicio, incluyendo Fin '
  'y Proposito (que no tienen area responsable) y si el programa ya tiene Ficha '
  'del Proyecto capturada para ese anio.';


REVOKE ALL ON public.v_mml_niveles           FROM PUBLIC; REVOKE ALL ON public.v_mml_niveles           FROM anon;
REVOKE ALL ON public.v_mml_captura_nivel     FROM PUBLIC; REVOKE ALL ON public.v_mml_captura_nivel     FROM anon;
REVOKE ALL ON public.v_avance_mml_areas      FROM PUBLIC; REVOKE ALL ON public.v_avance_mml_areas      FROM anon;
REVOKE ALL ON public.v_avance_mml_programas  FROM PUBLIC; REVOKE ALL ON public.v_avance_mml_programas  FROM anon;

GRANT SELECT ON public.v_mml_niveles          TO authenticated;
GRANT SELECT ON public.v_mml_captura_nivel    TO authenticated;
GRANT SELECT ON public.v_avance_mml_areas     TO authenticated;
GRANT SELECT ON public.v_avance_mml_programas TO authenticated;
