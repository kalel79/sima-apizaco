-- Avance de captura del mes vigente por área: cuántos indicadores tiene,
-- cuántos ya tienen avance capturado en el mes/año actual, y cuántos de esos
-- ya están validados. A diferencia de v_resumen_areas (que es acumulado
-- ENE→mes actual y excluye áreas sin avance vía HAVING), esta vista muestra
-- SIEMPRE las 34 áreas, incluida la captura en cero, porque el objetivo es
-- justo detectar quién no ha capturado el mes.
-- SECURITY INVOKER: respeta el RLS del usuario que consulta (mismo criterio
-- ya aplicado en v_comparativo_pmd), en vez de sumar otra vista SECURITY
-- DEFINER a la deuda técnica existente.
CREATE VIEW public.v_avance_captura_areas
WITH (security_invoker = true) AS
WITH mes AS (
  SELECT get_mes_actual() AS m, get_anio_actual() AS a
)
SELECT
  ar.id AS area_id,
  ar.nombre AS area,
  COUNT(i.id) AS total_indicadores,
  COUNT(av.id) AS capturados,
  COUNT(av.id) FILTER (WHERE av.validado = true) AS validados,
  CASE WHEN COUNT(i.id) > 0
       THEN ROUND((COUNT(av.id)::numeric / COUNT(i.id) * 100), 1)
       ELSE NULL END AS pct_captura,
  CASE WHEN COUNT(i.id) > 0
       THEN ROUND((COUNT(av.id) FILTER (WHERE av.validado = true)::numeric / COUNT(i.id) * 100), 1)
       ELSE NULL END AS pct_validacion,
  CASE
    WHEN COUNT(i.id) = 0 THEN 'SIN INDICADORES'
    WHEN COUNT(av.id) = 0 THEN 'PENDIENTE'
    WHEN COUNT(av.id) = COUNT(i.id) THEN 'COMPLETO'
    ELSE 'EN PROGRESO'
  END AS estado_captura,
  mes.m AS mes_actual,
  mes.a AS anio_actual
FROM areas ar
CROSS JOIN mes
LEFT JOIN indicadores i ON i.area_id = ar.id
LEFT JOIN avances av ON av.indicador_id = i.id AND av.mes = mes.m AND av.anio = mes.a
GROUP BY ar.id, ar.nombre, mes.m, mes.a
ORDER BY ar.nombre;
