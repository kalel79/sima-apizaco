-- fase_mml_31: v_resumen_ejes cuenta solo los indicadores del ejercicio activo.
--
-- `indicadores` es un catálogo acumulado sin año (el año sale de
-- v_indicador_anio). total_indicadores contaba el catálogo completo: en
-- sep-2026 el Resumen del Excel de Detalle decía 204 indicadores en vez de 170
-- (AJ: 20 en vez de 10). Los semáforos y el % no se afectaban porque los
-- indicadores del 2027 no tienen avances del 2026.
--
-- Mismo patrón que fase_mml_27: EXISTS contra v_indicador_anio (owner-rights a
-- propósito, para que el coordinador no pierda filas) y security_invoker
-- explícito. Solo cambia el JOIN de indicadores; columnas, tipos y orden
-- idénticos para que CREATE OR REPLACE proceda.

CREATE OR REPLACE VIEW public.v_resumen_ejes
WITH (security_invoker = true) AS
WITH mes AS (
  SELECT get_mes_actual() AS m, get_anio_actual() AS a
), meta_cat AS (
  SELECT i_1.id AS indicador_id,
    CASE WHEN mes.m >= 1  THEN COALESCE(i_1.meta_ene, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 2  THEN COALESCE(i_1.meta_feb, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 3  THEN COALESCE(i_1.meta_mar, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 4  THEN COALESCE(i_1.meta_abr, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 5  THEN COALESCE(i_1.meta_may, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 6  THEN COALESCE(i_1.meta_jun, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 7  THEN COALESCE(i_1.meta_jul, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 8  THEN COALESCE(i_1.meta_ago, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 9  THEN COALESCE(i_1.meta_sep, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 10 THEN COALESCE(i_1.meta_oct, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 11 THEN COALESCE(i_1.meta_nov, 0::numeric) ELSE 0::numeric END +
    CASE WHEN mes.m >= 12 THEN COALESCE(i_1.meta_dic, 0::numeric) ELSE 0::numeric END AS meta_cat_acum
  FROM indicadores i_1, mes
), acum AS (
  SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
  FROM avances a, mes
  WHERE a.anio = mes.a AND a.mes >= 1 AND a.mes <= mes.m
  GROUP BY a.indicador_id
), calculo AS (
  SELECT ac.indicador_id, ac.resultado_acum,
    CASE
      WHEN mc.meta_cat_acum > 0::numeric THEN mc.meta_cat_acum
      WHEN ac.resultado_acum > 0::numeric THEN 1::numeric
      ELSE 0::numeric
    END AS denominador,
    CASE
      WHEN mc.meta_cat_acum > 0::numeric THEN ac.resultado_acum / mc.meta_cat_acum
      WHEN ac.resultado_acum > 0::numeric THEN ac.resultado_acum / 1.0
      ELSE NULL::numeric
    END AS pct
  FROM acum ac
  JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
)
SELECT e.id,
  e.codigo,
  e.nombre AS eje,
  e.icono,
  e.color_hex,
  e.orden,
  count(DISTINCT i.id) AS total_indicadores,
  round(sum(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL)
        / NULLIF(sum(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0::numeric), 4) AS pct_promedio,
  count(*) FILTER (WHERE c.pct >= 1.10) AS optimo,
  count(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10) AS adecuado,
  count(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90) AS riesgo,
  count(*) FILTER (WHERE c.pct < 0.70) AS critico
FROM ejes e
JOIN areas ar ON ar.eje_id = e.id
JOIN indicadores i ON i.area_id = ar.id
  AND EXISTS (
    SELECT 1 FROM v_indicador_anio v
    WHERE v.indicador_id = i.id AND v.anio = get_anio_actual()
  )
LEFT JOIN calculo c ON c.indicador_id = i.id
GROUP BY e.id, e.codigo, e.nombre, e.icono, e.color_hex, e.orden
ORDER BY e.orden;
