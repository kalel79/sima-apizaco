-- ============================================================================
-- Diagnostico: a que anio(s) pertenece cada indicador
-- ----------------------------------------------------------------------------
-- Contexto: public.indicadores NO tiene columna anio; es un catalogo acumulado.
-- El anio de un indicador se deriva de los nodos que lo referencian:
--   · mir_niveles.anio  -> fuente historica del 2026 (fase_mml_02)
--   · arbol_nodos.anio  -> fuente vigente del 2027 en adelante (fase_mml_05)
--
-- Un indicador que sigue vigente aparece en VARIOS anios: copiarArbolDeAnioAnterior()
-- (src/lib/mml.js:341) arrastra indicador_id al copiar el arbol 2026 -> 2027, asi
-- que el nodo es nuevo pero apunta a la MISMA fila de indicadores.
--
-- Solo lecturas: no cambia nada. Correr en Supabase Dashboard -> SQL Editor.
-- ============================================================================


-- ############################################################################
-- CONSULTA 0 — RESUMEN EN UNA SOLA SALIDA  ← CORRE ESTA
-- ----------------------------------------------------------------------------
-- El SQL Editor de Supabase solo muestra el resultado del ULTIMO SELECT cuando
-- se corren varias sentencias juntas. Esta consulta devuelve todo el
-- diagnostico en una sola tabla, asi que basta con seleccionarla y correrla.
-- No depende de la vista v_indicador_anio: funciona este o no aplicada.
-- ############################################################################

WITH ia AS (
  SELECT indicador_id, anio FROM public.mir_niveles WHERE indicador_id IS NOT NULL AND activo
  UNION
  SELECT indicador_id, anio FROM public.arbol_nodos WHERE indicador_id IS NOT NULL
),
p AS (
  SELECT i.id,
         coalesce(bool_or(ia.anio = 2026), false) AS en_2026,
         coalesce(bool_or(ia.anio = 2027), false) AS en_2027
  FROM public.indicadores i
  LEFT JOIN ia ON ia.indicador_id = i.id
  GROUP BY i.id
)
            SELECT 1 AS orden, 'total en el catalogo'          AS metrica, count(*)::text AS valor FROM public.indicadores
UNION ALL   SELECT 2, 'anios presentes',        (SELECT string_agg(DISTINCT anio::text, ', ' ORDER BY anio::text) FROM ia)
UNION ALL   SELECT 3, 'indicadores 2026',        (SELECT count(DISTINCT indicador_id)::text FROM ia WHERE anio = 2026)
UNION ALL   SELECT 4, 'indicadores 2027',        (SELECT count(DISTINCT indicador_id)::text FROM ia WHERE anio = 2027)
UNION ALL   SELECT 5, 'en ambos (migran)',       (SELECT count(*)::text FROM p WHERE en_2026 AND en_2027)
UNION ALL   SELECT 6, 'solo 2026 (no migraron)', (SELECT count(*)::text FROM p WHERE en_2026 AND NOT en_2027)
UNION ALL   SELECT 7, 'solo 2027 (nuevos)',      (SELECT count(*)::text FROM p WHERE en_2027 AND NOT en_2026)
UNION ALL   SELECT 8, 'HUERFANOS (ningun anio)', (SELECT count(*)::text FROM p WHERE NOT en_2026 AND NOT en_2027)
ORDER BY orden;


-- ── Consultas de detalle (correr UNA A LA VEZ, ver nota del SQL Editor) ─────
-- (se repite el CTE en cada una para que cada bloque se pueda correr suelto)

-- 1) Totales: cuantos indicadores hay y cuantos quedan fuera de todo anio
SELECT
  (SELECT count(*) FROM public.indicadores)                   AS total_catalogo,
  (SELECT count(*) FROM public.indicadores WHERE activo)      AS activos,
  (SELECT count(*) FROM public.indicadores WHERE NOT activo)  AS inactivos;


-- 2) Indicadores por anio, y de que fuente sale el enlace.
--    Esperado: 2026 ~170. 2027 = los copiados + los nuevos (NO solo los nuevos).
WITH ia AS (
  SELECT DISTINCT indicador_id, anio, 'mir_niveles' AS fuente
  FROM public.mir_niveles WHERE indicador_id IS NOT NULL AND activo
  UNION
  SELECT DISTINCT indicador_id, anio, 'arbol_nodos'
  FROM public.arbol_nodos WHERE indicador_id IS NOT NULL
)
SELECT anio,
       count(DISTINCT indicador_id)                                        AS indicadores,
       count(DISTINCT indicador_id) FILTER (WHERE fuente = 'mir_niveles')  AS via_mir_niveles,
       count(DISTINCT indicador_id) FILTER (WHERE fuente = 'arbol_nodos')  AS via_arbol_nodos
