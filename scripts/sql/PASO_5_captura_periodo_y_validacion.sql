-- ═══════════════════════════════════════════════════════════
-- PASO 5 — Bloqueo de periodo para enlace + validación con contraseña
-- Ya aplicado en Supabase (autorizado por Hugo el 2026-06-19).
-- ═══════════════════════════════════════════════════════════

-- 0. (Ya aplicado en un paso anterior) Cierra el hueco de seguridad:
--    esta política ALL/true permitía a CUALQUIER usuario autenticado
--    insertar/editar/borrar avances de cualquier área, anulando en la
--    práctica a avances_insert_rol/avances_update_rol/avances_delete_admin.
-- DROP POLICY IF EXISTS escritura_auth ON public.avances;

-- 1. Columnas de auditoría de validación (validado ya existía, sin uso)
ALTER TABLE public.avances
  ADD COLUMN IF NOT EXISTS validado_at timestamptz,
  ADD COLUMN IF NOT EXISTS validado_por uuid REFERENCES public.usuarios(id);

-- 2. INSERT: enlace solo puede capturar el mes/año ACTUAL (el que define
--    Planeación en su panel, vía get_mes_actual()/get_anio_actual()).
--    admin/planeación sin restricción de periodo.
DROP POLICY IF EXISTS avances_insert_rol ON public.avances;
CREATE POLICY avances_insert_rol ON public.avances
  FOR INSERT
  WITH CHECK (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND mes = get_mes_actual()
      AND anio = get_anio_actual()
      AND EXISTS (
        SELECT 1 FROM indicadores i JOIN usuarios u ON u.area_id = i.area_id
        WHERE i.id = avances.indicador_id AND u.auth_uid = auth.uid()
      )
    )
  );

-- 3. UPDATE: enlace solo puede editar el mes/año actual, y solo si AÚN
--    no fue validado (validado IS NOT TRUE). Una vez validado, ni el
--    propio enlace puede tocarlo -- queda fijo para la evaluación.
--    admin/planeación pueden seguir editando aunque ya esté validado
--    (vía oficial de corrección, decisión de Hugo).
DROP POLICY IF EXISTS avances_update_rol ON public.avances;
CREATE POLICY avances_update_rol ON public.avances
  FOR UPDATE
  USING (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND mes = get_mes_actual()
      AND anio = get_anio_actual()
      AND validado IS NOT TRUE
      AND EXISTS (
        SELECT 1 FROM indicadores i JOIN usuarios u ON u.area_id = i.area_id
        WHERE i.id = avances.indicador_id AND u.auth_uid = auth.uid()
      )
    )
  )
  WITH CHECK (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND mes = get_mes_actual()
      AND anio = get_anio_actual()
      AND EXISTS (
        SELECT 1 FROM indicadores i JOIN usuarios u ON u.area_id = i.area_id
        WHERE i.id = avances.indicador_id AND u.auth_uid = auth.uid()
      )
    )
  );

-- NOTA: la acción de "validar" (poner validado=true) es, para el enlace,
-- un UPDATE más -- permitido porque antes de validar la fila cumple
-- validado IS NOT TRUE. La app pide la contraseña ANTES de hacer este
-- UPDATE (re-autenticación vía supabase.auth.signInWithPassword); RLS no
-- puede verificar la contraseña por sí sola, solo garantiza que una vez
-- validado, no se puede revertir ni editar desde la app del enlace.
