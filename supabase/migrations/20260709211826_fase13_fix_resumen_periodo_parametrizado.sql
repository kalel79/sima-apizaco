-- Fase 1.3 (fix): version parametrizada de v_dashboard_global/v_resumen_ejes/
-- v_resumen_areas para poder recalcular el resumen de CUALQUIER mes pasado,
-- no solo el periodo activo (las vistas solo reflejan get_mes_actual()/
-- get_anio_actual()). Mismo cuerpo SQL que las vistas (extraido via
-- pg_get_viewdef), solo se reemplaza el CTE "mes" por parametros.
-- Sin SECURITY DEFINER: igual que las vistas (security_invoker desde fase 0.1),
-- respetan el RLS del usuario que llama.

CREATE OR REPLACE FUNCTION public.resumen_global_periodo(p_anio integer, p_mes integer)
RETURNS TABLE(
  total_indicadores bigint, pct_global numeric,
  optimo bigint, adecuado bigint, riesgo bigint, critico bigint
)
LANGUAGE sql STABLE SET search_path = 'public' AS $$
  WITH meta_cat AS (
    SELECT i.id AS indicador_id,
      ( CASE WHEN p_mes >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
      + CASE WHEN p_mes >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
      + CASE WHEN p_mes >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
      + CASE WHEN p_mes >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
      + CASE WHEN p_mes >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
      + CASE WHEN p_mes >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
      + CASE WHEN p_mes >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
      + CASE WHEN p_mes >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
      + CASE WHEN p_mes >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
      + CASE WHEN p_mes >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
      + CASE WHEN p_mes >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
      + CASE WHEN p_mes >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
      )::numeric AS meta_cat_acum
    FROM indicadores i
  ),
  acum AS (
    SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
    FROM avances a
    WHERE a.anio = p_anio AND a.mes >= 1 AND a.mes <= p_mes
    GROUP BY a.indicador_id
  ),
  calculo AS (
    SELECT ac.indicador_id, ac.resultado_acum,
      CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN 1
           ELSE 0 END AS denominador,
      CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN ac.resultado_acum / 1.0
           ELSE NULL END AS pct
    FROM acum ac
    JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
  )
  SELECT
    count(*) FILTER (WHERE pct IS NOT NULL) AS total_indicadores,
    round( sum(resultado_acum) FILTER (WHERE pct IS NOT NULL)
         / NULLIF(sum(denominador) FILTER (WHERE pct IS NOT NULL), 0), 4) AS pct_global,
    count(*) FILTER (WHERE pct >= 1.10)                AS optimo,
    count(*) FILTER (WHERE pct >= 0.90 AND pct < 1.10) AS adecuado,
    count(*) FILTER (WHERE pct >= 0.70 AND pct < 0.90) AS riesgo,
    count(*) FILTER (WHERE pct < 0.70)                 AS critico
  FROM calculo;
$$;

CREATE OR REPLACE FUNCTION public.resumen_ejes_periodo(p_anio integer, p_mes integer)
RETURNS TABLE(
  id integer, codigo character varying, eje character varying, icono character varying,
  color_hex character varying, orden smallint, total_indicadores bigint, pct_promedio numeric,
  optimo bigint, adecuado bigint, riesgo bigint, critico bigint
)
LANGUAGE sql STABLE SET search_path = 'public' AS $$
  WITH meta_cat AS (
    SELECT i.id AS indicador_id,
      ( CASE WHEN p_mes >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
      + CASE WHEN p_mes >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
      + CASE WHEN p_mes >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
      + CASE WHEN p_mes >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
      + CASE WHEN p_mes >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
      + CASE WHEN p_mes >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
      + CASE WHEN p_mes >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
      + CASE WHEN p_mes >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
      + CASE WHEN p_mes >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
      + CASE WHEN p_mes >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
      + CASE WHEN p_mes >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
      + CASE WHEN p_mes >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
      )::numeric AS meta_cat_acum
    FROM indicadores i
  ),
  acum AS (
    SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
    FROM avances a
    WHERE a.anio = p_anio AND a.mes >= 1 AND a.mes <= p_mes
    GROUP BY a.indicador_id
  ),
  calculo AS (
    SELECT ac.indicador_id, ac.resultado_acum,
      CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN 1
           ELSE 0 END AS denominador,
      CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN ac.resultado_acum / 1.0
           ELSE NULL END AS pct
    FROM acum ac
    JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
  )
  SELECT e.id, e.codigo, e.nombre AS eje, e.icono, e.color_hex, e.orden,
    count(DISTINCT i.id) AS total_indicadores,
    round(sum(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL)
        / NULLIF(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0), 4) AS pct_promedio,
    count(*) FILTER (WHERE c.pct >= 1.10)                AS optimo,
    count(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10) AS adecuado,
    count(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90) AS riesgo,
    count(*) FILTER (WHERE c.pct < 0.70)                 AS critico
  FROM ejes e
  JOIN areas ar ON ar.eje_id = e.id
  JOIN indicadores i ON i.area_id = ar.id
  LEFT JOIN calculo c ON c.indicador_id = i.id
  GROUP BY e.id, e.codigo, e.nombre, e.icono, e.color_hex, e.orden
  ORDER BY e.orden;
