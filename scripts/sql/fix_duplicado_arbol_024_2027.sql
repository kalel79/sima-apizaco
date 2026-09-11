-- fix_duplicado_arbol_024_2027.sql
-- APLICADO EN PRODUCCIÓN el 2026-09-11. NO RE-EJECUTAR (el WHERE es
-- idempotente: si se corre de nuevo no afecta filas).
--
-- Tercer caso del mismo problema que atacó `fix_duplicados_arbol_2027.sql` el
-- 2026-09-07 y que se quedó fuera de aquella pasada: un indicador colgado de
-- DOS nodos dentro del mismo ejercicio. v_mml_captura_nivel lee la ficha y las
-- metas DEL INDICADOR, no del nodo, así que el segundo nodo se lleva de regalo
-- los 7 puntos de ficha y las 12 metas del primero.
--
-- Estado previo (respaldo por si hay que revertir):
--   nodo 753 (PP 024/2027, MEDIO hijo del Propósito 751, área 8 Obras
--             Públicas, texto "Mejora de la infraestructura urbana")
--             indicador_id = 60   -> debía ser 49
--   nodo 767 (PP 024/2027, MEDIO hijo del Componente 2 (755), texto
--             "Coordinación interinstitucional efectiva entre Obras Públicas,
--             Servicios Municipales...")   indicador_id = 60  <- correcto
--
-- Por qué el 49 y no otro: el nodo 753 es estructuralmente el COMPONENTE 1 del
-- 024 —cuelga del Propósito y es el padre de las Actividades 1.1 a 1.6 (nodos
-- 760, 763, 764, 766, 769, 770, con los indicadores E3-OP-A1.1-01 .. A1.6-01)—
-- y su `area_responsable_id` es 8 (Obras Públicas). El indicador 49
-- (E3-OP-C1-01, "Porcentaje de obras de rehabilitación y modernización de
-- infraestructura urbana concluidas respecto al total programado", nivel_mir
-- 'Componente 1', área 8) estaba en la MIR 2026 y se había quedado SIN NINGÚN
-- NODO en 2027. El 60 (E3-IU-A2.4-01) es de Imagen Urbana (área 9) y se queda
-- únicamente en su Actividad 2.4, el nodo 767.
--
-- CONSECUENCIA ESPERADA Y CORRECTA: el avance de captura de Obras Públicas en
-- 2027 BAJA, porque deja de contar lo que no era suyo. El nodo 753 pasa de
-- d_ficha 7 y d_metas 12 (prestados del indicador 60) a d_ficha 4 y d_metas 0,
-- que es lo que el indicador 49 tiene de verdad: le faltan definición, fórmula
-- y año de línea base, y su POA 2027 está vacío. Imagen Urbana no se mueve.
-- NO se siembran metas en cero para maquillarlo.

UPDATE arbol_nodos
   SET indicador_id = 49
 WHERE id = 753 AND anio = 2027 AND indicador_id = 60;

-- Verificación (esperado: 'ninguno' en los dos renglones)
SELECT 'repetidos_en_arbol' AS chk,
       COALESCE(string_agg(anio || ':ind ' || indicador_id || ' x' || c, ', '), 'ninguno') AS detalle
  FROM (SELECT anio, indicador_id, count(*) c FROM arbol_nodos
         WHERE indicador_id IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1) t
UNION ALL
SELECT 'repetidos_en_MIR',
       COALESCE(string_agg(anio || ':ind ' || indicador_id || ' x' || c, ', '), 'ninguno')
  FROM (SELECT anio, indicador_id, count(*) c FROM v_mml_niveles
         WHERE anio IN (2026,2027) AND indicador_id IS NOT NULL
         GROUP BY 1,2 HAVING count(*) > 1) t2;

-- ROLLBACK
-- UPDATE arbol_nodos SET indicador_id = 60 WHERE id = 753;
