-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 3 — RLS en public.usuarios
-- Archivo : sima/sql/PASO_3_RLS_usuarios.sql
-- Fecha   : 2026-06-05
-- Uso     : SQL Editor de Supabase (corre como postgres → bypasea RLS)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- MODELO DE PERMISOS
--   SELECT  : admin/planeacion → todas las filas
--             enlace/directivo → solo su propia fila (auth_uid = auth.uid())
--   INSERT/UPDATE/DELETE : solo admin
--
-- CASOS ESPECIALES
--   · Javier Rivera / Edgar Arturo: auth_uid IS NULL (nunca autenticados).
--     La política SELECT los filtra correctamente: NULL = <uuid> es falso en SQL,
--     por lo que enlace/directivo jamás verán esas filas. Admin sí las ve (ve todo).
--   · Hugo (admin): la función SECURITY DEFINER lee su rol sin recursión en RLS.
--     Si get_my_rol() devuelve 'admin' → CASE retorna true → ve todas las filas.
--
-- POR QUÉ SE NECESITA UNA FUNCIÓN SECURITY DEFINER
--   La política SELECT necesita conocer el rol del usuario actual leyendo
--   public.usuarios. Sin SECURITY DEFINER esa lectura estaría sujeta a RLS →
--   recursión infinita. Con SECURITY DEFINER la función corre como postgres
--   (que tiene BYPASSRLS) y siempre puede leer la tabla sin activar políticas.
--
-- ESTRUCTURA
--   SECCIÓN 0 — DRY-RUN (read-only, ejecutar PRIMERO)
--   SECCIÓN 1 — SQL PRINCIPAL (función + ENABLE RLS + políticas)
--   SECCIÓN 2 — VERIFICACIÓN POST-APLICACIÓN
--   SECCIÓN 3 — ROLLBACK
-- ═══════════════════════════════════════════════════════════════════════════════


-- ╔═════════════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 0 — DRY-RUN                                                        ║
-- ║ Todos los bloques son read-only. No modifica nada.                         ║
-- ║ Ejecutar en orden y validar cada resultado antes de pasar a SECCIÓN 1.    ║
-- ╚═════════════════════════════════════════════════════════════════════════════╝


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ DRY-RUN A — Estado actual: usuarios, roles y auth_uid                       │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- Resultado esperado (mínimo):
--   Hugo          → admin      → auth_uid <uuid>    estado: autenticado
--   Javier Rivera → directivo  → auth_uid NULL       estado: sin_auth
--   Edgar Arturo  → planeacion → auth_uid NULL       estado: sin_auth
--
-- ALTO: si algún usuario con rol 'admin' aparece con estado 'sin_auth'
--       NO aplicar RLS hasta que su auth_uid esté poblado.

SELECT
  u.id,
  u.nombre,
  u.email,
  r.codigo                                                          AS rol,
  u.auth_uid,
  CASE WHEN u.auth_uid IS NULL THEN 'sin_auth' ELSE 'autenticado' END AS estado
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY r.codigo, u.nombre;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ DRY-RUN B — Simular política SELECT para cada usuario autenticado          │
-- │ Replica el USING de la política antes de habilitarla.                      │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- Resultado esperado por rol:
--   admin      → filas_visibles = total_filas_tabla · ve_su_propia_fila = true
--   planeacion → filas_visibles = total_filas_tabla · ve_su_propia_fila = true
--   enlace     → filas_visibles = 1                · ve_su_propia_fila = true
--   directivo  → filas_visibles = 1                · ve_su_propia_fila = true
--
-- ALTO: si cualquier fila muestra ve_su_propia_fila = false → detener.
--       Significaría que ese usuario no podría leer su perfil → useAuth roto.

