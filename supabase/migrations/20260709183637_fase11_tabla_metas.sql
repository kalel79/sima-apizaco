-- Fase 1.1: modelo de metas normalizado (multi-año).
-- Tabla nueva; las columnas meta_ene..meta_dic y meta_anual_2026 de indicadores
-- se conservan congeladas hasta validar paridad en producción.

CREATE TABLE public.metas (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  indicador_id  INTEGER NOT NULL REFERENCES public.indicadores(id),
  anio          SMALLINT NOT NULL,
  mes           SMALLINT NOT NULL CHECK (mes BETWEEN 0 AND 12), -- 0 = meta anual
  valor         NUMERIC,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (indicador_id, anio, mes)
);

CREATE TRIGGER trg_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY metas_select_autenticados ON public.metas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY metas_write_admin ON public.metas
  FOR ALL TO authenticated
  USING (public.get_my_rol() = 'admin') WITH CHECK (public.get_my_rol() = 'admin');

-- Migrar meta_ene..meta_dic -> mes 1..12
INSERT INTO public.metas (indicador_id, anio, mes, valor)
SELECT i.id, 2026, m.mes, m.valor
FROM public.indicadores i
CROSS JOIN LATERAL (VALUES
  (1,i.meta_ene),(2,i.meta_feb),(3,i.meta_mar),(4,i.meta_abr),
  (5,i.meta_may),(6,i.meta_jun),(7,i.meta_jul),(8,i.meta_ago),
  (9,i.meta_sep),(10,i.meta_oct),(11,i.meta_nov),(12,i.meta_dic)
) AS m(mes, valor);

-- Migrar meta_anual_2026 -> mes 0
INSERT INTO public.metas (indicador_id, anio, mes, valor)
SELECT id, 2026, 0, meta_anual_2026 FROM public.indicadores;
