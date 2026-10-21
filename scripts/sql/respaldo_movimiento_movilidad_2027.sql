-- respaldo_movimiento_movilidad_2027.sql
-- Respaldo del estado PREVIO, tomado el 2026-10-21 antes de correr
-- scripts/sql/movimiento_movilidad_2027.sql
--
-- ESTE ARCHIVO NO SE EJECUTA EN CONDICIONES NORMALES: es el rollback.
--
-- ESTADO PREVIO
--
-- Movilidad y Transporte (area 37) vivia en el PP 024 (id 6), eje E3 (id 3):
--   nodo 871  CAUSA  programa_id=6  padre_id=731 (problema central del 024)  orden=3
--     872, 873, 874  CAUSA  padre_id=871  orden=1,2,3
--   nodo 867  MEDIO  programa_id=6  padre_id=751 (objetivo raiz del 024)  orden=3
--             indicador 187 (E3-MT-C3-01, 'Componente 3')
--     868  orden=1  indicador 188 (E3-MT-A3.1-01, 'Actividad 3.1')
--     869  orden=2  indicador 189 (E3-MT-A3.2-01, 'Actividad 3.2')
--     870  orden=3  indicador 190 (E3-MT-A3.3-01, 'Actividad 3.3')
--   indicadores 187-190 -> programa_id=6
--   areas.id=37 -> programa_id=6, eje_id=3
--   Las metas 2027 de 187-190 no se tocan en el movimiento (mismo indicador).

BEGIN;

UPDATE arbol_nodos SET programa_id = 6, padre_id = 731, orden = 3 WHERE id = 871 AND anio = 2027;
UPDATE arbol_nodos SET programa_id = 6, orden = v.orden
  FROM (VALUES (872, 1), (873, 2), (874, 3)) AS v(id, orden)
 WHERE arbol_nodos.id = v.id AND arbol_nodos.anio = 2027;

UPDATE arbol_nodos SET programa_id = 6, padre_id = 751, orden = 3 WHERE id = 867 AND anio = 2027;
UPDATE arbol_nodos SET programa_id = 6, orden = v.orden
  FROM (VALUES (868, 1), (869, 2), (870, 3)) AS v(id, orden)
 WHERE arbol_nodos.id = v.id AND arbol_nodos.anio = 2027;

UPDATE indicadores SET programa_id = 6, clave = v.clave, nivel_mir = v.nivel_mir
  FROM (VALUES
    (187, 'E3-MT-C3-01',   'Componente 3'),
    (188, 'E3-MT-A3.1-01', 'Actividad 3.1'),
    (189, 'E3-MT-A3.2-01', 'Actividad 3.2'),
    (190, 'E3-MT-A3.3-01', 'Actividad 3.3')
  ) AS v(id, clave, nivel_mir)
 WHERE indicadores.id = v.id;

UPDATE areas SET programa_id = 6, eje_id = 3 WHERE id = 37;

COMMIT;