WITH sesiones AS (
  SELECT
    u.auth_uid  AS uid_sesion,
    r.codigo    AS rol_sesion,
    u.nombre    AS nombre_usuario
  FROM public.usuarios u
  JOIN public.roles r ON r.id = u.rol_id
  WHERE u.auth_uid IS NOT NULL
)
SELECT
  s.nombre_usuario,
  s.rol_sesion,
  s.uid_sesion,
  -- ¿Cuántas filas serían visibles según la lógica USING de la política?
  (
    SELECT COUNT(*)
    FROM public.usuarios u2
    WHERE CASE s.rol_sesion
            WHEN 'admin'      THEN true
            WHEN 'planeacion' THEN true
            WHEN 'enlace'     THEN u2.auth_uid = s.uid_sesion
            WHEN 'directivo'  THEN u2.auth_uid = s.uid_sesion
            ELSE false
          END
  )                                                                   AS filas_visibles,
  -- ¿Ve su propia fila? (false aquí = useAuth roto para ese usuario)
  EXISTS (
    SELECT 1
    FROM public.usuarios u3
    WHERE u3.auth_uid = s.uid_sesion
      AND CASE s.rol_sesion
            WHEN 'admin'      THEN true
            WHEN 'planeacion' THEN true
            WHEN 'enlace'     THEN u3.auth_uid = s.uid_sesion
            WHEN 'directivo'  THEN u3.auth_uid = s.uid_sesion
            ELSE false
          END
  )                                                                   AS ve_su_propia_fila,
  -- Total de filas de referencia
  (SELECT COUNT(*) FROM public.usuarios)                              AS total_filas_tabla
FROM sesiones s
ORDER BY s.rol_sesion, s.nombre_usuario;


-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ DRY-RUN C — Comportamiento de filas con auth_uid NULL bajo la política     │
-- └─────────────────────────────────────────────────────────────────────────────┘
--
-- Resultado esperado: las filas con auth_uid NULL (Javier, Edgar).
-- Análisis de visibilidad post-RLS:
--   · Un admin autenticado las ve   → CASE 'admin' THEN true → visible ✓
--   · Un enlace autenticado NO las ve → auth_uid IS NULL = <uuid> → false → oculta ✓
--
-- Si esta query devuelve 0 filas: no hay usuarios sin auth_uid → caso sin riesgo.

SELECT
  u.nombre,
  u.email,
  r.codigo                                                          AS rol,
  u.auth_uid,
  'admin/planeacion: SÍ la ven · enlace/directivo: NO la ven'       AS visibilidad_post_rls
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
WHERE u.auth_uid IS NULL;


-- ╔═════════════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 1 — SQL PRINCIPAL                                                  ║
-- ║ Ejecutar SOLO después de revisar y aprobar los tres DRY-RUN.               ║
-- ╚═════════════════════════════════════════════════════════════════════════════╝


-- ── 1.1  Función auxiliar SECURITY DEFINER ────────────────────────────────────
--
-- get_my_rol() devuelve el código de rol del usuario actualmente autenticado
-- leyendo public.usuarios sin activar RLS (corre como postgres owner).
-- Retorna NULL si auth.uid() es NULL o si el usuario no tiene fila en usuarios.
-- STABLE: el resultado no cambia durante la misma transacción (permite caché).

CREATE OR REPLACE FUNCTION public.get_my_rol()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT r.codigo
  FROM   public.usuarios u
  JOIN   public.roles    r ON r.id = u.rol_id
  WHERE  u.auth_uid = auth.uid()
  LIMIT  1;
$$;

-- Las políticas llaman a esta función como rol 'authenticated' o 'anon'.
GRANT EXECUTE ON FUNCTION public.get_my_rol() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_rol() TO anon;


-- ── 1.2  Habilitar RLS ────────────────────────────────────────────────────────
--
-- A partir de aquí, sin ninguna política = sin acceso para authenticated/anon.
-- postgres y service_role siguen teniendo acceso completo (BYPASSRLS implícito).

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;


-- ── 1.3  Política SELECT ──────────────────────────────────────────────────────
--
-- admin/planeacion → ven todas las filas (true incondicional)
-- enlace/directivo → solo ven la fila donde auth_uid coincide con su sesión
-- Cualquier otro caso (NULL, rol desconocido) → sin acceso

