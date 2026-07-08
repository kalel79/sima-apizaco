DROP VIEW IF EXISTS public.v_alertas_logros;

CREATE VIEW public.v_alertas_logros AS
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
    meta_prog_acum,
    meta_eval_acum,
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
  WHERE NOT (
    COALESCE(meta_prog_acum, 0) = 0 AND
    COALESCE(meta_eval_acum,  0) = 0 AND
    COALESCE(resultado_acum,  0) = 0
  )
)
SELECT
  i.id                                                    AS indicador_id,
  i.nombre                                                AS indicador,
  i.nivel_mir,
  ar.nombre                                               AS area,
  e.codigo                                                AS eje_codigo,
  e.nombre                                                AS eje,
  e.color_hex                                             AS eje_color,
  e.icono                                                 AS eje_icono,
  ROUND(c.meta_prog_acum, 4)                              AS meta_programada,
  ROUND(c.meta_eval_acum, 4)                              AS meta_evaluable,
  ROUND(c.resultado_acum, 4)                              AS resultado,
  ROUND(c.pct, 4)                                         AS pct_cumplimiento,
  CASE
    WHEN c.pct >= 1.10 THEN 'ÓPTIMO'
    WHEN c.pct >= 0.90 THEN 'ADECUADO'
    WHEN c.pct >= 0.70 THEN 'RIESGO'
    ELSE                    'CRÍTICO'
  END                                                     AS semaforo,
  av4.tipo_alerta,
  av4.tendencia,
  ROUND(c.denominador - c.resultado_acum, 4)              AS brecha
FROM calculo c
JOIN   indicadores i   ON i.id             = c.indicador_id
JOIN   areas       ar  ON ar.id            = i.area_id
JOIN   ejes        e   ON e.id             = ar.eje_id
LEFT JOIN avances  av4 ON av4.indicador_id = c.indicador_id
                      AND av4.anio = 2026 AND av4.mes = 4
ORDER BY
  CASE
    WHEN c.pct <  0.70                       THEN 1
    WHEN c.pct >= 0.70 AND c.pct < 0.90     THEN 2
    WHEN c.pct >= 0.90 AND c.pct < 1.10     THEN 3
    ELSE                                           4
  END,
  ROUND(c.denominador - c.resultado_acum, 4) DESC;
