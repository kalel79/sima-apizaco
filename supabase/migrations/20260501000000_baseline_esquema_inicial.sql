-- ═══════════════════════════════════════════════════════════════════════════
-- BASELINE — Esquema inicial del SIMA (reconstruido por introspección el
-- 2026-07-08, fase 0.2 de higiene del repositorio).
--
-- El esquema original se creó vía SQL Editor (scripts PASO_2..PASO_5, hoy en
-- scripts/sql/) y nunca quedó en el historial de migraciones. Este archivo
-- captura el estado del esquema TAL COMO EXISTÍA ANTES de la primera migración
-- registrada (20260528153528), de modo que la cadena completa de migraciones
-- reproduce el esquema de producción en una base fresca.
--
-- Exclusiones deliberadas (las crean migraciones posteriores):
--   · usuarios.primer_login                      → 20260630235506
--   · marcar_primer_login_completado()           → 20260630235612
--   · políticas de programas_pmd                 → 20260703150459
--   · vistas v_*                                 → 20260528* / 20260703*
--   · políticas nuevas de audit_log              → 20260707210017
-- Inclusiones deliberadas que migraciones posteriores corrigen/eliminan:
--   · políticas lectura_publica (hueco de seguridad original) → las elimina
--     20260707210230
--   · admin_puede_insertar_audit_log (WITH CHECK true)        → la reemplaza
--     20260707210017
--   · tablas backup_*_20260617 en public                      → las mueve
--     20260707210057
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Extensiones ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Tablas (en orden de dependencias) ───────────────────────────────────────

CREATE TABLE public.roles (
  id serial NOT NULL,
  codigo character varying(30) NOT NULL,
  nombre character varying(100) NOT NULL,
  descripcion text,
  nivel smallint DEFAULT 1 NOT NULL
);

CREATE TABLE public.ejes (
  id serial NOT NULL,
  codigo character varying(10) NOT NULL,
  nombre character varying(300) NOT NULL,
  descripcion text,
  icono character varying(10),
  color_hex character varying(7) DEFAULT '#8B0000'::character varying NOT NULL,
  orden smallint DEFAULT 1 NOT NULL,
  activo boolean DEFAULT true NOT NULL
);

CREATE TABLE public.programas (
  id serial NOT NULL,
  clave character varying(10) NOT NULL,
  nombre character varying(300) NOT NULL,
  eje_id integer NOT NULL,
  elaboro_nombre character varying(200),
  elaboro_cargo character varying(200),
  unidad_resp text,
  activo boolean DEFAULT true NOT NULL
);

CREATE TABLE public.areas (
  id serial NOT NULL,
  nombre character varying(200) NOT NULL,
  eje_id integer NOT NULL,
  programa_id integer,
  num_indicadores_mir smallint DEFAULT 0,
  activo boolean DEFAULT true NOT NULL
);

