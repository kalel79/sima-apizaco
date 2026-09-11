-- respaldo_movimientos_parquimetros_rastro_2027.sql
-- Respaldo del estado PREVIO, tomado el 2026-09-07 antes de correr
-- scripts/sql/movimientos_parquimetros_rastro_2027.sql
--
-- ESTE ARCHIVO NO SE EJECUTA EN CONDICIONES NORMALES: es el rollback de los
-- dos movimientos de area del ejercicio 2027.
--
-- ESTADO PREVIO
--
-- Parquimetros (area 15) vivia en el PP 012 (id 3), eje E4 (id 4):
--   nodo 989  COMPONENTE  programa_id=3  padre_id=975 (objetivo raiz del 012)
--             orden=8  indicador_id=71 (E4-PAR-C8-01, 'Componente 8')
--   nodo 990  ACTIVIDAD   programa_id=3  padre_id=989
--             orden=1  indicador_id=87 (E4-PAR-A8.1-01, 'Actividad 8.1')
--   areas.id=15 -> programa_id=3, eje_id=4
--   Ninguno de los dos indicadores tenia metas 2027 (nada que restaurar ahi).
--
-- Rastro (area 36) vivia en el PP 018 (id 4), eje E2 (id 2):
--   nodo 631  ACTIVIDAD   programa_id=4  padre_id=608 (Componente
--             'Ampliar los espacios publicos para el bienestar')
--             orden=2  indicador_id=34 (E2-RAS-A1.2-01, 'Actividad 1.2')
--   areas.id=36 -> programa_id=4, eje_id=2
--   El indicador 34 tenia estas metas 2027 (suma de meses = 100 = anual):
--     mes 0=100, 1=0, 2=0, 3=0, 4=0, 5=0, 6=50, 7=0, 8=50, 9=0, 10=0, 11=0, 12=0
--
-- Los indicadores 34, 71 y 87 NO se borran en el movimiento: se quedan como
-- los indicadores del ejercicio 2026, con sus metas y avances 2026 intactos.
-- Lo que se crea son tres indicadores NUEVOS para 2027.

BEGIN;

-- 1) Devolver los nodos a su programa y padre originales
UPDATE arbol_nodos SET programa_id = 3, padre_id = 975, orden = 8, indicador_id = 71
 WHERE id = 989 AND anio = 2027;
UPDATE arbol_nodos SET programa_id = 3, orden = 1, indicador_id = 87
 WHERE id = 990 AND anio = 2027;
UPDATE arbol_nodos SET programa_id = 4, padre_id = 608, orden = 2, indicador_id = 34
 WHERE id = 631 AND anio = 2027;

-- 2) Devolver las areas a su programa y eje originales
UPDATE areas SET programa_id = 3, eje_id = 4 WHERE id = 15;  -- Parquimetros -> 012 / E4
UPDATE areas SET programa_id = 4, eje_id = 2 WHERE id = 36;  -- Rastro       -> 018 / E2

-- 3) Devolver al indicador 34 su POA 2027. Los meses primero: el trigger
--    trg_metas_recalcula_anual escribe solo el renglon anual (mes 0) con la
--    suma, que da 100, igual que el original.
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES
  (34, 2027,  1,  0), (34, 2027,  2,  0), (34, 2027,  3,  0), (34, 2027,  4,  0),
  (34, 2027,  5,  0), (34, 2027,  6, 50), (34, 2027,  7,  0), (34, 2027,  8, 50),
  (34, 2027,  9,  0), (34, 2027, 10,  0), (34, 2027, 11,  0), (34, 2027, 12,  0)
ON CONFLICT (indicador_id, anio, mes) DO UPDATE SET valor = EXCLUDED.valor;

-- 4) Borrar los tres indicadores creados para 2027. Se identifican por clave
--    para no depender de los ids que haya asignado la secuencia.
--    OJO: correr esto DESPUES del paso 1, porque los nodos los referencian.
DELETE FROM metas WHERE indicador_id IN
  (SELECT id FROM indicadores WHERE clave IN ('E5-PAR-C7-01','E5-PAR-A7.1-01','E6-RAS-A4.5-01'))
  AND mes BETWEEN 1 AND 12;
DELETE FROM metas WHERE indicador_id IN
  (SELECT id FROM indicadores WHERE clave IN ('E5-PAR-C7-01','E5-PAR-A7.1-01','E6-RAS-A4.5-01'))
  AND mes = 0;
DELETE FROM indicadores WHERE clave IN ('E5-PAR-C7-01','E5-PAR-A7.1-01','E6-RAS-A4.5-01');

COMMIT;

-- Verificacion de la restauracion
-- Esperado: 012 = 26 niveles, 018 = 22, 032 = 21, 037 = 26; catalogo = 195;
--           metas_34_2027 = 13.
SELECT p.clave,
       (SELECT count(*) FROM v_mml_niveles v WHERE v.anio = 2027 AND v.programa_id = p.id) AS niveles_2027
  FROM programas p WHERE p.clave IN ('012','018','032','037') ORDER BY p.clave;
