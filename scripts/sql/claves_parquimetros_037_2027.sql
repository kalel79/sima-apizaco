-- PP 037 / 2027, Parquimetros: las claves estaban cruzadas respecto al nivel.
-- El Componente (nodo 989) tenia el 199 con clave de Actividad y la Actividad
-- (nodo 990) el 198 con clave de Componente; los nombres si correspondian a su
-- nivel, asi que solo se intercambian las claves. Aplicado 2026-09-24, no re-ejecutar.
-- Rollback: el mismo intercambio a la inversa.

UPDATE indicadores SET clave = 'TMP-PAR-SWAP'   WHERE id = 198 AND clave = 'E5-PAR-C7-01';
UPDATE indicadores SET clave = 'E5-PAR-C7-01'   WHERE id = 199 AND clave = 'E5-PAR-A7.1-01';
UPDATE indicadores SET clave = 'E5-PAR-A7.1-01' WHERE id = 198 AND clave = 'TMP-PAR-SWAP';