CREATE TABLE public.programas_pmd (
  id serial NOT NULL,
  numero integer NOT NULL,
  nombre text NOT NULL,
  eje text NOT NULL,
  objetivo text,
  meta text,
  responsable text,
  plazo text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.indicadores (
  id serial NOT NULL,
  nombre text NOT NULL,
  nivel_mir character varying(50) NOT NULL,
  area_id integer NOT NULL,
  programa_id integer NOT NULL,
  unidad_medida character varying(100) DEFAULT 'Porcentaje'::character varying NOT NULL,
  formula text,
  frecuencia character varying(50) DEFAULT 'Mensual'::character varying NOT NULL,
  linea_base numeric(15,4),
  meta_anual_2026 numeric(15,4),
  meta_ene numeric(15,4) DEFAULT 0,
  meta_feb numeric(15,4) DEFAULT 0,
  meta_mar numeric(15,4) DEFAULT 0,
  meta_abr numeric(15,4) DEFAULT 0,
  meta_may numeric(15,4) DEFAULT 0,
  meta_jun numeric(15,4) DEFAULT 0,
  meta_jul numeric(15,4) DEFAULT 0,
  meta_ago numeric(15,4) DEFAULT 0,
  meta_sep numeric(15,4) DEFAULT 0,
  meta_oct numeric(15,4) DEFAULT 0,
  meta_nov numeric(15,4) DEFAULT 0,
  meta_dic numeric(15,4) DEFAULT 0,
  activo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  clave character varying(30),
  programa_pmd_id integer
);

CREATE TABLE public.usuarios (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  auth_uid uuid,
  nombre character varying(150) NOT NULL,
  apellidos character varying(150),
  email character varying(255) NOT NULL,
  cargo character varying(200),
  rol_id integer DEFAULT 2 NOT NULL,
  area_id integer,
  activo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.avances (
  id bigserial NOT NULL,
  indicador_id integer NOT NULL,
  anio smallint DEFAULT 2026 NOT NULL,
  mes smallint NOT NULL,
  meta_programada numeric(15,4),
  meta_evaluable numeric(15,4),
  resultado numeric(15,4),
  pct_cumplimiento numeric(8,4),
  semaforo character varying(20),
  tipo_alerta character varying(30),
  tendencia character varying(5),
  capturado_por uuid,
  validado boolean DEFAULT false NOT NULL,
  observaciones text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  validado_at timestamp with time zone,
  validado_por uuid
);

CREATE TABLE public.evidencias (
  id bigserial NOT NULL,
  avance_id bigint NOT NULL,
  nombre_archivo character varying(300),
  url_storage text,
  descripcion text,
  subido_por uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  indicador_id integer,
  area_id integer,
  tipo_mime character varying(100),
  tamano_bytes bigint
);

CREATE TABLE public.audit_log (
  id bigserial NOT NULL,
  tabla character varying(100) NOT NULL,
  accion character varying(20) NOT NULL,
  registro_id text,
  usuario_id uuid,
  datos_antes jsonb,
  datos_nuevo jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.configuracion (
  clave text NOT NULL,
  valor text NOT NULL,
  descripcion text,
  actualizado_at timestamp with time zone DEFAULT now(),
  actualizado_por uuid
);

COMMENT ON TABLE public.configuracion IS
  'Parámetros institucionales editables del SIMA. Permite avanzar el periodo de evaluación sin tocar código ni vistas.';

-- Respaldos del 17-jun-2026 (copias sin constraints, hechas con SELECT INTO).
-- 20260707210057 las mueve al esquema backups.
CREATE TABLE public.backup_indicadores_20260617 (
  id integer, nombre text, nivel_mir character varying(50), area_id integer,
  programa_id integer, unidad_medida character varying(100), formula text,
  frecuencia character varying(50), linea_base numeric(15,4),
  meta_anual_2026 numeric(15,4),
  meta_ene numeric(15,4), meta_feb numeric(15,4), meta_mar numeric(15,4),
  meta_abr numeric(15,4), meta_may numeric(15,4), meta_jun numeric(15,4),
  meta_jul numeric(15,4), meta_ago numeric(15,4), meta_sep numeric(15,4),
  meta_oct numeric(15,4), meta_nov numeric(15,4), meta_dic numeric(15,4),
  activo boolean, created_at timestamp with time zone
);

CREATE TABLE public.backup_avances_20260617 (
  id bigint, indicador_id integer, anio smallint, mes smallint,
  meta_programada numeric(15,4), meta_evaluable numeric(15,4),
  resultado numeric(15,4), pct_cumplimiento numeric(8,4),
  semaforo character varying(20), tipo_alerta character varying(30),
  tendencia character varying(5), capturado_por uuid, validado boolean,
  observaciones text, created_at timestamp with time zone,
  updated_at timestamp with time zone
);

CREATE TABLE public.backup_evidencias_20260617 (
  id bigint, avance_id bigint, nombre_archivo character varying(300),
  url_storage text, descripcion text, subido_por uuid,
  created_at timestamp with time zone
);

-- ─── Constraints (nombres idénticos a producción) ────────────────────────────

ALTER TABLE public.roles       ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE public.roles       ADD CONSTRAINT roles_codigo_key UNIQUE (codigo);

ALTER TABLE public.ejes        ADD CONSTRAINT ejes_pkey PRIMARY KEY (id);
ALTER TABLE public.ejes        ADD CONSTRAINT ejes_codigo_key UNIQUE (codigo);

ALTER TABLE public.programas   ADD CONSTRAINT programas_pkey PRIMARY KEY (id);
ALTER TABLE public.programas   ADD CONSTRAINT programas_clave_key UNIQUE (clave);
ALTER TABLE public.programas   ADD CONSTRAINT programas_eje_id_fkey FOREIGN KEY (eje_id) REFERENCES ejes(id);

ALTER TABLE public.areas       ADD CONSTRAINT areas_pkey PRIMARY KEY (id);
ALTER TABLE public.areas       ADD CONSTRAINT areas_eje_id_fkey FOREIGN KEY (eje_id) REFERENCES ejes(id);
ALTER TABLE public.areas       ADD CONSTRAINT areas_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES programas(id);
ALTER TABLE public.areas       ADD CONSTRAINT fk_areas_eje FOREIGN KEY (eje_id) REFERENCES ejes(id);

ALTER TABLE public.programas_pmd ADD CONSTRAINT programas_pmd_pkey PRIMARY KEY (id);

ALTER TABLE public.indicadores ADD CONSTRAINT indicadores_pkey PRIMARY KEY (id);
ALTER TABLE public.indicadores ADD CONSTRAINT fk_indicadores_area FOREIGN KEY (area_id) REFERENCES areas(id);
ALTER TABLE public.indicadores ADD CONSTRAINT fk_indicadores_programa FOREIGN KEY (programa_id) REFERENCES programas(id);
ALTER TABLE public.indicadores ADD CONSTRAINT indicadores_area_id_fkey FOREIGN KEY (area_id) REFERENCES areas(id);
ALTER TABLE public.indicadores ADD CONSTRAINT indicadores_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES programas(id);
ALTER TABLE public.indicadores ADD CONSTRAINT indicadores_programa_pmd_id_fkey FOREIGN KEY (programa_pmd_id) REFERENCES programas_pmd(id);

ALTER TABLE public.usuarios    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
ALTER TABLE public.usuarios    ADD CONSTRAINT usuarios_auth_uid_key UNIQUE (auth_uid);
ALTER TABLE public.usuarios    ADD CONSTRAINT usuarios_email_key UNIQUE (email);
ALTER TABLE public.usuarios    ADD CONSTRAINT fk_usuarios_area FOREIGN KEY (area_id) REFERENCES areas(id);
ALTER TABLE public.usuarios    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES roles(id);

ALTER TABLE public.avances     ADD CONSTRAINT avances_pkey PRIMARY KEY (id);
ALTER TABLE public.avances     ADD CONSTRAINT avances_indicador_id_anio_mes_key UNIQUE (indicador_id, anio, mes);
ALTER TABLE public.avances     ADD CONSTRAINT avances_capturado_por_fkey FOREIGN KEY (capturado_por) REFERENCES usuarios(id);
ALTER TABLE public.avances     ADD CONSTRAINT avances_indicador_id_fkey FOREIGN KEY (indicador_id) REFERENCES indicadores(id);
ALTER TABLE public.avances     ADD CONSTRAINT avances_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES usuarios(id);
ALTER TABLE public.avances     ADD CONSTRAINT fk_avances_indicador FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE;
ALTER TABLE public.avances     ADD CONSTRAINT avances_mes_check CHECK (mes >= 1 AND mes <= 12);
ALTER TABLE public.avances     ADD CONSTRAINT avances_semaforo_check CHECK (semaforo::text = ANY (ARRAY['ÓPTIMO'::character varying, 'ADECUADO'::character varying, 'RIESGO'::character varying, 'CRÍTICO'::character varying]::text[]));

ALTER TABLE public.evidencias  ADD CONSTRAINT evidencias_pkey PRIMARY KEY (id);
ALTER TABLE public.evidencias  ADD CONSTRAINT evidencias_area_id_fkey FOREIGN KEY (area_id) REFERENCES areas(id);
ALTER TABLE public.evidencias  ADD CONSTRAINT evidencias_avance_id_fkey FOREIGN KEY (avance_id) REFERENCES avances(id);
ALTER TABLE public.evidencias  ADD CONSTRAINT evidencias_indicador_id_fkey FOREIGN KEY (indicador_id) REFERENCES indicadores(id);
ALTER TABLE public.evidencias  ADD CONSTRAINT evidencias_subido_por_fkey FOREIGN KEY (subido_por) REFERENCES usuarios(id);

ALTER TABLE public.audit_log   ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_log   ADD CONSTRAINT audit_log_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

ALTER TABLE public.configuracion ADD CONSTRAINT configuracion_pkey PRIMARY KEY (clave);
ALTER TABLE public.configuracion ADD CONSTRAINT configuracion_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES auth.users(id);

-- ─── Índices ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_areas_eje                   ON public.areas USING btree (eje_id);
CREATE INDEX idx_avances_indicador_periodo   ON public.avances USING btree (indicador_id, anio, mes);
CREATE INDEX idx_avances_semaforo            ON public.avances USING btree (semaforo);
CREATE INDEX idx_evidencias_area_id          ON public.evidencias USING btree (area_id);
CREATE INDEX idx_evidencias_avance_id        ON public.evidencias USING btree (avance_id);
CREATE INDEX idx_indicadores_area            ON public.indicadores USING btree (area_id);
CREATE UNIQUE INDEX idx_indicadores_clave    ON public.indicadores USING btree (clave);
CREATE INDEX idx_indicadores_programa        ON public.indicadores USING btree (programa_id);
CREATE INDEX idx_usuarios_auth_uid           ON public.usuarios USING btree (auth_uid);

-- ─── Funciones ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calcular_semaforo(pct numeric)
 RETURNS character varying
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  SELECT CASE
    WHEN pct > 1.10  THEN 'ÓPTIMO'
    WHEN pct >= 0.90 THEN 'ADECUADO'
    WHEN pct >= 0.70 THEN 'RIESGO'
    ELSE 'CRÍTICO'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.configuracion_set_actualizado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.actualizado_at = NOW();
    NEW.actualizado_por = auth.uid();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_anio_actual()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT COALESCE(
        (SELECT valor::INTEGER FROM public.configuracion WHERE clave = 'anio_actual_evaluacion'),
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_mes_actual()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT COALESCE(
        (SELECT valor::INTEGER FROM public.configuracion WHERE clave = 'mes_actual_evaluacion'),
        EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_my_rol()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.codigo
  FROM   public.usuarios u
  JOIN   public.roles    r ON r.id = u.rol_id
  WHERE  u.auth_uid = auth.uid()
  LIMIT  1;
$function$;

-- ─── Triggers ────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_avances_updated_at
  BEFORE UPDATE ON public.avances
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER configuracion_actualizado_trigger
  BEFORE INSERT OR UPDATE ON public.configuracion
  FOR EACH ROW EXECUTE FUNCTION configuracion_set_actualizado();

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas_pmd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura autenticada, escritura admin
CREATE POLICY roles_select_autenticados ON public.roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY roles_write_admin ON public.roles
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');

CREATE POLICY ejes_select_autenticados ON public.ejes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY ejes_write_admin ON public.ejes
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');

CREATE POLICY programas_select_autenticados ON public.programas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY programas_write_admin ON public.programas
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');

CREATE POLICY areas_select_autenticados ON public.areas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY areas_write_admin ON public.areas
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');

CREATE POLICY indicadores_select_autenticados ON public.indicadores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY indicadores_write_admin ON public.indicadores
  FOR ALL TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');

-- Políticas de lectura anónima del diseño original (HUECO DE SEGURIDAD:
-- las elimina 20260707210230; se conservan aquí solo por fidelidad histórica).
CREATE POLICY lectura_publica ON public.areas       FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.avances     FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.ejes        FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.indicadores FOR SELECT TO public USING (true);
CREATE POLICY lectura_publica ON public.programas   FOR SELECT TO public USING (true);

-- usuarios (PASO_3)
CREATE POLICY usuarios_select_v1 ON public.usuarios
  FOR SELECT USING (
    CASE get_my_rol()
      WHEN 'admin'      THEN true
      WHEN 'planeacion' THEN true
      WHEN 'enlace'     THEN (auth_uid = auth.uid())
      WHEN 'directivo'  THEN (auth_uid = auth.uid())
      ELSE false
    END
  );
CREATE POLICY usuarios_insert_v1 ON public.usuarios
  FOR INSERT WITH CHECK (get_my_rol() = 'admin');
CREATE POLICY usuarios_update_v1 ON public.usuarios
  FOR UPDATE USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');
CREATE POLICY usuarios_delete_v1 ON public.usuarios
  FOR DELETE USING (get_my_rol() = 'admin');

-- avances (PASO_3 / PASO_5)
CREATE POLICY avances_select_autenticados ON public.avances
  FOR SELECT TO authenticated USING (true);
CREATE POLICY avances_insert_rol ON public.avances
  FOR INSERT WITH CHECK (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND mes = get_mes_actual() AND anio = get_anio_actual()
      AND EXISTS (
        SELECT 1 FROM indicadores i
        JOIN usuarios u ON u.area_id = i.area_id
        WHERE i.id = avances.indicador_id AND u.auth_uid = auth.uid()
      )
    )
  );
CREATE POLICY avances_update_rol ON public.avances
  FOR UPDATE USING (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND mes = get_mes_actual() AND anio = get_anio_actual()
      AND validado IS NOT TRUE
      AND EXISTS (
        SELECT 1 FROM indicadores i
        JOIN usuarios u ON u.area_id = i.area_id
        WHERE i.id = avances.indicador_id AND u.auth_uid = auth.uid()
      )
    )
  ) WITH CHECK (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND mes = get_mes_actual() AND anio = get_anio_actual()
      AND EXISTS (
        SELECT 1 FROM indicadores i
        JOIN usuarios u ON u.area_id = i.area_id
        WHERE i.id = avances.indicador_id AND u.auth_uid = auth.uid()
      )
    )
  );
CREATE POLICY avances_delete_admin ON public.avances
  FOR DELETE TO authenticated USING (get_my_rol() = 'admin');

-- evidencias (PASO_4)
CREATE POLICY evidencias_select_rol ON public.evidencias
  FOR SELECT USING (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND area_id = (SELECT u.area_id FROM usuarios u WHERE u.auth_uid = auth.uid())
    )
  );
CREATE POLICY evidencias_insert_rol ON public.evidencias
  FOR INSERT WITH CHECK (
    subido_por = (SELECT u.id FROM usuarios u WHERE u.auth_uid = auth.uid())
    AND (
      (get_my_rol() = ANY (ARRAY['admin','planeacion']))
      OR (
        get_my_rol() = 'enlace'
        AND area_id = (SELECT u.area_id FROM usuarios u WHERE u.auth_uid = auth.uid())
      )
    )
  );
CREATE POLICY evidencias_delete_rol ON public.evidencias
  FOR DELETE USING (
    (get_my_rol() = ANY (ARRAY['admin','planeacion']))
    OR (
      get_my_rol() = 'enlace'
      AND subido_por = (SELECT u.id FROM usuarios u WHERE u.auth_uid = auth.uid())
      AND area_id = (SELECT u.area_id FROM usuarios u WHERE u.auth_uid = auth.uid())
    )
  );

-- audit_log: política original permisiva (la reemplaza 20260707210017)
CREATE POLICY admin_puede_insertar_audit_log ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- configuracion
CREATE POLICY configuracion_select_v1 ON public.configuracion
  FOR SELECT TO authenticated USING (true);
CREATE POLICY configuracion_insert_v1 ON public.configuracion
  FOR INSERT TO authenticated WITH CHECK (get_my_rol() = 'admin');
CREATE POLICY configuracion_update_v1 ON public.configuracion
  FOR UPDATE TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');
CREATE POLICY configuracion_delete_v1 ON public.configuracion
  FOR DELETE TO authenticated USING (get_my_rol() = 'admin');

-- ─── Storage: bucket de evidencias y sus políticas (PASO_4) ──────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias', 'evidencias', false, 10485760,
  ARRAY[
    'application/pdf', 'image/jpeg', 'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY evidencias_storage_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidencias'
    AND (
      (get_my_rol() = ANY (ARRAY['admin','planeacion']))
      OR (
        get_my_rol() = 'enlace'
        AND (storage.foldername(name))[1] =
            (SELECT u.area_id::text FROM usuarios u WHERE u.auth_uid = auth.uid())
      )
    )
  );

CREATE POLICY evidencias_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidencias'
    AND (
      (get_my_rol() = ANY (ARRAY['admin','planeacion']))
      OR (
        get_my_rol() = 'enlace'
        AND (storage.foldername(name))[1] =
            (SELECT u.area_id::text FROM usuarios u WHERE u.auth_uid = auth.uid())
      )
    )
  );

