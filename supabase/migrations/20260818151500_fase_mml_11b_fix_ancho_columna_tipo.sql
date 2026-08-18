-- ============================================================
-- FASE MML 11b — corrige arbol_nodos.tipo, que se quedo en varchar(10).
--
-- Bug real encontrado por Hugo probando fase_mml_11: el CHECK nuevo permitia
-- 'FIN_GENERAL' (11) y 'EFECTO_GENERAL' (15), pero la COLUMNA seguia siendo
-- varchar(10) — el guardado tronaba con "value too long for type character
-- varying(10)" antes de siquiera llegar a evaluar el CHECK.
-- ============================================================

ALTER TABLE public.arbol_nodos ALTER COLUMN tipo TYPE character varying(20);
