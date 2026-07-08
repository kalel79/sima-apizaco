-- Corrige v_comparativo_pmd: el promedio de pct_cumplimiento por mes inflaba
-- el % (ej. 3339% en el programa 3). Se reemplaza por la misma metodología
-- acumulada que usa v_resumen_ejes/v_dashboard_global:
-- (SUM(resultado) / SUM(meta_programada)) * 100 acumulando mes 1 → mes actual.
-- Nota de escala: a diferencia de la vista anterior (pct_promedio como
-- fracción 0-1, ej. 0.78), esta vista devuelve pct_promedio ya en escala de
-- porcentaje (ej. 78.03) — el frontend debe dejar de multiplicar por 100.
CREATE OR REPLACE VIEW v_comparativo_pmd
WITH (security_invoker = true) AS
WITH avances_acum AS (
  SELECT
    a.indicador_id,
    SUM(a.resultado) AS resultado_acum,
    SUM(a.meta_programada) AS meta_acum
  FROM avances a
  WHERE a.anio = get_anio_actual()
    AND a.mes >= 1
    AND a.mes <= get_mes_actual()
  GROUP BY a.indicador_id
),
pct_por_indicador AS (
  SELECT
    i.id AS indicador_id,
    i.programa_pmd_id,
    CASE
      WHEN aa.meta_acum > 0 THEN ROUND((aa.resultado_acum / aa.meta_acum * 100)::numeric, 2)
      WHEN aa.meta_acum = 0 AND aa.resultado_acum > 0 THEN 100
      ELSE NULL
    END AS pct,
    CASE
      WHEN aa.meta_acum IS NULL THEN NULL
      WHEN aa.meta_acum > 0 AND (aa.resultado_acum / aa.meta_acum * 100) >= 110 THEN 'ÓPTIMO'
      WHEN aa.meta_acum > 0 AND (aa.resultado_acum / aa.meta_acum * 100) >= 90 THEN 'ADECUADO'
      WHEN aa.meta_acum > 0 AND (aa.resultado_acum / aa.meta_acum * 100) >= 70 THEN 'RIESGO'
      WHEN aa.meta_acum > 0 THEN 'CRÍTICO'
      WHEN aa.meta_acum = 0 AND aa.resultado_acum > 0 THEN 'ÓPTIMO'
      ELSE NULL
    END AS semaforo
  FROM indicadores i
  LEFT JOIN avances_acum aa ON aa.indicador_id = i.id
)
SELECT
  p.id AS programa_id,
  p.numero,
  p.nombre AS programa_nombre,
  p.eje,
  p.objetivo,
  p.meta AS meta_pmd,
  p.responsable,
  p.plazo,
  COUNT(pi.indicador_id) AS total_indicadores,
  COUNT(pi.pct) AS indicadores_con_avance,
  ROUND(AVG(pi.pct)::numeric, 1) AS pct_promedio,
  SUM(CASE WHEN pi.semaforo = 'ÓPTIMO' THEN 1 ELSE 0 END) AS optimo,
  SUM(CASE WHEN pi.semaforo = 'ADECUADO' THEN 1 ELSE 0 END) AS adecuado,
  SUM(CASE WHEN pi.semaforo = 'RIESGO' THEN 1 ELSE 0 END) AS riesgo,
  SUM(CASE WHEN pi.semaforo = 'CRÍTICO' THEN 1 ELSE 0 END) AS critico
FROM programas_pmd p
LEFT JOIN pct_por_indicador pi ON pi.programa_pmd_id = p.id
GROUP BY p.id, p.numero, p.nombre, p.eje, p.objetivo, p.meta, p.responsable, p.plazo
ORDER BY p.numero;
