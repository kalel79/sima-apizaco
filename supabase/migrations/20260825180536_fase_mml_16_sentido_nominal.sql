-- ============================================================
-- FASE MML 16 — "Nominal" como sentido válido del indicador
-- La ficha de indicador del formato oficial ofrece 4 opciones de
-- Sentido/Comportamiento: Ascendente, Descendente, Regular y Nominal.
-- El CHECK solo aceptaba las 3 primeras. Aditivo: ninguna fila
-- existente deja de cumplirlo.
-- ============================================================
ALTER TABLE public.indicadores
  DROP CONSTRAINT indicadores_sentido_check;

ALTER TABLE public.indicadores
  ADD CONSTRAINT indicadores_sentido_check
  CHECK (sentido IS NULL OR sentido::text = ANY (ARRAY['Ascendente','Descendente','Regular','Nominal']));
