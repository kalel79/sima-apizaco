-- Respaldo del EXPEDIENTE MML 2027 del PP 033 "Apoyo a las Politicas
-- Gubernamentales" (programa_id = 8), tomado el 2026-08-31 ANTES de borrarlo
-- para dejar el ano vacio y poder usar los botones "Copiar de 2026" del
-- Expediente MML (esos botones solo aparecen si la seccion del ano destino no
-- tiene filas todavia).
--
-- Contenido respaldado: 30 nodos de arbol (15 PROBLEMA + 15 OBJETIVOS),
-- 5 filas de diagnostico y 6 de involucrados, capturados por el area con
-- enfoque de Comunicacion Social y distintos del expediente 2026 del programa.
--
-- El arbol de OBJETIVOS traia un CICLO (674 -> 682 -> 674) que dejaba
-- huerfanos a 674, 675, 679, 680, 681 y 682: por eso no colgaban de la raiz,
-- y por eso copiarArbolDeAnioAnterior() nunca habria podido reconstruirlo.
--
-- Ningun nodo tenia indicador_id, area_responsable_id, supuestos ni
-- medios_verificacion; no habia acciones alternativas, mir_niveles ni
-- presupuesto para 2027, y ninguna meta colgaba de estos nodos. La unica fila
-- 2027 que NO se borro es la de ficha_proyecto (no bloquea ninguna copia).
--
-- Para restaurar: ejecutar este archivo completo. Si para entonces ya se
-- recapturo (o se copio de 2026) el expediente 2027 del programa 8, borrarlo
-- primero o los ids chocaran:
--   DELETE FROM arbol_nodos           WHERE programa_id = 8 AND anio = 2027;
--   DELETE FROM diagnostico_programa  WHERE programa_id = 8 AND anio = 2027;
--   DELETE FROM involucrados_programa WHERE programa_id = 8 AND anio = 2027;

BEGIN;

INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (653, 8, 2027, 'PROBLEMA', 'CENTRAL', NULL, 1, 'Baja visibilidad de las acciones gubernamentales y alcance limitado de sus mensajes.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (654, 8, 2027, 'PROBLEMA', 'EFECTO', 653, 2, 'Poco tiempo para los valores de calidad que se requieren', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (655, 8, 2027, 'PROBLEMA', 'CAUSA', 661, 3, 'Insuficiencia de Información.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (656, 8, 2027, 'PROBLEMA', 'EFECTO', 655, 4, 'Tiempo limitado para desarrollar estrategias de comunicación oportunas y efectivas dirigidas a la ciudadanía.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (657, 8, 2027, 'PROBLEMA', 'EFECTO', 654, 5, 'Desgaste operativo del personal y equipo de trabajo.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (658, 8, 2027, 'PROBLEMA', 'CAUSA', 653, 6, 'Reorientación constante de la planeación de las campañas.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (659, 8, 2027, 'PROBLEMA', 'CAUSA', 653, 7, 'Reorientación de los recursos presupuestarios para las campañas.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (660, 8, 2027, 'PROBLEMA', 'CAUSA', 661, 8, 'Deficiencias en la coordinación logística.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (661, 8, 2027, 'PROBLEMA', 'CAUSA', 662, 9, 'Comunicación interinstitucional limitada entre las direcciones.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (662, 8, 2027, 'PROBLEMA', 'CAUSA', 653, 10, 'Deficiencias en la organización administrativa y documental.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (663, 8, 2027, 'PROBLEMA', 'CAUSA', 664, 11, 'Falta de programación oportuna de la agenda institucional.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (664, 8, 2027, 'PROBLEMA', 'CAUSA', 653, 12, 'Confirmación tardía de eventos por parte de proveedores e instituciones externas.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (665, 8, 2027, 'PROBLEMA', 'CAUSA', 659, 13, 'Limitaciones presupuestales.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (666, 8, 2027, 'OBJETIVOS', 'OBJETIVO', NULL, 1, 'Dar mayor difusión y voz a las acciones gubernamentales, procurando su alcance y adecuada recepción por parte de la ciudadanía.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (667, 8, 2027, 'PROBLEMA', 'EFECTO', 654, 14, 'El proceso de Preproducción, producción y postproducción es deficiente', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (668, 8, 2027, 'PROBLEMA', 'CAUSA', 658, 15, 'Entrega de información tardía. ', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (669, 8, 2027, 'OBJETIVOS', 'FIN', 666, 2, 'Tiempo suficiente para garantizar los estándares de calidad requeridos en las acciones de comunicación.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (670, 8, 2027, 'OBJETIVOS', 'MEDIO', 677, 3, 'Disponibilidad suficiente de información para el desarrollo de las acciones de comunicación.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (671, 8, 2027, 'OBJETIVOS', 'FIN', 666, 4, 'Tiempo suficiente para desarrollar estrategias de comunicación oportunas y efectivas dirigidas a la ciudadanía.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (672, 8, 2027, 'OBJETIVOS', 'FIN', 669, 5, 'Condiciones operativas adecuadas para el personal y equipo de trabajo.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (673, 8, 2027, 'OBJETIVOS', 'FIN', 669, 6, 'Procesos eficientes de preproducción, producción y postproducción.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (674, 8, 2027, 'OBJETIVOS', 'MEDIO', 682, 7, 'Planeación estable y alineada con los objetivos establecidos.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (675, 8, 2027, 'OBJETIVOS', 'MEDIO', 682, 8, 'Asignación eficiente y oportuna de los recursos presupuestarios.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (676, 8, 2027, 'OBJETIVOS', 'MEDIO', 666, 9, 'Coordinación logística eficiente y articulada.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (677, 8, 2027, 'OBJETIVOS', 'MEDIO', 666, 10, 'Comunicación interinstitucional efectiva entre las direcciones.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (678, 8, 2027, 'OBJETIVOS', 'MEDIO', 670, 11, 'Organización administrativa y documental eficiente.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (679, 8, 2027, 'OBJETIVOS', 'MEDIO', 682, 12, 'Programación oportuna de la agenda institucional.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (680, 8, 2027, 'OBJETIVOS', 'MEDIO', 679, 13, 'Confirmación oportuna de eventos por parte de proveedores e instituciones externas.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (681, 8, 2027, 'OBJETIVOS', 'MEDIO', 682, 14, 'Disponibilidad presupuestaria suficiente para el desarrollo de las acciones de la campaña.', NULL, NULL, NULL, NULL);
INSERT INTO arbol_nodos (id, programa_id, anio, arbol, tipo, padre_id, orden, texto, indicador_id, supuestos, medios_verificacion, area_responsable_id) VALUES (682, 8, 2027, 'OBJETIVOS', 'MEDIO', 674, 15, 'Entrega oportuna de información para el desarrollo de las acciones de comunicación.', NULL, NULL, NULL, NULL);

INSERT INTO diagnostico_programa (id, programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES (60, 8, 2027, 1, 'Limitada articulación interinstitucional con las áreas operativas. Existen canales de comunicación insuficientes, falta de seguimiento a los acuerdos estratégicos y débil sistematización de la información que permita evaluar resultados de gestión.', 'Presidencia Municipal con mecanismos claros de coordinación, toma de decisiones informada, delegación organizada de funciones y reuniones generales de seguimiento para monitorear el avance de cada área, identificar necesidades y brindar el apoyo correspondiente.');
INSERT INTO diagnostico_programa (id, programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES (61, 8, 2027, 2, 'Procesos administrativos con limitada digitalización y rezagos en la gestión documental, lo que afecta la eficiencia de los procesos internos del Ayuntamiento. Los procesos de archivo y acuerdos carecen de herramientas tecnológicas que garanticen su trazabilidad y consulta oportuna.', 'La presidencia Municipal cuenta con digitalización de trámites y archivo histórico, garantizando la transparencia, legalidad y trazabilidad de los actos administrativos.');
INSERT INTO diagnostico_programa (id, programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES (62, 8, 2027, 3, 'Limitada capacidad operativa y presupuestal. Existen carencias en equipamiento, conectividad. ', 'El Ayuntamiento cuenta con equipamiento básico de buena calidad.');
INSERT INTO diagnostico_programa (id, programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES (63, 8, 2027, 4, 'Presencia digital poco constante, con estrategias reactivas más que preventivas. Hay carencia de planeación comunicacional basada en objetivos de impacto, lo que limita la comunicación a la ciudadanía.', 'Los mecanismos establecidos de coordinación interinstitucional permiten programar con antelación las campañas y acciones de comunicación, definiendo responsabilidades y tiempos para asegurar una ejecución oportuna y efectiva a la hora de comunicar a la ciudadanía. ');
INSERT INTO diagnostico_programa (id, programa_id, anio, orden, situacion_actual, transformacion_deseada) VALUES (64, 8, 2027, 5, 'Enfrenta problemas de saturación operativa, derivada de una atención constante a situaciones administrativas y escaso tiempo para el desarrollo de las campañas. ', 'El criterio de priorización y programación de solicitudes entre las áreas de este Ayuntamiento, considerando tiempos de atención y capacidad operativa, optimiza recursos y garantiza el desarrollo oportuno de las acciones de comunicación.');

INSERT INTO involucrados_programa (id, programa_id, anio, categoria, actor, orden) VALUES (187, 8, 2027, 'BENEFICIARIO', 'Ciudadanía del municipio ', 1);
INSERT INTO involucrados_programa (id, programa_id, anio, categoria, actor, orden) VALUES (188, 8, 2027, 'BENEFICIARIO', 'Presidente Municipal', 2);
INSERT INTO involucrados_programa (id, programa_id, anio, categoria, actor, orden) VALUES (189, 8, 2027, 'BENEFICIARIO', 'Direcciones y Coordinaciones solicitantes de campañas', 3);
INSERT INTO involucrados_programa (id, programa_id, anio, categoria, actor, orden) VALUES (190, 8, 2027, 'BENEFICIARIO', 'Coordinación de Comunicación Social', 4);
INSERT INTO involucrados_programa (id, programa_id, anio, categoria, actor, orden) VALUES (191, 8, 2027, 'EJECUTOR', 'Direcciones y Coordinaciones que soliciten campañas de publicidad', 1);
INSERT INTO involucrados_programa (id, programa_id, anio, categoria, actor, orden) VALUES (192, 8, 2027, 'EJECUTOR', 'Coordinación de Comunicación Social', 2);

SELECT setval(pg_get_serial_sequence('arbol_nodos','id'),           (SELECT max(id) FROM arbol_nodos));
SELECT setval(pg_get_serial_sequence('diagnostico_programa','id'),  (SELECT max(id) FROM diagnostico_programa));
SELECT setval(pg_get_serial_sequence('involucrados_programa','id'), (SELECT max(id) FROM involucrados_programa));

COMMIT;
