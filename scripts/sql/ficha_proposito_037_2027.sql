-- PP 037 / 2027: definicion, formula e interpretacion del Proposito
-- E5-TES-PRO-02 (205), capturado el 2026-09-24 sin esos campos.
-- Es el mismo indicador que el Proposito 2026 E5-TES-PRO-01 (89): mismo nombre y
-- mismas variables (NTD / NTI), asi que se toman sus textos.
-- Solo escribe campos vacios. Aplicado 2026-09-24, no re-ejecutar.
-- Rollback: UPDATE indicadores SET definicion = NULL, formula = NULL, interpretacion = NULL WHERE id = 205;

UPDATE public.indicadores
SET definicion = coalesce(nullif(trim(definicion), ''),
      'Mide el porcentaje de trámites y servicios municipales que se encuentran digitalizados y disponibles para realizarse en línea, respecto del total de trámites y servicios identificados en el inventario municipal durante el periodo de medición, como expresión del avance en innovación tecnológica, transparencia y modernización de la gestión pública.'),
    formula = coalesce(nullif(trim(formula), ''), '(NTD / NTI) × 100'),
    interpretacion = coalesce(nullif(trim(interpretacion), ''),
      'Evalúa el avance de la modernización administrativa y la accesibilidad de trámites digitales. Refleja eficiencia, transparencia y reducción de tiempos administrativos.')
WHERE id = 205;

-- Sentido: se capturo 'Regular'; debe ser 'Ascendente' como su gemelo 2026 (89),
-- porque mas tramites digitalizados es mejor. Aplicado 2026-09-24, no re-ejecutar.
-- Rollback: UPDATE indicadores SET sentido = 'Regular' WHERE id = 205;
UPDATE public.indicadores SET sentido = 'Ascendente' WHERE id = 205 AND sentido = 'Regular';
