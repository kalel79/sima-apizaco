-- ============================================================
-- FASE MML 30 — Titular de cada área (firma del Acuse de MIR y POA)
-- El acuse de captura MIR/POA por área lo firman el enlace y el titular del
-- área. firmas_programa es por PROGRAMA (un programa tiene de 2 a 6 áreas),
-- así que el titular vive en su propia tabla, una fila por área.
-- Tabla aparte y no columnas en `areas` a propósito: `areas` solo la escribe
-- admin y aquí también escriben planeación y el enlace de su propia área.
-- 100% aditiva.
-- ============================================================

-- `id` además de area_id único: fn_audit_row registra NEW.id.
CREATE TABLE public.area_titulares (
  id          serial PRIMARY KEY,
  area_id     integer NOT NULL UNIQUE REFERENCES public.areas(id) ON DELETE CASCADE,
  nombre      varchar(200) NOT NULL CHECK (length(btrim(nombre)) > 0),
  cargo       varchar(200),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_area_titulares_updated_at
  BEFORE UPDATE ON public.area_titulares
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Quién cambió la firma de un área queda en la bitácora.
CREATE TRIGGER trg_area_titulares_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.area_titulares
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

ALTER TABLE public.area_titulares ENABLE ROW LEVEL SECURITY;

CREATE POLICY area_titulares_select ON public.area_titulares
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo','enlace']));

CREATE POLICY area_titulares_write_admin ON public.area_titulares
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

-- El enlace conoce a su titular: puede capturarlo solo para su área.
CREATE POLICY area_titulares_write_enlace ON public.area_titulares
  FOR ALL TO authenticated
  USING (public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id())
  WITH CHECK (public.get_my_rol() = 'enlace' AND area_id = public.get_my_area_id());

REVOKE ALL ON public.area_titulares FROM anon;
REVOKE ALL ON SEQUENCE public.area_titulares_id_seq FROM anon;
