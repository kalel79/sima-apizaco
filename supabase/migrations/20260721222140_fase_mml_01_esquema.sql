-- ============================================================
-- FASE MML 01 — Esquema del módulo Metodología de Marco Lógico
-- Diseño: docs/DISENO_MIGRACION_MML.md (confirmado 2026-07-21)
-- 100% aditiva: no modifica ninguna columna/vista/política existente.
-- ============================================================

-- ---------- 2.1 mir_niveles: árbol de la MIR ----------
CREATE TABLE public.mir_niveles (
  id                serial PRIMARY KEY,
  programa_id       integer NOT NULL REFERENCES public.programas(id),
  anio              smallint NOT NULL,
  tipo              varchar(12) NOT NULL
                    CHECK (tipo IN ('FIN','PROPOSITO','COMPONENTE','ACTIVIDAD')),
  padre_id          integer REFERENCES public.mir_niveles(id),
  numero            smallint,
  resumen_narrativo text,
  supuestos         text,
  indicador_id      integer REFERENCES public.indicadores(id),
  orden             smallint NOT NULL DEFAULT 0,
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programa_id, anio, tipo, padre_id, numero),
  CHECK (
    (tipo IN ('FIN','PROPOSITO') AND padre_id IS NULL AND numero IS NULL)
    OR
    (tipo IN ('COMPONENTE','ACTIVIDAD') AND padre_id IS NOT NULL AND numero IS NOT NULL)
  )
);

CREATE UNIQUE INDEX mir_niveles_fin_proposito_unico
  ON public.mir_niveles (programa_id, anio, tipo)
  WHERE tipo IN ('FIN','PROPOSITO');

CREATE TRIGGER trg_mir_niveles_updated_at
  BEFORE UPDATE ON public.mir_niveles
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Validación del TIPO del padre (un CHECK no puede leer otra fila).
-- Convención de funciones trigger del proyecto (fase 0.1): search_path = ''.
CREATE FUNCTION public.mir_niveles_valida_padre() RETURNS trigger
  LANGUAGE plpgsql SET search_path = ''
  AS $$
DECLARE
  padre_tipo varchar;
BEGIN
  IF NEW.padre_id IS NOT NULL THEN
    SELECT tipo INTO padre_tipo FROM public.mir_niveles WHERE id = NEW.padre_id;
    IF NEW.tipo = 'COMPONENTE' AND padre_tipo IS DISTINCT FROM 'PROPOSITO' THEN
      RAISE EXCEPTION 'Un COMPONENTE debe colgar de un PROPOSITO (padre_id=% es %)', NEW.padre_id, padre_tipo;
    ELSIF NEW.tipo = 'ACTIVIDAD' AND padre_tipo IS DISTINCT FROM 'COMPONENTE' THEN
      RAISE EXCEPTION 'Una ACTIVIDAD debe colgar de un COMPONENTE (padre_id=% es %)', NEW.padre_id, padre_tipo;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_mir_niveles_valida_padre
  BEFORE INSERT OR UPDATE ON public.mir_niveles
  FOR EACH ROW EXECUTE FUNCTION public.mir_niveles_valida_padre();

-- ---------- 2.2 indicadores: columnas nuevas (NULLables) ----------
ALTER TABLE public.indicadores
  ADD COLUMN definicion          text,
  ADD COLUMN tipo_indicador      varchar(15) CHECK (tipo_indicador IN ('Estratégico','Gestión')),
  ADD COLUMN dimension           varchar(12) CHECK (dimension IN ('Eficacia','Eficiencia','Economía','Calidad')),
  ADD COLUMN sentido             varchar(12) CHECK (sentido IN ('Ascendente','Descendente','Regular')),
  ADD COLUMN medios_verificacion text,
  ADD COLUMN linea_base_anio     smallint,
  ADD COLUMN interpretacion      text;

-- ---------- 2.3 variables de fórmula ----------
CREATE TABLE public.indicador_variables (
  id            serial PRIMARY KEY,
  indicador_id  integer NOT NULL REFERENCES public.indicadores(id),
  nombre        varchar(200) NOT NULL,
  simbolo       varchar(20),
  unidad_medida varchar(100) NOT NULL,
  fuente        text,
  orden         smallint NOT NULL DEFAULT 0
);

CREATE TABLE public.indicador_variables_valores (
  id              bigserial PRIMARY KEY,
  variable_id     integer NOT NULL REFERENCES public.indicador_variables(id),
  anio            smallint NOT NULL,
  valor_alcanzado numeric(15,4),
  valor_meta      numeric(15,4),
  UNIQUE (variable_id, anio)
);

