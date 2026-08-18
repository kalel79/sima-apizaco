-- ============================================================
-- FASE MML 09 — Área responsable por Componente + restricción por área de
-- los "datos de indicador" en la MIR.
--
-- Problema real (verificado en producción, 2026-08-18): los 9 programas
-- reparten su MIR entre 2 y 6 áreas distintas (ej. programa_id=9: 6 áreas).
-- Hoy la RLS de arbol_nodos/indicador_variables/indicador_variables_valores
-- solo checa "¿tu área pertenece a este programa?" (get_mis_programa_ids()),
-- no "¿es tu Componente?" — cualquier enlace de cualquiera de esas áreas
-- puede capturar/modificar el renglón MIR de cualquier otra área del mismo
-- programa.
--
-- Decisiones de Hugo (confirmadas 2026-08-18):
-- 1. El área dueña de un Componente es un campo NUEVO y explícito
--    (area_responsable_id), NO derivado de indicadores.area_id — los
--    indicadores 2027 pueden cambiar/eliminarse, el área del Componente no
--    debe depender de eso. Se captura desde la pantalla Árbol de Objetivos
--    (no desde Riesgos/MIR). Las Actividades heredan la de su Componente
--    padre, nunca se captura aparte.
-- 2. Solo se restringen por área los "datos de indicador": indicador_id,
--    supuestos, medios_verificacion (arbol_nodos); Tipo/Dimensión/Sentido/
--    Definición/Línea base/Frecuencia/Interpretación (indicadores);
--    Variables de la fórmula y sus valores. El texto/estructura del árbol
--    (texto, padre_id, orden) sigue abierto a cualquier enlace del
--    programa, sin cambio.
-- 3. Fin y Propósito (los 2 niveles compartidos de toda la MIR) solo los
--    captura Planeación/Admin, sin importar área.
-- 4. Un Componente sin área asignada bloquea sus datos de indicador para
--    cualquier enlace hasta que Planeación/Admin le asigne área. Arranque:
--    la columna nueva queda vacía para todo lo ya sembrado — Planeación
--    asigna a mano, sin backfill automático.
--
-- Mecanismo: indicador_id/supuestos/medios_verificacion viven en la MISMA
-- fila que texto/padre_id/orden, que deben seguir sin restricción — RLS
-- actúa por fila, no por columna, para el mismo rol de Postgres
-- (authenticated). Se usa un trigger BEFORE INSERT OR UPDATE que solo
-- interviene cuando esas columnas específicas cambian, en vez de partir la
-- tabla (evita reescribir resolverDatosMML/expedienteMMLSecciones.js/
-- instructivoMMLSecciones.js/SeccionMIR.jsx por el mismo resultado).
-- indicadores/indicador_variables/indicador_variables_valores no tienen
-- este problema (toda la fila es "dato de indicador"), ahí basta RLS normal.
-- ============================================================

-- ── 1. Columna nueva ──────────────────────────────────────────────────────
ALTER TABLE public.arbol_nodos
  ADD COLUMN area_responsable_id integer REFERENCES public.areas(id);

-- ── 2. Funciones auxiliares (mismo patrón que get_mis_programa_ids()/get_my_rol()) ──
CREATE FUNCTION public.get_my_area_id()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.area_id FROM public.usuarios u WHERE u.auth_uid = auth.uid() LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_area_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_area_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_area_id() TO authenticated;

-- Área efectiva de un nodo YA EXISTENTE: la propia si es Componente (o tiene
-- area_responsable_id puesta), o la de su padre si no tiene (Actividad ->
-- Componente). Fin/Propósito devuelven NULL siempre (nunca tienen área).
CREATE FUNCTION public.get_area_efectiva_nodo(p_nodo_id integer)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(n.area_responsable_id, p.area_responsable_id)
  FROM public.arbol_nodos n
  LEFT JOIN public.arbol_nodos p ON p.id = n.padre_id
  WHERE n.id = p_nodo_id
