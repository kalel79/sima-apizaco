-- ============================================================
-- FASE INFORME 02 — Fotografías de las acciones del Informe de Gobierno
-- Hasta 3 fotos por acción, que el PDF del Informe acomoda en la página de
-- acciones relevantes del eje. Las sube el enlace (su área, captura abierta)
-- o admin/planeación (siempre). Bucket privado: el PDF las baja con URL
-- firmada al generarse.
-- 100% aditiva: solo crea objetos nuevos.
-- ============================================================

-- ---------- Bucket ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('informe-fotos', 'informe-fotos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ---------- Tabla ----------
-- orden 1..3 + UNIQUE(accion_id, orden) limita a 3 fotos por acción sin trigger.
CREATE TABLE public.informe_acciones_fotos (
  id            serial PRIMARY KEY,
  accion_id     integer  NOT NULL REFERENCES public.informe_acciones(id) ON DELETE CASCADE,
  storage_path  text     NOT NULL UNIQUE,
  orden         smallint NOT NULL,
  ancho         integer,
  alto          integer,
  created_by    uuid     REFERENCES public.usuarios(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT informe_acciones_fotos_orden_chk CHECK (orden BETWEEN 1 AND 3),
  CONSTRAINT informe_acciones_fotos_orden_uq UNIQUE (accion_id, orden)
);

-- created_by lo pone la base; subir una foto marca la acción con foto.
-- El UPDATE a informe_acciones pasa por fn_informe_acciones_validar: si quien
-- sube es enlace, la acción vuelve a "pendiente de revisión", igual que al editarla.
CREATE OR REPLACE FUNCTION public.fn_informe_fotos_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT u.id INTO NEW.created_by FROM public.usuarios u WHERE u.auth_uid = auth.uid();
    UPDATE public.informe_acciones SET tiene_foto = true
     WHERE id = NEW.accion_id AND NOT tiene_foto;
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_informe_fotos_sync() FROM anon;

CREATE TRIGGER trg_informe_fotos_sync
  BEFORE INSERT ON public.informe_acciones_fotos
  FOR EACH ROW EXECUTE FUNCTION public.fn_informe_fotos_sync();

CREATE TRIGGER trg_informe_fotos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.informe_acciones_fotos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

-- ---------- RLS ----------
ALTER TABLE public.informe_acciones_fotos ENABLE ROW LEVEL SECURITY;

-- Lectura: quien puede ver la acción ve sus fotos (el subquery hereda la RLS
-- de informe_acciones del usuario que consulta).
CREATE POLICY informe_fotos_select ON public.informe_acciones_fotos
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.informe_acciones a WHERE a.id = accion_id));

CREATE POLICY informe_fotos_insert ON public.informe_acciones_fotos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.informe_acciones a
    JOIN public.informe_gobierno g ON g.id = a.informe_id
    WHERE a.id = accion_id
      AND (public.get_my_rol() = ANY (ARRAY['admin','planeacion'])
           OR (public.get_my_rol() = 'enlace' AND a.area_id = public.get_my_area_id() AND g.captura_abierta))
  ));

CREATE POLICY informe_fotos_delete ON public.informe_acciones_fotos
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.informe_acciones a
    JOIN public.informe_gobierno g ON g.id = a.informe_id
    WHERE a.id = accion_id
      AND (public.get_my_rol() = ANY (ARRAY['admin','planeacion'])
           OR (public.get_my_rol() = 'enlace' AND a.area_id = public.get_my_area_id() AND g.captura_abierta))
  ));

REVOKE ALL ON public.informe_acciones_fotos FROM anon;
REVOKE ALL ON SEQUENCE public.informe_acciones_fotos_id_seq FROM anon;

-- ---------- Storage ----------
-- Ruta: {area_id}/{accion_id}/{archivo}. El enlace solo toca la carpeta de su
-- área y solo con alguna captura de informe abierta.
CREATE POLICY informe_fotos_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'informe-fotos'
    AND (
      public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo'])
      OR (public.get_my_rol() = 'enlace'
          AND (storage.foldername(name))[1] = public.get_my_area_id()::text)
    )
  );

CREATE POLICY informe_fotos_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'informe-fotos'
    AND (
      public.get_my_rol() = ANY (ARRAY['admin','planeacion'])
      OR (public.get_my_rol() = 'enlace'
          AND (storage.foldername(name))[1] = public.get_my_area_id()::text
          AND EXISTS (SELECT 1 FROM public.informe_gobierno g WHERE g.captura_abierta))
    )
  );

CREATE POLICY informe_fotos_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'informe-fotos'
    AND (
      public.get_my_rol() = ANY (ARRAY['admin','planeacion'])
      OR (public.get_my_rol() = 'enlace'
          AND (storage.foldername(name))[1] = public.get_my_area_id()::text
          AND EXISTS (SELECT 1 FROM public.informe_gobierno g WHERE g.captura_abierta))
    )
  );
