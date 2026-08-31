-- ============================================================
-- FASE MML 23 — la ESTRUCTURA de los dos árboles (Problema y Objetivos)
-- queda reservada a Planeación/Administrador.
--
-- Decisión de Hugo (2026-08-31). Hasta ahora la política `arbol_write_area`
-- le daba al enlace ALL sobre `arbol_nodos` de los programas de su área, con
-- alcance por PROGRAMA, no por área: el enlace de un área podía reescribir,
-- recolgar o BORRAR los Componentes de otras áreas del mismo programa (el
-- trigger solo gateaba indicador_id/supuestos/medios_verificacion, y el DELETE
-- no pasaba por él porque es BEFORE INSERT OR UPDATE).
--
-- ALCANCE ELEGIDO: se bloquea la estructura, NO la captura de la MIR.
--   · El enlace pierde INSERT y DELETE sobre arbol_nodos, y ya no puede
--     cambiar texto/tipo/padre_id/orden (ni arbol/programa_id/anio).
--   · CONSERVA lo que ya hacía en la pestaña Riesgos/MIR sobre los nodos de
--     SU área: supuestos, medios_verificacion e indicador_id — que es lo que
--     escribe actualizarNodoMIR() y lo que el trigger ya acotaba por área.
--   · area_responsable_id sigue siendo exclusivo de Planeación/Admin.
--
-- Del lado del cliente, ExpedienteMML.jsx pasa `puedeEditarArbol`
-- (admin/planeación) a las dos instancias de SeccionArbol, en vez de
-- `puedeEditarEsteArea`. El Diagnóstico, los Involucrados y las Acciones
-- alternativas NO se tocan: el enlace los sigue editando.
-- ============================================================

-- 1) RLS: el enlace pasa de ALL a solo UPDATE.
DROP POLICY IF EXISTS arbol_write_area ON public.arbol_nodos;

CREATE POLICY arbol_update_area ON public.arbol_nodos
  FOR UPDATE
  USING      (programa_id = ANY (get_mis_programa_ids()) AND get_my_rol() = 'enlace')
  WITH CHECK (programa_id = ANY (get_mis_programa_ids()) AND get_my_rol() = 'enlace');

-- 2) Trigger: además de lo que ya validaba, el enlace no puede tocar las
--    columnas estructurales del árbol.
CREATE OR REPLACE FUNCTION public.arbol_nodos_valida_datos_indicador()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_old_indicador integer;
  v_old_supuestos text;
  v_old_medios    text;
  v_old_area      integer;
  v_area_efectiva integer;
  v_padre_valido  boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_indicador := OLD.indicador_id;
    v_old_supuestos := OLD.supuestos;
    v_old_medios    := OLD.medios_verificacion;
    v_old_area      := OLD.area_responsable_id;
  END IF;

  -- Integridad estructural: area_responsable_id solo en un nodo tipo MEDIO
  -- (Componente o Actividad) — aplica a TODOS los roles. Un Componente
  -- cuelga de la raíz OBJETIVO; una Actividad cuelga de un Componente
  -- (tipo MEDIO) — fase_mml_13 permite ambos casos, antes solo el primero.
  IF NEW.area_responsable_id IS NOT NULL THEN
    IF NEW.tipo <> 'MEDIO' THEN
      RAISE EXCEPTION 'area_responsable_id solo aplica a Componentes/Actividades (tipo MEDIO).';
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.arbol_nodos p WHERE p.id = NEW.padre_id AND p.tipo IN ('OBJETIVO', 'MEDIO')
    ) INTO v_padre_valido;
    IF NOT v_padre_valido THEN
      RAISE EXCEPTION 'area_responsable_id solo se captura en Componente o Actividad, nunca en Fin/Propósito.';
    END IF;
  END IF;

  -- Admin/planeación (y cualquier llamado sin rol resuelto, ej. service_role):
  -- sin restricción adicional. COALESCE es necesario porque en SQL
  -- `NULL <> 'enlace'` da NULL, que PL/pgSQL trata como falso en un IF — sin
  -- esto, un rol no resuelto caía por error en la rama restringida de enlace.
  IF COALESCE(public.get_my_rol(), '') <> 'enlace' THEN
    RETURN NEW;
  END IF;

  -- ── fase_mml_23 ───────────────────────────────────────────────────────────
  -- La estructura de los dos árboles es de Planeación/Admin. El INSERT ya lo
  -- corta la RLS (el enlace solo tiene UPDATE); se deja la guarda aquí para
  -- que el motivo sea explícito si alguna vez se le devuelve el INSERT.
  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Solo Planeación/Administrador puede agregar nodos al Árbol del Problema o al Árbol de Objetivos.';
  END IF;

  IF NEW.texto       IS DISTINCT FROM OLD.texto
     OR NEW.tipo     IS DISTINCT FROM OLD.tipo
     OR NEW.padre_id IS DISTINCT FROM OLD.padre_id
     OR NEW.orden    IS DISTINCT FROM OLD.orden
     OR NEW.arbol    IS DISTINCT FROM OLD.arbol
     OR NEW.programa_id IS DISTINCT FROM OLD.programa_id
     OR NEW.anio     IS DISTINCT FROM OLD.anio THEN
    RAISE EXCEPTION 'El Árbol del Problema y el Árbol de Objetivos solo los edita Planeación/Administrador. El enlace captura los supuestos, los medios de verificación y el indicador de los Componentes/Actividades de su área en la pestaña Riesgos/MIR.';
  END IF;
  -- ──────────────────────────────────────────────────────────────────────────

  -- Solo Planeación/Admin asigna o cambia el área responsable (Componente o
  -- Actividad).
  IF NEW.area_responsable_id IS DISTINCT FROM v_old_area THEN
    RAISE EXCEPTION 'Solo Planeación/Administrador puede asignar el Área responsable.';
  END IF;

  -- Datos de indicador: solo se gatean si cambió alguno de los 3.
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
