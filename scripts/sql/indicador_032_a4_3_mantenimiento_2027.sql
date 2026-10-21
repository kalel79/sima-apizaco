-- indicador_032_a4_3_mantenimiento_2027.sql
-- APLICADO EN PRODUCCION el 2026-10-21. NO RE-EJECUTAR.
--
-- QUE HACE
--   PP 032, Actividad 4.3 (Servicios Municipales, "Adquisicion y mantenimiento
--   de maquinaria"), SOLO 2027: el indicador pasa de "...adquiridas y en
--   funcionamiento" a "...adquiridas y con mantenimiento", con la definicion
--   ajustada. La formula y el resto de la ficha se copian tal cual.
--
-- POR QUE UN INDICADOR NUEVO
--   El 130 (E6-SM-A4.3-01) tambien es la Actividad 4.3 de la MIR 2026, con 4
--   avances capturados, y `indicadores` no tiene año. Se crea uno nuevo para
--   2027 con sufijo -02 (convencion de los reemplazos 2027) y el 130 se queda
--   como el del 2026, intacto.
--
-- ROLLBACK (estado previo: nodo 812 -> indicador 130; metas 2027 del 130:
--   mes 0=1, 2=1, resto 0):
--   UPDATE arbol_nodos SET indicador_id = 130 WHERE id = 812 AND anio = 2027;
--   INSERT INTO metas (indicador_id, anio, mes, valor)
--     SELECT 130, 2027, g, CASE WHEN g = 2 THEN 1 ELSE 0 END FROM generate_series(1,12) g
--   ON CONFLICT (indicador_id, anio, mes) DO UPDATE SET valor = EXCLUDED.valor;
--   DELETE FROM metas WHERE indicador_id = (SELECT id FROM indicadores WHERE clave = 'E6-SM-A4.3-02') AND mes BETWEEN 1 AND 12;
--   DELETE FROM metas WHERE indicador_id = (SELECT id FROM indicadores WHERE clave = 'E6-SM-A4.3-02');
--   DELETE FROM indicadores WHERE clave = 'E6-SM-A4.3-02';

BEGIN;

-- 1) Indicador nuevo, ficha copiada del 130
INSERT INTO indicadores (nombre, nivel_mir, area_id, programa_id, unidad_medida, formula, frecuencia,
  linea_base, activo, clave, programa_pmd_id, definicion, tipo_indicador, dimension, sentido,
  medios_verificacion, linea_base_anio, interpretacion)
SELECT 'Porcentaje de unidades operativas adquiridas y con mantenimiento.',
       s.nivel_mir, s.area_id, s.programa_id, s.unidad_medida, s.formula, s.frecuencia,
       s.linea_base, s.activo, 'E6-SM-A4.3-02', s.programa_pmd_id,
       'Mide el porcentaje de unidades operativas adquiridas por el municipio, así como de las existentes que recibieron mantenimiento preventivo o correctivo, que se encuentran disponibles y en condiciones de funcionamiento para la prestación de los servicios públicos, respecto del total de unidades operativas programadas para su adquisición o mantenimiento durante el periodo.',
       s.tipo_indicador, s.dimension, s.sentido, s.medios_verificacion, s.linea_base_anio, s.interpretacion
  FROM indicadores s WHERE s.id = 130;

-- 2) POA 2027 al indicador nuevo (solo meses; trg_metas_recalcula_anual arma el anual)
INSERT INTO metas (indicador_id, anio, mes, valor)
SELECT (SELECT id FROM indicadores WHERE clave = 'E6-SM-A4.3-02'), 2027, m.mes, m.valor
  FROM metas m WHERE m.indicador_id = 130 AND m.anio = 2027 AND m.mes BETWEEN 1 AND 12
ON CONFLICT (indicador_id, anio, mes) DO UPDATE SET valor = EXCLUDED.valor;

-- 3) El nodo 2027 apunta al indicador nuevo
UPDATE arbol_nodos SET indicador_id = (SELECT id FROM indicadores WHERE clave = 'E6-SM-A4.3-02')
 WHERE id = 812 AND anio = 2027 AND indicador_id = 130;

-- 4) El 130 ya no es de 2027: se suelta su POA de ese año (dos pasadas por el trigger)
DELETE FROM metas WHERE indicador_id = 130 AND anio = 2027 AND mes BETWEEN 1 AND 12;
DELETE FROM metas WHERE indicador_id = 130 AND anio = 2027 AND mes = 0;

COMMIT;
