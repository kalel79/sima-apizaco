-- ============================================================
-- Regidurías en el Expediente MML 2027 — PP 033 "Apoyo a las Políticas
-- Gubernamentales" (programa_id = 8, eje_id = 8), anio = 2027, area_id = 27.
--
-- Sustituye el contenido del Componente 3 y de la Actividad 3.1 —hoy heredados
-- del 2026 y referidos a convenios y acuerdos vinculatorios— por el del
-- documento oficial del área: atención ciudadana (Componente) y asistencia a
-- las sesiones de Cabildo (Actividad).
--
-- YA APLICADO en producción el 2026-09-11 (aprobado por Hugo). NO RE-EJECUTAR.
--   ids resultantes: indicadores 202 (E8-REG-C3-02) y 203 (E8-REG-A3.1-02),
--   con sus 4 filas en indicador_variables. Los nodos 850 / 862 (OBJETIVOS) y
--   828 / 841 (PROBLEMA) se editaron en sitio; no se creó ningún nodo nuevo.
--
-- ORIGEN DE LA NARRATIVA: "MML_Indicadores_Regiduria.xlsx" (Regiduría —
--   H. Ayuntamiento de Apizaco), hojas "Árbol del Problema", "Árbol de
--   Objetivos", "Resumen MIR", "Ficha Componente" y "Ficha Actividad".
--   Resumen narrativo, nombre del indicador, método de cálculo, definición,
--   medios de verificación, supuestos e interpretación se toman VERBATIM de
--   ese archivo. El Excel numera su contenido como Componente 1 / Actividad
--   1.1 porque está escrito desde la Regiduría; aquí entra en el lugar que el
--   área ya ocupa dentro del PP 033: Componente 3 / Actividad 3.1.
--
-- PATRÓN: es el mismo que ya usaron Secretaría del Ayuntamiento (E8-SA-C2-02,
--   E8-SA-A2.1-02) y Gobernación (E8-GOB-C4-02, E8-GOB-A4.1-02) en este mismo
--   programa. Se crean indicadores NUEVOS con sufijo -02 y se repunta el nodo
--   del árbol 2027; los -01 (151 y 157) NO se tocan porque siguen siendo los
--   del ejercicio 2026 (mir_niveles 94 y 156, con sus 12 metas cada uno).
--   Verificado antes de aplicar: 151 y 157 no tienen ninguna meta en 2027, así
--   que repuntar los nodos no deja metas huérfanas.
--
-- ADAPTACIONES respecto al Excel:
--   a) "la Regiduría" → "las Regidurías" en definiciones e interpretación, para
--      que case con el nombre del área 27 y con el hecho de que son varias.
--   b) LÍNEA BASE 2026, no 2025. El Excel se redactó sin año de ejercicio; los
--      otros indicadores -02 del 033/2027 usan 2026 (el ejercicio inmediato
--      anterior). El VALOR se deja NULL: el propio Excel dice que lo captura
--      el área.
--   c) La "Advertencia de uso" del Excel se anexa al final de `interpretacion`:
--      no hay columna propia para ella y es justo lo que evita malas lecturas.
--   d) FIN, PROPÓSITO y ACTIVIDAD 1.2 del Excel se descartan. El Fin y el
--      Propósito del 033 ya existen (nodos 845 y 844) y son de todo el
--      programa, no de la Regiduría; la Actividad 1.2 (canalización en 5 días
--      hábiles) el propio Excel la marca como referencia para cerrar la matriz,
--      no como indicador solicitado.
--   e) NO se tocan efectos ni fines: los efectos 827 ("Insatisfacción por parte
--      de la ciudadanía, al no tener una respuesta favorable...") y 833
--      ("Desconfianza en las acciones del Municipio") ya cubren los que plantea
--      el Excel.
--   f) SIN METAS. El POA 2027 lo captura el enlace del área — es exactamente lo
--      único que queda pendiente después de este script.
--
-- Convenciones respetadas:
--   · clave: E8-REG-C3-02 / E8-REG-A3.1-02 (REG = Regidurías; eje 8).
--   · fórmula escrita con los símbolos de las variables, como el resto del 033
--     (E8-CS-C5-01 = "(NPCE/TPCP) X 100"), y en el formato que produce
--     componerFormula() en src/utils/expedienteMMLContenido.js.
--   · área responsable solo en el Componente; la Actividad la hereda vía
--     get_area_efectiva_nodo() / v_mml_niveles (fase_mml_09).
--   · no se mueve ningún padre_id → no hay riesgo de ciclo en arbol_nodos.
--
-- Rollback: scripts/sql/respaldo_regidurias_033_2027.sql
-- ============================================================

