-- Expediente MML: coordinador es un rol de solo-consulta general en el
-- sistema (dashboards), pero no tiene acceso a la pantalla de Expediente MML
-- (puedeVerMML en App.jsx = admin/planeacion/directivo/enlace). Las políticas
-- SELECT de las tablas de contenido MML estaban abiertas a cualquier
-- authenticated (USING true), lo que permitía a coordinador leer los datos
-- vía API/Supabase directo aunque la UI no le mostrara el módulo. Se alinea
-- RLS con el gate del frontend.

ALTER POLICY mir_niveles_select ON public.mir_niveles
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY indicador_variables_select ON public.indicador_variables
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY ind_var_valores_select ON public.indicador_variables_valores
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY diagnostico_select ON public.diagnostico_programa
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY arbol_select ON public.arbol_nodos
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY involucrados_select ON public.involucrados_programa
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY acciones_select ON public.acciones_alternativas
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY presupuesto_select ON public.presupuesto_programa
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));

ALTER POLICY firmas_select ON public.firmas_programa
  USING (public.get_my_rol() IN ('admin','planeacion','directivo','enlace'));
