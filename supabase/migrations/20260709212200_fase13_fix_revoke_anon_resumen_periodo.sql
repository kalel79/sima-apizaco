-- Corrige la migracion anterior: REVOKE ALL ... FROM public NO quita el
-- EXECUTE que Supabase otorga a "anon" por default privileges al crear la
-- funcion (mismo patron ya documentado en fase01_seguridad para get_my_rol
-- y otras funciones). Hay que revocar explicitamente de "anon".

REVOKE EXECUTE ON FUNCTION public.resumen_global_periodo(integer,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resumen_ejes_periodo(integer,integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resumen_areas_periodo(integer,integer) FROM anon;
