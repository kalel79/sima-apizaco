-- ============================================================
-- FASE INFORME 06 — Bloques narrativos del Informe (hilación)
-- Separa lo que capturan las áreas (logros) de cómo se cuenta (bloques):
-- cada eje se organiza en bloques temáticos con orden editorial fijo y cada
-- logro pertenece a un bloque y tiene un orden dentro de él. El título del
-- bloque sale de este catálogo, no del texto libre `tema`, que se conserva
-- sin cambios y deja de imprimirse.
-- Solo admin/planeación editan bloques, textos del eje y la asignación.
-- 100 % aditiva: tablas nuevas, columnas nuevas nullable y la vista las
-- expone al final. Se puede ejecutar más de una vez sin duplicar nada.
-- Sin BEGIN/COMMIT: se ejecuta completa en el editor SQL de Supabase.
-- ============================================================

-- ---------- Catálogo de bloques ----------
CREATE TABLE IF NOT EXISTS public.informe_bloques (
  id            serial PRIMARY KEY,
  informe_id    integer  NOT NULL REFERENCES public.informe_gobierno(id) ON DELETE CASCADE,
  eje_id        integer  NOT NULL REFERENCES public.ejes(id),
  orden         smallint NOT NULL,
  titulo        text     NOT NULL,
  texto_puente  text,
  activo        boolean  NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT informe_bloques_titulo_chk CHECK (
    titulo = btrim(titulo) AND char_length(titulo) BETWEEN 3 AND 60 AND titulo !~ '\.$'
  ),
  CONSTRAINT informe_bloques_titulo_uk UNIQUE (informe_id, eje_id, titulo)
);

COMMENT ON TABLE  public.informe_bloques              IS 'Bloques narrativos del Informe: agrupan los logros de un eje en orden editorial.';
COMMENT ON COLUMN public.informe_bloques.orden        IS 'Posición del bloque dentro del eje (1, 2, 3…). No se repite el bloque en el eje.';
COMMENT ON COLUMN public.informe_bloques.titulo       IS 'Título editorial del bloque: hasta 60 caracteres, sin punto final.';
COMMENT ON COLUMN public.informe_bloques.texto_puente IS 'Una o dos frases que enlazan con el bloque anterior. Opcional.';

CREATE INDEX IF NOT EXISTS idx_informe_bloques_eje ON public.informe_bloques (informe_id, eje_id, orden);

DROP TRIGGER IF EXISTS trg_informe_bloques_updated_at ON public.informe_bloques;
CREATE TRIGGER trg_informe_bloques_updated_at
  BEFORE UPDATE ON public.informe_bloques
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_informe_bloques_audit ON public.informe_bloques;
CREATE TRIGGER trg_informe_bloques_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.informe_bloques
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

-- ---------- Textos de apertura y cierre de cada eje ----------
CREATE TABLE IF NOT EXISTS public.informe_ejes_texto (
  id          serial PRIMARY KEY,
  informe_id  integer NOT NULL REFERENCES public.informe_gobierno(id) ON DELETE CASCADE,
  eje_id      integer NOT NULL REFERENCES public.ejes(id),
  entradilla  text,
  cierre      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT informe_ejes_texto_uk UNIQUE (informe_id, eje_id)
);

COMMENT ON TABLE  public.informe_ejes_texto            IS 'Textos de enlace del capítulo de cada eje en el Informe.';
COMMENT ON COLUMN public.informe_ejes_texto.entradilla IS 'Párrafo de apertura del eje: anuncia el recorrido por sus bloques.';
COMMENT ON COLUMN public.informe_ejes_texto.cierre     IS 'Frase final del eje, que enlaza con su compromiso del año siguiente.';

DROP TRIGGER IF EXISTS trg_informe_ejes_texto_updated_at ON public.informe_ejes_texto;
CREATE TRIGGER trg_informe_ejes_texto_updated_at
  BEFORE UPDATE ON public.informe_ejes_texto
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_informe_ejes_texto_audit ON public.informe_ejes_texto;
CREATE TRIGGER trg_informe_ejes_texto_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.informe_ejes_texto
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