-- ---------- 2.4 diagnóstico (PP-FM-03) ----------
CREATE TABLE public.diagnostico_programa (
  id                     serial PRIMARY KEY,
  programa_id            integer NOT NULL REFERENCES public.programas(id),
  anio                   smallint NOT NULL,
  orden                  smallint NOT NULL,
  situacion_actual       text NOT NULL,
  transformacion_deseada text,
  UNIQUE (programa_id, anio, orden)
);

-- ---------- 2.5 árboles de problema/objetivos (PP-FM-04/07) ----------
CREATE TABLE public.arbol_nodos (
  id          serial PRIMARY KEY,
  programa_id integer NOT NULL REFERENCES public.programas(id),
  anio        smallint NOT NULL,
  arbol       varchar(10) NOT NULL CHECK (arbol IN ('PROBLEMA','OBJETIVOS')),
  tipo        varchar(10) NOT NULL
              CHECK (tipo IN ('CENTRAL','CAUSA','EFECTO','OBJETIVO','MEDIO','FIN')),
  padre_id    integer REFERENCES public.arbol_nodos(id),
  orden       smallint NOT NULL DEFAULT 0,
  texto       text NOT NULL
);

-- ---------- 2.6 involucrados (PP-FM-05) ----------
CREATE TABLE public.involucrados_programa (
  id          serial PRIMARY KEY,
  programa_id integer NOT NULL REFERENCES public.programas(id),
  anio        smallint NOT NULL,
  categoria   varchar(15) NOT NULL
              CHECK (categoria IN ('BENEFICIARIO','EJECUTOR','OPOSITOR','INDIFERENTE')),
  actor       text NOT NULL,
  orden       smallint NOT NULL DEFAULT 0
);

-- ---------- 2.7 acciones y alternativas (PP-FM-08/09) ----------
CREATE TABLE public.acciones_alternativas (
  id            serial PRIMARY KEY,
  programa_id   integer NOT NULL REFERENCES public.programas(id),
  anio          smallint NOT NULL,
  medio_id      integer REFERENCES public.arbol_nodos(id),
  texto         text NOT NULL,
  seleccionada  boolean NOT NULL DEFAULT false,
  justificacion text,
  orden         smallint NOT NULL DEFAULT 0
);

-- ---------- 2.8 presupuesto por programa/capítulo ----------
CREATE TABLE public.presupuesto_programa (
  id          serial PRIMARY KEY,
  programa_id integer NOT NULL REFERENCES public.programas(id),
  anio        smallint NOT NULL,
  capitulo    smallint NOT NULL
              CHECK (capitulo IN (1000,2000,3000,4000,5000,6000,7000,8000,9000)),
  importe     numeric(15,2) NOT NULL DEFAULT 0,
  UNIQUE (programa_id, anio, capitulo)
);

-- ---------- 2.9 firmas (default global con override por programa) ----------
CREATE TABLE public.firmas_programa (
  id          serial PRIMARY KEY,
  programa_id integer REFERENCES public.programas(id),
  rol_firma   varchar(25) NOT NULL
              CHECK (rol_firma IN ('ELABORO','AUTORIZA','VOBO','ELABORO_PRESUPUESTAL','REVISO')),
  nombre      varchar(200) NOT NULL,
  cargo       varchar(200) NOT NULL,
  orden       smallint NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX firmas_programa_unicas
  ON public.firmas_programa (COALESCE(programa_id, 0), rol_firma);

-- ---------- 2.10 programas: encabezado del expediente ----------
ALTER TABLE public.programas
  ADD COLUMN clave_programatica varchar(30),
  ADD COLUMN finalidad          varchar(120),
  ADD COLUMN funcion            varchar(120),
  ADD COLUMN subfuncion         varchar(120),
  ADD COLUMN tipo_proyecto      varchar(60),
  ADD COLUMN fuentes_financiamiento text;

-- ---------- 3. Función auxiliar de pertenencia a programa ----------
-- Convención SECURITY DEFINER del proyecto (verificada 2026-07-21): search_path = public.
CREATE FUNCTION public.get_mis_programa_ids() RETURNS integer[]
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT array_agg(DISTINCT a.programa_id)
        FROM public.usuarios u JOIN public.areas a ON a.id = u.area_id
        WHERE u.auth_uid = auth.uid() AND a.programa_id IS NOT NULL $$;
REVOKE EXECUTE ON FUNCTION public.get_mis_programa_ids() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_mis_programa_ids() TO authenticated;

-- ---------- 3. RLS ----------
-- Tablas de contenido: lectura authenticated; escritura admin/planeación
-- y áreas (directivo/enlace/coordinador) sobre SU programa.
-- Tablas restringidas (firmas, presupuesto): solo admin/planeación.

-- mir_niveles
ALTER TABLE public.mir_niveles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mir_niveles FROM anon;
CREATE POLICY mir_niveles_select ON public.mir_niveles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY mir_niveles_write_admin ON public.mir_niveles
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY mir_niveles_write_area ON public.mir_niveles
  FOR ALL TO authenticated
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() IN ('directivo','enlace','coordinador'))
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() IN ('directivo','enlace','coordinador'));

