-- ============================================================
-- FASE MML 12 — permite a Planeación escribir en `metas` (POA).
--
-- Detectado al construir "Copiar de 2026 → 2027": metas_write_admin
-- (fase 1.1, previa al módulo MML) era admin-only y metas_write_area
-- (fase_mml_10) solo cubre enlace por área — Planeación quedó sin
-- política de escritura en esta tabla, inconsistente con el resto del
-- módulo MML donde planeación siempre puede escribir (arbol_write_admin,
-- involucrados_write_admin, etc. ya incluyen 'planeacion'). El front
-- (puedeEditarDatosIndicador) ya asumía que planeación podía editar
-- cualquier fila de metas; esto lo hace cierto también en la base.
-- ============================================================

CREATE POLICY metas_write_planeacion ON public.metas
  FOR ALL TO authenticated
  USING (public.get_my_rol() = 'planeacion')
  WITH CHECK (public.get_my_rol() = 'planeacion');
