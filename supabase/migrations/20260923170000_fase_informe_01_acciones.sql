-- ============================================================
-- FASE INFORME 01 — Captura de acciones relevantes para el Informe de Gobierno
-- Sustituye las 34 plantillas Excel por área (Plantillas_Informe_Gobierno_2026_v2)
-- por captura directa en SIMA. Las columnas replican la hoja "Captura de
-- Acciones" de esas plantillas; Nivel MIR, Programa PMD y Eje NO se guardan:
-- se derivan del indicador y del área en la vista v_informe_acciones.
-- Las fotos no viven aquí (las integra Comunicación Social); solo se marca si
-- el área tiene foto/video de la acción.
-- 100% aditiva: solo crea objetos nuevos.
-- ============================================================

-- ---------- Informes (uno por año de gobierno) ----------
CREATE TABLE public.informe_gobierno (
  id               serial PRIMARY KEY,
  numero           smallint NOT NULL UNIQUE,        -- 1er, 2do, 3er informe
  periodo_inicio   date     NOT NULL,
  periodo_fin      date     NOT NULL,
  captura_abierta  boolean  NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT informe_gobierno_periodo_chk CHECK (periodo_fin > periodo_inicio)
);

CREATE TRIGGER trg_informe_gobierno_updated_at
  BEFORE UPDATE ON public.informe_gobierno
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

INSERT INTO public.informe_gobierno (numero, periodo_inicio, periodo_fin, captura_abierta)
VALUES (2, '2025-09-01', '2026-08-31', true);

-- ---------- Acciones capturadas por las áreas ----------
CREATE TABLE public.informe_acciones (
  id                  serial PRIMARY KEY,
  informe_id          integer  NOT NULL REFERENCES public.informe_gobierno(id) ON DELETE CASCADE,
  area_id             integer  NOT NULL REFERENCES public.areas(id),
  coordinacion        varchar(200),
  indicador_id        integer  REFERENCES public.indicadores(id),
  justificacion       text,                          -- obligatoria si no hay indicador
  accion              text     NOT NULL,
  fecha               date     NOT NULL,
  monto               numeric(14,2),
  beneficiarios       integer,
  descripcion         text     NOT NULL,
  tiene_foto          boolean  NOT NULL DEFAULT false,
  tiene_video         boolean  NOT NULL DEFAULT false,
  -- Revisión de Planeación. Toda acción entra al informe por defecto;
  -- Planeación solo quita las que no van.
  revisada            boolean  NOT NULL DEFAULT false,
  incluir_en_informe  boolean  NOT NULL DEFAULT true,
  created_by          uuid     REFERENCES public.usuarios(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT informe_acciones_vinculo_chk CHECK (
    indicador_id IS NOT NULL OR length(btrim(coalesce(justificacion, ''))) > 0
  ),
  CONSTRAINT informe_acciones_textos_chk CHECK (
    length(btrim(accion)) > 0 AND length(btrim(descripcion)) > 0
  ),
  CONSTRAINT informe_acciones_monto_chk CHECK (monto IS NULL OR monto >= 0),
  CONSTRAINT informe_acciones_benef_chk CHECK (beneficiarios IS NULL OR beneficiarios >= 0)
);

CREATE INDEX informe_acciones_informe_area_idx ON public.informe_acciones (informe_id, area_id);

CREATE TRIGGER trg_informe_acciones_updated_at
  BEFORE UPDATE ON public.informe_acciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ---------- Reglas que un CHECK no alcanza ----------
-- 1) La fecha cae dentro del periodo del informe.
-- 2) El indicador pertenece al área que captura.
-- 3) Solo admin/planeación mueven revisada/incluir_en_informe; si otro rol
--    edita una acción ya revisada, vuelve a quedar pendiente de revisión.
-- 4) created_by lo pone la base, no el cliente.
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
    END IF;
  ELSE
    NEW.created_by := OLD.created_by;
    IF NOT v_es_planeacion THEN
      NEW.incluir_en_informe := OLD.incluir_en_informe;
      NEW.revisada := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_informe_acciones_validar() FROM anon;

