-- Fase 3.1: portal ciudadano de transparencia (ruta pública /transparencia,
-- sin login). Solo expone snapshots de meses YA CERRADOS (cierres_mensuales,
-- fase 1.3) y explícitamente publicados por admin/planeación — nunca datos
-- en vivo, nunca el mes en curso, nunca observaciones ni datos de usuarios.
--
-- Es la primera función de todo el proyecto con acceso público sin
-- autenticación; escrutinio más alto que el resto del esquema:
--   - SET search_path fijo en toda función SECURITY DEFINER (evita hijacking).
--   - SELECT con columnas explícitas, nunca SELECT *.
--   - LIMIT explícito en la función pública (cota de payload aunque el
--     historial de meses publicados crezca por años).
--   - Ver src/lib/cierres.js (getTransparenciaPublica) para las mitigaciones
--     de abuso en la capa de cliente (GET cacheable + caché corta en
--     sessionStorage) — el rate-limiting real de infraestructura (WAF/CDN
--     delante de *.supabase.co) queda fuera del alcance de este repo y se
--     documenta como pendiente manual.

-- cierres_mensuales es inmutable a propósito (solo SELECT/INSERT, ver fase
-- 1.3) — "publicar" se modela como una tabla aparte en vez de una columna
-- UPDATE-able en cierres_mensuales, para no romper esa inmutabilidad.
-- `destacados` se congela al momento de publicar (mismo espíritu que el
-- resto del snapshot: los reportes/portal no recalculan en vivo).
CREATE TABLE public.transparencia_publicaciones (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cierre_id     BIGINT NOT NULL UNIQUE REFERENCES public.cierres_mensuales(id),
  destacados    JSONB,
  publicado_por UUID REFERENCES public.usuarios(id),
  publicado_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transparencia_publicaciones ENABLE ROW LEVEL SECURITY;

-- El panel admin necesita ver qué meses están publicados para pintar el
-- toggle; anon NUNCA tiene política aquí — su único acceso es la función
-- get_transparencia_publica() de abajo, que ya viene columnas-curada.
CREATE POLICY transparencia_pub_select_autenticados ON public.transparencia_publicaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY transparencia_pub_insert_planeacion ON public.transparencia_publicaciones
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_rol() IN ('admin', 'planeacion'));

CREATE POLICY transparencia_pub_delete_planeacion ON public.transparencia_publicaciones
  FOR DELETE TO authenticated
  USING (public.get_my_rol() IN ('admin', 'planeacion'));

