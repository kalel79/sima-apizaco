-- ============================================================
-- PP 005 (programa_id = 2) / 2027 — Actividad 3.1 de Seguridad Pública (área 1).
--
-- El indicador "Porcentaje de patrullas-unidades y equipo policial operativas
-- en servicio" (id 14, E1-SP-A3.1-01) pasa a incluir el equipo de PROTECCIÓN
-- CIVIL en 2027, en línea con el objetivo del nodo 564 ("Renovar el parque
-- vehicular y equipo policial y de protección civil...").
--
-- PATRÓN -02: el 14 lo siguen usando el 2026 (mir_niveles 170, nodo 120, 13
-- metas y 7 avances capturados), así que NO se toca. Se crea E1-SP-A3.1-02
-- con los mismos atributos y fórmula, se repunta el nodo 564 y se le pasan las
-- 13 metas 2027 que tenía el 14. Verificado antes de aplicar: el 14 no tiene
-- avances, evidencias, hallazgos ASM ni acciones del informe en 2027.
--
-- Pedido por Hugo el 2026-10-07.
-- ============================================================

BEGIN;

-- 1) Indicador nuevo, copia del 14 con el alcance ampliado.
INSERT INTO indicadores
  (clave, nombre, nivel_mir, area_id, programa_id, programa_pmd_id, unidad_medida,
   frecuencia, tipo_indicador, dimension, sentido, formula, definicion,
   medios_verificacion, interpretacion, linea_base, linea_base_anio, activo)
SELECT 'E1-SP-A3.1-02',
       'Porcentaje de patrullas-unidades y equipo policial y de protección civil operativas en servicio',
       nivel_mir, area_id, programa_id, programa_pmd_id, unidad_medida,
       frecuencia, tipo_indicador, dimension, sentido, formula,
       'Mide el porcentaje de patrullas, unidades y equipo policial y de protección civil que se encuentran operativas y disponibles para el servicio respecto del total registrado.',
       'Inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial y de protección civil.',
       'Mide la disponibilidad real del parque vehicular y equipamiento operativo de seguridad pública y protección civil, reflejando capacidad de respuesta.',
       linea_base, linea_base_anio, true
FROM indicadores WHERE id = 14;

-- 2) Variables (mismos símbolos, para que la fórmula siga cuadrando).
INSERT INTO indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
SELECT i.id, v.nombre, v.simbolo, 'Unidades', i.medios_verificacion, v.orden
FROM (VALUES
  ('Parque vehicular-equipo policial y de protección civil operativas', 'PVEP',  1),
  ('Total de parque vehicular-equipo policial y de protección civil',   'TPVEP', 2)
) AS v(nombre, simbolo, orden)
CROSS JOIN indicadores i WHERE i.clave = 'E1-SP-A3.1-02';

-- 3) Nodo del árbol de objetivos 2027.
UPDATE arbol_nodos SET
  indicador_id = (SELECT id FROM indicadores WHERE clave = 'E1-SP-A3.1-02'),
  medios_verificacion = 'Inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial y de protección civil.'
WHERE id = 564 AND anio = 2027 AND indicador_id = 14;

-- 4) Metas 2027 al indicador nuevo (el 2026 se queda en el 14).
UPDATE metas
   SET indicador_id = (SELECT id FROM indicadores WHERE clave = 'E1-SP-A3.1-02')
 WHERE indicador_id = 14 AND anio = 2027;

-- 5) Conteo denormalizado del área (catálogo acumulado).
UPDATE areas
   SET num_indicadores_mir = (SELECT count(*) FROM indicadores WHERE area_id = 1)
 WHERE id = 1;

COMMIT;

-- ── Rollback ────────────────────────────────────────────────────────────────
-- BEGIN;
-- UPDATE metas SET indicador_id = 14
--  WHERE anio = 2027 AND indicador_id = (SELECT id FROM indicadores WHERE clave='E1-SP-A3.1-02');
-- UPDATE arbol_nodos SET indicador_id = 14,
--   medios_verificacion = 'inventario vehicular, bitácoras de mantenimiento, pólizas, inventario de equipo policial. '
--  WHERE id = 564;
-- DELETE FROM indicador_variables WHERE indicador_id = (SELECT id FROM indicadores WHERE clave='E1-SP-A3.1-02');
-- DELETE FROM indicadores WHERE clave = 'E1-SP-A3.1-02';
-- UPDATE areas SET num_indicadores_mir = (SELECT count(*) FROM indicadores WHERE area_id = 1) WHERE id = 1;
-- COMMIT;
