-- Reversa de fase_mml_29: deja las 9 políticas exactamente como estaban antes
-- (capturadas de pg_policies el 2026-09-04, justo antes de aplicar la
-- migración). Pegar completo en el SQL Editor si hay que revertir.

drop policy if exists arbol_select on public.arbol_nodos;
create policy arbol_select on public.arbol_nodos
  for select to public
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace', 'coordinador']));

drop policy if exists arbol_update_area on public.arbol_nodos;
create policy arbol_update_area on public.arbol_nodos
  for update to public
  using      (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace')
  with check (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace');

drop policy if exists diagnostico_select on public.diagnostico_programa;
create policy diagnostico_select on public.diagnostico_programa
  for select to authenticated
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace']));

drop policy if exists diagnostico_write_area on public.diagnostico_programa;
create policy diagnostico_write_area on public.diagnostico_programa
  for all to authenticated
  using      (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace')
  with check (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace');

drop policy if exists involucrados_select on public.involucrados_programa;
create policy involucrados_select on public.involucrados_programa
  for select to authenticated
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace']));

drop policy if exists involucrados_write_area on public.involucrados_programa;
create policy involucrados_write_area on public.involucrados_programa
  for all to authenticated
  using      (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace')
  with check (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace');

drop policy if exists acciones_select on public.acciones_alternativas;
create policy acciones_select on public.acciones_alternativas
  for select to authenticated
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace']));

drop policy if exists acciones_write_area on public.acciones_alternativas;
create policy acciones_write_area on public.acciones_alternativas
  for all to authenticated
  using      (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace')
  with check (programa_id = any (public.get_mis_programa_ids()) and public.get_my_rol() = 'enlace');

drop policy if exists ficha_proyecto_select on public.ficha_proyecto;
create policy ficha_proyecto_select on public.ficha_proyecto
  for select to authenticated
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace']));

drop policy if exists ficha_fuente_select on public.ficha_fuente_financiamiento;
create policy ficha_fuente_select on public.ficha_fuente_financiamiento
  for select to authenticated
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace']));

drop policy if exists presupuesto_select on public.presupuesto_programa;
create policy presupuesto_select on public.presupuesto_programa
  for select to authenticated
  using (public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'enlace']));
