-- Respaldo de lo que había en el PP 012 / 2027 ANTES de copiar el diagnóstico y
-- el árbol de objetivos de 2026 (2026-09-02).
--
-- Eran dos registros accidentales, no contenido real:
--   * diagnostico_programa id=54: alguien pegó el nombre y la fórmula de un
--     indicador en "Situación actual" / "Transformación deseada".
--   * arbol_nodos id=974: un "Nuevo nodo…" MEDIO suelto, sin padre, sin texto
--     capturado y sin indicador vinculado.
--
-- Solo correr esto si hay que devolver el expediente a como estaba. Los ids
-- originales no se restauran (las secuencias ya avanzaron); se reinsertan como
-- filas nuevas.

insert into diagnostico_programa (programa_id, anio, orden, situacion_actual, transformacion_deseada)
values (3, 2027, 1,
        'Porcentaje de productores rurales capacitados en prácticas sostenible',
        E'(Productores capacitados / Total de productores en padrón) × 100\n\n');

insert into arbol_nodos (programa_id, anio, arbol, tipo, padre_id, orden, texto,
                         supuestos, medios_verificacion, indicador_id, area_responsable_id)
values (3, 2027, 'OBJETIVOS', 'MEDIO', null, 1, 'Nuevo nodo…',
        null, null, null, null);
