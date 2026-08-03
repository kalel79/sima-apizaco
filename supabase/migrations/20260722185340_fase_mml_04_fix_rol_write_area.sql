-- ============================================================
-- FASE MML 04 — Corrección de seguridad en *_write_area
-- Motivo: 'directivo' y 'coordinador' son roles de solo-consulta en
-- toda la aplicación (sin módulo de captura); las políticas
-- write_area de las 7 tablas de contenido MML los incluían por
-- error, contradiciendo esa convención. write_admin no se toca.
-- ============================================================

ALTER POLICY mir_niveles_write_area ON public.mir_niveles
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() = 'enlace')
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() = 'enlace');

ALTER POLICY diagnostico_write_area ON public.diagnostico_programa
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() = 'enlace')
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() = 'enlace');

ALTER POLICY arbol_write_area ON public.arbol_nodos
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() = 'enlace')
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() = 'enlace');

ALTER POLICY involucrados_write_area ON public.involucrados_programa
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() = 'enlace')
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() = 'enlace');

ALTER POLICY acciones_write_area ON public.acciones_alternativas
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() = 'enlace')
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() = 'enlace');

ALTER POLICY indicador_variables_write_area ON public.indicador_variables
  USING (public.get_my_rol() = 'enlace'
         AND EXISTS (SELECT 1 FROM public.indicadores i
                     WHERE i.id = indicador_id
                       AND i.programa_id = ANY (public.get_mis_programa_ids())))
  WITH CHECK (public.get_my_rol() = 'enlace'
              AND EXISTS (SELECT 1 FROM public.indicadores i
                          WHERE i.id = indicador_id
                            AND i.programa_id = ANY (public.get_mis_programa_ids())));

ALTER POLICY ind_var_valores_write_area ON public.indicador_variables_valores
  USING (public.get_my_rol() = 'enlace'
         AND EXISTS (SELECT 1
                     FROM public.indicador_variables v
                     JOIN public.indicadores i ON i.id = v.indicador_id
                     WHERE v.id = variable_id
                       AND i.programa_id = ANY (public.get_mis_programa_ids())))
  WITH CHECK (public.get_my_rol() = 'enlace'
              AND EXISTS (SELECT 1
                          FROM public.indicador_variables v
                          JOIN public.indicadores i ON i.id = v.indicador_id
                          WHERE v.id = variable_id
                            AND i.programa_id = ANY (public.get_mis_programa_ids())));