FROM ia
GROUP BY anio
ORDER BY anio;


-- 3) Traslape 2026 / 2027: cuantos migran, cuantos son nuevos, cuantos se quedaron.
--    Esto es lo que responde "¿cuantos del 2026 pasan al 2027?".
WITH ia AS (
  SELECT DISTINCT indicador_id, anio FROM public.mir_niveles WHERE indicador_id IS NOT NULL AND activo
  UNION
  SELECT DISTINCT indicador_id, anio FROM public.arbol_nodos WHERE indicador_id IS NOT NULL
),
p AS (
  SELECT i.id,
         coalesce(bool_or(ia.anio = 2026), false) AS en_2026,
         coalesce(bool_or(ia.anio = 2027), false) AS en_2027
  FROM public.indicadores i
  LEFT JOIN ia ON ia.indicador_id = i.id
  GROUP BY i.id
)
SELECT
  count(*) FILTER (WHERE en_2026 AND en_2027)          AS en_ambos_migran,
  count(*) FILTER (WHERE en_2026 AND NOT en_2027)      AS solo_2026_no_migraron,
  count(*) FILTER (WHERE en_2027 AND NOT en_2026)      AS solo_2027_nuevos,
  count(*) FILTER (WHERE NOT en_2026 AND NOT en_2027)  AS en_ningun_anio
FROM p;


-- 4) Avance de la copia 2026 -> 2027 por programa.
--    Un programa con nodos_2027 = 0 todavia no se ha copiado: al filtrar
--    Captura por anio, ese programa aparecera vacio en 2027 (correcto, pero
--    conviene saberlo antes de prender el filtro).
SELECT pr.id AS programa_id, pr.clave, pr.nombre,
       count(DISTINCT n26.indicador_id) AS indicadores_2026,
       count(DISTINCT n27.indicador_id) AS indicadores_2027
FROM public.programas pr
LEFT JOIN public.arbol_nodos n26
       ON n26.programa_id = pr.id AND n26.anio = 2026 AND n26.indicador_id IS NOT NULL
LEFT JOIN public.arbol_nodos n27
       ON n27.programa_id = pr.id AND n27.anio = 2027 AND n27.indicador_id IS NOT NULL
GROUP BY pr.id, pr.clave, pr.nombre
ORDER BY pr.clave;


-- 5) Huerfanos: indicadores que no cuelgan de NINGUN nodo de ningun anio.
--    Si esto devuelve filas, un filtro por anio los ocultaria de Captura.
--    Hay que decidir que hacer con ellos ANTES de aplicar el filtro.
WITH ia AS (
  SELECT DISTINCT indicador_id FROM public.mir_niveles WHERE indicador_id IS NOT NULL AND activo
  UNION
  SELECT DISTINCT indicador_id FROM public.arbol_nodos WHERE indicador_id IS NOT NULL
)
SELECT i.id, i.clave, i.nombre, i.area_id, i.programa_id, i.nivel_mir,
       i.activo, i.created_at
FROM public.indicadores i
WHERE NOT EXISTS (SELECT 1 FROM ia WHERE ia.indicador_id = i.id)
ORDER BY i.created_at;


-- 6) Los ultimos creados: para ver con nombre y apellido cuales son los "de mas"
--    y confirmar que son del 2027.
WITH ia AS (
  SELECT DISTINCT indicador_id, anio FROM public.mir_niveles WHERE indicador_id IS NOT NULL AND activo
  UNION
  SELECT DISTINCT indicador_id, anio FROM public.arbol_nodos WHERE indicador_id IS NOT NULL
)
SELECT i.id, i.clave, i.nombre, a.nombre AS area, i.nivel_mir, i.created_at,
       (SELECT string_agg(DISTINCT ia.anio::text, ', ' ORDER BY ia.anio::text)
          FROM ia WHERE ia.indicador_id = i.id) AS anios
FROM public.indicadores i
LEFT JOIN public.areas a ON a.id = i.area_id
ORDER BY i.created_at DESC
LIMIT 25;


-- 7) Contraste con lo que hoy ve la pantalla de Captura:
--    getIndicadoresLista() (src/lib/consultas.js:333) trae la tabla completa,
--    sin filtro de anio y sin filtrar activo. Este numero es el "180".
SELECT count(*) AS lo_que_hoy_muestra_captura FROM public.indicadores;