BEGIN;

-- 1) Indicadores 2027 de Regidurías (documento oficial del área).
INSERT INTO indicadores
  (clave, nombre, nivel_mir, area_id, programa_id, unidad_medida, frecuencia,
   tipo_indicador, dimension, sentido, formula, definicion, medios_verificacion,
   interpretacion, linea_base_anio, activo)
SELECT v.clave, v.nombre, v.nivel, 27, 8, 'Porcentaje', 'Trimestral',
       'Gestión', 'Eficacia', 'Ascendente', v.formula, v.definicion, v.mv,
       v.interpretacion, 2026, true
FROM (VALUES
  ('E8-REG-C3-02',
   'Porcentaje de solicitudes ciudadanas atendidas',
   'Componente 3',
   '(SCA / SCR) × 100',
   'Mide la proporción de solicitudes, peticiones o demandas presentadas por la ciudadanía ante las Regidurías que reciben atención formal en el periodo, entendiendo por atención el registro de la solicitud y su resolución directa o su canalización documentada al área ejecutora competente. Cuantifica la cobertura del servicio de atención ciudadana respecto de la demanda efectivamente recibida.',
   'Bitácora o sistema de registro de atención ciudadana; acuses de recepción de solicitudes; oficios de canalización a las áreas ejecutoras con sello de recibido. Resguardo: Regidurías. Disponibilidad: dentro de los 10 días hábiles siguientes al cierre del trimestre.',
   'El resultado expresa, de cada 100 solicitudes ciudadanas recibidas en el periodo, cuántas recibieron atención formal por parte de las Regidurías. Un valor cercano al 100% indica cobertura plena de la demanda recibida; valores decrecientes señalan rezago en la capacidad de respuesta del área. El indicador mide cobertura, no satisfacción ni resolución definitiva: una solicitud canalizada cuenta como atendida aunque el área ejecutora aún no la resuelva, por lo que debe leerse junto con el indicador de Propósito, que mide resolución favorable. Advertencia de uso: un aumento en el denominador (más solicitudes recibidas) puede reducir el indicador sin que el desempeño empeore; por ello el reporte trimestral debe acompañarse siempre del valor absoluto de ambas variables.'),
  ('E8-REG-A3.1-02',
   'Porcentaje de asistencia a las sesiones de Cabildo',
   'Actividad 3.1',
   '(SA / SC) × 100',
   'Mide la proporción de sesiones de Cabildo —ordinarias, extraordinarias y solemnes— formalmente convocadas en el periodo a las que asisten las Regidurías, respecto del total de sesiones convocadas. Refleja el cumplimiento de la obligación de asistencia prevista en la Ley Municipal del Estado de Tlaxcala y la disponibilidad del representante popular para deliberar y votar los asuntos que dan solución a las demandas ciudadanas.',
   'Convocatorias, listas de asistencia y actas de sesión de Cabildo. Resguardo: Secretaría del Ayuntamiento. Disponibilidad: dentro de los 10 días hábiles siguientes al cierre del trimestre, previa solicitud formal.',
   'El resultado expresa, de cada 100 sesiones de Cabildo convocadas en el periodo, a cuántas asistieron las Regidurías. Un valor de 100% indica cumplimiento pleno de la obligación de asistencia; cualquier valor inferior señala sesiones en las que el área no participó en la deliberación ni en la votación de los asuntos turnados, lo que compromete la gestión de las demandas ciudadanas ante el órgano de gobierno. Al ser un indicador de cumplimiento normativo, su capacidad de discriminar desempeño es limitada: conviene leerlo junto con el aporte sustantivo del área, no solo con la presencia física. Advertencia de uso: no deben excluirse del denominador las sesiones a las que no se asistió por causa justificada; la justificación se documenta en el apartado de observaciones del reporte, sin alterar el cálculo. Las sesiones convocadas que no se celebraron por falta de quórum se contabilizan en el denominador y, si hubo registro de presencia, también en el numerador.')
) AS v(clave, nombre, nivel, formula, definicion, mv, interpretacion);

