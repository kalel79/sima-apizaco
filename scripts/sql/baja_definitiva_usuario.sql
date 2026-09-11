-- ============================================================================
-- Baja definitiva de un usuario (perfil public.usuarios + cuenta auth.users)
-- ----------------------------------------------------------------------------
-- Caso que origino el script: Abdi Elisa Robles Herrera
--                             <Abdiroblesherrera.5@gmail.com>
--
-- Criterio: se conserva TODO el historico (avances, evidencias, cierres,
-- audit_log, publicaciones). Lo unico que se pierde es la AUTORIA: las
-- columnas que apuntaban al usuario quedan en NULL. Antes de borrar se deja
-- constancia en audit_log con la fotografia completa del perfil.
--
-- OJO: este proyecto apunta a PRODUCCION. Corre los pasos EN ORDEN y no pases
-- al PASO 3 sin haber leido la salida del PASO 2.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor (corre como postgres, asi que
-- ignora RLS; auth.users solo es accesible desde ahi, no desde el frontend).
-- ============================================================================


-- ============================================================================
-- PASO 1 - IDENTIFICACION (solo lectura, no cambia nada)
-- ============================================================================

-- 1.a  Perfil en public.usuarios
SELECT u.id, u.auth_uid, u.nombre, u.apellidos, u.email, u.cargo,
       u.activo, u.primer_login, r.codigo AS rol, a.nombre AS area,
       u.created_at, u.updated_at
FROM   public.usuarios u
LEFT   JOIN public.roles r ON r.id = u.rol_id
LEFT   JOIN public.areas a ON a.id = u.area_id
WHERE  lower(u.email) = lower('Abdiroblesherrera.5@gmail.com');

-- 1.b  Cuenta en Supabase Auth
SELECT id, email, created_at, last_sign_in_at, email_confirmed_at,
       banned_until, raw_user_meta_data
FROM   auth.users
WHERE  lower(email) = lower('Abdiroblesherrera.5@gmail.com');

-- 1.c  Duplicados / homonimos: para no borrar al que no era, y para detectar
--      un alta que quedo a medias con el correo escrito distinto.
SELECT 'usuarios' AS origen, u.id::text AS id, u.auth_uid::text AS auth_uid,
       u.email, u.nombre || ' ' || coalesce(u.apellidos, '') AS nombre_completo,
       u.activo::text AS activo
FROM   public.usuarios u
WHERE  u.email ILIKE '%abdirobles%'
   OR  u.nombre ILIKE '%abdi%'
   OR  u.apellidos ILIKE '%robles herrera%'
UNION ALL
SELECT 'auth.users', au.id::text, NULL, au.email, NULL, NULL
FROM   auth.users au
WHERE  au.email ILIKE '%abdirobles%';

-- 1.d  Todas las columnas del esquema que apuntan a public.usuarios(id).
--      Si aqui aparece algo con no_nulo = true, el PASO 2 se detendra: esa
--      tabla necesita una decision manual (reasignar, no desligar).
SELECT ns.nspname     AS esquema,
       src.relname    AS tabla,
       att.attname    AS columna,
       att.attnotnull AS no_nulo,
       con.conname    AS constraint_fk
FROM   pg_constraint con
JOIN   pg_class     src ON src.oid = con.conrelid
JOIN   pg_namespace ns  ON ns.oid  = src.relnamespace
JOIN   pg_class     tgt ON tgt.oid = con.confrelid
JOIN   pg_namespace tns ON tns.oid = tgt.relnamespace
CROSS  JOIN LATERAL unnest(con.conkey, con.confkey) AS k(attnum, fattnum)
JOIN   pg_attribute att  ON att.attrelid  = con.conrelid  AND att.attnum  = k.attnum
JOIN   pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = k.fattnum
WHERE  con.contype = 'f'
  AND  tns.nspname = 'public'
  AND  tgt.relname = 'usuarios'
  AND  fatt.attname = 'id'
ORDER  BY 1, 2, 3;


-- ============================================================================
-- PASO 2 - SIMULACION (v_simular = true: reporta el impacto y revierte)
-- PASO 3 - EJECUCION  (cambia v_simular a false y vuelve a correr el bloque)
-- ============================================================================
--
-- El bloque es atomico: o se aplica completo o no se aplica nada.
-- En simulacion termina con un ERROR a proposito: ese error ES el reporte.

DO $baja$
DECLARE
  ---------------------------------------------------------------------------
  v_email    text    := 'Abdiroblesherrera.5@gmail.com';
  v_simular  boolean := true;   -- <- PASO 3: ponlo en false para aplicar
  ---------------------------------------------------------------------------
  v_id       uuid;
  v_auth_uid uuid;
  v_snap     jsonb;
  v_dup      int;
  v_n        bigint;
  v_tot      bigint := 0;
  v_rep      text   := '';
  r          record;
