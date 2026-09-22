-- Formula de calculo de los 19 indicadores de las MIR 2027 que la tenian vacia,
-- con los simbolos de sus variables (indicador_variables). Aplicado 2026-09-22 — no re-ejecutar.
-- Los 4 de variacion contra anio base (62, 63, 114, 132) NO se pueden derivar con
-- componerFormula() (que arma A / B x 100), por eso se capturan a mano.
-- 132: se toma como porcentaje de REDUCCION porque asi lo piden su nombre y su meta
-- 2027 (+20); su sentido sigue en 'Descendente' y hay que corregirlo aparte.
UPDATE public.indicadores i
SET formula = d.formula
FROM (VALUES
  (62,  '((ITAEEA / ITAEEB) − 1) × 100'),
  (63,  '((EA / EB) − 1) × 100'),
  (25,  '(PEP / PT) × 100'),
  (26,  '(PAESSB / PT) × 100'),
  (132, '((CRAB − CRAA) / CRAB) × 100'),
  (133, '(PI / PPP) × 100'),
  (139, '(PR / PP) × 100'),
  (47,  '(CS / TE) × 100'),
  (48,  '(SCC / TSB) × 100'),
  (114, '((SAAV / SAB) − 1) × 100'),
  (115, '(PI / PP) × 100'),
  (147, '(CS / TE) × 100'),
  (154, '(NPEI / TDPI) × 100'),
  (160, '(NTFO / TTR) × 100'),
  (89,  '(NTD / NTI) × 100'),
  (95,  '(CPETF / TCPP) × 100'),
  (111, '(CPETF2 / TCPP2) × 100'),
  (112, '(CRPC / TCP) × 100'),
  (113, '(PEj / PPA) × 100')
) AS d(id, formula)
WHERE i.id = d.id
  AND nullif(trim(coalesce(i.formula, '')), '') IS NULL;

-- La definicion del 132 (escrita el mismo dia en definiciones_indicadores_2027.sql)
-- hablaba de "variacion"; se alinea con la formula de reduccion.
UPDATE public.indicadores
SET definicion = 'Mide el porcentaje de reducción del número de casos de violencia de género y de feminicidio en grado de tentativa registrados en el municipio de Apizaco en el año de medición, respecto del número de casos registrados en el año base, con información de la Dirección de Seguridad Pública, de la Fiscalía General del Estado y del INEGI. Un valor positivo indica que los casos disminuyeron.'
WHERE id = 132;

-- Con la formula de reduccion, un valor mayor es mejor: el sentido pasa a Ascendente
-- (aprobado por Hugo el 2026-09-22).
UPDATE public.indicadores SET sentido = 'Ascendente' WHERE id = 132;
