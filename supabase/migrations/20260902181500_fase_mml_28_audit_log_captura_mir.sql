-- ============================================================
-- FASE MML 28 — el audit_log cubre la captura de la MIR.
--
-- Hasta ahora audit_log solo registraba avances, cierres, transparencia y
-- resets de contrasena, todos escritos a mano desde el frontend. Las tres
-- tablas donde se captura la MIR/POA -- indicadores, metas y arbol_nodos --
-- no dejaban rastro de quien escribia, y tampoco guardan un usuario en sus
-- propias columnas.
--
-- El 2026-09-02, al rastrear el indicador huerfano 192, la unica evidencia
-- disponible fueron los edge_logs de Supabase, que se retienen unos pocos
-- dias: pasada esa ventana el rastro se pierde para siempre.
--
-- Se resuelve con triggers en la base y NO con llamadas desde el frontend,
-- a proposito: asi tambien quedan registradas las escrituras que no pasan
-- por la app (MCP, SQL Editor del Dashboard, scripts). El DELETE que dejo
-- huerfano al 192 fue precisamente una de esas.
-- ============================================================

-- 1. De donde vino la escritura ------------------------------------------
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS origen text;

COMMENT ON COLUMN audit_log.origen IS
  'Rol de sesion + application_name de la conexion que escribio. Distingue la app (authenticator) del MCP, el SQL Editor y los scripts.';

-- 2. Funcion generica de auditoria ---------------------------------------
CREATE OR REPLACE FUNCTION public.fn_audit_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_usuario  uuid;
  v_registro text;
  v_antes    jsonb;
  v_nuevo    jsonb;
BEGIN
  -- Un upsert que no cambio nada no ensucia la bitacora.
  IF TG_OP = 'UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN
    RETURN NULL;
  END IF;

  -- audit_log.usuario_id apunta a usuarios.id, no a auth_uid. Queda NULL
  -- cuando la escritura no viene de una sesion autenticada de la app.
  SELECT u.id INTO v_usuario
  FROM public.usuarios u
  WHERE u.auth_uid = auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_registro := OLD.id::text;
    v_antes    := to_jsonb(OLD);
    v_nuevo    := NULL;
  ELSE
    v_registro := NEW.id::text;
    v_antes    := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
    v_nuevo    := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_log
    (tabla, accion, registro_id, usuario_id, datos_antes, datos_nuevo, origen)
  VALUES
    (TG_TABLE_NAME, TG_OP, v_registro, v_usuario, v_antes, v_nuevo,
     -- session_user, no current_user: dentro de un SECURITY DEFINER
     -- current_user es siempre el propietario y no distingue nada.
     session_user || ' / ' || COALESCE(NULLIF(current_setting('application_name', true), ''), '?'));

  RETURN NULL;

EXCEPTION WHEN OTHERS THEN
  -- Falla ABIERTA a proposito: una bitacora incompleta es mala, pero peor es
  -- que un enlace no pueda capturar su mes porque el trigger reviento. El
  -- WARNING queda en los postgres_logs.
  RAISE WARNING 'audit_log: no se pudo registrar % en % (%)', TG_OP, TG_TABLE_NAME, SQLERRM;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_audit_row() FROM anon;

-- 3. Los tres triggers ----------------------------------------------------
DROP TRIGGER IF EXISTS trg_indicadores_audit ON indicadores;
CREATE TRIGGER trg_indicadores_audit
  AFTER INSERT OR UPDATE OR DELETE ON indicadores
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

DROP TRIGGER IF EXISTS trg_metas_audit ON metas;
CREATE TRIGGER trg_metas_audit
  AFTER INSERT OR UPDATE OR DELETE ON metas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

DROP TRIGGER IF EXISTS trg_arbol_nodos_audit ON arbol_nodos;
CREATE TRIGGER trg_arbol_nodos_audit
  AFTER INSERT OR UPDATE OR DELETE ON arbol_nodos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_row();

-- 4. Higiene: audit_log arrastra grants de anon desde su creacion (2026-07).
--    La RLS ya lo bloqueaba en la practica, pero el grant sobraba.
REVOKE ALL ON TABLE audit_log FROM anon;

-- 5. La bitacora va a crecer mucho mas rapido que antes: indice por tabla
--    y fecha, que es como se consulta.
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla_fecha
  ON audit_log (tabla, created_at DESC);
