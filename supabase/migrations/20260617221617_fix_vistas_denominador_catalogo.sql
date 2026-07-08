
-- Corrección: denominador usa meta acumulada del catálogo (indicadores.meta_ene..dic)
-- en lugar de SUM(meta_programada) de avances.
-- La regla meta=1 se aplica una sola vez por indicador, no por fila mensual.

-- ─── v_dashboard_global ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_dashboard_global AS
WITH mes AS (SELECT get_mes_actual() AS m, get_anio_actual() AS a),
meta_cat AS (
  SELECT i.id AS indicador_id,
    ( CASE WHEN mes.m >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
    + CASE WHEN mes.m >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
    + CASE WHEN mes.m >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
    + CASE WHEN mes.m >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
    + CASE WHEN mes.m >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
    + CASE WHEN mes.m >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
    + CASE WHEN mes.m >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
    + CASE WHEN mes.m >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
    + CASE WHEN mes.m >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
    + CASE WHEN mes.m >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
    + CASE WHEN mes.m >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
    + CASE WHEN mes.m >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
    )::numeric AS meta_cat_acum
  FROM indicadores i, mes
),
acum AS (
  SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
  FROM avances a, mes
  WHERE a.anio = mes.a AND a.mes >= 1 AND a.mes <= mes.m
  GROUP BY a.indicador_id
),
calculo AS (
  SELECT ac.indicador_id, ac.resultado_acum,
    CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1
         ELSE 0 END AS denominador,
    CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1.00
         ELSE NULL END AS pct
  FROM acum ac
  JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
)
SELECT
  count(*)           FILTER (WHERE pct IS NOT NULL) AS total_indicadores,
  round( sum(resultado_acum) FILTER (WHERE pct IS NOT NULL)
       / NULLIF(sum(denominador) FILTER (WHERE pct IS NOT NULL), 0), 4) AS pct_global,
  count(*) FILTER (WHERE pct >= 1.10)                AS optimo,
  count(*) FILTER (WHERE pct >= 0.90 AND pct < 1.10) AS adecuado,
  count(*) FILTER (WHERE pct >= 0.70 AND pct < 0.90) AS riesgo,
  count(*) FILTER (WHERE pct < 0.70)                 AS critico
FROM calculo;

-- ─── v_resumen_ejes ───────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_resumen_ejes AS
WITH mes AS (SELECT get_mes_actual() AS m, get_anio_actual() AS a),
meta_cat AS (
  SELECT i.id AS indicador_id,
    ( CASE WHEN mes.m >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
    + CASE WHEN mes.m >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
    + CASE WHEN mes.m >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
    + CASE WHEN mes.m >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
    + CASE WHEN mes.m >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
    + CASE WHEN mes.m >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
    + CASE WHEN mes.m >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
    + CASE WHEN mes.m >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
    + CASE WHEN mes.m >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
    + CASE WHEN mes.m >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
    + CASE WHEN mes.m >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
    + CASE WHEN mes.m >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
    )::numeric AS meta_cat_acum
  FROM indicadores i, mes
),
acum AS (
  SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
  FROM avances a, mes
  WHERE a.anio = mes.a AND a.mes >= 1 AND a.mes <= mes.m
  GROUP BY a.indicador_id
),
calculo AS (
  SELECT ac.indicador_id, ac.resultado_acum,
    CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1
         ELSE 0 END AS denominador,
    CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1.00
         ELSE NULL END AS pct
  FROM acum ac
  JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
)
SELECT
  e.id, e.codigo, e.nombre AS eje, e.icono, e.color_hex, e.orden,
  count(DISTINCT i.id) AS total_indicadores,
  round( sum(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL)
       / NULLIF(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0), 4) AS pct_promedio,
  count(*) FILTER (WHERE c.pct >= 1.10)                  AS optimo,
  count(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10) AS adecuado,
  count(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90) AS riesgo,
  count(*) FILTER (WHERE c.pct < 0.70)                   AS critico
FROM ejes e
JOIN areas ar      ON ar.eje_id  = e.id
JOIN indicadores i ON i.area_id  = ar.id
LEFT JOIN calculo c ON c.indicador_id = i.id
GROUP BY e.id, e.codigo, e.nombre, e.icono, e.color_hex, e.orden
ORDER BY e.orden;

