-- ── fase_mml_29: el enlace ya no ve el Expediente MML 2026 ──────────────────
-- El 2026 es un expediente cerrado; el enlace solo trabaja el ejercicio en
-- captura. ExpedienteMML.jsx ya le quitó el selector de año, pero eso es la
-- vista: sin esto la API le sigue devolviendo las filas de 2026. Se agrega
-- `anio <> 2026` a la rama 'enlace' de las 7 tablas cuyo contenido es
-- exclusivamente del expediente.
--
-- OJO 1: las políticas ALL de enlace (diagnostico/involucrados/acciones
--   _write_area) son PERMISSIVE, así que TAMBIÉN otorgan SELECT. Sin tocarlas,
--   restringir solo las políticas *_select no bloquearía nada.
-- OJO 2: NO se tocan `metas`, `indicadores` ni `avances` — el enlace los
--   necesita en 2026 para la captura mensual.
-- OJO 3: `firmas_programa` no tiene columna `anio` (las firmas son por
--   programa, no por ejercicio), así que queda fuera.
-- OJO 4: `v_indicador_anio` es security_invoker=false (derechos del
--   propietario), así que el filtro por año de la pantalla de Captura sigue
--   leyendo arbol_nodos 2026 y no se rompe.
-- OJO 5: los otros tres lectores de arbol_nodos (getIndicadoresPorPrograma,
--   getDetalleIndicadoresPMD, getProgramasPresupuestariosPorPmd) cuelgan de
--   PantallaPMD, que es admin/planeación/directivo — el enlace no entra.
--
-- Al abrir el ejercicio 2028 hay que mover el 2026 en las 7 políticas.
-- Se conservan tal cual los roles de cada política (`public` en las de
-- arbol_nodos, `authenticated` en las demás) y el resto de sus condiciones.

-- ── arbol_nodos ────────────────────────────────────────────────────────────
drop policy if exists arbol_select on public.arbol_nodos;
create policy arbol_select on public.arbol_nodos
  for select to public
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo', 'coordinador'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );

-- El enlace tampoco debe poder escribir a ciegas en un ejercicio que no ve.
drop policy if exists arbol_update_area on public.arbol_nodos;
create policy arbol_update_area on public.arbol_nodos
  for update to public
  using (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  )
  with check (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  );

-- ── diagnostico_programa ───────────────────────────────────────────────────
drop policy if exists diagnostico_select on public.diagnostico_programa;
create policy diagnostico_select on public.diagnostico_programa
  for select to authenticated
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );

drop policy if exists diagnostico_write_area on public.diagnostico_programa;
create policy diagnostico_write_area on public.diagnostico_programa
  for all to authenticated
  using (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  )
  with check (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  );

-- ── involucrados_programa ──────────────────────────────────────────────────
drop policy if exists involucrados_select on public.involucrados_programa;
create policy involucrados_select on public.involucrados_programa
  for select to authenticated
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );

drop policy if exists involucrados_write_area on public.involucrados_programa;
create policy involucrados_write_area on public.involucrados_programa
  for all to authenticated
  using (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  )
  with check (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  );

-- ── acciones_alternativas ──────────────────────────────────────────────────
drop policy if exists acciones_select on public.acciones_alternativas;
create policy acciones_select on public.acciones_alternativas
  for select to authenticated
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );

drop policy if exists acciones_write_area on public.acciones_alternativas;
create policy acciones_write_area on public.acciones_alternativas
  for all to authenticated
  using (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  )
  with check (
    programa_id = any (public.get_mis_programa_ids())
    and public.get_my_rol() = 'enlace'
    and anio <> 2026
  );

-- ── ficha_proyecto ─────────────────────────────────────────────────────────
drop policy if exists ficha_proyecto_select on public.ficha_proyecto;
create policy ficha_proyecto_select on public.ficha_proyecto
  for select to authenticated
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );

-- ── ficha_fuente_financiamiento ────────────────────────────────────────────
drop policy if exists ficha_fuente_select on public.ficha_fuente_financiamiento;
create policy ficha_fuente_select on public.ficha_fuente_financiamiento
  for select to authenticated
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );

-- ── presupuesto_programa ───────────────────────────────────────────────────
drop policy if exists presupuesto_select on public.presupuesto_programa;
create policy presupuesto_select on public.presupuesto_programa
  for select to authenticated
  using (
    public.get_my_rol() = any (array['admin', 'planeacion', 'directivo'])
    or (public.get_my_rol() = 'enlace' and anio <> 2026)
  );
