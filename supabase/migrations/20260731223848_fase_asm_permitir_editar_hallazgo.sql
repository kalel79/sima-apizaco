-- Módulo ASM: permite editar el texto de un hallazgo ya registrado
-- (columnas hallazgo/justificacion) a admin/planeacion, que son los únicos
-- roles con alcance de captura en el módulo desde
-- 20260729161059_fase_asm_restringir_lectura_sin_enlace.sql. No existía
-- ninguna política de UPDATE para asm_hallazgos (solo INSERT vía captura),
-- así que se agrega como política adicional y permisiva: no reemplaza ni
-- depende de la política de escritura original (creada fuera de las
-- migraciones versionadas), simplemente la complementa para el comando
-- UPDATE.
CREATE POLICY asm_hallazgos_update_admin_planeacion ON public.asm_hallazgos
  FOR UPDATE
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
