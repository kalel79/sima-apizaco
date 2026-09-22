-- Copia las metas 2026 (meses 1-12) a 2027 para los Fin/Proposito del MML 2027
-- que no tenian metas o las tenian todas en cero. Aplicado 2026-09-22 — no re-ejecutar.
--   012: E4-DE-FIN-01 (62), E4-DE-PRO-01 (63)
--   018: E2-DS-FIN-01 (25), E2-DS-PRO-01 (26)   <- tenian filas 2027 en cero (sin diciembre)
--   021: E7-IMM-PRO-01 (133)                    <- tenia solo diciembre en cero
--   024: E3-OP-FIN-01 (47)
--   032: E6-ECO-FIN-01 (114), E6-ECO-PRO-01 (115)
--   033: E8-DP-FIN-01 (147)
--   037: E5-TES-FIN-01 (88), E5-TES-PRO-01 (89)
-- El renglon anual (mes=0) lo recalcula trg_metas_recalcula_anual.
INSERT INTO public.metas (indicador_id, anio, mes, valor)
SELECT m.indicador_id, 2027, m.mes, m.valor
FROM public.metas m
WHERE m.anio = 2026
  AND m.mes BETWEEN 1 AND 12
  AND m.indicador_id IN (62, 63, 25, 26, 133, 47, 114, 115, 147, 88, 89)
ON CONFLICT (indicador_id, anio, mes) DO UPDATE SET valor = EXCLUDED.valor
WHERE public.metas.valor IS DISTINCT FROM EXCLUDED.valor;
