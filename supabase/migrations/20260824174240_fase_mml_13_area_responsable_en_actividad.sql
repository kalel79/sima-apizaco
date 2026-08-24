-- ============================================================
-- FASE MML 13 — permite asignar Área responsable también en la Actividad
-- (override opcional; si no se asigna, sigue heredando la del Componente).
--
-- Decisión de Hugo (confirmada 2026-08-24): hasta ahora area_responsable_id
-- solo se podía capturar en el Componente (fase_mml_09); la Actividad la
-- heredaba siempre y el trigger bloqueaba ponerla aparte. Ahora la Actividad
-- también puede tener su propia área — get_area_efectiva_nodo() ya hacía
-- COALESCE(propia, del padre), así que no requiere cambios: si la Actividad
-- no tiene área propia, sigue cayendo a la del Componente igual que antes.
-- Mismo permiso que ya aplicaba (solo Planeación/Administrador asignan).
-- ============================================================

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

  -- Solo Planeación/Admin asigna o cambia el área responsable (Componente o
  -- Actividad).
  IF NEW.area_responsable_id IS DISTINCT FROM v_old_area THEN
    RAISE EXCEPTION 'Solo Planeación/Administrador puede asignar el Área responsable.';
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
