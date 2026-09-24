-- PP 037 / 2027: clave para el Fin (204) y el Proposito (205), capturados el
-- 2026-09-24 sin clave. Patron -02: las -01 (88, 89) son del MIR 2026 y el
-- catalogo de indicadores es acumulado. Aplicado 2026-09-24, no re-ejecutar.
-- Rollback: UPDATE indicadores SET clave = NULL WHERE id IN (204, 205);

UPDATE indicadores SET clave = 'E5-TES-FIN-02' WHERE id = 204 AND clave IS NULL;
UPDATE indicadores SET clave = 'E5-TES-PRO-02' WHERE id = 205 AND clave IS NULL;