$$;

CREATE OR REPLACE FUNCTION public.resumen_areas_periodo(p_anio integer, p_mes integer)
RETURNS TABLE(
  area_id integer, area character varying, eje_codigo character varying, eje_nombre character varying,
  eje_color character varying, eje_icono character varying, total_indicadores bigint, pct_promedio numeric,
  en_ok bigint, optimo bigint, adecuado bigint, riesgo bigint, critico bigint
)
LANGUAGE sql STABLE SET search_path = 'public' AS $$
  WITH meta_cat AS (
    SELECT i.id AS indicador_id,
      ( CASE WHEN p_mes >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
      + CASE WHEN p_mes >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
      + CASE WHEN p_mes >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
      + CASE WHEN p_mes >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
      + CASE WHEN p_mes >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
      + CASE WHEN p_mes >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
      + CASE WHEN p_mes >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
      + CASE WHEN p_mes >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
      + CASE WHEN p_mes >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
      + CASE WHEN p_mes >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
      + CASE WHEN p_mes >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
      + CASE WHEN p_mes >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
      )::numeric AS meta_cat_acum
    FROM indicadores i
  ),
  acum AS (
    SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
    FROM avances a
    WHERE a.anio = p_anio AND a.mes >= 1 AND a.mes <= p_mes
    GROUP BY a.indicador_id
  ),
  calculo AS (
    SELECT ac.indicador_id, ac.resultado_acum,
      CASE WHEN mc.meta_cat_acum > 0 THEN mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN 1
           ELSE 0 END AS denominador,
      CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN ac.resultado_acum / 1.0
           ELSE NULL END AS pct
    FROM acum ac
    JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
  )
  SELECT ar.id AS area_id, ar.nombre AS area, e.codigo AS eje_codigo, e.nombre AS eje_nombre,
    e.color_hex AS eje_color, e.icono AS eje_icono,
    count(DISTINCT i.id) AS total_indicadores,
    round(sum(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL)
        / NULLIF(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0), 4) AS pct_promedio,
    count(*) FILTER (WHERE c.pct >= 0.90)                AS en_ok,
    count(*) FILTER (WHERE c.pct >= 1.10)                AS optimo,
    count(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10) AS adecuado,
    count(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90) AS riesgo,
    count(*) FILTER (WHERE c.pct < 0.70)                 AS critico
  FROM areas ar
  JOIN ejes e ON e.id = ar.eje_id
  JOIN indicadores i ON i.area_id = ar.id
  LEFT JOIN calculo c ON c.indicador_id = i.id
  GROUP BY ar.id, ar.nombre, e.codigo, e.nombre, e.color_hex, e.icono
  HAVING COALESCE(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0) > 0
  ORDER BY pct_promedio DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.resumen_global_periodo(integer,integer) FROM public;
REVOKE ALL ON FUNCTION public.resumen_ejes_periodo(integer,integer) FROM public;
REVOKE ALL ON FUNCTION public.resumen_areas_periodo(integer,integer) FROM public;
GRANT EXECUTE ON FUNCTION public.resumen_global_periodo(integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resumen_ejes_periodo(integer,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resumen_areas_periodo(integer,integer) TO authenticated;
