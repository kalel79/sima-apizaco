-- CAPAMA como área de SIMA solo para el Segundo Informe de Gobierno (5 nov 2026).
-- Es organismo paramunicipal: no tiene MIR, indicadores ni usuarios. Planeación
-- captura sus acciones (desde el Excel que entrega CAPAMA) en el módulo Informe,
-- sin vincular a indicador y con justificación. Eje 3: Infraestructura y
-- Servicios Públicos de Calidad.
-- Como área sin indicadores aparece en gris ("SIN INDICADORES"/"SIN NIVELES")
-- al final de Avance de captura y Avance MML, igual que otras áreas sin MIR.

INSERT INTO public.areas (nombre, eje_id, programa_id, num_indicadores_mir, activo)
SELECT 'CAPAMA', 3, NULL, 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.areas WHERE nombre = 'CAPAMA');

-- Para revertir (solo si no tiene acciones capturadas en informe_acciones):
-- DELETE FROM public.areas WHERE nombre = 'CAPAMA'
--   AND NOT EXISTS (SELECT 1 FROM public.informe_acciones a WHERE a.area_id = areas.id);
