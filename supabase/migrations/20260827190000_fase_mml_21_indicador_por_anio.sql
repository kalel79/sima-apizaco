-- ============================================================
-- FASE MML 21 — v_indicador_anio: a qué año(s) pertenece cada indicador
-- ------------------------------------------------------------
-- Problema (detectado por Hugo 2026-08-27): la pantalla de Captura mostraba
-- 180 indicadores para 2026, siendo 170 los del ejercicio. `indicadores` no
-- tiene columna de año — es un catálogo acumulado — y getIndicadoresLista()
-- traía la tabla completa. Los 10 de más son los creados al capturar la MIR
-- 2027. Además esos 10 entraban en los reportes del 2026 con avances y metas
-- vacías, diluyendo los porcentajes de cobertura.
--
-- El año de un indicador se deriva de los nodos que lo referencian:
--   · mir_niveles.anio  → fuente del 2026 (backfill de fase_mml_02: 170/170)
--   · arbol_nodos.anio  → fuente vigente del 2027 en adelante (fase_mml_05)
--
-- Es una relación N-a-M a propósito: un indicador vigente pertenece a VARIOS
-- años. copiarArbolDeAnioAnterior() (src/lib/mml.js:341) arrastra indicador_id
-- al copiar el árbol 2026 → 2027, así que el nodo es nuevo pero apunta a la
-- misma fila de `indicadores`. El catálogo NO se duplica por año.
--
-- ── Por qué esta vista NO es security_invoker ──────────────────────────────
-- fase01_vistas_security_invoker fijó la convención de vistas con derechos del
-- invocador. Aquí se hace la excepción a propósito: fase_mml_06 restringió el
-- SELECT de mir_niveles/arbol_nodos a los roles que ven el módulo MML
-- (admin/planeacion/directivo/enlace), dejando fuera a `coordinador`. Con
-- security_invoker, un coordinador leería 0 filas de esta vista y se quedaría
-- con la pantalla de Indicadores vacía. La vista expone únicamente el par
-- (indicador_id, anio) — dos enteros, sin texto narrativo ni dato personal —
-- así que resolverla con los derechos del propietario no filtra nada
-- sensible. El acceso se acota abajo con REVOKE anon + GRANT authenticated.
-- ============================================================

CREATE OR REPLACE VIEW public.v_indicador_anio AS
  -- 2026 (histórico: mir_niveles dejó de escribirse para años nuevos)
  SELECT mn.indicador_id, mn.anio
  FROM   public.mir_niveles mn
  WHERE  mn.indicador_id IS NOT NULL
    AND  mn.activo
UNION  -- UNION (no ALL) deduplica: un indicador puede estar en ambas fuentes
  -- 2027 en adelante (arbol_nodos no tiene columna `activo`)
  SELECT an.indicador_id, an.anio
  FROM   public.arbol_nodos an
  WHERE  an.indicador_id IS NOT NULL;

COMMENT ON VIEW public.v_indicador_anio IS
  'Relación N-a-M indicador ↔ año, derivada de mir_niveles (2026) y arbol_nodos '
  '(2027+). `indicadores` es un catálogo acumulado sin columna de año; esta vista '
  'es la fuente única para filtrar listados y reportes por ejercicio. Un indicador '
  'vigente en varios años aparece varias veces, una por año, sin duplicarse en el '
  'catálogo.';

REVOKE ALL ON public.v_indicador_anio FROM PUBLIC;
REVOKE ALL ON public.v_indicador_anio FROM anon;
GRANT  SELECT ON public.v_indicador_anio TO authenticated;

-- ── Verificación posterior al apply ────────────────────────────────────────
-- Esperado: 2026 ≈ 170; 2027 = los copiados del 2026 + los nuevos (NO solo los
-- nuevos); `en_ningun_anio` = 0. El detalle completo, en
-- scripts/sql/diagnostico_indicadores_por_anio.sql
--
-- SELECT anio, count(DISTINCT indicador_id) FROM public.v_indicador_anio
-- GROUP BY anio ORDER BY anio;
--
-- SELECT count(*) AS en_ningun_anio FROM public.indicadores i
-- WHERE NOT EXISTS (SELECT 1 FROM public.v_indicador_anio v WHERE v.indicador_id = i.id);
