-- Corrige el hueco de RLS en programas_pmd (tenía RLS habilitado sin políticas,
-- es decir, ilegible para todos). Se replica el mismo patrón de las demás
-- tablas de catálogo (areas, ejes, programas): lectura para authenticated y
-- public, escritura solo para admin.
CREATE POLICY "programas_pmd_select_autenticados" ON public.programas_pmd
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lectura_publica" ON public.programas_pmd
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "programas_pmd_write_admin" ON public.programas_pmd
  FOR ALL
  TO authenticated
  USING (get_my_rol() = 'admin')
  WITH CHECK (get_my_rol() = 'admin');

-- Vista comparativa PMD vs. avance real de indicadores MIR.
-- security_invoker = true: a diferencia de las vistas existentes del
-- proyecto (v_dashboard_global, v_resumen_ejes, etc., todas SECURITY
-- DEFINER y marcadas como ERROR por el linter de Supabase), esta vista
-- respeta el RLS del usuario que consulta en vez del dueño de la vista.
CREATE VIEW public.v_comparativo_pmd
WITH (security_invoker = true) AS
SELECT
  p.id AS programa_id,
  p.numero,
  p.nombre AS programa_nombre,
  p.eje,
  p.objetivo,
  p.meta AS meta_pmd,
  p.responsable,
  p.plazo,
  COUNT(i.id) AS total_indicadores,
  COUNT(a.id) AS indicadores_con_avance,
  ROUND(AVG(a.pct_cumplimiento)::numeric, 2) AS pct_promedio,
  SUM(CASE WHEN a.semaforo = 'ÓPTIMO' THEN 1 ELSE 0 END) AS optimo,
  SUM(CASE WHEN a.semaforo = 'ADECUADO' THEN 1 ELSE 0 END) AS adecuado,
  SUM(CASE WHEN a.semaforo = 'RIESGO' THEN 1 ELSE 0 END) AS riesgo,
  SUM(CASE WHEN a.semaforo = 'CRÍTICO' THEN 1 ELSE 0 END) AS critico
FROM programas_pmd p
LEFT JOIN indicadores i ON i.programa_pmd_id = p.id
LEFT JOIN avances a ON a.indicador_id = i.id
  AND a.mes <= get_mes_actual()
  AND a.anio = get_anio_actual()
GROUP BY p.id, p.numero, p.nombre, p.eje, p.objetivo, p.meta, p.responsable, p.plazo
ORDER BY p.numero;
