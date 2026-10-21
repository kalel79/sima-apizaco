-- movimiento_movilidad_2027.sql
-- APLICADO EN PRODUCCION el 2026-10-21. NO RE-EJECUTAR.
-- Resultado: 005 = 24/28, 024 = 15/15 (niveles 2026/2027); 2026 sin cambios.
-- Rollback: scripts/sql/respaldo_movimiento_movilidad_2027.sql
--
-- QUE HACE
--   Movilidad y Transporte (area 37) pasa del PP 024 al PP 005 (Seguridad
--   Publica y Transito Vial): su Componente 3 y sus Actividades 3.1-3.3 pasan
--   a ser Componente 6 y Actividades 6.1-6.3 del 005. Su causa en el arbol de
--   problemas (nodo 871 y sus tres subcausas) se va con el.
--   SOLO PARA EL EJERCICIO 2027.
--
-- POR QUE AQUI SI SE MUEVEN LOS INDICADORES EXISTENTES
--   A diferencia de Parquimetros/Rastro, los indicadores 187-190 solo estan en
--   la MIR 2027 (ningun nodo 2026, ningun avance, evidencia ni hallazgo), y el
--   area 37 no tenia MIR 2026. Reescribir clave/nivel/programa no contradice
--   nada del 2026, asi que no hace falta crear indicadores nuevos y las metas
--   2027 se quedan donde estan.
--
-- ORDEN: el 005 numera sus nodos de 4 en 4 (componente 5 = orden 23, sus
--   actividades 24-28), asi que el Componente 6 entra con orden 29 y sus
--   actividades con 30-32. Igual para la causa y sus subcausas.
--
-- IDS UTILES: programas 005=2, 024=6. Ejes E1=1, E3=3.
--   Raices 2027: 005 problema=527 objetivo=554; 024 problema=731 objetivo=751.

BEGIN;

-- 1) Arbol de problemas: la causa y sus subcausas
UPDATE arbol_nodos SET programa_id = 2, padre_id = 527, orden = 29
 WHERE id = 871 AND anio = 2027 AND programa_id = 6;
UPDATE arbol_nodos SET programa_id = 2, orden = v.orden
  FROM (VALUES (872, 30), (873, 31), (874, 32)) AS v(id, orden)
 WHERE arbol_nodos.id = v.id AND arbol_nodos.anio = 2027 AND arbol_nodos.padre_id = 871;

-- 2) Arbol de objetivos: el componente y sus actividades
UPDATE arbol_nodos SET programa_id = 2, padre_id = 554, orden = 29
 WHERE id = 867 AND anio = 2027 AND programa_id = 6;
UPDATE arbol_nodos SET programa_id = 2, orden = v.orden
  FROM (VALUES (868, 30), (869, 31), (870, 32)) AS v(id, orden)
 WHERE arbol_nodos.id = v.id AND arbol_nodos.anio = 2027 AND arbol_nodos.padre_id = 867;

-- 3) Indicadores: nuevo programa, clave con eje E1 y numeracion del 005
UPDATE indicadores SET programa_id = 2, clave = v.clave, nivel_mir = v.nivel_mir
  FROM (VALUES
    (187, 'E1-MT-C6-01',   'Componente 6'),
    (188, 'E1-MT-A6.1-01', 'Actividad 6.1'),
    (189, 'E1-MT-A6.2-01', 'Actividad 6.2'),
    (190, 'E1-MT-A6.3-01', 'Actividad 6.3')
  ) AS v(id, clave, nivel_mir)
 WHERE indicadores.id = v.id AND indicadores.programa_id = 6;

-- 4) El area sigue a sus indicadores (getProgramaIdDeArea, src/lib/mml.js)
UPDATE areas SET programa_id = 2, eje_id = 1 WHERE id = 37;

COMMIT;

-- VERIFICACION
SELECT p.clave,
       (SELECT count(*) FROM v_mml_niveles v WHERE v.anio = 2026 AND v.programa_id = p.id) AS n2026,
       (SELECT count(*) FROM v_mml_niveles v WHERE v.anio = 2027 AND v.programa_id = p.id) AS n2027
  FROM programas p WHERE p.clave IN ('005','024') ORDER BY p.clave;
