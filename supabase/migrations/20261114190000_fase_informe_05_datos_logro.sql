-- ============================================================
-- FASE INFORME 05 — Datos de logro de las acciones del Informe
-- El Informe destaca logros: cada acción puede llevar una cifra principal
-- (número y qué cuenta), el lugar, el pie de foto y un tema que agrupa los
-- logros del capítulo. Los captura el enlace o Planeación; todos opcionales.
-- destacado_eje (abre el capítulo del eje) y destacado_informe (va en la
-- página de logros del año) solo los mueve admin/planeación.
-- 100% aditiva: columnas nuevas nullable y la vista las expone al final.
-- ============================================================

ALTER TABLE public.informe_acciones
  ADD COLUMN IF NOT EXISTS cifra_valor       text,
  ADD COLUMN IF NOT EXISTS cifra_etiqueta    text,
  ADD COLUMN IF NOT EXISTS lugar             text,
  ADD COLUMN IF NOT EXISTS pie_foto          text,
  ADD COLUMN IF NOT EXISTS tema              text,
  ADD COLUMN IF NOT EXISTS destacado_eje     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS destacado_informe boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.informe_acciones.cifra_valor    IS 'Cifra principal del logro tal como se imprime: "3,000", "82.57 %", "1.er lugar".';
COMMENT ON COLUMN public.informe_acciones.cifra_etiqueta IS 'Qué cuenta la cifra principal: "árboles plantados".';
COMMENT ON COLUMN public.informe_acciones.lugar          IS 'Dónde ocurrió: colonia, comunidad o todo el municipio.';
COMMENT ON COLUMN public.informe_acciones.pie_foto       IS 'Pie de foto para el PDF: qué se ve y quién la tomó.';
COMMENT ON COLUMN public.informe_acciones.tema           IS 'Título ciudadano que agrupa los logros dentro del capítulo del eje.';
COMMENT ON COLUMN public.informe_acciones.destacado_eje     IS 'Logro que abre el capítulo de su eje. Solo admin/planeación.';
COMMENT ON COLUMN public.informe_acciones.destacado_informe IS 'Logro que va en la página de logros del año. Solo admin/planeación.';

-- Misma función de fase_informe_01, más la regla de los destacados.
CREATE OR REPLACE FUNCTION public.fn_informe_acciones_validar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ini date;
  v_fin date;
  v_es_planeacion boolean := public.get_my_rol() = ANY (ARRAY['admin','planeacion']);
BEGIN
  SELECT periodo_inicio, periodo_fin INTO v_ini, v_fin
  FROM public.informe_gobierno WHERE id = NEW.informe_id;

  IF NEW.fecha < v_ini OR NEW.fecha > v_fin THEN
    RAISE EXCEPTION 'La fecha % está fuera del periodo del informe (% a %)', NEW.fecha, v_ini, v_fin
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.indicador_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.indicadores i WHERE i.id = NEW.indicador_id AND i.area_id = NEW.area_id
  ) THEN
    RAISE EXCEPTION 'El indicador % no pertenece al área %', NEW.indicador_id, NEW.area_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT u.id INTO NEW.created_by FROM public.usuarios u WHERE u.auth_uid = auth.uid();
    IF NOT v_es_planeacion THEN
      NEW.revisada := false;
      NEW.incluir_en_informe := true;
      NEW.destacado_eje := false;
      NEW.destacado_informe := false;
    END IF;
  ELSE
    NEW.created_by := OLD.created_by;
    IF NOT v_es_planeacion THEN
      NEW.incluir_en_informe := OLD.incluir_en_informe;
      NEW.revisada := false;
      NEW.destacado_eje := OLD.destacado_eje;
      NEW.destacado_informe := OLD.destacado_informe;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_informe_acciones_validar() FROM anon;

CREATE OR REPLACE VIEW public.v_informe_acciones WITH (security_invoker = true) AS
 SELECT a.id,
    a.informe_id,
    a.area_id,
    ar.nombre AS area,
    e.codigo AS eje_codigo,
    e.nombre AS eje,
    e.orden AS eje_orden,
    a.coordinacion,
    a.indicador_id,
    i.clave AS indicador_clave,
    i.nombre AS indicador,
    i.nivel_mir,
    i.programa_pmd_id,
    p.numero AS programa_pmd_numero,
    p.nombre AS programa_pmd,
    a.justificacion,
    a.accion,
    a.fecha,
    a.monto,
    a.beneficiarios,
    a.descripcion,
    a.tiene_foto,
    a.tiene_video,
    a.revisada,
    a.incluir_en_informe,
    a.created_at,
    a.updated_at,
    a.diagrama,
    a.cifra_valor,
    a.cifra_etiqueta,
    a.lugar,
    a.pie_foto,
    a.tema,
    a.destacado_eje,
    a.destacado_informe
   FROM informe_acciones a
     JOIN areas ar ON ar.id = a.area_id
     LEFT JOIN ejes e ON e.id = ar.eje_id
     LEFT JOIN indicadores i ON i.id = a.indicador_id
     LEFT JOIN programas_pmd p ON p.id = i.programa_pmd_id;
