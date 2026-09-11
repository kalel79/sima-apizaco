-- limpieza_mir_niveles_003_2027.sql
-- APLICADO EN PRODUCCION el 2026-09-07. NO RE-EJECUTAR (las guardas abortan
-- de todos modos: ya no hay 10 filas con anio=2027).
--
-- OJO, LA TRAMPA DEL TRIGGER (costo un paso extra al aplicarlo):
-- `metas` tiene el trigger FOR EACH ROW `trg_metas_recalcula_anual`, que en
-- INSERT/UPDATE/DELETE de un mes 1-12 vuelve a escribir el renglon anual
-- (mes = 0) con la suma de los meses, via INSERT ... ON CONFLICT. Al borrar
-- los 13 renglones de un indicador en un solo DELETE, el anual se borra y
-- enseguida un mes posterior lo RESUCITA en 0. La funcion sale temprano
-- cuando mes = 0, asi que la segunda pasada (paso 2 de abajo) si lo elimina
-- para siempre. Regla general: al borrar el POA de un año hay que barrer los
-- meses primero y el anual despues, en dos DELETE separados.
--
-- ANTES DE EJECUTAR: el respaldo restaurable ya esta en
-- scripts/sql/respaldo_mir_niveles_003_2027.sql (10 niveles + 26 metas).
-- Si algo sale mal, ese archivo devuelve todo tal cual estaba.
--
-- QUE HACE Y POR QUE
-- `mir_niveles` solo es canonica para 2026; de 2027 en adelante la MIR vive en
-- `arbol_nodos`. Pero quedaron 10 filas con anio=2027 (ids 244-253, PP 003,
-- indicadores 161-170) sembradas el 2026-07-23, que son la MIR del 003 de
-- antes de que se rearmara con los indicadores 173-182 (Sindicatura +
-- Direccion Juridica).
--
-- Esas 10 filas no se ven en ningun lado (v_mml_niveles no las lee), pero
-- `v_indicador_anio` es `mir_niveles UNION arbol_nodos`, asi que los
-- indicadores 161-170 figuran como si fueran del ejercicio 2027: el 2027
-- cuenta 189 indicadores cuando su MIR real tiene 179. Es el mismo mecanismo
-- que inflo los denominadores de 2026 y bloqueo el acuse de los enlaces en
-- agosto de 2026. Hoy no muerde porque el ejercicio en curso es 2026, pero
-- muerde en cuanto get_anio_actual() devuelva 2027: v_avance_captura_areas
-- filtra por v_indicador_anio y le sumaria 10 indicadores fantasma a
-- Sindicatura y Direccion Juridica.
--
-- Los 10 indicadores NO se borran: siguen en el catalogo y siguen siendo del
-- ejercicio 2026 (ahi si tienen su nivel real). Lo unico que se borra es su
-- pertenencia falsa a 2027.
--
-- Comprobado antes de preparar esto:
--   * la unica FK que apunta a mir_niveles es su propio padre_id, no hay
--     otras tablas colgando de estas filas;
--   * el lote es cerrado (ninguna fila de fuera es hija de estas 10 ni
--     viceversa), asi que no hace falta ordenar el borrado;
--   * ninguno de los 10 indicadores tiene avances 2027 capturados.

BEGIN;

-- 0) Guardas: si el lote no es exactamente el esperado, aborta sin tocar nada.
DO $$
DECLARE
  n_niveles int;
  n_fuera   int;
  n_avances int;
BEGIN
  SELECT count(*) INTO n_niveles FROM mir_niveles WHERE anio = 2027;
  IF n_niveles <> 10 THEN
    RAISE EXCEPTION 'Se esperaban 10 filas en mir_niveles con anio=2027 y hay %. Revisar antes de borrar.', n_niveles;
  END IF;

  SELECT count(*) INTO n_fuera FROM mir_niveles WHERE anio = 2027 AND id NOT BETWEEN 244 AND 253;
  IF n_fuera <> 0 THEN
    RAISE EXCEPTION 'Hay % filas con anio=2027 fuera del lote 244-253. Respaldarlas antes de borrar.', n_fuera;
  END IF;

  SELECT count(*) INTO n_avances FROM avances WHERE anio = 2027 AND indicador_id BETWEEN 161 AND 170;
  IF n_avances <> 0 THEN
    RAISE EXCEPTION 'Hay % avances 2027 en los indicadores 161-170. NO borrar: revisar primero.', n_avances;
  END IF;
END $$;

-- 1) El POA 2027 huerfano (solo los indicadores 162 y 167 alcanzaron a tener
--    metas). Va primero para no dejar metas de un ejercicio sin MIR.
DELETE FROM metas
 WHERE anio = 2027
   AND indicador_id BETWEEN 161 AND 170;

-- 2) Segunda pasada: trg_metas_recalcula_anual resucita el renglon anual
--    (mes = 0, valor 0) mientras se borran los meses. Como la funcion ignora
--    mes = 0, este DELETE si lo deja ido. Ver la nota del encabezado.
DELETE FROM metas
 WHERE anio = 2027
   AND mes = 0
   AND indicador_id BETWEEN 161 AND 170;

-- 3) Las 10 filas de la MIR vieja del 003.
DELETE FROM mir_niveles
 WHERE anio = 2027
   AND id BETWEEN 244 AND 253;

COMMIT;

-- VERIFICACION (un solo SELECT, para que el SQL Editor lo muestre)
-- Esperado:
--   niveles_2027_en_mir_niveles = 0
--   metas_2027_huerfanas        = 0
--   indicadores_2027            = 179  (antes 189, ahora cuadra con la MIR)
--   niveles_mir_2027            = 179
--   indicadores_2026            = 170  (los 161-170 siguen en 2026, intactos)
--   los_10_siguen_en_catalogo   = 10
SELECT
  (SELECT count(*) FROM mir_niveles WHERE anio = 2027)                                AS niveles_2027_en_mir_niveles,
  (SELECT count(*) FROM metas WHERE anio = 2027 AND indicador_id BETWEEN 161 AND 170) AS metas_2027_huerfanas,
  (SELECT count(*) FROM v_indicador_anio WHERE anio = 2027)                           AS indicadores_2027,
  (SELECT count(*) FROM v_mml_niveles WHERE anio = 2027)                              AS niveles_mir_2027,
  (SELECT count(*) FROM v_indicador_anio WHERE anio = 2026)                           AS indicadores_2026,
  (SELECT count(*) FROM indicadores WHERE id BETWEEN 161 AND 170)                     AS los_10_siguen_en_catalogo;

-- ROLLBACK: correr scripts/sql/respaldo_mir_niveles_003_2027.sql
