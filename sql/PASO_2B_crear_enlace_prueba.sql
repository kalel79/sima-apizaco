-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 2B — Crear usuario enlace de prueba vía SQL directo (sin SMTP)
-- Archivo : sima/sql/PASO_2B_crear_enlace_prueba.sql
-- Fecha   : 2026-06-04
-- Uso     : SQL Editor de Supabase
--           → corre como rol "postgres" (superuser) → bypasea RLS automáticamente
--           → NO se necesita SET LOCAL ROLE
-- Credenciales que queda: hmonrob+enlacetest@gmail.com / PruebaEnlace2026!
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- INSTRUCCIONES:
--   Ejecuta los bloques EN ORDEN. Cada bloque tiene su propio botón RUN.
--   Bloque 0 y 1 son read-only (diagnóstico). Bloque 2 hace los INSERTs.
--   Bloque 3 verifica el resultado final.
-- ───────────────────────────────────────────────────────────────────────────────


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ BLOQUE 0 — Verificaciones previas (ejecutar primero)                        │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 0a. pgcrypto debe estar presente (viene habilitado por defecto en Supabase)
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'pgcrypto';
-- Resultado esperado: 1 fila con extname = 'pgcrypto'
-- Si devuelve 0 filas: CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0b. Confirmar que corremos como superuser (bypasea RLS)
SELECT current_user AS rol_activo, pg_has_role(current_user, 'postgres', 'member') AS es_superuser;
-- Resultado esperado: rol_activo = postgres | es_superuser = true


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ BLOQUE 1 — Diagnóstico: confirmar IDs exactos antes de insertar            │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 1a. Todos los roles (confirma que 'enlace' existe)
SELECT id, codigo, nombre
FROM public.roles
ORDER BY codigo;

-- 1b. Todas las áreas (busca el nombre exacto de Comunicación Social)
SELECT id, nombre
FROM public.areas
ORDER BY nombre;

-- *** PAUSA AQUÍ: Confirma el nombre exacto del área antes de ejecutar Bloque 2.
-- Si el área se llama diferente a "Comunicación Social", ajusta el ILIKE en el Bloque 2.


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ BLOQUE 2 — INSERT principal (idempotente: borra y recrea si ya existía)    │
-- │ IMPORTANTE: ejecuta Bloque 1 primero y confirma que los IDs son correctos  │
-- └─────────────────────────────────────────────────────────────────────────────┘

DO $$
DECLARE
  v_auth_uid  uuid;
  v_rol_id    integer;
  v_area_id   integer;
  v_email     text := 'hmonrob+enlacetest@gmail.com';
  v_nombre    text := 'Enlace Prueba';
  v_password  text := 'PruebaEnlace2026!';
BEGIN

  -- ── 2.1 Obtener IDs desde catálogos ────────────────────────────────────────
  SELECT id INTO v_rol_id
  FROM public.roles
  WHERE codigo = 'enlace';

  -- Ajusta '%comunicaci%' si el área tiene un nombre diferente
  SELECT id INTO v_area_id
  FROM public.areas
  WHERE nombre ILIKE '%comunicaci%'
  LIMIT 1;

  -- Validaciones: abortamos si los catálogos no tienen los datos esperados
  IF v_rol_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: Rol "enlace" no encontrado en public.roles. '
                    'Verifica la columna "codigo" en Bloque 1.';
  END IF;

  IF v_area_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: No se encontró un área con nombre que contenga '
                    '"comunicaci". Ajusta el ILIKE con el nombre exacto del Bloque 1.';
  END IF;

  RAISE NOTICE 'IDs encontrados → rol_id: % | area_id: %', v_rol_id, v_area_id;

  -- ── 2.2 Idempotencia: limpia registros previos si existen ──────────────────
  -- Se borra public.usuarios primero (FK depende de auth.users)
  DELETE FROM public.usuarios WHERE email = v_email;
  DELETE FROM auth.users      WHERE email = v_email;

  RAISE NOTICE 'Limpieza previa completada (DELETE idempotente).';

  -- ── 2.3 INSERT en auth.users ────────────────────────────────────────────────
  -- email_confirmed_at = now() → usuario queda confirmado sin necesitar correo
  -- confirmation_token / recovery_token / email_change* = '' (no NULL)
  --   evita el bug de Supabase donde NULL en esos campos rompe el login flow
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    email_change_confirm_status,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id estándar de Supabase
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),      -- hash bcrypt de la contraseña
    now(),                                  -- email_confirmed_at: confirma al instante
    now(),                                  -- invited_at
    '',                                     -- confirmation_token (string vacío, no NULL)
    null,                                   -- confirmation_sent_at
    '',                                     -- recovery_token (string vacío, no NULL)
    null,                                   -- recovery_sent_at
    '',                                     -- email_change_token_new (string vacío)
    '',                                     -- email_change (string vacío)
    null,                                   -- email_change_sent_at
    0,                                      -- email_change_confirm_status
    null,                                   -- last_sign_in_at (nunca ha entrado)
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('nombre', v_nombre), -- raw_user_meta_data
    false,                                  -- is_super_admin
    false,                                  -- is_sso_user
    now(),
    now()
  )
  RETURNING id INTO v_auth_uid;

  RAISE NOTICE 'auth.users creado → auth_uid: %', v_auth_uid;

  -- ── 2.4 INSERT en public.usuarios ───────────────────────────────────────────
  -- Solo se insertan los campos que invitarUsuario() usa (los demás son nullable)
  INSERT INTO public.usuarios (
    auth_uid,
    nombre,
    email,
    rol_id,
    area_id
  ) VALUES (
    v_auth_uid,
    v_nombre,
    v_email,
    v_rol_id,
    v_area_id
  );

  RAISE NOTICE '✓ public.usuarios creado correctamente.';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '  USUARIO LISTO:';
  RAISE NOTICE '    email    : %', v_email;
  RAISE NOTICE '    password : %', v_password;
  RAISE NOTICE '    auth_uid : %', v_auth_uid;
  RAISE NOTICE '    rol_id   : %', v_rol_id;
  RAISE NOTICE '    area_id  : %', v_area_id;
  RAISE NOTICE '══════════════════════════════════════════════════════';

END;
$$;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ BLOQUE 3 — Verificación final (debe devolver exactamente 1 fila)           │
-- └─────────────────────────────────────────────────────────────────────────────┘

SELECT
  au.email,
  au.encrypted_password IS NOT NULL      AS has_password,
  au.email_confirmed_at IS NOT NULL      AS email_confirmado,
  au.created_at                          AS creado_en,
  au.last_sign_in_at                     AS ultimo_login,
  r.codigo                               AS rol,
  COALESCE(a.nombre, '(sin área)')       AS area,
  u.nombre                               AS nombre_perfil,
  u.auth_uid
FROM auth.users       au
JOIN public.usuarios  u  ON u.auth_uid = au.id
JOIN public.roles     r  ON r.id       = u.rol_id
LEFT JOIN public.areas a ON a.id       = u.area_id
WHERE au.email = 'hmonrob+enlacetest@gmail.com';

-- Resultado esperado:
--   email            → hmonrob+enlacetest@gmail.com
--   has_password     → true
--   email_confirmado → true
--   rol              → enlace
--   area             → Comunicación Social (o el nombre exacto de tu BD)
--   nombre_perfil    → Enlace Prueba
