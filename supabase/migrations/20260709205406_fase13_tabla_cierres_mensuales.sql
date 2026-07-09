-- Fase 1.3: cierre mensual congelado (snapshots del resumen global/eje/area).
-- Inmutable a proposito: solo hay politicas de SELECT/INSERT, sin
-- UPDATE/DELETE (RLS deniega por defecto lo que no tiene politica).

CREATE TABLE public.cierres_mensuales (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anio           SMALLINT NOT NULL,
  mes            SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  cerrado_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrado_por    UUID REFERENCES public.usuarios(id),
  resumen_global JSONB NOT NULL,
  resumen_ejes   JSONB NOT NULL,
  resumen_areas  JSONB NOT NULL,
  UNIQUE (anio, mes)
);

ALTER TABLE public.cierres_mensuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY cierres_select_autenticados ON public.cierres_mensuales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY cierres_insert_admin ON public.cierres_mensuales
  FOR INSERT TO authenticated WITH CHECK (public.get_my_rol() = 'admin');
