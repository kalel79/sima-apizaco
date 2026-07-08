CREATE OR REPLACE VIEW public.v_dashboard_global AS
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
  COUNT(*) FILTER (WHERE pct IS NOT NULL)                        AS total_indicadores,
  ROUND(
    SUM(resultado_acum) FILTER (WHERE pct IS NOT NULL) /
    NULLIF(SUM(denominador) FILTER (WHERE pct IS NOT NULL), 0)
  , 4)                                                           AS pct_global,
  COUNT(*) FILTER (WHERE pct >= 1.10)                           AS optimo,
  COUNT(*) FILTER (WHERE pct >= 0.90 AND pct < 1.10)           AS adecuado,
  COUNT(*) FILTER (WHERE pct >= 0.70 AND pct < 0.90)           AS riesgo,
  COUNT(*) FILTER (WHERE pct < 0.70)                            AS critico
FROM calculo;
