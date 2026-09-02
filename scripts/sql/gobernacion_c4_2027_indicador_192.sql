-- PP 033 / 2027 · Componente 4 de Gobernación (nodo 852)
-- Sustituye el indicador de 2026 por el que capturó el área para 2027.
-- Aplicado el 2026-09-02, confirmado por Gobernación.
--
-- Antecedente: el 2026-08-31 a las 13:33 la enlace de Gobernación creó el
-- indicador 192 y lo vinculó al Componente 4 del árbol 2027 vía
-- crear_indicador_y_vincular(); le capturó su variable y sus 13 metas de 2027.
-- Ese mismo día borré el árbol 2027 del 033 para habilitar el "Copiar de 2026"
-- con un respaldo que ya estaba desactualizado, y el DELETE se llevó el nodo:
-- el indicador sobrevivió sin vínculo (arbol_nodos no cascadea a indicadores).
-- Al reconstruir el árbol, el "Copiar de 2026" devolvió el indicador 152 a esa
-- casilla. Como `indicadores` es un catálogo sin año, un indicador sin nodo en
-- ningún ejercicio pasa el filtro de TODOS los años (esDelAnio en consultas.js),
-- así que el 192 inflaba el denominador de agosto 2026: 171 en vez de 170.
--
-- El 152 conserva su nodo de 2026, sus 3 avances y su histórico: solo deja de
-- pertenecer al 2027.

BEGIN;

UPDATE arbol_nodos SET indicador_id = 192 WHERE id = 852;
UPDATE indicadores SET clave = 'E8-GOB-C4-02' WHERE id = 192;

COMMIT;

-- ── REVERSA ──────────────────────────────────────────────────────────────
-- Estado previo: arbol_nodos.id=852 tenía indicador_id = 152 (E8-GOB-C4-01)
--                indicadores.id=192 tenía clave = NULL
--
-- BEGIN;
--   UPDATE arbol_nodos SET indicador_id = 152  WHERE id = 852;
--   UPDATE indicadores SET clave        = NULL WHERE id = 192;
-- COMMIT;
