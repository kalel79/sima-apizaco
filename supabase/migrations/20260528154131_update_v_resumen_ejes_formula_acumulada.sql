CREATE OR REPLACE VIEW public.v_resumen_ejes AS
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
  e.id,
  e.codigo,
  e.nombre                                                             AS eje,
  e.icono,
  e.color_hex,
  e.orden,
  COUNT(DISTINCT i.id)                                                 AS total_indicadores,
  ROUND(
    SUM(c.resultado_acum) FILTER (WHERE c.pct IS NOT NULL) /
    NULLIF(SUM(c.denominador) FILTER (WHERE c.pct IS NOT NULL), 0)
  , 4)                                                                 AS pct_promedio,
  COUNT(*) FILTER (WHERE c.pct >= 1.10)                               AS optimo,
  COUNT(*) FILTER (WHERE c.pct >= 0.90 AND c.pct < 1.10)             AS adecuado,
  COUNT(*) FILTER (WHERE c.pct >= 0.70 AND c.pct < 0.90)             AS riesgo,
  COUNT(*) FILTER (WHERE c.pct < 0.70)                               AS critico
FROM ejes e
JOIN   areas      ar ON ar.eje_id     = e.id
JOIN   indicadores i  ON i.area_id    = ar.id
LEFT JOIN calculo  c  ON c.indicador_id = i.id
GROUP BY e.id, e.codigo, e.nombre, e.icono, e.color_hex, e.orden
ORDER BY e.orden;
