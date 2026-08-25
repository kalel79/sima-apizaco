-- ============================================================
-- FASE MML 18 — Proyecto del programa 024
-- Su archivo oficial dejó vacío el renglón "Proyecto" de la Ficha de
-- Proyecto, lo que dejaba incompleta la Clave Programática compuesta.
-- Hugo confirmó que el Proyecto del 024 es el 024 mismo; el texto sigue
-- el patrón de los otros 8 archivos, donde el Proyecto lleva el nombre
-- del programa.
-- ============================================================
UPDATE public.ficha_proyecto f
SET proyecto_num  = '024',
    proyecto_texto = 'Infraestructura y Equipamiento para el Desarrollo Urbano'
FROM public.programas p
WHERE p.id = f.programa_id
  AND p.clave = '024'
  AND coalesce(f.proyecto_num, '') = '';
