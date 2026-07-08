-- Fase 0.1: audit_log dejaba insertar cualquier cosa a cualquier autenticado (WITH CHECK true)
-- y no tenía política de lectura. Ahora: cada quien inserta solo eventos a su nombre,
-- y solo admin/planeación pueden consultar la bitácora.
DROP POLICY IF EXISTS admin_puede_insertar_audit_log ON public.audit_log;

CREATE POLICY audit_log_insert_propio ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = (SELECT u.id FROM public.usuarios u WHERE u.auth_uid = auth.uid())
  );

CREATE POLICY audit_log_select_supervision ON public.audit_log
  FOR SELECT TO authenticated
  USING (get_my_rol() IN ('admin', 'planeacion'));
