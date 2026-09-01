-- ============================================================
-- FIX — Ciclo en el Árbol de Objetivos del PP 032 / 2027
-- Aplicado en producción por MCP el 2026-09-01.  NO RE-EJECUTAR.
--
-- SÍNTOMA (reportado por Hugo): el Módulo Canino no aparecía en el Árbol de
--   Objetivos, la MIR ni el POA del Expediente MML 2027 del 032.
--
-- CAUSA: el nodo 815 (Componente 5, E6-MC-C5-01) tenía padre_id = 816, que es
--   su propia Actividad 5.1 -> ciclo 815 -> 816 -> 815.
--   derivarNivelesMIR() (src/lib/mml.js:127) y v_mml_niveles definen
--   Componente = nodo MEDIO cuyo padre es el Objetivo central (793). Al no
--   cumplirlo, el Componente 5 dejaba de serlo y sus 2 Actividades, colgadas
--   de un nodo que ya no era Componente, caían con él. Los tres niveles
--   desaparecían a la vez del árbol, de la MIR y del POA.
--   El Árbol del Problema (causa 818 + subcausas 819/820) y el diagnóstico
--   (fila orden=5) nunca se rompieron. Ningún dato se perdió: las 8 filas de
--   `metas` del indicador 183 capturadas el 2026-08-28 siguen intactas.
--
-- ORIGEN: edición accidental del <select> de padre en SeccionArbol.jsx:129,
--   que lista todos los nodos del árbol y solo excluye al propio nodo — no
--   valida ciclos ni descendientes. Mismo patrón que el ciclo del PP 033
--   (674 -> 682 -> 674, borrado el 2026-08-31). Pendiente: filtrar los
--   descendientes en ese <select> y/o un trigger que rechace un padre
--   descendiente del propio nodo.
-- ============================================================

BEGIN;

UPDATE arbol_nodos
   SET padre_id = (SELECT id FROM arbol_nodos
                    WHERE programa_id=7 AND anio=2027 AND arbol='OBJETIVOS'
                      AND tipo='OBJETIVO' AND padre_id IS NULL)   -- 793
 WHERE id = 815;   -- Componente 5, E6-MC-C5-01

COMMIT;

-- ── Verificación posterior (resultado real tras aplicar) ────────────────────
-- SELECT count(*) AS total_niveles,
--        count(*) FILTER (WHERE nivel='COMPONENTE') AS componentes,
--        count(*) FILTER (WHERE nivel='ACTIVIDAD')  AS actividades,
--        count(*) FILTER (WHERE area_responsable_id=38) AS del_modulo_canino
-- FROM v_mml_niveles WHERE programa_id=7 AND anio=2027;
--   antes: 19 / 4 / 13 / 0      después: 21 / 5 / 14 / 3

-- ── Detector de ciclos y huérfanos, para barrer los 9 programas ─────────────
-- WITH raices AS (
--   SELECT programa_id, anio, arbol, id AS raiz_id FROM arbol_nodos
--   WHERE padre_id IS NULL AND tipo IN ('OBJETIVO','CENTRAL')
-- ), niveles AS (
--   SELECT n.*, (n.id = r.raiz_id) AS es_raiz, (n.padre_id = r.raiz_id) AS es_nivel1,
--     (SELECT p.padre_id = r.raiz_id FROM arbol_nodos p WHERE p.id = n.padre_id) AS padre_es_nivel1
--   FROM arbol_nodos n
--   JOIN raices r ON r.programa_id=n.programa_id AND r.anio=n.anio AND r.arbol=n.arbol
-- )
-- SELECT programa_id, anio, arbol, id, tipo, orden, padre_id, left(texto,60)
-- FROM niveles
-- WHERE NOT es_raiz AND NOT COALESCE(es_nivel1,false) AND NOT COALESCE(padre_es_nivel1,false)
-- ORDER BY anio, programa_id, arbol, id;
--   2026-09-01: 0 filas en toda la base tras el fix.
