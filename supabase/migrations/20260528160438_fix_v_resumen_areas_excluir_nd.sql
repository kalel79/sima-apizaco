CREATE OR REPLACE VIEW public.v_resumen_areas AS
WITH acum AS (
  SELECT
    a.indicador_id,
    SUM(a.meta_programada) AS meta_prog_acum,
    SUM(a.meta_evaluable)  AS meta_eval_acum,
    SUM(a.resultado)       AS resultado_acum
  FROM avances a
  WHERE a.anio = 2026 AND a.mes BETWEEN 1 AND 4
  GROUP BY a.indicador_id
),
calculo AS (
  SELECT
    indicador_id,
    resultado_acum,
    CASE
      WHEN COALESCE(meta_prog_acum, 0) > 0 THEN meta_prog_acum
      WHEN COALESCE(meta_eval_acum,  0) > 0 THEN meta_eval_acum
      ELSE 0
    END AS denominador,
    CASE
      WHEN COALESCE(meta_prog_acum, 0) > 0 THEN resultado_acum / meta_prog_acum
      WHEN COALESCE(meta_eval_acum,  0) > 0 THEN resultado_acum / meta_eval_acum
      WHEN COALESCE(resultado_acum,  0) > 0 THEN 1.00
      ELSE NULL
    END AS pct
  FROM acum
)
SELECT
  ar.id                                                                AS area_id,
  ar.nombre                                                            AS area,
  e.codigo                                                             AS eje_codigo,
  e.nombre                                                             AS eje_nombre,
  e.color_hex                                                          AS eje_color,
  e.icono                                                              AS eje_icono,
  COUNT(DISTINCT i.id)                                                 AS total_indicadores,
  ROUND(
    SUM(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL) /
    NULLIF(SUM(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0)
  , 4)                                                                 AS pct_promedio,
  COUNT(*) FILTER (WHERE c.pct >= 0.90)                               AS en_ok,
  COUNT(*) FILTER (WHERE c.pct >= 1.10)                               AS optimo,
  COUNT(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10)             AS adecuado,
  COUNT(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90)             AS riesgo,
  COUNT(*) FILTER (WHERE c.pct < 0.70)                               AS critico
FROM areas        ar
JOIN   ejes        e  ON e.id           = ar.eje_id
JOIN   indicadores i  ON i.area_id      = ar.id
LEFT JOIN calculo  c  ON c.indicador_id = i.id
GROUP BY ar.id, ar.nombre, e.codigo, e.nombre, e.color_hex, e.icono
HAVING COALESCE(SUM(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0) > 0
ORDER BY ROUND(
    SUM(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL) /
    NULLIF(SUM(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0)
  , 4) DESC NULLS LAST;