-- indicador_variables (pertenencia vía indicadores.programa_id)
ALTER TABLE public.indicador_variables ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.indicador_variables FROM anon;
CREATE POLICY indicador_variables_select ON public.indicador_variables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY indicador_variables_write_admin ON public.indicador_variables
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY indicador_variables_write_area ON public.indicador_variables
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('directivo','enlace','coordinador')
         AND EXISTS (SELECT 1 FROM public.indicadores i
                     WHERE i.id = indicador_id
                       AND i.programa_id = ANY (public.get_mis_programa_ids())))
  WITH CHECK (public.get_my_rol() IN ('directivo','enlace','coordinador')
              AND EXISTS (SELECT 1 FROM public.indicadores i
                          WHERE i.id = indicador_id
                            AND i.programa_id = ANY (public.get_mis_programa_ids())));

-- indicador_variables_valores (pertenencia vía variable -> indicador)
ALTER TABLE public.indicador_variables_valores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.indicador_variables_valores FROM anon;
CREATE POLICY ind_var_valores_select ON public.indicador_variables_valores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY ind_var_valores_write_admin ON public.indicador_variables_valores
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY ind_var_valores_write_area ON public.indicador_variables_valores
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('directivo','enlace','coordinador')
         AND EXISTS (SELECT 1
                     FROM public.indicador_variables v
                     JOIN public.indicadores i ON i.id = v.indicador_id
                     WHERE v.id = variable_id
                       AND i.programa_id = ANY (public.get_mis_programa_ids())))
  WITH CHECK (public.get_my_rol() IN ('directivo','enlace','coordinador')
              AND EXISTS (SELECT 1
                          FROM public.indicador_variables v
                          JOIN public.indicadores i ON i.id = v.indicador_id
                          WHERE v.id = variable_id
                            AND i.programa_id = ANY (public.get_mis_programa_ids())));

-- diagnostico_programa
ALTER TABLE public.diagnostico_programa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diagnostico_programa FROM anon;
CREATE POLICY diagnostico_select ON public.diagnostico_programa
  FOR SELECT TO authenticated USING (true);
CREATE POLICY diagnostico_write_admin ON public.diagnostico_programa
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY diagnostico_write_area ON public.diagnostico_programa
  FOR ALL TO authenticated
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() IN ('directivo','enlace','coordinador'))
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() IN ('directivo','enlace','coordinador'));

-- arbol_nodos
ALTER TABLE public.arbol_nodos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.arbol_nodos FROM anon;
CREATE POLICY arbol_select ON public.arbol_nodos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY arbol_write_admin ON public.arbol_nodos
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY arbol_write_area ON public.arbol_nodos
  FOR ALL TO authenticated
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() IN ('directivo','enlace','coordinador'))
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() IN ('directivo','enlace','coordinador'));

-- involucrados_programa
ALTER TABLE public.involucrados_programa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.involucrados_programa FROM anon;
CREATE POLICY involucrados_select ON public.involucrados_programa
  FOR SELECT TO authenticated USING (true);
CREATE POLICY involucrados_write_admin ON public.involucrados_programa
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY involucrados_write_area ON public.involucrados_programa
  FOR ALL TO authenticated
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() IN ('directivo','enlace','coordinador'))
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() IN ('directivo','enlace','coordinador'));

-- acciones_alternativas
ALTER TABLE public.acciones_alternativas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.acciones_alternativas FROM anon;
CREATE POLICY acciones_select ON public.acciones_alternativas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY acciones_write_admin ON public.acciones_alternativas
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
CREATE POLICY acciones_write_area ON public.acciones_alternativas
  FOR ALL TO authenticated
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() IN ('directivo','enlace','coordinador'))
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() IN ('directivo','enlace','coordinador'));

-- presupuesto_programa (solo admin/planeación)
ALTER TABLE public.presupuesto_programa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.presupuesto_programa FROM anon;
CREATE POLICY presupuesto_select ON public.presupuesto_programa
  FOR SELECT TO authenticated USING (true);
CREATE POLICY presupuesto_write_admin ON public.presupuesto_programa
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));

-- firmas_programa (solo admin/planeación)
ALTER TABLE public.firmas_programa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.firmas_programa FROM anon;
CREATE POLICY firmas_select ON public.firmas_programa
  FOR SELECT TO authenticated USING (true);
CREATE POLICY firmas_write_admin ON public.firmas_programa
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
