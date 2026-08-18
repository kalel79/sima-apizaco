-- ============================================================
-- FASE MML 10 — permite a enlace capturar el POA (metas), scoped por área.
--
-- Separada de fase_mml_09 a propósito: metas_write_admin era admin-only
-- (ni planeación podía escribir) — esto amplía el alcance más allá de las 4
-- decisiones centrales de esa fase. Hugo pidió explícitamente que enlace
-- capture "la MIR, el POA y la ficha de los indicadores" — se aplica en el
-- mismo turno, pero en su propio archivo para poder revisar/revertir por
-- separado si hiciera falta. Mismo criterio de área que el resto del módulo
-- (puede_enlace_editar_indicador(), definida en fase_mml_09).
-- ============================================================

CREATE POLICY metas_write_area ON public.metas
  FOR ALL TO authenticated
  USING (get_my_rol() = 'enlace' AND public.puede_enlace_editar_indicador(indicador_id))
  WITH CHECK (get_my_rol() = 'enlace' AND public.puede_enlace_editar_indicador(indicador_id));
