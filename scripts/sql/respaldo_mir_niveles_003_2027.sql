-- respaldo_mir_niveles_003_2027.sql
-- Respaldo tomado el 2026-09-07, ANTES de correr
-- scripts/sql/limpieza_mir_niveles_003_2027.sql
--
-- ESTE ARCHIVO NO SE EJECUTA EN CONDICIONES NORMALES. Es el rollback: solo
-- correrlo si hay que devolver a produccion la MIR vieja del PP 003 / 2027.
--
-- Que es: las 10 filas de `mir_niveles` con anio=2027 (ids 244-253, PP 003 =
-- programa_id 1, indicadores 161-170), sembradas el 2026-07-23. Son la MIR del
-- 003 de ANTES de que se rearmara el programa en `arbol_nodos` con los
-- indicadores 173-182 (Sindicatura + Direccion Juridica). Quedaron huerfanas:
-- `mir_niveles` solo es canonica para 2026, de 2027 en adelante manda
-- `arbol_nodos`. Ninguna de las 10 aparece en la MIR que se renderiza
-- (v_mml_niveles), pero SI en `v_indicador_anio`, que es
-- `mir_niveles UNION arbol_nodos`, y por eso 2027 contaba 189 indicadores en
-- vez de 179 (mismo mecanismo que inflo los denominadores y bloqueo el acuse
-- en agosto de 2026).
--
-- Se verifico antes de respaldar:
--   * la unica FK que apunta a mir_niveles es su propio padre_id
--     (mir_niveles_padre_id_fkey); no hay otras tablas colgando de estas filas;
--   * el lote es cerrado: ninguna fila de fuera es hija de estas 10, y
--     ninguna de estas 10 tiene padre fuera del lote;
--   * los 10 indicadores (161-170) siguen perteneciendo a 2026, asi que
--     borrar estas filas NO los saca del catalogo ni del ejercicio 2026;
--   * no hay avances 2027 para ninguno de los 10.

BEGIN;

-- 1) Los 10 niveles de la MIR vieja
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (244, 1, 2027, 'FIN', NULL, NULL, 'Gobernabilidad y legitimidad fortalecidas a través de una gestión jurídica eficiente y transparente.', 'Los intereses del municipio se ven afectados por el alto número de Laudos Laborales Municipal.', 161, 1, 't', '2026-07-23 19:52:24.357305+00', '2026-07-23 19:52:24.357305+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (245, 1, 2027, 'PROPOSITO', NULL, NULL, 'Gestión jurídica eficiente y representación efectiva de los intereses municipales.', 'Las demandas jurisdiccionales, laborales y administrativas no son condenatarias para el Municipio', 162, 2, 't', '2026-07-23 19:52:24.51415+00', '2026-07-23 19:52:24.51415+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (246, 1, 2027, 'COMPONENTE', 245, 1, '1. Programa de capacitación y difusión en materia de atribuciones y facultades municipales implementado.', 'El personal y la ciudadanía muestran disposición para participar en las capacitaciones.', 163, 1, 't', '2026-07-23 19:52:24.636275+00', '2026-07-23 19:52:24.636275+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (247, 1, 2027, 'COMPONENTE', 245, 2, '2. Plan anual de formación jurídica continua para el personal de la Sindicatura ejecutado.', 'Se cuenta con recursos presupuestales y disponibilidad del personal.', 164, 2, 't', '2026-07-23 19:52:24.760417+00', '2026-07-23 19:52:24.760417+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (248, 1, 2027, 'COMPONENTE', 245, 3, '3. Marco normativo actualizado y difundido a todas las áreas del Ayuntamiento.', 'El Cabildo y dependencias municipales aprueban las actualizaciones normativas sin retrasos.', 165, 3, 't', '2026-07-23 19:52:24.885898+00', '2026-07-23 19:52:24.885898+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (249, 1, 2027, 'COMPONENTE', 245, 4, '4. Convenios de colaboración jurídica con instancias federales, estatales y sociales formalizados.', 'Las contrapartes institucionales mantienen disposición para colaborar con el municipio.', 166, 4, 't', '2026-07-23 19:52:25.01135+00', '2026-07-23 19:52:25.01135+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (250, 1, 2027, 'ACTIVIDAD', 246, 1, '1.1 Realizar talleres y campañas informativas sobre normatividad y facultades municipales.', 'Se mantiene la participación de las áreas operativas y de Comunicación Social.', 167, 1, 't', '2026-07-23 19:52:25.138454+00', '2026-07-23 19:52:25.138454+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (251, 1, 2027, 'ACTIVIDAD', 247, 1, '2.1 Implementar cursos, diplomados o asesorías jurídicas especializadas.', 'Las instituciones formadoras o ponentes mantienen disponibilidad y cobertura.', 168, 1, 't', '2026-07-23 19:52:25.260949+00', '2026-07-23 19:52:25.260949+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (252, 1, 2027, 'ACTIVIDAD', 248, 1, '3.1 Revisar, actualizar y publicar reglamentos y manuales jurídicos municipales.', 'Las áreas jurídicas cuentan con tiempo y apoyo técnico para la revisión normativa.', 169, 1, 't', '2026-07-23 19:52:25.385975+00', '2026-07-23 19:52:25.385975+00');
INSERT INTO mir_niveles (id, programa_id, anio, tipo, padre_id, numero, resumen_narrativo, supuestos, indicador_id, orden, activo, created_at, updated_at) VALUES (253, 1, 2027, 'ACTIVIDAD', 249, 1, '4.1 Gestionar y dar seguimiento a convenios de colaboración jurídica con dependencias externas.', 'Las instituciones firmantes mantienen voluntad de cooperación y cumplimiento de compromisos.', 170, 1, 't', '2026-07-23 19:52:25.508149+00', '2026-07-23 19:52:25.508149+00');

-- 2) El POA 2027 que colgaba de esa MIR vieja. Solo 2 de los 10 indicadores
--    llegaron a tener metas 2027 (162 = Proposito, 167 = Actividad 1.1); los
--    otros 8 nunca tuvieron. Ninguno tiene avances 2027.
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 0, 37.8);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 1, 1);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 2, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 3, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 4, 5);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 5, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 6, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 7, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 8, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 9, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 10, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 11, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (162, 2027, 12, 31.8);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 0, 0.07);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 1, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 2, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 3, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 4, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 5, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 6, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 7, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 8, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 9, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 10, 0);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 11, 0.01);
INSERT INTO metas (indicador_id, anio, mes, valor) VALUES (167, 2027, 12, 0);

-- 3) Los ids se reinsertan explicitos, asi que la secuencia no avanza sola:
--    reacomodarla para que un INSERT futuro no choque contra el id 253.
SELECT setval('mir_niveles_id_seq', GREATEST((SELECT max(id) FROM mir_niveles), 1), true);

COMMIT;

-- Verificacion de la restauracion
-- Esperado: niveles_restaurados = 10, metas_restauradas = 26,
--           indicadores_2027 = 189 (vuelve a quedar inflado, que es justo lo
--           que la limpieza corrige; este archivo solo existe por si hay que
--           deshacerla).
SELECT (SELECT count(*) FROM mir_niveles WHERE anio = 2027) AS niveles_restaurados,
       (SELECT count(*) FROM metas WHERE anio = 2027 AND indicador_id IN (162,167)) AS metas_restauradas,
       (SELECT count(*) FROM v_indicador_anio WHERE anio = 2027) AS indicadores_2027;