CREATE TRIGGER trg_informe_acciones_validar
  BEFORE INSERT OR UPDATE ON public.informe_acciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_informe_acciones_validar();

CREATE TRIGGER trg_informe_acciones_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.informe_acciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

-- ---------- RLS ----------
-- Informes: todos los roles con acceso leen; solo admin/planeación los editan.
ALTER TABLE public.informe_gobierno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_acciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY informe_gobierno_select ON public.informe_gobierno
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo','enlace']));

CREATE POLICY informe_gobierno_write ON public.informe_gobierno
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

-- Acciones: admin/planeación todo; directivo solo lee; enlace lee lo de su
-- área y escribe solo mientras la captura del informe esté abierta.
CREATE POLICY informe_acciones_admin ON public.informe_acciones
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

CREATE POLICY informe_acciones_directivo_select ON public.informe_acciones
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'directivo');

CREATE POLICY informe_acciones_enlace_select ON public.informe_acciones
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id());

CREATE POLICY informe_acciones_enlace_insert ON public.informe_acciones
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id()
    AND EXISTS (SELECT 1 FROM public.informe_gobierno g WHERE g.id = informe_id AND g.captura_abierta)
  );

CREATE POLICY informe_acciones_enlace_update ON public.informe_acciones
  FOR UPDATE TO authenticated
  USING (
    public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id()
    AND EXISTS (SELECT 1 FROM public.informe_gobierno g WHERE g.id = informe_id AND g.captura_abierta)
  )
  WITH CHECK (
    public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id()
    AND EXISTS (SELECT 1 FROM public.informe_gobierno g WHERE g.id = informe_id AND g.captura_abierta)
  );

CREATE POLICY informe_acciones_enlace_delete ON public.informe_acciones
  FOR DELETE TO authenticated
  USING (
    public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id()
    AND EXISTS (SELECT 1 FROM public.informe_gobierno g WHERE g.id = informe_id AND g.captura_abierta)
  );

REVOKE ALL ON public.informe_gobierno FROM anon;
REVOKE ALL ON public.informe_acciones FROM anon;
REVOKE ALL ON SEQUENCE public.informe_gobierno_id_seq FROM anon;
REVOKE ALL ON SEQUENCE public.informe_acciones_id_seq FROM anon;

-- ---------- Vista de consulta ----------
-- security_invoker: la vista respeta la RLS de informe_acciones (el enlace
-- solo ve su área). Eje, Nivel MIR y Programa PMD se derivan aquí, igual que
-- las columnas automáticas de la plantilla Excel.
CREATE VIEW public.v_informe_acciones
WITH (security_invoker = true) AS
SELECT
  a.id, a.informe_id, a.area_id,
  ar.nombre            AS area,
  e.codigo             AS eje_codigo,
  e.nombre             AS eje,
  e.orden              AS eje_orden,
  a.coordinacion,
  a.indicador_id,
  i.clave              AS indicador_clave,
  i.nombre             AS indicador,
  i.nivel_mir,
  i.programa_pmd_id,
  p.numero             AS programa_pmd_numero,
  p.nombre             AS programa_pmd,
  a.justificacion, a.accion, a.fecha, a.monto, a.beneficiarios, a.descripcion,
  a.tiene_foto, a.tiene_video, a.revisada, a.incluir_en_informe,
  a.created_at, a.updated_at
FROM public.informe_acciones a
JOIN public.areas ar            ON ar.id = a.area_id
LEFT JOIN public.ejes e         ON e.id = ar.eje_id
LEFT JOIN public.indicadores i  ON i.id = a.indicador_id
LEFT JOIN public.programas_pmd p ON p.id = i.programa_pmd_id;

REVOKE ALL ON public.v_informe_acciones FROM anon;
GRANT SELECT ON public.v_informe_acciones TO authenticated;