-- ─── v_resumen_areas ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_resumen_areas AS
WITH mes AS (SELECT get_mes_actual() AS m, get_anio_actual() AS a),
meta_cat AS (
  SELECT i.id AS indicador_id,
    ( CASE WHEN mes.m >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
    + CASE WHEN mes.m >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
    + CASE WHEN mes.m >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
    + CASE WHEN mes.m >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
    + CASE WHEN mes.m >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
    + CASE WHEN mes.m >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
    + CASE WHEN mes.m >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
    + CASE WHEN mes.m >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
    + CASE WHEN mes.m >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
    + CASE WHEN mes.m >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
    + CASE WHEN mes.m >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
    + CASE WHEN mes.m >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
    )::numeric AS meta_cat_acum
  FROM indicadores i, mes
),
acum AS (
  SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
  FROM avances a, mes
  WHERE a.anio = mes.a AND a.mes >= 1 AND a.mes <= mes.m
  GROUP BY a.indicador_id
),
calculo AS (
  SELECT ac.indicador_id, ac.resultado_acum,
    CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1
         ELSE 0 END AS denominador,
    CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1.00
         ELSE NULL END AS pct
  FROM acum ac
  JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
)
SELECT
  ar.id AS area_id, ar.nombre AS area,
  e.codigo AS eje_codigo, e.nombre AS eje_nombre,
  e.color_hex AS eje_color, e.icono AS eje_icono,
  count(DISTINCT i.id) AS total_indicadores,
  round( sum(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL)
       / NULLIF(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0), 4) AS pct_promedio,
  count(*) FILTER (WHERE c.pct >= 0.90)                  AS en_ok,
  count(*) FILTER (WHERE c.pct >= 1.10)                  AS optimo,
  count(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10) AS adecuado,
  count(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90) AS riesgo,
  count(*) FILTER (WHERE c.pct < 0.70)                   AS critico
FROM areas ar
JOIN ejes e        ON e.id      = ar.eje_id
JOIN indicadores i ON i.area_id = ar.id
LEFT JOIN calculo c ON c.indicador_id = i.id
GROUP BY ar.id, ar.nombre, e.codigo, e.nombre, e.color_hex, e.icono
HAVING COALESCE(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0) > 0
ORDER BY round( sum(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL)
              / NULLIF(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0), 4) DESC NULLS LAST;

-- ─── v_indicadores_acum ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_indicadores_acum AS
WITH mes AS (SELECT get_mes_actual() AS m, get_anio_actual() AS a),
meta_cat AS (
  SELECT i.id AS indicador_id,
    ( CASE WHEN mes.m >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
    + CASE WHEN mes.m >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
    + CASE WHEN mes.m >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
    + CASE WHEN mes.m >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
    + CASE WHEN mes.m >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
    + CASE WHEN mes.m >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
    + CASE WHEN mes.m >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
    + CASE WHEN mes.m >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
    + CASE WHEN mes.m >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
    + CASE WHEN mes.m >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
    + CASE WHEN mes.m >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
    + CASE WHEN mes.m >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
    )::numeric AS meta_cat_acum
  FROM indicadores i, mes
),
acum AS (
  SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
  FROM avances a, mes
  WHERE a.anio = mes.a AND a.mes >= 1 AND a.mes <= mes.m
  GROUP BY a.indicador_id
),
calculo AS (
  SELECT ac.indicador_id, ac.resultado_acum,
    CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1
         ELSE 0 END AS denominador,
    CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
         WHEN ac.resultado_acum  > 0 THEN 1.00
         ELSE NULL END AS pct
  FROM acum ac
  JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
  WHERE mc.meta_cat_acum > 0 OR ac.resultado_acum > 0
)
SELECT
  i.id,
  i.id        AS indicador_id,
  i.nombre    AS indicador,
  i.nivel_mir,
  ar.nombre   AS area,
  e.codigo    AS eje_codigo,
  e.nombre    AS eje_nombre,
  e.color_hex AS eje_color,
  e.icono     AS eje_icono,
  round(c.denominador,    4) AS meta_evaluable,
  round(c.resultado_acum, 4) AS resultado,
  round(c.pct,            4) AS pct_cumplimiento,
  CASE
    WHEN c.pct >= 1.10 THEN 'ÓPTIMO'
    WHEN c.pct >= 0.90 THEN 'ADECUADO'
    WHEN c.pct >= 0.70 THEN 'RIESGO'
    ELSE 'CRÍTICO'
  END AS semaforo,
  av_actual.tipo_alerta,
  av_actual.tendencia
FROM calculo c
JOIN indicadores i  ON i.id  = c.indicador_id
JOIN areas ar       ON ar.id = i.area_id
JOIN ejes e         ON e.id  = ar.eje_id
LEFT JOIN avances av_actual ON (
  av_actual.indicador_id = c.indicador_id
  AND av_actual.anio     = get_anio_actual()
  AND av_actual.mes      = get_mes_actual()
)
ORDER BY c.pct;
