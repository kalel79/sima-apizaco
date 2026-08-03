-- Módulo ASM: restringido a admin/planeacion/directivo (sin enlace), a
-- pedido de Hugo (2026-07-29). El enlace deja de tener alcance de captura en
-- ASM, así que se retiran sus políticas de escritura y se cierra la lectura,
-- antes abierta a cualquier authenticated (USING true, lo que también dejaba
-- pasar a coordinador), a los tres roles que conservan el módulo en la UI
-- (App.jsx: puedeVerASM).

DROP POLICY IF EXISTS asm_hallazgos_write_enlace ON public.asm_hallazgos;
DROP POLICY IF EXISTS asm_acciones_write_enlace ON public.asm_acciones_mejora;
DROP POLICY IF EXISTS asm_recursos_write_enlace ON public.asm_recursos;

ALTER POLICY asm_hallazgos_select ON public.asm_hallazgos
  USING (public.get_my_rol() IN ('admin','planeacion','directivo'));

ALTER POLICY asm_acciones_select ON public.asm_acciones_mejora
  USING (public.get_my_rol() IN ('admin','planeacion','directivo'));

ALTER POLICY asm_recursos_select ON public.asm_recursos
  USING (public.get_my_rol() IN ('admin','planeacion','directivo'));

-- asm_evidencias: el enlace ya no captura hallazgos/acciones/recursos, así
-- que se retira su condición de acceso propio por área en las tres políticas
-- (select/insert/delete quedan solo admin/planeacion, como ya era el único
-- alcance real de captura para este módulo).
ALTER POLICY asm_evidencias_select ON public.asm_evidencias
  USING (public.get_my_rol() IN ('admin','planeacion'));

ALTER POLICY asm_evidencias_insert ON public.asm_evidencias
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));

ALTER POLICY asm_evidencias_delete ON public.asm_evidencias
  USING (public.get_my_rol() IN ('admin','planeacion'));