-- 2) Variables de la fórmula (numerador primero: así las lee resolverFichaIndicador).
INSERT INTO indicador_variables (indicador_id, nombre, simbolo, unidad_medida, fuente, orden)
SELECT i.id, v.nombre, v.simbolo, v.unidad, i.medios_verificacion, v.orden
FROM (VALUES
  ('E8-REG-C3-02',  'Solicitudes ciudadanas atendidas',  'SCA', 'Solicitudes', 1),
  ('E8-REG-C3-02',  'Solicitudes ciudadanas recibidas',  'SCR', 'Solicitudes', 2),
  ('E8-REG-A3.1-02','Sesiones de Cabildo asistidas',     'SA',  'Sesiones',    1),
  ('E8-REG-A3.1-02','Sesiones de Cabildo convocadas',    'SC',  'Sesiones',    2)
) AS v(clave, nombre, simbolo, unidad, orden)
JOIN indicadores i ON i.clave = v.clave;

-- 3) Árbol de Objetivos — Componente 3 (nodo 850, MEDIO hijo del Propósito 844).
UPDATE arbol_nodos SET
  texto = 'Atención ciudadana otorgada a la población del municipio.',
  indicador_id = (SELECT id FROM indicadores WHERE clave = 'E8-REG-C3-02'),
  area_responsable_id = 27,
  supuestos = 'La ciudadanía presenta sus solicitudes por las vías institucionales y las áreas ejecutoras responden a las canalizaciones en los plazos establecidos.',
  medios_verificacion = 'Bitácora o sistema de registro de atención ciudadana; acuses de recepción y oficios de canalización, resguardados por las Regidurías.'
WHERE id = 850;

-- 4) Árbol de Objetivos — Actividad 3.1 (nodo 862, MEDIO hijo del 850).
UPDATE arbol_nodos SET
  texto = 'Participación en las sesiones de Cabildo para la gestión de las demandas ciudadanas recibidas.',
  indicador_id = (SELECT id FROM indicadores WHERE clave = 'E8-REG-A3.1-02'),
  supuestos = 'La Secretaría del Ayuntamiento convoca conforme a la Ley Municipal del Estado de Tlaxcala y se integra el quórum legal.',
  medios_verificacion = 'Convocatorias, listas de asistencia y actas de sesión, resguardadas por la Secretaría del Ayuntamiento.'
WHERE id = 862;

-- 5) Árbol del Problema — espejo negativo. La jerarquía 828 → 841 ya calca la
--    de 850 → 862, así que basta con cambiar el texto: la causa directa es la
--    del Componente y la indirecta la de la Actividad (Causas 2 y 1 del Excel).
UPDATE arbol_nodos SET
  texto = 'Ausencia de mecanismos formales de recepción, registro y seguimiento de las solicitudes ciudadanas.'
WHERE id = 828;

UPDATE arbol_nodos SET
  texto = 'Participación limitada de las Regidurías en las sesiones de Cabildo, órgano donde se deliberan y aprueban las soluciones a las demandas ciudadanas.'
WHERE id = 841;

-- 6) Análisis de alternativas: la fila del medio 850 repite el texto del
--    Componente, como las otras cinco del programa.
UPDATE acciones_alternativas SET
  texto = 'Atención ciudadana otorgada a la población del municipio.'
WHERE id = 81 AND programa_id = 8 AND anio = 2027 AND medio_id = 850;

-- 7) Conteo denormalizado del catálogo de áreas (2 → 4: el catálogo es
--    acumulado y conserva los -01 del 2026).
UPDATE areas
   SET num_indicadores_mir = (SELECT count(*) FROM indicadores WHERE area_id = 27)
 WHERE id = 27;

COMMIT;

-- ── Verificación posterior ──────────────────────────────────────────────────
-- SELECT nivel, nodo_id, indicador_clave, d_mir, d_riesgos, d_ficha, d_metas
-- FROM v_mml_captura_nivel
-- WHERE programa_id = 8 AND anio = 2027 AND area_id = 27;
--   → 850 y 862 con d_mir=1, d_riesgos=2, d_ficha=7, d_metas=0.
--
-- SELECT (SELECT count(*) FROM indicadores) catalogo,
--        (SELECT count(*) FROM v_indicador_anio WHERE anio=2026) a2026,
--        (SELECT count(*) FROM v_indicador_anio WHERE anio=2027) a2027;
--   → 201 / 170 / 178 (antes: 199 / 170 / 178).
