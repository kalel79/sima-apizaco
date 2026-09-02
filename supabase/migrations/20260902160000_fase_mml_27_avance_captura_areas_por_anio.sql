-- fase_mml_27 — v_avance_captura_areas cuenta solo los indicadores del ejercicio
--
-- `indicadores` es un catálogo acumulado sin columna de año (fase_mml_21): el
-- año se deriva de los nodos que lo referencian (mir_niveles en 2026,
-- arbol_nodos de 2027 en adelante) y v_indicador_anio unifica ambas fuentes.
-- La vista hacía LEFT JOIN indicadores sin filtro, así que los 23 indicadores
-- sembrados para la MIR 2027 entraron al denominador del mes en curso de 8
-- áreas: el tablero de Planeación pedía 193 indicadores cuando 2026 tiene 170,
-- Secretaría del Ayuntamiento aparecía EN PROGRESO al 50% teniendo su mes
-- completo, y Movilidad y Transporte y el Módulo Canino salían PENDIENTE sin
-- tener un solo indicador de 2026.
--
-- Criterio del filtro (el mismo de esDelAnio() en src/lib/consultas.js): un
-- indicador huérfano —sin nodo en ningún ejercicio— se deja pasar en todos los
-- años, así el filtro nunca esconde nada en silencio; solo saca de la cuenta lo
-- que positivamente se sabe de otro año.
--
-- security_invoker=true se conserva a propósito (fase01): las áreas, los
-- indicadores y los avances se leen con los permisos de quien consulta. La
-- subconsulta a v_indicador_anio corre con derechos del PROPIETARIO porque esa
-- vista es owner-rights desde fase_mml_21, precisamente para que el rol
-- `coordinador` —a quien fase_mml_06 dejó fuera del SELECT de mir_niveles y
-- arbol_nodos— no pierda filas al aplicarse el filtro.
--
-- Efecto verificado contra producción (agosto 2026) antes de aplicar: cambian 8
-- áreas y ninguna pierde avances capturados.
--   Sindicatura 10->4, Dirección Jurídica 10->6, Instituto Municipal de la Mujer
--   16->14, Movilidad y Transporte 4->0, Gobernación 4->2, Secretaría del
--   Ayuntamiento 4->2, Coordinación del Módulo Canino 3->0, Desarrollo Social
--   11->10. Las otras 28 áreas quedan idénticas.

CREATE OR REPLACE VIEW public.v_avance_captura_areas
WITH (security_invoker = true) AS
WITH mes AS (
  SELECT get_mes_actual() AS m, get_anio_actual() AS a
)
SELECT ar.id AS area_id,
       ar.nombre AS area,
       count(i.id) AS total_indicadores,
       count(av.id) AS capturados,
       count(av.id) FILTER (WHERE av.validado = true) AS validados,
       CASE WHEN count(i.id) > 0
            THEN round(count(av.id)::numeric / count(i.id)::numeric * 100::numeric, 1)
            ELSE NULL::numeric END AS pct_captura,
       CASE WHEN count(i.id) > 0
            THEN round(count(av.id) FILTER (WHERE av.validado = true)::numeric / count(i.id)::numeric * 100::numeric, 1)
            ELSE NULL::numeric END AS pct_validacion,
       CASE WHEN count(i.id) = 0            THEN 'SIN INDICADORES'::text
            WHEN count(av.id) = 0           THEN 'PENDIENTE'::text
            WHEN count(av.id) = count(i.id) THEN 'COMPLETO'::text
            ELSE 'EN PROGRESO'::text END AS estado_captura,
       mes.m AS mes_actual,
       mes.a AS anio_actual
  FROM areas ar
  CROSS JOIN mes
  LEFT JOIN indicadores i
         ON i.area_id = ar.id
        AND (NOT EXISTS (SELECT 1 FROM v_indicador_anio va
                          WHERE va.indicador_id = i.id)
             OR EXISTS (SELECT 1 FROM v_indicador_anio va
                         WHERE va.indicador_id = i.id AND va.anio = mes.a))
  LEFT JOIN avances av
         ON av.indicador_id = i.id AND av.mes = mes.m AND av.anio = mes.a
 GROUP BY ar.id, ar.nombre, mes.m, mes.a
 ORDER BY ar.nombre;
