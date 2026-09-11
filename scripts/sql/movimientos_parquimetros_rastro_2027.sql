-- movimientos_parquimetros_rastro_2027.sql
-- APLICADO EN PRODUCCION el 2026-09-07. NO RE-EJECUTAR.
-- Rollback: scripts/sql/respaldo_movimientos_parquimetros_rastro_2027.sql
--
-- QUE HACE
--   1) Parquimetros (area 15): su Componente y su Actividad pasan del PP 012
--      al PP 037, como Componente 7 y Actividad 7.1.
--   2) Rastro (area 36): su Actividad pasa del PP 018 al PP 032, como
--      Actividad 4.5, colgada del Componente 4 de Servicios Municipales.
--   SOLO PARA EL EJERCICIO 2027. El 2026 no se toca.
--
-- POR QUE SE CREAN INDICADORES NUEVOS EN LUGAR DE MOVER LOS EXISTENTES
--   `indicadores` es un catalogo acumulado SIN columna de año: su `clave`,
--   `nivel_mir` y `programa_id` los comparten 2026 y 2027. Reescribirlos
--   habria dejado al 2026 diciendo que el Rastro es Actividad 4.5 del 032,
--   contradiciendo la MIR 2026 ya validada y sus avances capturados. Por eso
--   se crean tres indicadores nuevos para 2027 (mismo patron que los otros 25
--   indicadores nuevos del ejercicio) y los originales 34, 71 y 87 se quedan
--   como los del 2026, intactos con sus metas y avances de ese año.
--
-- POR QUE TAMBIEN SE MUEVEN LAS AREAS
--   `getProgramaIdDeArea()` (src/lib/mml.js:15) resuelve por
--   `areas.programa_id` que Expediente MML abre un enlace. Sin mover el area,
--   el enlace de Parquimetros seguiria entrando al expediente del 012 y ya no
--   veria su Componente. CONTRAPARTIDA ACEPTADA POR HUGO: `areas` tampoco
--   tiene año, asi que en 2026 esos dos enlaces ya no ven su MIR dentro del
--   Expediente MML (sus niveles 2026 siguen en el 012 y el 018). Su captura
--   mensual de avances NO se afecta: esa va por `profile.area_id` directo.
--
-- IDS UTILES: programas 012=3, 018=4, 032=7, 037=9. Ejes E2=2, E4=4, E5=5, TA=6.

BEGIN;

-- 1) Tres indicadores nuevos para 2027, con la ficha copiada del original.
--    Solo cambian clave, nivel_mir y programa_id. Ids resultantes: 198, 199, 200.
INSERT INTO indicadores (nombre, nivel_mir, area_id, programa_id, unidad_medida, formula, frecuencia,
  linea_base, activo, clave, programa_pmd_id, definicion, tipo_indicador, dimension, sentido,
  medios_verificacion, linea_base_anio, interpretacion)
SELECT s.nombre, v.nivel_mir, s.area_id, v.programa_id, s.unidad_medida, s.formula, s.frecuencia,
       s.linea_base, s.activo, v.clave, s.programa_pmd_id, s.definicion, s.tipo_indicador, s.dimension,
       s.sentido, s.medios_verificacion, s.linea_base_anio, s.interpretacion
  FROM (VALUES
    (71, 'E5-PAR-C7-01',   'Componente 7',  9),
    (87, 'E5-PAR-A7.1-01', 'Actividad 7.1', 9),
    (34, 'E6-RAS-A4.5-01', 'Actividad 4.5', 7)
  ) AS v(origen, clave, nivel_mir, programa_id)
  JOIN indicadores s ON s.id = v.origen;

