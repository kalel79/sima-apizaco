-- Fase 0.1: elimina la lectura anónima total de las tablas base.
-- La anon key viaja en el bundle del frontend: con estas políticas cualquier
-- persona podía leer avances (incl. observaciones internas), indicadores, etc.
-- Los usuarios autenticados conservan sus políticas *_select_autenticados.
DROP POLICY IF EXISTS lectura_publica ON public.areas;
DROP POLICY IF EXISTS lectura_publica ON public.avances;
DROP POLICY IF EXISTS lectura_publica ON public.ejes;
DROP POLICY IF EXISTS lectura_publica ON public.indicadores;
DROP POLICY IF EXISTS lectura_publica ON public.programas;
DROP POLICY IF EXISTS lectura_publica ON public.programas_pmd;
