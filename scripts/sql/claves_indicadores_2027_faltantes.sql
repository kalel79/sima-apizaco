-- claves_indicadores_2027_faltantes.sql
-- APLICADO EN PRODUCCION el 2026-09-07. NO RE-EJECUTAR (el WHERE exige
-- clave IS NULL, asi que una segunda corrida no afecta filas).
--
-- Contexto: 15 indicadores nuevos del ejercicio 2027 se habian capturado sin
-- `clave`. Todos los demas del catalogo si la traen, y `indicadores.clave`
-- tiene indice UNICO (idx_indicadores_clave), asi que cualquier choque lo
-- rechaza la base.
--
-- FORMATO DE LA CLAVE (derivado de las 180 claves que ya existian, no
-- inventado):  E<n>-<siglas del area>-<nivel>-<consecutivo>
--
--   E<n>  = prefijo por PROGRAMA, no por el codigo del eje:
--           003 -> E9   005 -> E1   012 -> E4   018 -> E2   021 -> E7
--           024 -> E3   032 -> E6   033 -> E8   037 -> E5
--           (ojo: los ejes AJ/TA/TB/MS se numeran E9/E6/E7/E8)
--   siglas = las del area dueña del indicador (indicadores.area_id):
--           SIN Sindicatura, DJ Direccion Juridica, CUL Turismo y Cultura
--           (en su faceta cultural; la turistica usa TUR), DS Desarrollo
--           Social, GOB Gobernacion, SA Secretaria del Ayuntamiento.
--   nivel = FIN | PRO | C<n> | A<n>.<m>
--   consec= 01, y 02 cuando el 01 ya lo ocupa el indicador de 2026 al que
--           este reemplaza. Precedente: E8-GOB-C4-02 (indicador 192).
--
-- 10 de los 15 cayeron en -02 justamente porque son el reemplazo 2027 de un
-- indicador 2026 que ya tenia el -01; los otros 5 estrenan numeracion.

UPDATE indicadores i
   SET clave = v.clave
  FROM (VALUES
    -- PP 003 / Sindicatura (area 32)
    (175, 'E9-SIN-PRO-02'),    -- Proposito      (el -01 es del ind. 162, 2026)
    (173, 'E9-SIN-C1-02'),     -- Componente 1   (el -01 es del ind. 163, 2026)
    (176, 'E9-SIN-A1.1-02'),   -- Actividad 1.1  (el -01 es del ind. 167, 2026)
    (177, 'E9-SIN-A1.2-01'),   -- Actividad 1.2  (nueva)
    (178, 'E9-SIN-A1.3-01'),   -- Actividad 1.3  (nueva)
    (179, 'E9-SIN-A1.4-01'),   -- Actividad 1.4  (nueva)
    -- PP 003 / Direccion Juridica (area 31)
    (174, 'E9-DJ-FIN-01'),     -- Fin  (ver NOTA de abajo)
    (180, 'E9-DJ-C2-02'),      -- Componente 2   (el -01 es del ind. 164, 2026)
    (181, 'E9-DJ-A2.1-02'),    -- Actividad 2.1  (el -01 es del ind. 168, 2026)
    (182, 'E9-DJ-A2.2-01'),    -- Actividad 2.2  (nueva)
    -- PP 012 / Turismo y Cultura (area 11)
    (197, 'E4-CUL-C6-02'),     -- Componente 6   (el -01 es del ind. 69, 2026)
    -- PP 018 / Desarrollo Social (area 4)
    (196, 'E2-DS-A3.1-02'),    -- Actividad 3.1  (el -01 es del ind. 37, 2026)
    -- PP 033 / Gobernacion (area 28)
    (186, 'E8-GOB-A4.1-02'),   -- Actividad 4.1  (el -01 es del ind. 158, 2026)
    -- PP 033 / Secretaria del Ayuntamiento (area 26)
    (191, 'E8-SA-C2-02'),      -- Componente 2   (el -01 es del ind. 150, 2026)
    (195, 'E8-SA-A2.1-02')     -- Actividad 2.1  (el -01 es del ind. 156, 2026)
  ) AS v(id, clave)
 WHERE i.id = v.id AND i.clave IS NULL;

-- NOTA sobre el indicador 174 (Fin del PP 003 en 2027):
-- se le puso siglas DJ porque su `indicadores.area_id` es Direccion Juridica
-- (31), que es el criterio que sigue TODO el resto del catalogo. Pero el Fin
-- del mismo programa en 2026 es E9-SIN-FIN-01 (Sindicatura): el Fin es de
-- programa, no de area, y cambio de dueño entre ejercicios. Si se decide que
-- deba seguir siendo de Sindicatura, la correccion es
--   UPDATE indicadores SET clave = 'E9-SIN-FIN-02', area_id = 32 WHERE id = 174;

-- VERIFICACION (un solo SELECT; esperado: 'ninguno'/'ninguna' en los cuatro)
SELECT 'sin_clave' AS chk, coalesce(string_agg(id::text, ', '), 'ninguno') AS detalle
  FROM indicadores WHERE clave IS NULL
UNION ALL
SELECT 'claves_duplicadas', coalesce(string_agg(clave || ' x' || n, ', '), 'ninguna')
  FROM (SELECT clave, count(*) n FROM indicadores WHERE clave IS NOT NULL
         GROUP BY 1 HAVING count(*) > 1) d
UNION ALL
SELECT 'prefijo_eje_no_coincide', coalesce(string_agg(id || ' (' || clave || ')', ', '), 'ninguno')
  FROM (SELECT i.id, i.clave FROM indicadores i JOIN areas a ON a.id = i.area_id
         WHERE i.clave IS NOT NULL
           AND split_part(i.clave, '-', 1) <> (SELECT split_part(x.clave, '-', 1) FROM indicadores x
                                                WHERE x.programa_id = i.programa_id AND x.clave IS NOT NULL
                                                GROUP BY split_part(x.clave, '-', 1)
                                                ORDER BY count(*) DESC LIMIT 1)) t
UNION ALL
SELECT 'nivel_no_coincide_con_clave', coalesce(string_agg(id || ' (' || clave || ' vs ' || nivel_mir || ')', ', '), 'ninguno')
  FROM (SELECT i.id, i.clave, i.nivel_mir, split_part(i.clave, '-', 3) AS tok,
               CASE WHEN i.nivel_mir = 'Fin' THEN 'FIN'
                    WHEN i.nivel_mir = 'Proposito' THEN 'PRO'
                    WHEN i.nivel_mir LIKE 'Componente %' THEN 'C' || split_part(i.nivel_mir, ' ', 2)
                    WHEN i.nivel_mir LIKE 'Actividad %'  THEN 'A' || split_part(i.nivel_mir, ' ', 2)
               END AS esperado
          FROM indicadores i WHERE i.clave IS NOT NULL) t2
 WHERE tok IS DISTINCT FROM esperado;

-- ROLLBACK
-- UPDATE indicadores SET clave = NULL
--  WHERE id IN (173,174,175,176,177,178,179,180,181,182,186,191,195,196,197);