-- ---------- Asignación de cada logro ----------
-- bloque_id:         bloque al que pertenece (del mismo eje que su área).
-- orden_en_bloque:   orden manual dentro del bloque; sin valor, decide la fecha.
-- eje_referencia_id: otro eje que trata el mismo tema («Véase también…»).
-- El logro no cambia de eje: el eje sigue saliendo de su área.
ALTER TABLE public.informe_acciones
  ADD COLUMN IF NOT EXISTS bloque_id         integer  REFERENCES public.informe_bloques(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS orden_en_bloque   smallint,
  ADD COLUMN IF NOT EXISTS eje_referencia_id integer  REFERENCES public.ejes(id);

COMMENT ON COLUMN public.informe_acciones.bloque_id         IS 'Bloque narrativo del Informe al que pertenece el logro. Solo admin/planeación.';
COMMENT ON COLUMN public.informe_acciones.orden_en_bloque   IS 'Orden manual dentro del bloque; si falta, se ordena por área y fecha. Solo admin/planeación.';
COMMENT ON COLUMN public.informe_acciones.eje_referencia_id IS 'Eje con un logro del mismo tema, para la referencia cruzada. Solo admin/planeación.';

CREATE INDEX IF NOT EXISTS idx_informe_acciones_bloque ON public.informe_acciones (bloque_id);

-- ---------- RLS ----------
-- Igual que informe_gobierno: todos los roles con acceso leen; solo
-- admin/planeación editan.
ALTER TABLE public.informe_bloques    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_ejes_texto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS informe_bloques_select ON public.informe_bloques;
CREATE POLICY informe_bloques_select ON public.informe_bloques
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo','enlace']));

DROP POLICY IF EXISTS informe_bloques_write ON public.informe_bloques;
CREATE POLICY informe_bloques_write ON public.informe_bloques
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

DROP POLICY IF EXISTS informe_ejes_texto_select ON public.informe_ejes_texto;
CREATE POLICY informe_ejes_texto_select ON public.informe_ejes_texto
  FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion','directivo','enlace']));

DROP POLICY IF EXISTS informe_ejes_texto_write ON public.informe_ejes_texto;
CREATE POLICY informe_ejes_texto_write ON public.informe_ejes_texto
  FOR ALL TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['admin','planeacion']))
  WITH CHECK (public.get_my_rol() = ANY (ARRAY['admin','planeacion']));

REVOKE ALL ON public.informe_bloques, public.informe_ejes_texto FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.informe_bloques, public.informe_ejes_texto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.informe_bloques_id_seq, public.informe_ejes_texto_id_seq TO authenticated;

-- ---------- Validación ----------
-- Misma función de fase_informe_05, más las reglas de los bloques: el enlace
-- no puede mover la asignación, el bloque debe ser del mismo informe y del
-- eje del área, y la referencia cruzada debe apuntar a otro eje.
CREATE OR REPLACE FUNCTION public.fn_informe_acciones_validar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ini date;
  v_fin date;
  v_eje integer;
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
      NEW.bloque_id := NULL;
      NEW.orden_en_bloque := NULL;
      NEW.eje_referencia_id := NULL;
    END IF;
  ELSE
    NEW.created_by := OLD.created_by;
    IF NOT v_es_planeacion THEN
      NEW.incluir_en_informe := OLD.incluir_en_informe;
      NEW.revisada := false;
      NEW.destacado_eje := OLD.destacado_eje;
      NEW.destacado_informe := OLD.destacado_informe;
      NEW.bloque_id := OLD.bloque_id;
      NEW.orden_en_bloque := OLD.orden_en_bloque;
      NEW.eje_referencia_id := OLD.eje_referencia_id;
    END IF;
  END IF;

  IF NEW.bloque_id IS NOT NULL OR NEW.eje_referencia_id IS NOT NULL THEN
    SELECT ar.eje_id INTO v_eje FROM public.areas ar WHERE ar.id = NEW.area_id;

    IF NEW.bloque_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.informe_bloques b
      WHERE b.id = NEW.bloque_id AND b.informe_id = NEW.informe_id AND b.eje_id = v_eje
    ) THEN
      RAISE EXCEPTION 'El bloque % no pertenece al eje del área % en este informe', NEW.bloque_id, NEW.area_id
        USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.eje_referencia_id IS NOT NULL AND NEW.eje_referencia_id = v_eje THEN
      RAISE EXCEPTION 'La referencia cruzada debe apuntar a un eje distinto al del logro'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_informe_acciones_validar() FROM anon;

-- ---------- Vista ----------
-- Mismas columnas y en el mismo orden que en fase_informe_05; las nuevas van
-- al final.
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
    a.destacado_informe,
    a.bloque_id,
    b.orden AS bloque_orden,
    b.titulo AS bloque,
    a.orden_en_bloque,
    a.eje_referencia_id,
    er.codigo AS eje_referencia_codigo
   FROM informe_acciones a
     JOIN areas ar ON ar.id = a.area_id
     LEFT JOIN ejes e ON e.id = ar.eje_id
     LEFT JOIN indicadores i ON i.id = a.indicador_id
     LEFT JOIN programas_pmd p ON p.id = i.programa_pmd_id
     LEFT JOIN informe_bloques b ON b.id = a.bloque_id
     LEFT JOIN ejes er ON er.id = a.eje_referencia_id;

