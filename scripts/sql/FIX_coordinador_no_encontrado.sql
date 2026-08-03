-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX — Coordinadores no pueden ver su propio perfil ("usuario no encontrado")
-- Fecha   : 2026-07-15
-- Causa   : la política usuarios_select_v1 (scripts/sql/PASO_3_RLS_usuarios.sql)
--           solo contempla los roles admin/planeacion/enlace/directivo. El rol
--           "coordinador" (rol_id=6, agregado después) cae en el ELSE false y
--           se le niega la lectura de su propia fila en public.usuarios.
-- Afecta  : los 9 usuarios con rol_id=6, incluida analauralimam@gmail.com.
-- Uso     : SQL Editor de Supabase (dashboard.supabase.com → proyecto sima-apizaco
--           → SQL Editor) → pegar → Run.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "usuarios_select_v1" ON public.usuarios;

CREATE POLICY "usuarios_select_v1"
  ON  public.usuarios
  FOR SELECT
  USING (
    CASE public.get_my_rol()
      WHEN 'admin'       THEN true
      WHEN 'planeacion'  THEN true
      WHEN 'enlace'      THEN auth_uid = auth.uid()
      WHEN 'directivo'   THEN auth_uid = auth.uid()
      WHEN 'coordinador' THEN auth_uid = auth.uid()
      ELSE false
    END
  );

-- Verificación (debe existir la política con las 5 ramas del CASE):
SELECT policyname, cmd
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'usuarios' AND policyname = 'usuarios_select_v1';