CREATE POLICY "usuarios_select_v1"
  ON  public.usuarios
  FOR SELECT
  USING (
    CASE public.get_my_rol()
      WHEN 'admin'      THEN true
      WHEN 'planeacion' THEN true
      WHEN 'enlace'     THEN auth_uid = auth.uid()
      WHEN 'directivo'  THEN auth_uid = auth.uid()
      ELSE false
    END
  );


-- ── 1.4  Política INSERT ──────────────────────────────────────────────────────

CREATE POLICY "usuarios_insert_v1"
  ON  public.usuarios
  FOR INSERT
  WITH CHECK (public.get_my_rol() = 'admin');


-- ── 1.5  Política UPDATE ──────────────────────────────────────────────────────
--
-- USING controla qué filas puede ver/tocar para el UPDATE.
-- WITH CHECK controla qué valores puede escribir después del UPDATE.
-- Ambas apuntan al mismo criterio: solo admin.

CREATE POLICY "usuarios_update_v1"
  ON  public.usuarios
  FOR UPDATE
  USING      (public.get_my_rol() = 'admin')
  WITH CHECK (public.get_my_rol() = 'admin');


-- ── 1.6  Política DELETE ──────────────────────────────────────────────────────

CREATE POLICY "usuarios_delete_v1"
  ON  public.usuarios
  FOR DELETE
  USING (public.get_my_rol() = 'admin');


-- ╔═════════════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 2 — VERIFICACIÓN POST-APLICACIÓN                                   ║
-- ║ Ejecutar inmediatamente después de SECCIÓN 1.                              ║
-- ╚═════════════════════════════════════════════════════════════════════════════╝


-- ── 2.1  RLS habilitado ───────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  schemaname = 'public' AND tablename = 'usuarios';
-- Esperado: rowsecurity = true


-- ── 2.2  Las 4 políticas existen ──────────────────────────────────────────────
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'usuarios'
ORDER  BY policyname;
-- Esperado: 4 filas:
--   usuarios_delete_v1  DELETE
--   usuarios_insert_v1  INSERT
--   usuarios_select_v1  SELECT
--   usuarios_update_v1  UPDATE


-- ── 2.3  Función SECURITY DEFINER existe ──────────────────────────────────────
SELECT proname, prosecdef, provolatile
FROM   pg_proc
WHERE  proname = 'get_my_rol'
  AND  pronamespace = 'public'::regnamespace;
-- Esperado: prosecdef = true  (si es false, SECURITY DEFINER no se aplicó)


-- ── 2.4  Acceso como postgres sigue funcionando ───────────────────────────────
-- postgres bypasea RLS → debe devolver todas las filas, sin importar las políticas.
-- Si devuelve 0 filas hay un problema grave anterior a RLS (tabla vacía o error).
SELECT COUNT(*) AS total_visible_como_postgres FROM public.usuarios;


-- ╔═════════════════════════════════════════════════════════════════════════════╗
-- ║ SECCIÓN 3 — ROLLBACK                                                       ║
-- ║ Ejecutar si algo falla después de SECCIÓN 1.                               ║
-- ║ Complementa ROLLBACK_RLS.sql (que ya tiene DISABLE RLS para todas las      ║
-- ║ tablas). Este rollback también elimina políticas y función.                ║
-- ╚═════════════════════════════════════════════════════════════════════════════╝

-- Orden correcto: primero eliminar políticas, luego desactivar RLS, luego función.
-- Las sentencias son idempotentes (IF EXISTS): seguras aunque aún no se hayan creado.

DROP POLICY IF EXISTS "usuarios_select_v1" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_v1" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_v1" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_delete_v1" ON public.usuarios;

ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.get_my_rol();

-- Verificar rollback:
SELECT rowsecurity
FROM   pg_tables
WHERE  schemaname = 'public' AND tablename = 'usuarios';
-- Esperado: rowsecurity = false

SELECT COUNT(*) AS politicas_restantes
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'usuarios';
-- Esperado: 0
