-- Fase 0.1: las funciones SECURITY DEFINER solo deben ser ejecutables por usuarios autenticados.
REVOKE EXECUTE ON FUNCTION public.get_my_rol()                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_mes_actual()                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_anio_actual()                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_primer_login_completado() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_rol()                     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_mes_actual()                 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_anio_actual()                TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.marcar_primer_login_completado() TO authenticated, service_role;