CREATE POLICY evidencias_storage_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidencias'
    AND (
      (get_my_rol() = ANY (ARRAY['admin','planeacion']))
      OR (
        get_my_rol() = 'enlace'
        AND (storage.foldername(name))[1] =
            (SELECT u.area_id::text FROM usuarios u WHERE u.auth_uid = auth.uid())
      )
    )
  );

-- ─── Catálogo mínimo indispensable ───────────────────────────────────────────

INSERT INTO public.roles (id, codigo, nombre, descripcion, nivel) VALUES
  (1, 'admin',      'Administrador SIMA',      'Control total del sistema',                 1),
  (2, 'planeacion', 'Coordinador Planeación',  'Captura y validación de todos los ejes',    2),
  (3, 'enlace',     'Enlace de Área',          'Captura avances de su área responsable',    2),
  (4, 'directivo',  'Directivo',               'Consulta dashboards y genera reportes',     3)
ON CONFLICT (id) DO NOTHING;

SELECT setval('roles_id_seq', (SELECT MAX(id) FROM public.roles));

INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
  ('anio_actual_evaluacion', '2026', 'Año activo de evaluación. Se actualizará al cierre del ejercicio fiscal.'),
  ('mes_actual_evaluacion',  '6',    'Mes activo de evaluación (1-12). Al cambiarlo, el Dashboard y las vistas se actualizan automáticamente.')
ON CONFLICT (clave) DO NOTHING;
