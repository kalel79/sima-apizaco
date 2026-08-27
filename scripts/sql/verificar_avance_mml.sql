-- ============================================================================
-- Verificacion de las vistas de avance del Expediente MML (fase_mml_22)
-- ----------------------------------------------------------------------------
-- Correr DESPUES de aplicar 20260827210000_fase_mml_22_avance_captura_mml.sql.
-- Solo lecturas.
--
-- Lo que se esta comprobando es que v_mml_niveles reproduce en SQL, sin
-- desviarse, la derivacion de la MIR que hoy hace derivarNivelesMIR() en JS
-- (src/lib/mml.js). Si eso esta bien, el resto son sumas.
-- ============================================================================


-- ############################################################################
-- CHEQUEO 1 — CONSOLIDADO  ← CORRE ESTA PRIMERO
-- Devuelve todo en una sola tabla (el SQL Editor solo muestra el ultimo SELECT).
-- ############################################################################

WITH niveles AS (SELECT * FROM public.v_mml_niveles),
     cap     AS (SELECT * FROM public.v_mml_captura_nivel)
            SELECT 1 AS orden, 'anios con arbol'                AS chequeo,
                   (SELECT string_agg(DISTINCT anio::text, ', ' ORDER BY anio::text) FROM niveles) AS valor,
                   ''::text AS esperado
UNION ALL   SELECT 2, 'niveles 2026 (v_mml_niveles)',
                   (SELECT count(*)::text FROM niveles WHERE anio = 2026),
                   'comparar con el renglon 3'
UNION ALL   SELECT 3, 'niveles 2026 (mir_niveles, historico)',
                   (SELECT count(*)::text FROM public.mir_niveles WHERE anio = 2026 AND activo),
                   'fase_mml_02 documento 170'
UNION ALL   SELECT 4, 'niveles 2027 (v_mml_niveles)',
                   (SELECT count(*)::text FROM niveles WHERE anio = 2027), ''
UNION ALL   SELECT 5, 'niveles sin area (deben ser solo FIN/PROPOSITO)',
                   (SELECT count(*)::text FROM niveles WHERE area_responsable_id IS NULL), ''
UNION ALL   SELECT 6, 'de esos, cuantos NO son FIN/PROPOSITO',
                   (SELECT count(*)::text FROM niveles
                     WHERE area_responsable_id IS NULL AND nivel NOT IN ('FIN','PROPOSITO')),
                   'debe ser 0'
UNION ALL   SELECT 7, 'un solo FIN y un solo PROPOSITO por programa/anio',
                   (SELECT coalesce(count(*)::text,'0') FROM (
                      SELECT programa_id, anio, nivel FROM niveles
                      WHERE nivel IN ('FIN','PROPOSITO')
                      GROUP BY programa_id, anio, nivel HAVING count(*) > 1) x),
                   'debe ser 0'
UNION ALL   SELECT 8, 'datos capturados 2027 / esperados',
                   (SELECT sum(d_mir + d_riesgos + d_ficha + d_metas)::text || ' / ' || (count(*) * 22)::text
                      FROM cap WHERE anio = 2027), ''
UNION ALL   SELECT 9, 'suma por area + sin area = total niveles 2027',
                   (SELECT (SELECT coalesce(sum(total_niveles),0) FROM public.v_avance_mml_areas WHERE anio = 2027)::text
                           || ' + ' ||
                           (SELECT count(*) FROM niveles WHERE anio = 2027 AND area_responsable_id IS NULL)::text
                           || ' = ' ||
                           (SELECT count(*) FROM niveles WHERE anio = 2027)::text),
                   'la suma debe cuadrar'
ORDER BY orden;


-- ############################################################################
-- CHEQUEO 2 — Desglose de niveles por tipo y anio.
-- Para 2026, fase_mml_02 dejo asentado en mir_niveles: 9 FIN, 9 PROPOSITO,
-- 45 COMPONENTE, 107 ACTIVIDAD (170). Si v_mml_niveles se aleja mucho de eso
-- para 2026, la derivacion desde arbol_nodos no esta coincidiendo con la MIR
-- historica y hay que revisarla ANTES de confiar en los porcentajes.
-- ############################################################################

SELECT anio, nivel, count(*) AS niveles
FROM   public.v_mml_niveles
GROUP  BY anio, nivel
ORDER  BY anio, CASE nivel WHEN 'FIN' THEN 1 WHEN 'PROPOSITO' THEN 2
                           WHEN 'COMPONENTE' THEN 3 ELSE 4 END;


-- ############################################################################
-- CHEQUEO 3 — El avance por area, tal cual lo vera la pantalla.
-- ############################################################################

SELECT area, total_niveles, pct_mir, pct_riesgos, pct_ficha, pct_metas,
       pct_global, estado_captura
FROM   public.v_avance_mml_areas
WHERE  anio = 2027
ORDER  BY total_niveles DESC, area;


-- ############################################################################
-- CHEQUEO 4 — Contraste crudo de UN area contra las tablas base, sin pasar por
-- las vistas. Cambia el area_id por uno que si tenga niveles (chequeo 3).
-- Los dos renglones deben coincidir.
-- ############################################################################

WITH param AS (SELECT 37 AS area_id, 2027 AS anio)   -- <- ajusta aqui
SELECT 'via vistas' AS fuente,
       v.total_niveles, v.mir_capturados, v.riesgos_capturados,
       v.ficha_capturados, v.metas_capturados
FROM   public.v_avance_mml_areas v, param p
WHERE  v.area_id = p.area_id AND v.anio = p.anio
UNION ALL
SELECT 'via tablas base',
       count(*),
       count(n.indicador_id),
       sum((nullif(btrim(n.supuestos),'') IS NOT NULL)::int
         + (nullif(btrim(n.medios_verificacion),'') IS NOT NULL)::int),
       sum((nullif(btrim(i.definicion),'') IS NOT NULL)::int
         + (nullif(btrim(i.formula),'') IS NOT NULL)::int
         + (nullif(btrim(i.tipo_indicador),'') IS NOT NULL)::int
         + (nullif(btrim(i.dimension),'') IS NOT NULL)::int
         + (nullif(btrim(i.sentido),'') IS NOT NULL)::int
         + (i.linea_base_anio IS NOT NULL)::int
         + (nullif(btrim(i.interpretacion),'') IS NOT NULL)::int),
       (SELECT count(*) FROM public.metas m, param p2
         WHERE m.anio = p2.anio AND m.mes BETWEEN 1 AND 12 AND m.valor IS NOT NULL
           AND m.indicador_id IN (SELECT indicador_id FROM public.v_mml_niveles
                                   WHERE area_responsable_id = p2.area_id AND anio = p2.anio
                                     AND indicador_id IS NOT NULL))
FROM   public.v_mml_niveles n
LEFT   JOIN public.indicadores i ON i.id = n.indicador_id
CROSS  JOIN param p
WHERE  n.area_responsable_id = p.area_id AND n.anio = p.anio;
