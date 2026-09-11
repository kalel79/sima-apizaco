-- fix_duplicados_arbol_2027.sql
-- APLICADO EN PRODUCCION el 2026-09-07. NO RE-EJECUTAR (los WHERE son
-- idempotentes: si se corre de nuevo no afecta filas).
--
-- Contexto: al mapear el Expediente MML 2026 vs 2027 aparecieron dos
-- indicadores repetidos dentro de un mismo ejercicio en `arbol_nodos`, cosa
-- que la MIR no admite y que ademas infla el reporte de avance de captura,
-- porque v_mml_captura_nivel lee ficha y metas DEL INDICADOR, no del nodo:
-- un indicador colgado de dos nodos le regala al segundo nodo los 7 puntos
-- de ficha y las 12 metas del primero.
--
-- Estado previo (respaldo por si hay que revertir):
--   nodo 559 (PP 005/2027, COMPONENTE "Justicia civica y mediacion
--             comunitaria")          indicador_id = 11   -> debia ser 4
--   nodo 550 (PP 005/2027, FIN hijo del FIN_GENERAL 549) indicador_id = 1
--   indicadores.nivel_mir del id 174                     = 'Proposito'

-- 1) PP 005 / 2027: el Componente 2 apuntaba al indicador de su Actividad 2.1.
--    El arbol 2027 es copia nodo por nodo del 2026 (mismos textos) y ahi el
--    Componente lleva el indicador 4 (E1-JM-C2-01); solo este nodo quedo mal.
--    El 11 (E1-JM-A2.1-01) se queda unicamente en la Actividad 2.1 (nodo 560).
UPDATE arbol_nodos
   SET indicador_id = 4
 WHERE id = 559 AND anio = 2027 AND indicador_id = 11;

-- 2) PP 005 / 2027: el FIN 550 cuelga del FIN_GENERAL 549 (es un fin
--    indirecto del arbol de objetivos, no el Fin de la MIR) y repetia el
--    indicador 1 del 549. v_mml_niveles solo renderiza el FIN_GENERAL, asi
--    que el nodo era invisible en la MIR pero contaba como repetido. Los
--    demas fines indirectos (551, 552, 553) ya tienen indicador_id NULL.
UPDATE arbol_nodos
   SET indicador_id = NULL
 WHERE id = 550 AND anio = 2027 AND tipo = 'FIN' AND indicador_id = 1;

-- 3) PP 003 / 2027: el indicador 174 esta bien colocado en el nodo FIN (519)
--    pero su etiqueta decia 'Proposito'. El Proposito del 003 es el 175.
UPDATE indicadores
   SET nivel_mir = 'Fin'
 WHERE id = 174 AND nivel_mir = 'Proposito';

-- NOTA: NO se sembraron metas 2027 para el indicador 4. Se intento y se
-- revirtio: v_mml_captura_nivel cuenta como capturado cualquier valor NOT
-- NULL, asi que 12 ceros dejaban al Juzgado Municipal en 97.7% "capturado"
-- sin que el area hubiera capturado nada. Sin filas, el POA del Componente 2
-- se ve pendiente (36/48 metas, 84.1%), que es lo correcto, y la pestana POA
-- hace upsert, asi que el enlace puede capturar sin filas previas.

-- Verificacion (esperado: 'ninguno' en los tres renglones)
SELECT 'repetidos_en_arbol' AS chk,
       COALESCE(string_agg(anio || ':ind ' || indicador_id || ' x' || c, ', '), 'ninguno') AS detalle
  FROM (SELECT anio, indicador_id, count(*) c FROM arbol_nodos
         WHERE indicador_id IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1) t
UNION ALL
SELECT 'repetidos_en_MIR',
       COALESCE(string_agg(anio || ':ind ' || indicador_id || ' x' || c, ', '), 'ninguno')
  FROM (SELECT anio, indicador_id, count(*) c FROM v_mml_niveles
         WHERE anio IN (2026,2027) AND indicador_id IS NOT NULL
         GROUP BY 1,2 HAVING count(*) > 1) t2
UNION ALL
SELECT 'nivel_nodo <> nivel_indicador',
       COALESCE(string_agg(anio || ':nodo ' || nodo || ' (' || nivel || ' vs ' || nivel_mir || ')', ', '), 'ninguno')
  FROM (SELECT v.anio, v.id AS nodo, v.nivel, i.nivel_mir,
               CASE upper(split_part(i.nivel_mir,' ',1))
                 WHEN 'FIN' THEN 'FIN' WHEN 'PROPOSITO' THEN 'PROPOSITO'
                 WHEN 'COMPONENTE' THEN 'COMPONENTE' WHEN 'ACTIVIDAD' THEN 'ACTIVIDAD'
                 ELSE 'OTRO' END AS ni
          FROM v_mml_niveles v JOIN indicadores i ON i.id = v.indicador_id
         WHERE v.anio IN (2026,2027)) t3
 WHERE ni <> nivel;

-- ROLLBACK
-- UPDATE arbol_nodos SET indicador_id = 11 WHERE id = 559;
-- UPDATE arbol_nodos SET indicador_id = 1  WHERE id = 550;
-- UPDATE indicadores SET nivel_mir = 'Proposito' WHERE id = 174;