-- 2) El POA 2027 del Rastro pasa al indicador nuevo. Se insertan SOLO los
--    meses: trg_metas_recalcula_anual arma el renglon anual con la suma
--    (100 = 50 en junio + 50 en agosto, identico al original).
--    Parquimetros no tenia POA 2027, no hay nada que copiar.
INSERT INTO metas (indicador_id, anio, mes, valor)
SELECT (SELECT id FROM indicadores WHERE clave = 'E6-RAS-A4.5-01'), 2027, m.mes, m.valor
  FROM metas m WHERE m.indicador_id = 34 AND m.anio = 2027 AND m.mes BETWEEN 1 AND 12
ON CONFLICT (indicador_id, anio, mes) DO UPDATE SET valor = EXCLUDED.valor;

-- 3) Los nodos cambian de programa, de padre y de indicador.
--    Parquimetros: el Componente cuelga del objetivo raiz del 037 (nodo 912)
--    con orden 7 (el 037 ya tenia 6 componentes). Su Actividad no cambia de
--    padre, solo de programa e indicador.
UPDATE arbol_nodos SET programa_id = 9, padre_id = 912, orden = 7,
       indicador_id = (SELECT id FROM indicadores WHERE clave = 'E5-PAR-C7-01')
 WHERE id = 989 AND anio = 2027 AND programa_id = 3;

UPDATE arbol_nodos SET programa_id = 9, orden = 1,
       indicador_id = (SELECT id FROM indicadores WHERE clave = 'E5-PAR-A7.1-01')
 WHERE id = 990 AND anio = 2027 AND padre_id = 989;

--    Rastro: pasa a colgar del Componente 4 del 032 (nodo 801, Servicios
--    Municipales), que ya tenia 4 actividades, asi que entra con orden 5.
UPDATE arbol_nodos SET programa_id = 7, padre_id = 801, orden = 5,
       indicador_id = (SELECT id FROM indicadores WHERE clave = 'E6-RAS-A4.5-01')
 WHERE id = 631 AND anio = 2027 AND programa_id = 4;

-- 4) El indicador 34 ya no pertenece a 2027, su POA de ese año queda huerfano.
--    DOS pasadas: trg_metas_recalcula_anual resucita el renglon anual mientras
--    se borran los meses, y solo lo suelta cuando el DELETE ataca mes = 0.
DELETE FROM metas WHERE indicador_id = 34 AND anio = 2027 AND mes BETWEEN 1 AND 12;
DELETE FROM metas WHERE indicador_id = 34 AND anio = 2027 AND mes = 0;

-- 5) Las areas siguen a sus indicadores.
UPDATE areas SET programa_id = 9, eje_id = 5 WHERE id = 15;  -- Parquimetros -> 037 / E5
UPDATE areas SET programa_id = 7, eje_id = 6 WHERE id = 36;  -- Rastro       -> 032 / TA

COMMIT;

-- VERIFICACION (un solo SELECT)
-- Esperado: 012 = 26/24, 018 = 22/21, 032 = 18/22, 037 = 26/28 (2026/2027);
--           2027 = 179 nodos / 179 indicadores; 2026 = 170/170 sin cambios;
--           catalogo = 198; ningun indicador repetido ni sin clave.
SELECT p.clave,
       (SELECT count(*) FROM v_mml_niveles v WHERE v.anio = 2026 AND v.programa_id = p.id) AS n2026,
       (SELECT count(*) FROM v_mml_niveles v WHERE v.anio = 2027 AND v.programa_id = p.id) AS n2027
  FROM programas p WHERE p.clave IN ('012','018','032','037') ORDER BY p.clave;

-- PENDIENTE DETECTADO, NO TOCADO EN ESTE SCRIPT:
-- los indicadores 37 (E2-DS-A3.1-01), 150 (E8-SA-C2-01) y 156 (E8-SA-A2.1-01)
-- tienen 13 metas de 2027 cada uno pero ya no estan en la MIR 2027 (fueron
-- reemplazados por los indicadores 196, 191 y 195). Es el mismo tipo de
-- residuo que se limpio en limpieza_mir_niveles_003_2027.sql. Sin avances
-- 2027, o sea que se pueden borrar, pero requiere decision de Hugo.