-- ---------- Semilla del catálogo (2.º Informe) ----------
-- Títulos y textos en borrador: Planeación los edita después. Protección
-- Civil (E1) y el eje AJ no llevan bloque porque no tienen logros.
INSERT INTO public.informe_bloques (informe_id, eje_id, orden, titulo, texto_puente)
SELECT g.id, e.id, s.orden, s.titulo, s.texto_puente
FROM (VALUES
  ('E1', 1, 'Una policía mejor preparada y equipada', NULL),
  ('E1', 2, 'Tecnología y respuesta inmediata', 'Mejor equipo y mejor preparación se traducen en una respuesta más rápida.'),
  ('E1', 3, 'Prevención con la ciudadanía', NULL),
  ('E1', 4, 'Calles ordenadas y seguras', NULL),
  ('E1', 5, 'Justicia cívica y cultura de paz', NULL),

  ('E2', 1, 'Apoyo a quienes más lo necesitan', NULL),
  ('E2', 2, 'Salud cerca de la gente', NULL),
  ('E2', 3, 'Solidaridad ante emergencias', NULL),
  ('E2', 4, 'Convivencia y tradiciones familiares', NULL),
  ('E2', 5, 'Educación', NULL),
  ('E2', 6, 'Juventudes', NULL),
  ('E2', 7, 'Deporte', NULL),

  ('E3', 1, 'Agua potable', NULL),
  ('E3', 2, 'Drenaje y saneamiento', NULL),
  ('E3', 3, 'Calles y vialidades', NULL),
  ('E3', 4, 'Alumbrado público', NULL),
  ('E3', 5, 'Parques y espacios públicos', NULL),

  ('E4', 1, 'Apizaco, Barrio Mágico: turismo y cultura', NULL),
  ('E4', 2, 'Comercio, emprendimiento y mercados', NULL),
  ('E4', 3, 'El campo apizaquense', NULL),

  ('E5', 1, 'Planeación y evaluación del desempeño', NULL),
  ('E5', 2, 'Finanzas públicas ordenadas', NULL),
  ('E5', 3, 'Control interno y combate a la corrupción', NULL),
  ('E5', 4, 'Transparencia y acceso a la información', NULL),
  ('E5', 5, 'Gobierno digital', NULL),
  ('E5', 6, 'Parquímetros', NULL),

  ('TA', 1, 'Residuos y limpia', NULL),
  ('TA', 2, 'Municipio verde', NULL),
  ('TA', 3, 'Educación ambiental', NULL),
  ('TA', 4, 'Energía sustentable', NULL),
  ('TA', 5, 'Bienestar animal', NULL),
  ('TA', 6, 'Rastro municipal', NULL),

  ('TB', 1, 'Igualdad desde el gobierno', NULL),
  ('TB', 2, 'Una vida libre de violencia', NULL),
  ('TB', 3, 'Autonomía económica de las mujeres', NULL),
  ('TB', 4, 'Niñas, niños y adolescentes', NULL),

  ('MS', 1, 'Gobierno cercano', NULL),
  ('MS', 2, 'Participación y orden en la vía pública', NULL),
  ('MS', 3, 'Comunicación con la ciudadanía', NULL)
) AS s(eje, orden, titulo, texto_puente)
JOIN public.ejes e ON e.codigo = s.eje
JOIN public.informe_gobierno g ON g.numero = 2
ON CONFLICT (informe_id, eje_id, titulo) DO NOTHING;

INSERT INTO public.informe_ejes_texto (informe_id, eje_id, entradilla)
SELECT g.id, e.id, s.entradilla
FROM (VALUES
  ('E1', 'La seguridad se construye con policías preparados, tecnología que responde y vecinos organizados. Así trabajamos este año.'),
  ('E2', 'El bienestar empieza por quien más lo necesita y se extiende a toda la familia: asistencia, salud, educación, juventud y deporte.'),
  ('E3', 'Del agua que llega a casa a la calle por la que se camina: los servicios básicos son la primera obligación del municipio.'),
  ('E4', 'Apizaco crece cuando su cultura atrae visitantes, sus comercios se fortalecen y su campo produce.'),
  ('E5', 'Un gobierno que se mide, cuida el dinero público y rinde cuentas. El primer lugar estatal en la Guía Consultiva de Desempeño Municipal es el resultado de ese orden.'),
  ('TA', 'Un municipio limpio y verde se sostiene con servicio diario y con educación.'),
  ('TB', 'La igualdad se construye desde la institución, protege a las mujeres de la violencia, abre oportunidades de trabajo y cuida a la niñez.')
) AS s(eje, entradilla)
JOIN public.ejes e ON e.codigo = s.eje
JOIN public.informe_gobierno g ON g.numero = 2
ON CONFLICT (informe_id, eje_id) DO NOTHING;

-- ---------- Comprobación (solo lectura) ----------
-- Debe devolver 8 ejes con 5, 7, 5, 3, 6, 6, 4 y 3 bloques (39 en total).
SELECT e.codigo AS eje, count(*) AS bloques,
       (SELECT t.entradilla IS NOT NULL FROM public.informe_ejes_texto t
         WHERE t.informe_id = b.informe_id AND t.eje_id = b.eje_id) AS con_entradilla
FROM public.informe_bloques b
JOIN public.ejes e ON e.id = b.eje_id
GROUP BY e.codigo, e.orden, b.informe_id, b.eje_id
ORDER BY e.orden;
