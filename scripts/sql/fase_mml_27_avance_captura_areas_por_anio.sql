-- ═══════════════════════════════════════════════════════════════════════════
-- fase_mml_27 — v_avance_captura_areas cuenta solo los indicadores del ejercicio
-- Pegar COMPLETO en el SQL Editor del Dashboard de Supabase y ejecutar.
-- Copia de supabase/migrations/20260902160000_fase_mml_27_*.sql con la
-- verificación al final (el editor solo muestra el resultado del último SELECT).
-- ═══════════════════════════════════════════════════════════════════════════
--
-- `indicadores` es un catálogo acumulado sin columna de año (fase_mml_21): el
-- año se deriva de los nodos que lo referencian (mir_niveles en 2026,
-- arbol_nodos de 2027 en adelante) y v_indicador_anio unifica ambas fuentes.
-- La vista hacía LEFT JOIN indicadores sin filtro, así que los indicadores
-- sembrados para la MIR 2027 entraron al denominador del mes en curso de 8
-- áreas: el tablero de Planeación pedía 194 indicadores cuando 2026 tiene 170,
-- Secretaría del Ayuntamiento aparecía EN PROGRESO al 50% teniendo su mes
-- completo, y Movilidad y Transporte y el Módulo Canino salían PENDIENTE sin
-- tener un solo indicador de 2026.
--
-- Criterio del filtro (el mismo de esDelAnio() en src/lib/consultas.js): un
-- indicador huérfano —sin nodo en ningún ejercicio— se deja pasar en todos los
-- años, así el filtro nunca esconde nada en silencio; solo saca de la cuenta lo
-- que positivamente se sabe de otro año.
--
-- security_invoker=true se conserva a propósito (fase01): áreas, indicadores y
-- avances se leen con los permisos de quien consulta. La subconsulta a
-- v_indicador_anio corre con derechos del PROPIETARIO porque esa vista es
-- owner-rights desde fase_mml_21, precisamente para que el rol `coordinador`
-- —a quien fase_mml_06 dejó fuera del SELECT de mir_niveles y arbol_nodos— no
-- pierda filas al aplicarse el filtro.

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

-- ── Verificación consolidada ───────────────────────────────────────────────
-- Esperado: security_invoker sigue en true, el total del tablero baja de 194 a
-- 170 (los indicadores de 2026), y las 8 áreas que cambian son Sindicatura,
-- Dirección Jurídica, IMM, Movilidad y Transporte, Gobernación, Secretaría del
-- Ayuntamiento, Módulo Canino y Desarrollo Social. Ninguna pierde capturados.
SELECT 'security_invoker'                    AS concepto,
       (SELECT reloptions::text FROM pg_class
         WHERE oid = 'public.v_avance_captura_areas'::regclass) AS valor
UNION ALL
SELECT 'total de indicadores que pide el tablero',
       (SELECT sum(total_indicadores)::text FROM v_avance_captura_areas)
UNION ALL
SELECT 'indicadores del ejercicio activo (debe coincidir)',
       (SELECT count(*)::text FROM indicadores i
         WHERE NOT EXISTS (SELECT 1 FROM v_indicador_anio va WHERE va.indicador_id = i.id)
            OR EXISTS (SELECT 1 FROM v_indicador_anio va
                        WHERE va.indicador_id = i.id AND va.anio = get_anio_actual()))
UNION ALL
SELECT 'areas que ya no piden indicadores de otro ejercicio',
       (SELECT count(*)::text FROM v_avance_captura_areas WHERE estado_captura = 'SIN INDICADORES')
UNION ALL
SELECT 'avances capturados en total (no debe bajar)',
       (SELECT sum(capturados)::text FROM v_avance_captura_areas)
UNION ALL
SELECT 'Secretaria del Ayuntamiento',
       (SELECT capturados || '/' || total_indicadores || ' — ' || estado_captura
          FROM v_avance_captura_areas WHERE area = 'Secretaría del Ayuntamiento');
