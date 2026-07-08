-- Fase 0.1: las vistas dejan de ejecutarse con permisos del creador (postgres)
-- y pasan a respetar las políticas RLS del usuario que consulta.
-- Los usuarios autenticados tienen SELECT en todas las tablas base, por lo que
-- el comportamiento de la app no cambia; el acceso anónimo queda sujeto a RLS.
ALTER VIEW public.v_dashboard_global     SET (security_invoker = true);
ALTER VIEW public.v_resumen_ejes         SET (security_invoker = true);
ALTER VIEW public.v_resumen_areas        SET (security_invoker = true);
ALTER VIEW public.v_alertas_logros       SET (security_invoker = true);
ALTER VIEW public.v_indicadores_acum     SET (security_invoker = true);
ALTER VIEW public.v_avance_captura_areas SET (security_invoker = true);
ALTER VIEW public.v_comparativo_pmd      SET (security_invoker = true);
