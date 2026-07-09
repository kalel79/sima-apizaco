-- Fase 1.1: verifica que la tabla `metas` (2026) sea idéntica a las columnas
-- viejas meta_ene..meta_dic + meta_anual_2026 de `indicadores`.
-- Debe devolver 0 filas en ambas queries. Correr en el SQL editor de Supabase
-- o vía MCP (execute_sql) cada vez que se quiera reconfirmar la paridad
-- mientras las columnas viejas sigan congeladas.

-- 1) Conteo de filas
SELECT
  (SELECT count(*) FROM public.metas WHERE anio = 2026 AND mes BETWEEN 1 AND 12) AS filas_mensuales,
  (SELECT count(*) * 12 FROM public.indicadores)                                  AS esperado_mensual,
  (SELECT count(*) FROM public.metas WHERE anio = 2026 AND mes = 0)              AS filas_anual,
  (SELECT count(*) FROM public.indicadores)                                       AS esperado_anual;

-- 2) Comparación valor a valor (0 mismatches esperado)
WITH viejo AS (
  SELECT id AS indicador_id, m.mes, m.valor FROM public.indicadores i
  CROSS JOIN LATERAL (VALUES
    (1,i.meta_ene),(2,i.meta_feb),(3,i.meta_mar),(4,i.meta_abr),
    (5,i.meta_may),(6,i.meta_jun),(7,i.meta_jul),(8,i.meta_ago),
    (9,i.meta_sep),(10,i.meta_oct),(11,i.meta_nov),(12,i.meta_dic),
    (0,i.meta_anual_2026)
  ) AS m(mes, valor)
)
SELECT v.indicador_id, v.mes, v.valor AS valor_viejo, nu.valor AS valor_nuevo
FROM viejo v
JOIN public.metas nu ON nu.indicador_id = v.indicador_id AND nu.anio = 2026 AND nu.mes = v.mes
WHERE nu.valor IS DISTINCT FROM v.valor;