$$;
REVOKE ALL ON FUNCTION public.get_area_efectiva_nodo(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_area_efectiva_nodo(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_area_efectiva_nodo(integer) TO authenticated;

-- ¿Existe un nodo de la MIR (Componente o Actividad, no Fin/Propósito) que
-- vincule este indicador cuya área efectiva sea la del enlace que llama?
-- Usada por indicadores/indicador_variables/indicador_variables_valores/metas.
CREATE FUNCTION public.puede_enlace_editar_indicador(p_indicador_id integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.arbol_nodos n
    WHERE n.indicador_id = p_indicador_id
      AND n.arbol = 'OBJETIVOS'
      AND n.tipo = 'MEDIO'
      AND public.get_area_efectiva_nodo(n.id) IS NOT NULL
      AND public.get_area_efectiva_nodo(n.id) = public.get_my_area_id()
  )
$$;
REVOKE ALL ON FUNCTION public.puede_enlace_editar_indicador(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.puede_enlace_editar_indicador(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.puede_enlace_editar_indicador(integer) TO authenticated;

-- ── 3. Trigger: gatea indicador_id/supuestos/medios_verificacion y el propio
--      area_responsable_id por área, SOLO para rol enlace. texto/padre_id/
--      orden nunca se tocan aquí — arbol_write_area/arbol_write_admin (RLS
--      existente, sin cambios) siguen decidiendo el acceso por programa. ──
CREATE FUNCTION public.arbol_nodos_valida_datos_indicador()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_old_indicador integer;
  v_old_supuestos text;
  v_old_medios    text;
  v_old_area      integer;
  v_area_efectiva integer;
  v_es_componente boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_indicador := OLD.indicador_id;
    v_old_supuestos := OLD.supuestos;
    v_old_medios    := OLD.medios_verificacion;
    v_old_area      := OLD.area_responsable_id;
  END IF;

  -- Integridad estructural: area_responsable_id solo en un Componente
  -- (MEDIO hijo directo de la raíz OBJETIVO) — aplica a TODOS los roles.
  IF NEW.area_responsable_id IS NOT NULL THEN
    IF NEW.tipo <> 'MEDIO' THEN
      RAISE EXCEPTION 'area_responsable_id solo aplica a Componentes/Actividades (tipo MEDIO).';
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.arbol_nodos p WHERE p.id = NEW.padre_id AND p.tipo = 'OBJETIVO'
    ) INTO v_es_componente;
    IF NOT v_es_componente THEN
      RAISE EXCEPTION 'area_responsable_id solo se captura en el Componente; la Actividad hereda la de su Componente.';
    END IF;
  END IF;

  -- Admin/planeación (y cualquier llamado sin rol resuelto, ej. service_role):
  -- sin restricción adicional. COALESCE es necesario porque en SQL
  -- `NULL <> 'enlace'` da NULL, que PL/pgSQL trata como falso en un IF — sin
  -- esto, un rol no resuelto caía por error en la rama restringida de enlace.
  IF COALESCE(public.get_my_rol(), '') <> 'enlace' THEN
    RETURN NEW;
  END IF;

  -- Solo Planeación/Admin asigna o cambia el área responsable.
  IF NEW.area_responsable_id IS DISTINCT FROM v_old_area THEN
    RAISE EXCEPTION 'Solo Planeación/Administrador puede asignar el Área responsable de un Componente.';
  END IF;

  -- Datos de indicador: solo se gatean si cambió alguno de los 3 — texto/
  -- padre_id/orden sigue abierto a cualquier enlace del programa.
  IF NEW.indicador_id           IS DISTINCT FROM v_old_indicador
     OR NEW.supuestos           IS DISTINCT FROM v_old_supuestos
     OR NEW.medios_verificacion IS DISTINCT FROM v_old_medios THEN

    IF NEW.tipo IN ('OBJETIVO', 'FIN') THEN
      RAISE EXCEPTION 'El Propósito y el Fin de la MIR solo los captura Planeación/Administrador.';
    END IF;

    -- Cálculo inline (no vía get_area_efectiva_nodo, que asume la fila ya
    -- persistida; en un INSERT, NEW.id todavía no existe en la tabla).
    v_area_efectiva := NEW.area_responsable_id;
    IF v_area_efectiva IS NULL AND NEW.padre_id IS NOT NULL THEN
      SELECT area_responsable_id INTO v_area_efectiva
      FROM public.arbol_nodos WHERE id = NEW.padre_id;
    END IF;

    IF v_area_efectiva IS NULL THEN
      RAISE EXCEPTION 'Este Componente/Actividad no tiene Área responsable asignada; solo Planeación/Administrador puede capturar sus datos de indicador hasta que se le asigne.';
    ELSIF v_area_efectiva IS DISTINCT FROM public.get_my_area_id() THEN
      RAISE EXCEPTION 'Solo el enlace del área responsable de este Componente/Actividad puede capturar sus datos de indicador.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_arbol_nodos_valida_datos_indicador
  BEFORE INSERT OR UPDATE ON public.arbol_nodos
  FOR EACH ROW EXECUTE FUNCTION public.arbol_nodos_valida_datos_indicador();

-- ── 4. RPC: crear indicador + vincularlo en una sola operación atómica.
--      Bajo indicadores_write_area (abajo), un enlace nunca podría hacer
--      INSERT directo a indicadores: puede_enlace_editar_indicador(NEW.id)
--      no puede ser true para un id que todavía no existe en ningún
--      arbol_nodos. Esta función corre como su dueño (bypassea RLS) y
--      valida el permiso ella misma antes de escribir. ──
CREATE FUNCTION public.crear_indicador_y_vincular(
  p_nodo_id integer, p_nombre text, p_area_id integer, p_programa_id integer,
  p_unidad_medida text, p_frecuencia text, p_nivel_mir text
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nodo RECORD;
  v_area_efectiva integer;
  v_nuevo_id integer;
BEGIN
  SELECT * INTO v_nodo FROM public.arbol_nodos WHERE id = p_nodo_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nodo % no existe', p_nodo_id;
  END IF;

  IF public.get_my_rol() = 'enlace' THEN
    IF v_nodo.tipo IN ('OBJETIVO', 'FIN') THEN
      RAISE EXCEPTION 'El Propósito y el Fin solo los captura Planeación/Administrador.';
    END IF;
    v_area_efectiva := public.get_area_efectiva_nodo(p_nodo_id);
    IF v_area_efectiva IS NULL OR v_area_efectiva IS DISTINCT FROM public.get_my_area_id() THEN
      RAISE EXCEPTION 'No tienes permiso para vincular un indicador a este nodo.';
    END IF;
  ELSIF public.get_my_rol() IN ('admin', 'planeacion') THEN
    NULL; -- sin restricción adicional
  ELSE
    -- Cubre explícitamente rol NULL (sin fila en usuarios) además de otros
    -- roles: "NOT IN" con NULL no habría bloqueado por la propagación de NULL.
    RAISE EXCEPTION 'No tienes permiso para crear indicadores.';
  END IF;

  INSERT INTO public.indicadores (nombre, area_id, programa_id, unidad_medida, frecuencia, nivel_mir, activo)
  VALUES (p_nombre, p_area_id, p_programa_id, COALESCE(p_unidad_medida, 'Porcentaje'), COALESCE(p_frecuencia, 'Anual'), p_nivel_mir, true)
  RETURNING id INTO v_nuevo_id;

  UPDATE public.arbol_nodos SET indicador_id = v_nuevo_id WHERE id = p_nodo_id;

  RETURN v_nuevo_id;
END;
$$;
REVOKE ALL ON FUNCTION public.crear_indicador_y_vincular(integer, text, integer, integer, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.crear_indicador_y_vincular(integer, text, integer, integer, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.crear_indicador_y_vincular(integer, text, integer, integer, text, text, text) TO authenticated;

-- ── 5. RLS: indicadores — nueva política para enlace, scoped por área ────
CREATE POLICY indicadores_write_area ON public.indicadores
  FOR ALL TO authenticated
  USING (get_my_rol() = 'enlace' AND public.puede_enlace_editar_indicador(id))
  WITH CHECK (get_my_rol() = 'enlace' AND public.puede_enlace_editar_indicador(id));

-- ── 6. RLS: indicador_variables / indicador_variables_valores — se
--      endurece de "scoped por programa" a "scoped por área". ──
ALTER POLICY indicador_variables_write_area ON public.indicador_variables
  USING (get_my_rol() = 'enlace' AND public.puede_enlace_editar_indicador(indicador_id))
  WITH CHECK (get_my_rol() = 'enlace' AND public.puede_enlace_editar_indicador(indicador_id));

ALTER POLICY ind_var_valores_write_area ON public.indicador_variables_valores
  USING (
    get_my_rol() = 'enlace'
    AND EXISTS (
      SELECT 1 FROM public.indicador_variables v
      WHERE v.id = indicador_variables_valores.variable_id
        AND public.puede_enlace_editar_indicador(v.indicador_id)
    )
  )
  WITH CHECK (
    get_my_rol() = 'enlace'
    AND EXISTS (
      SELECT 1 FROM public.indicador_variables v
      WHERE v.id = indicador_variables_valores.variable_id
        AND public.puede_enlace_editar_indicador(v.indicador_id)
    )
  );
