-- ============================================================
-- FASE MML 02 — Backfill del árbol MIR 2026 desde indicadores.nivel_mir
-- Pre-verificado 2026-07-21: 0 duplicados por programa, 0 actividades sin
-- componente padre, 170/170 nivel_mir parseables.
-- Verificado post-apply: 9 FIN, 9 PROPOSITO, 45 COMPONENTE, 107 ACTIVIDAD
-- (170 total); conteos por programa idénticos a indicadores (003=10, 005=24,
-- 012=26, 018=22, 021=15, 024=15, 032=18, 033=14, 037=26); 170/170 enlazados;
-- 0 nodos mal colgados.
-- ============================================================

-- 1) FIN y PROPOSITO (raíz, sin padre ni número)
INSERT INTO public.mir_niveles (programa_id, anio, tipo, padre_id, numero, indicador_id, orden)
SELECT i.programa_id, 2026,
       CASE WHEN trim(i.nivel_mir) = 'Fin' THEN 'FIN' ELSE 'PROPOSITO' END,
       NULL, NULL, i.id,
       CASE WHEN trim(i.nivel_mir) = 'Fin' THEN 1 ELSE 2 END
FROM public.indicadores i
WHERE trim(i.nivel_mir) IN ('Fin','Proposito');

-- 2) COMPONENTES (padre = PROPOSITO de su programa)
INSERT INTO public.mir_niveles (programa_id, anio, tipo, padre_id, numero, indicador_id, orden)
SELECT i.programa_id, 2026, 'COMPONENTE',
       p.id,
       (regexp_match(trim(i.nivel_mir), '^Componente (\d+)$'))[1]::smallint,
       i.id,
       (regexp_match(trim(i.nivel_mir), '^Componente (\d+)$'))[1]::smallint
FROM public.indicadores i
JOIN public.mir_niveles p
  ON p.programa_id = i.programa_id AND p.anio = 2026 AND p.tipo = 'PROPOSITO'
WHERE trim(i.nivel_mir) ~ '^Componente \d+$';

-- 3) ACTIVIDADES (padre = COMPONENTE con el número correspondiente)
INSERT INTO public.mir_niveles (programa_id, anio, tipo, padre_id, numero, indicador_id, orden)
SELECT i.programa_id, 2026, 'ACTIVIDAD',
       c.id,
       (regexp_match(trim(i.nivel_mir), '^Actividad \d+\.(\d+)$'))[1]::smallint,
       i.id,
       (regexp_match(trim(i.nivel_mir), '^Actividad \d+\.(\d+)$'))[1]::smallint
FROM public.indicadores i
JOIN public.mir_niveles c
  ON c.programa_id = i.programa_id AND c.anio = 2026 AND c.tipo = 'COMPONENTE'
 AND c.numero = (regexp_match(trim(i.nivel_mir), '^Actividad (\d+)\.'))[1]::smallint
WHERE trim(i.nivel_mir) ~ '^Actividad \d+\.\d+$';
