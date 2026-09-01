-- ============================================================
-- fase_mml_25 — El Árbol del Problema y el de Objetivos no admiten ciclos.
--
-- MOTIVO: el 2026-09-01 el Módulo Canino "desapareció" del Árbol de Objetivos,
-- la MIR y el POA del PP 032/2027. El Componente 5 tenía padre_id = su propia
-- Actividad 5.1 (ciclo 815 -> 816 -> 815). derivarNivelesMIR() y v_mml_niveles
-- definen Componente = nodo MEDIO cuyo padre es el Objetivo central; al no
-- cumplirlo, el Componente deja de serlo y SUS ACTIVIDADES CAEN CON ÉL, sin
-- error visible. Mismo patrón en el PP 033/2027 (674 -> 682 -> 674).
--
-- Se extiende la función del trigger que ya existe en la tabla (no se crea un
-- segundo trigger, para no depender del orden de ejecución entre ambos). El
-- resto de la función va reproducido tal cual: fase_mml_09/13 (área
-- responsable), fase_mml_23 (estructura solo Planeación/Admin) y las reglas
-- del enlace no cambian.
--
-- La validación va en la zona de INTEGRIDAD ESTRUCTURAL, antes del corte por
-- rol: desde fase_mml_23 el árbol solo lo edita Planeación/Administrador, que
-- es justo quien sale por el `RETURN NEW` de esa rama. Puesta después, no
-- protegería a nadie.
-- ============================================================

CREATE OR REPLACE FUNCTION public.arbol_nodos_valida_datos_indicador()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_indicador integer;
  v_old_supuestos text;
  v_old_medios    text;
  v_old_area      integer;
  v_area_efectiva integer;
  v_padre_valido  boolean;
  v_ciclo         boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_old_indicador := OLD.indicador_id;
    v_old_supuestos := OLD.supuestos;
    v_old_medios    := OLD.medios_verificacion;
    v_old_area      := OLD.area_responsable_id;
  END IF;

  -- ── fase_mml_25 ───────────────────────────────────────────────────────────
  -- Integridad estructural: un nodo no puede colgar de sí mismo ni de uno de
  -- sus descendientes. Se sube por la cadena de padres desde el padre nuevo;
  -- si se alcanza el propio nodo, hay ciclo. `CYCLE` (PG 14+) corta el
  -- recorrido si la cadena ya trae basura de antes, en vez de girar sin fin.
  -- En un BEFORE INSERT, NEW.id ya viene resuelto por la secuencia, así que la
  -- misma consulta cubre el INSERT (que solo puede cerrar un ciclo apuntándose
  -- a sí mismo) y el UPDATE (el caso real).
  IF NEW.padre_id IS NOT NULL AND NEW.id IS NOT NULL THEN
    WITH RECURSIVE ancestros AS (
      SELECT p.id, p.padre_id
      FROM public.arbol_nodos p
      WHERE p.id = NEW.padre_id
      UNION ALL
      SELECT p.id, p.padre_id
      FROM public.arbol_nodos p
      JOIN ancestros a ON p.id = a.padre_id
    ) CYCLE id SET es_ciclo USING ruta
    SELECT EXISTS (SELECT 1 FROM ancestros WHERE id = NEW.id) INTO v_ciclo;

    IF v_ciclo THEN
      RAISE EXCEPTION 'Un nodo no puede colgar de sí mismo ni de uno de sus descendientes. Se formaría un ciclo y ese Componente, junto con todas sus Actividades, desaparecería de la MIR y del POA sin aviso.';
    END IF;
  END IF;
  -- ──────────────────────────────────────────────────────────────────────────

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
$function$;
