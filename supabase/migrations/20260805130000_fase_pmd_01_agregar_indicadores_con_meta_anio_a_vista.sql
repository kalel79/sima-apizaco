-- Agrega a v_comparativo_pmd el conteo de indicadores del programa que sí
-- tienen meta capturada para el año en curso (tabla `metas`, mes=0 anual o
-- cualquier mes). Se usa desde el frontend para ocultar temporalmente del
-- módulo PMD los programas sin indicador o sin meta 2026 (pedido de Hugo:
-- "por ahora" — mientras Planeación termina de alinear esos programas).
-- Columna nueva al final del SELECT: CREATE OR REPLACE no permite reordenar
-- ni insertar columnas en medio de una vista existente.
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
metas_anio AS (
  SELECT DISTINCT indicador_id
  FROM metas
  WHERE anio = get_anio_actual() AND valor IS NOT NULL
),
pct_por_indicador AS (
  SELECT
    i.id AS indicador_id,
    i.programa_pmd_id,
    (ma.indicador_id IS NOT NULL) AS tiene_meta_anio,
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
  LEFT JOIN metas_anio ma ON ma.indicador_id = i.id
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
  SUM(CASE WHEN pi.semaforo = 'CRÍTICO' THEN 1 ELSE 0 END) AS critico,
  COUNT(pi.indicador_id) FILTER (WHERE pi.tiene_meta_anio) AS indicadores_con_meta_anio
FROM programas_pmd p
LEFT JOIN pct_por_indicador pi ON pi.programa_pmd_id = p.id
GROUP BY p.id, p.numero, p.nombre, p.eje, p.objetivo, p.meta, p.responsable, p.plazo
ORDER BY p.numero;
