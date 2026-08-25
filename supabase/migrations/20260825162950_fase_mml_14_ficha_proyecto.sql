-- ============================================================
-- FASE MML 14 — Ficha de Proyecto con sus 9 apartados
-- Sustituye los 6 campos sueltos que vivían en public.programas
-- (clave_programatica/finalidad/funcion/subfuncion/tipo_proyecto/
-- fuentes_financiamiento) por una ficha por programa+año, igual que
-- diagnóstico, árboles y presupuesto. 100% aditiva: no toca ni borra
-- ninguna columna existente.
-- ============================================================

-- ---------- Ficha de proyecto (apartados 2 a 6, 8 y 9) ----------
CREATE TABLE public.ficha_proyecto (
  id                  serial PRIMARY KEY,
  programa_id         integer  NOT NULL REFERENCES public.programas(id) ON DELETE CASCADE,
  anio                smallint NOT NULL,

  -- 2. Tipo de proyecto (varias marcables)
  tipos_proyecto      text[]   NOT NULL DEFAULT '{}',

  -- 3. Clasificación administrativa (Ramo / Unidad Responsable; el Municipio
  --    es siempre 05 Apizaco, Tlaxcala y va como constante en el front)
  ramo_numero         varchar(20),
  ramo_texto          varchar(200),
  unidad_resp_numero  varchar(20),
  unidad_resp_texto   text,

  -- 4. Clasificación económica (varias marcables)
  clasif_economica    text[]   NOT NULL DEFAULT '{}',

  -- 5. Clasificación funcional-programática (número + texto cada una)
  finalidad_num       varchar(20),  finalidad_texto    varchar(200),
  funcion_num         varchar(20),  funcion_texto      varchar(200),
  subfuncion_num      varchar(20),  subfuncion_texto   varchar(200),
  programa_num        varchar(20),  programa_texto     varchar(200),
  proyecto_num        varchar(20),  proyecto_texto     varchar(200),
  clasif_prog_num     varchar(20),  clasif_prog_texto  varchar(200),

  -- 6. Clasificación regional
  region_estatal      varchar(120),
  region_regional     varchar(120),
  region_municipal    varchar(120),
  region_localidad    varchar(120),

  -- 8. Periodo de ejecución
  fecha_inicio        date,
  fecha_termino       date,

  -- 9. Datos del líder/responsable del proyecto
  lider_nombre        varchar(200),
  lider_cargo         varchar(200),
  lider_tel           varchar(40),
  lider_email         varchar(120),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (programa_id, anio),
  CONSTRAINT ficha_proyecto_tipos_chk CHECK (
    tipos_proyecto <@ ARRAY['INVERSION','OPERACION','OBRA_PUBLICA','INNOVACION','INVERSION_PRODUCTIVA']::text[]
  ),
  CONSTRAINT ficha_proyecto_economica_chk CHECK (
    clasif_economica <@ ARRAY['GASTO_OPERACION','GASTO_INVERSION','ORG_AUTONOMOS','GASTO_REASIGNADO','DEUDA_PUBLICA','ADEFAS']::text[]
  ),
  CONSTRAINT ficha_proyecto_fechas_chk CHECK (
    fecha_inicio IS NULL OR fecha_termino IS NULL OR fecha_termino >= fecha_inicio
  )
);

CREATE TRIGGER trg_ficha_proyecto_updated_at
  BEFORE UPDATE ON public.ficha_proyecto
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ---------- Apartado 7: "Especificar fuente de financiamiento" ----------
-- Los 7 renglones fijos del formato, cada uno marcable y con importe. El
-- desglose por capítulo (1000..9000) sigue viviendo en presupuesto_programa.
CREATE TABLE public.ficha_fuente_financiamiento (
  id           serial PRIMARY KEY,
  programa_id  integer  NOT NULL REFERENCES public.programas(id) ON DELETE CASCADE,
  anio         smallint NOT NULL,
  fuente       varchar(30) NOT NULL
               CHECK (fuente IN ('LOCALES','PARTICIPACIONES','APORTACIONES_FEDERALES',
                                 'FEDERAL_REASIGNADO','ESTATAL_REASIGNADO','BENEFICIARIOS','OTRAS')),
  marcado      boolean  NOT NULL DEFAULT false,
  importe      numeric(14,2) NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programa_id, anio, fuente)
);

CREATE TRIGGER trg_ficha_fuente_financiamiento_updated_at
  BEFORE UPDATE ON public.ficha_fuente_financiamiento
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ---------- RLS: mismo criterio que presupuesto_programa ----------
-- Lectura para los 4 roles que ya leen el Expediente MML; escritura
-- reservada a admin/planeación (la ficha es parte del encabezado
-- institucional, no del contenido que captura el enlace).
ALTER TABLE public.ficha_proyecto              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_fuente_financiamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY ficha_proyecto_select ON public.ficha_proyecto
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo','enlace']));

CREATE POLICY ficha_proyecto_write_admin ON public.ficha_proyecto
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

CREATE POLICY ficha_fuente_select ON public.ficha_fuente_financiamiento
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo','enlace']));

CREATE POLICY ficha_fuente_write_admin ON public.ficha_fuente_financiamiento
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

REVOKE ALL ON public.ficha_proyecto              FROM anon;
REVOKE ALL ON public.ficha_fuente_financiamiento FROM anon;