BEGIN
  -- -- Guardas ---------------------------------------------------------------
  SELECT count(*) INTO v_dup
  FROM public.usuarios WHERE lower(email) = lower(v_email);

  IF v_dup = 0 THEN
    RAISE EXCEPTION 'No existe ningun perfil en public.usuarios con el correo %', v_email;
  ELSIF v_dup > 1 THEN
    RAISE EXCEPTION 'Hay % perfiles con el correo %. Revisalos con el PASO 1.c y borra por id, no por correo.', v_dup, v_email;
  END IF;

  SELECT u.id, u.auth_uid, to_jsonb(u)
    INTO v_id, v_auth_uid, v_snap
  FROM public.usuarios u
  WHERE lower(u.email) = lower(v_email);

  v_rep := format(E'\n  perfil  : %s  (%s)\n  auth_uid: %s\n',
                  v_id, v_snap->>'nombre',
                  coalesce(v_auth_uid::text, 'sin cuenta de Auth ligada'));

  -- -- Desligar referencias (conserva las filas, borra la autoria) -----------
  FOR r IN
    SELECT ns.nspname AS esquema, src.relname AS tabla,
           att.attname AS columna, att.attnotnull AS no_nulo
    FROM   pg_constraint con
    JOIN   pg_class     src ON src.oid = con.conrelid
    JOIN   pg_namespace ns  ON ns.oid  = src.relnamespace
    JOIN   pg_class     tgt ON tgt.oid = con.confrelid
    JOIN   pg_namespace tns ON tns.oid = tgt.relnamespace
    CROSS  JOIN LATERAL unnest(con.conkey, con.confkey) AS k(attnum, fattnum)
    JOIN   pg_attribute att  ON att.attrelid  = con.conrelid  AND att.attnum  = k.attnum
    JOIN   pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = k.fattnum
    WHERE  con.contype = 'f'
      AND  tns.nspname = 'public'
      AND  tgt.relname = 'usuarios'
      AND  fatt.attname = 'id'
    ORDER  BY 1, 2, 3
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = $1',
                   r.esquema, r.tabla, r.columna)
      INTO v_n USING v_id;

    CONTINUE WHEN v_n = 0;

    IF r.no_nulo THEN
      RAISE EXCEPTION 'La columna %.%.% es NOT NULL y tiene % fila(s) del usuario: no se puede desligar. Decide si esas filas se reasignan a otro usuario o se borran, y ajusta el script.',
        r.esquema, r.tabla, r.columna, v_n;
    END IF;

    EXECUTE format('UPDATE %I.%I SET %I = NULL WHERE %I = $1',
                   r.esquema, r.tabla, r.columna, r.columna) USING v_id;

    v_tot := v_tot + v_n;
    v_rep := v_rep || format(E'  desliga : %-30s %s fila(s)\n',
                             r.tabla || '.' || r.columna, v_n);
  END LOOP;

  -- -- Constancia de la baja (queda aunque el usuario ya no exista) ----------
  INSERT INTO public.audit_log (tabla, accion, registro_id, usuario_id, datos_antes, datos_nuevo)
  VALUES ('usuarios', 'BAJA_DEFINITIVA', v_id::text, NULL, v_snap,
          jsonb_build_object('ejecutado_en', now(),
                             'referencias_desligadas', v_tot,
                             'auth_uid', v_auth_uid));

  -- -- Borrado ---------------------------------------------------------------
  DELETE FROM public.usuarios WHERE id = v_id;
  v_rep := v_rep || format(E'  borra   : %-30s 1 fila\n', 'public.usuarios');

  -- auth.users arrastra en cascada sesiones, identities y refresh_tokens.
  -- Se busca por auth_uid y tambien por correo, por si el perfil quedo sin ligar.
  DELETE FROM auth.users
  WHERE id = v_auth_uid OR lower(email) = lower(v_email);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_rep := v_rep || format(E'  borra   : %-30s %s fila(s)\n', 'auth.users', v_n);

  IF v_simular THEN
    RAISE EXCEPTION E'SIMULACION - nada se aplico. Esto es lo que haria:\n%\nSi esta bien, cambia v_simular a false y vuelve a correr el bloque.', v_rep;
  END IF;

  RAISE NOTICE E'BAJA APLICADA:\n%', v_rep;
END
$baja$;


-- ============================================================================
-- PASO 4 - VERIFICACION (despues de correr el PASO 3)
-- ============================================================================
-- Ambos contadores deben dar 0 y la constancia debe aparecer.

SELECT
  (SELECT count(*) FROM public.usuarios
     WHERE lower(email) = lower('Abdiroblesherrera.5@gmail.com')) AS perfiles_restantes,
  (SELECT count(*) FROM auth.users
     WHERE lower(email) = lower('Abdiroblesherrera.5@gmail.com')) AS cuentas_auth_restantes;

SELECT id, accion, registro_id, datos_antes->>'email' AS email, datos_nuevo, created_at
FROM   public.audit_log
WHERE  accion = 'BAJA_DEFINITIVA'
ORDER  BY created_at DESC
LIMIT  5;
