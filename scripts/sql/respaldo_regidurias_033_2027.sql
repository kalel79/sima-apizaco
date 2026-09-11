-- ============================================================
-- RESPALDO / ROLLBACK de `regidurias_033_2027.sql`
-- PP 033 "Apoyo a las Políticas Gubernamentales" (programa_id = 8), anio = 2027
-- Área 27 "Regidurías" — Componente 3 y Actividad 3.1
--
-- Estado capturado con SELECT el 2026-09-11, ANTES de aplicar el cambio.
-- Ejecutar este archivo completo deja el 033/2027 exactamente como estaba:
-- los nodos vuelven a apuntar a los indicadores de convenios (151 / 157) y
-- los indicadores nuevos desaparecen del catálogo.
--
-- OJO: solo es seguro mientras el área no haya capturado metas sobre los
-- indicadores nuevos. Si ya hay metas en `metas` para E8-REG-C3-02 o
-- E8-REG-A3.1-02, el DELETE del final falla por FK (o se las lleva en
-- cascada, según la FK) — revisar antes de correrlo.
-- ============================================================

BEGIN;

-- 1) Árbol de Objetivos: Componente 3 y Actividad 3.1 como estaban.
UPDATE arbol_nodos SET
  texto = 'Suficientes acuerdos vinculatorios con entidades de órdenes de Gobierno Federal y Estatal, así como entidades privadas de la sociedad civil.',
  indicador_id = 151,
  area_responsable_id = 27,
  supuestos = 'Las entidades externas mantienen interés en colaborar y los procesos de aprobación administrativa no se retrasan.',
  medios_verificacion = 'Convenios registrados, oficios de colaboración, actas de sesión de Cabildo, informes de vinculación institucional.'
WHERE id = 850;

UPDATE arbol_nodos SET
  texto = 'Celebrar convenios y acuerdos con instituciones públicas y privadas, para la ejecución de obras y acciones.',
  indicador_id = 157,
  area_responsable_id = NULL,
  supuestos = 'Las acciones que se realizan es con la participación de la población, de esta forma se logra el desarrollo económico y social de los habitantes del municipio, con la finalidad de mejorar la calidad de vida.',
  medios_verificacion = 'Secretaría del Ayuntamiento, Direcciones, Coordinaciones del H. Ayuntamiento, lista de asistencia, manuales, encuestas, actas de cabildo, reportes de metas e indicadores, reportes presupuestales y demás documentos que las áreas controlen.'
WHERE id = 862;

-- 2) Árbol del Problema: Causa 3 y su causa indirecta como estaban.
UPDATE arbol_nodos SET
  texto = 'Insuficientes acuerdos vinculatorios con entidades de órdenes de Gobierno Federal y Estatal, así como entidades privadas de la sociedad civil.'
WHERE id = 828;

UPDATE arbol_nodos SET
  texto = 'Falta de convenios y acuerdos con instituciones públicas y privadas para la ejecución de obras y acciones.'
WHERE id = 841;

-- 3) Análisis de alternativas.
UPDATE acciones_alternativas SET
  texto = 'Suficientes acuerdos vinculatorios con entidades de órdenes de Gobierno Federal y Estatal, así como entidades privadas de la sociedad civil.'
WHERE id = 81;

-- 4) Indicadores nuevos y sus variables fuera del catálogo.
DELETE FROM indicador_variables
 WHERE indicador_id IN (SELECT id FROM indicadores WHERE clave IN ('E8-REG-C3-02','E8-REG-A3.1-02'));

DELETE FROM indicadores WHERE clave IN ('E8-REG-C3-02','E8-REG-A3.1-02');

-- 5) Conteo denormalizado del área (vuelve a 2).
UPDATE areas
   SET num_indicadores_mir = (SELECT count(*) FROM indicadores WHERE area_id = 27)
 WHERE id = 27;

COMMIT;
