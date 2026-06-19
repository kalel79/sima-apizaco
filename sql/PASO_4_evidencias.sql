-- ═══════════════════════════════════════════════════════════
-- PASO 4 — EVIDENCIAS: columnas + RLS de tabla + RLS de Storage
-- Revisar antes de ejecutar en Supabase. NO se ha aplicado nada aún.
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. ALTER TABLE: columnas nuevas en evidencias
-- ─────────────────────────────────────────────
-- indicador_id y area_id se denormalizan (copiados desde avances/indicadores
-- al insertar) para que las políticas de RLS y de Storage no requieran JOIN.
ALTER TABLE public.evidencias
  ADD COLUMN IF NOT EXISTS indicador_id integer REFERENCES public.indicadores(id),
  ADD COLUMN IF NOT EXISTS area_id      integer REFERENCES public.areas(id),
  ADD COLUMN IF NOT EXISTS tipo_mime    varchar(100),
  ADD COLUMN IF NOT EXISTS tamano_bytes bigint;

ALTER TABLE public.evidencias
  ADD CONSTRAINT evidencias_avance_id_fkey
  FOREIGN KEY (avance_id) REFERENCES public.avances(id) ON DELETE CASCADE;

-- Índices para listar evidencias por avance y filtrar por área
CREATE INDEX IF NOT EXISTS idx_evidencias_avance_id ON public.evidencias(avance_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_area_id    ON public.evidencias(area_id);

-- ─────────────────────────────────────────────
-- 2. RLS en la tabla evidencias
-- ─────────────────────────────────────────────
-- RLS ya está habilitado (relrowsecurity = true). Quitamos la política
-- de lectura pública existente (demasiado abierta para datos por área)
-- y la sustituimos por las reglas correctas.
-- NOTA: evidencias.subido_por tiene FK a usuarios(id) (mismo patrón que
-- avances.capturado_por) -- NO es auth.uid() directamente. auth.uid() es
-- usuarios.auth_uid. Por eso las políticas resuelven el id interno con un
-- subselect: (SELECT u.id FROM usuarios u WHERE u.auth_uid = auth.uid()).
DROP POLICY IF EXISTS lectura_publica       ON public.evidencias;
DROP POLICY IF EXISTS evidencias_select_rol ON public.evidencias;
DROP POLICY IF EXISTS evidencias_insert_rol ON public.evidencias;
DROP POLICY IF EXISTS evidencias_delete_rol ON public.evidencias;

-- SELECT: admin/planeación ven todas; enlace solo las de su propia área
CREATE POLICY evidencias_select_rol ON public.evidencias
  FOR SELECT
  USING (
    get_my_rol() IN ('admin','planeacion')
    OR (
      get_my_rol() = 'enlace'
      AND area_id = (SELECT u.area_id FROM public.usuarios u WHERE u.auth_uid = auth.uid())
    )
  );

-- INSERT: enlace solo en evidencias de su propia área; admin/planeación en cualquiera.
-- Además, subido_por debe ser siempre el usuario autenticado (evita suplantación).
CREATE POLICY evidencias_insert_rol ON public.evidencias
  FOR INSERT
  WITH CHECK (
    subido_por = (SELECT u.id FROM public.usuarios u WHERE u.auth_uid = auth.uid())
    AND (
      get_my_rol() IN ('admin','planeacion')
      OR (
        get_my_rol() = 'enlace'
        AND area_id = (SELECT u.area_id FROM public.usuarios u WHERE u.auth_uid = auth.uid())
      )
    )
  );

-- DELETE: admin y planeación borran cualquier evidencia (cualquier área);
-- enlace solo borra lo que él mismo subió, de su propia área.
CREATE POLICY evidencias_delete_rol ON public.evidencias
  FOR DELETE
  USING (
    get_my_rol() IN ('admin','planeacion')
    OR (
      get_my_rol() = 'enlace'
      AND subido_por = (SELECT u.id FROM public.usuarios u WHERE u.auth_uid = auth.uid())
      AND area_id = (SELECT u.area_id FROM public.usuarios u WHERE u.auth_uid = auth.uid())
    )
  );

-- (Sin política de UPDATE: una evidencia se borra y se vuelve a subir, no se edita in-place)

-- ─────────────────────────────────────────────
-- 3. Bucket de Storage "evidencias"
-- ─────────────────────────────────────────────
-- El bucket en sí se crea MANUALMENTE desde el dashboard (ver instrucciones
-- aparte). Estas políticas asumen que el bucket se llama 'evidencias' y que
-- el path de cada objeto tiene la forma:
--   {area_id}/{indicador_id}/{anio}-{mes}/{archivo}
-- storage.foldername(name) devuelve un array con cada segmento de carpeta,
-- así que (storage.foldername(name))[1] es el area_id.

-- SELECT (para generar signed URLs / descargar): admin/planeación ven todo;
-- enlace solo objetos cuyo primer segmento de carpeta = su area_id
CREATE POLICY evidencias_storage_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'evidencias'
    AND (
      get_my_rol() IN ('admin','planeacion')
      OR (
        get_my_rol() = 'enlace'
        AND (storage.foldername(name))[1] = (
          SELECT u.area_id::text FROM public.usuarios u WHERE u.auth_uid = auth.uid()
        )
      )
    )
  );

-- INSERT: enlace solo puede subir dentro de su propia carpeta de área;
-- admin/planeación pueden subir en cualquier carpeta
CREATE POLICY evidencias_storage_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'evidencias'
    AND (
      get_my_rol() IN ('admin','planeacion')
      OR (
        get_my_rol() = 'enlace'
        AND (storage.foldername(name))[1] = (
          SELECT u.area_id::text FROM public.usuarios u WHERE u.auth_uid = auth.uid()
        )
      )
    )
  );

-- DELETE: mismo criterio que en la tabla evidencias. Admin y planeación
-- borran objetos de cualquier área; enlace solo objetos dentro de su
-- propia carpeta de área (la verificación de "solo lo que él subió" la
-- hace la tabla evidencias antes de borrar el objeto correspondiente).
CREATE POLICY evidencias_storage_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'evidencias'
    AND (
      get_my_rol() IN ('admin','planeacion')
      OR (
        get_my_rol() = 'enlace'
        AND (storage.foldername(name))[1] = (
          SELECT u.area_id::text FROM public.usuarios u WHERE u.auth_uid = auth.uid()
        )
      )
    )
  );
