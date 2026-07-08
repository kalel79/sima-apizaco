-- ============================================================================
-- ROLLBACK Fase 0.1 — Remediación de seguridad (2026-07-07)
-- Ejecutar SOLO si alguna pantalla deja de funcionar tras la fase 0.1.
-- Revierte cada cambio en orden inverso. Idealmente revertir solo el bloque
-- que corresponda al síntoma, no todo el archivo.
-- ============================================================================

-- 6) Restaurar lectura anónima en tablas base (revierte drop de lectura_publica)
CREATE POLICY lectura_publica ON public.areas         FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.avances       FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.ejes          FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.indicadores   FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.programas     FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.programas_pmd FOR SELECT TO public USING (true);

-- 5) Regresar tablas de respaldo a public
ALTER TABLE backups.backup_indicadores_20260617 SET SCHEMA public;
ALTER TABLE backups.backup_avances_20260617     SET SCHEMA public;
ALTER TABLE backups.backup_evidencias_20260617  SET SCHEMA public;

-- 4) Restaurar políticas originales de audit_log
DROP POLICY IF EXISTS audit_log_insert_propio      ON public.audit_log;
DROP POLICY IF EXISTS audit_log_select_supervision ON public.audit_log;
CREATE POLICY admin_puede_insertar_audit_log ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- 3) Quitar search_path fijo
ALTER FUNCTION public.calcular_semaforo(numeric)      RESET search_path;
ALTER FUNCTION public.fn_set_updated_at()             RESET search_path;
ALTER FUNCTION public.configuracion_set_actualizado() RESET search_path;

-- 2) Restaurar EXECUTE para anon en funciones definer
GRANT EXECUTE ON FUNCTION public.get_my_rol()                     TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mes_actual()                 TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_anio_actual()                TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.marcar_primer_login_completado() TO PUBLIC;

-- 1) Regresar vistas a SECURITY DEFINER (comportamiento previo)
ALTER VIEW public.v_dashboard_global     SET (security_invoker = false);
ALTER VIEW public.v_resumen_ejes         SET (security_invoker = false);
ALTER VIEW public.v_resumen_areas        SET (security_invoker = false);
ALTER VIEW public.v_alertas_logros       SET (security_invoker = false);
ALTER VIEW public.v_indicadores_acum     SET (security_invoker = false);
-- v_avance_captura_areas y v_comparativo_pmd ya eran invoker desde antes; no tocar.