-- Avance por indicador de un mes ARBITRARIO ya cerrado (a diferencia de
-- v_indicadores_acum, que solo refleja get_mes_actual()/get_anio_actual()).
-- Mismo patrón CTE que resumen_global_periodo/resumen_ejes_periodo/
-- resumen_areas_periodo (fase 1.3, 20260709211826) y mismos umbrales
-- inline (>=1.10/0.90/0.70) para no sumar una tercera variante del
-- semáforo a las dos que ya conviven en el proyecto (ver nota metodológica
-- entregada el 2026-07-16). Autenticado solamente — la usa el panel admin
-- al publicar, para elegir los indicadores destacados; nunca se otorga a
-- anon (el público solo ve los 3 que el admin curó, vía `destacados`).
CREATE OR REPLACE FUNCTION public.resumen_indicadores_periodo(p_anio integer, p_mes integer)
RETURNS TABLE(
  indicador_id integer, clave character varying, indicador text,
  area character varying, eje_codigo character varying,
  pct numeric, semaforo character varying
)
LANGUAGE sql STABLE SET search_path = 'public' AS $$
  WITH meta_cat AS (
    SELECT i.id AS indicador_id,
      ( CASE WHEN p_mes >= 1  THEN COALESCE(i.meta_ene,0) ELSE 0 END
      + CASE WHEN p_mes >= 2  THEN COALESCE(i.meta_feb,0) ELSE 0 END
      + CASE WHEN p_mes >= 3  THEN COALESCE(i.meta_mar,0) ELSE 0 END
      + CASE WHEN p_mes >= 4  THEN COALESCE(i.meta_abr,0) ELSE 0 END
      + CASE WHEN p_mes >= 5  THEN COALESCE(i.meta_may,0) ELSE 0 END
      + CASE WHEN p_mes >= 6  THEN COALESCE(i.meta_jun,0) ELSE 0 END
      + CASE WHEN p_mes >= 7  THEN COALESCE(i.meta_jul,0) ELSE 0 END
      + CASE WHEN p_mes >= 8  THEN COALESCE(i.meta_ago,0) ELSE 0 END
      + CASE WHEN p_mes >= 9  THEN COALESCE(i.meta_sep,0) ELSE 0 END
      + CASE WHEN p_mes >= 10 THEN COALESCE(i.meta_oct,0) ELSE 0 END
      + CASE WHEN p_mes >= 11 THEN COALESCE(i.meta_nov,0) ELSE 0 END
      + CASE WHEN p_mes >= 12 THEN COALESCE(i.meta_dic,0) ELSE 0 END
      )::numeric AS meta_cat_acum
    FROM indicadores i
  ),
  acum AS (
    SELECT a.indicador_id, sum(a.resultado) AS resultado_acum
    FROM avances a
    WHERE a.anio = p_anio AND a.mes >= 1 AND a.mes <= p_mes
    GROUP BY a.indicador_id
  ),
  calculo AS (
    SELECT ac.indicador_id, ac.resultado_acum,
      CASE WHEN mc.meta_cat_acum > 0 THEN ac.resultado_acum / mc.meta_cat_acum
           WHEN ac.resultado_acum  > 0 THEN ac.resultado_acum / 1.0
           ELSE NULL END AS pct
    FROM acum ac
    JOIN meta_cat mc ON mc.indicador_id = ac.indicador_id
  )
  SELECT i.id AS indicador_id, i.clave, i.nombre AS indicador,
    ar.nombre AS area, e.codigo AS eje_codigo,
    c.pct,
    CASE WHEN c.pct IS NULL      THEN NULL
         WHEN c.pct >= 1.10      THEN 'ÓPTIMO'
         WHEN c.pct >= 0.90      THEN 'ADECUADO'
         WHEN c.pct >= 0.70      THEN 'RIESGO'
         ELSE 'CRÍTICO' END AS semaforo
  FROM indicadores i
  JOIN areas ar ON ar.id = i.area_id
  JOIN ejes  e  ON e.id  = ar.eje_id
  LEFT JOIN calculo c ON c.indicador_id = i.id
  ORDER BY c.pct DESC NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.resumen_indicadores_periodo(integer,integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resumen_indicadores_periodo(integer,integer) TO authenticated, service_role;

-- Única puerta pública: función SECURITY DEFINER que solo puede devolver las
-- columnas ya curadas de un cierre (nunca cerrado_por/publicado_por, nunca
-- tablas base) y solo filas con publicación explícita. Mismo patrón que
-- get_my_rol()/get_anio_actual() (baseline 2026-05-01), pero a diferencia de
-- esas — endurecidas en fase 0.1 para NO ser ejecutables por anon — esta SÍ
-- se otorga a anon a propósito: es el objetivo de la fase 3.1.
CREATE OR REPLACE FUNCTION public.get_transparencia_publica()
RETURNS TABLE (
  cierre_id      BIGINT,
  anio           SMALLINT,
  mes            SMALLINT,
  cerrado_at     TIMESTAMPTZ,
  publicado_at   TIMESTAMPTZ,
  resumen_global JSONB,
  resumen_ejes   JSONB,
  resumen_areas  JSONB,
  destacados     JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT cm.id AS cierre_id, cm.anio, cm.mes, cm.cerrado_at,
         tp.publicado_at, cm.resumen_global, cm.resumen_ejes, cm.resumen_areas, tp.destacados
  FROM   public.cierres_mensuales cm
  JOIN   public.transparencia_publicaciones tp ON tp.cierre_id = cm.id
  ORDER  BY cm.anio DESC, cm.mes DESC
  LIMIT  36;
$$;

REVOKE EXECUTE ON FUNCTION public.get_transparencia_publica() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_transparencia_publica() TO anon, authenticated, service_role;
