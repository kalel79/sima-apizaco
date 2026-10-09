-- Dirección Jurídica (área 31) — meses sin captura ENE-MAY 2026 completados con 0 / 0.
-- APLICADO en producción el 2026-10-09 por MCP (ids 1865-1877). NO re-ejecutar
-- (el ON CONFLICT lo hace inofensivo, pero no hace falta).
--
-- Indicadores 168 (A2.1), 169 (A3.1) y 170 (A4.1): en esos meses la meta del POA
-- 2026 es 0 y nunca se capturó avance. Se replica la regla de guardarAvance():
-- meta_programada = meta del mes, % y semáforo sobre el acumulado ENE→mes
-- (null si meta y resultado acumulados son 0). Quedan validado = false.
-- No cambia ningún acumulado: siguen 3/3, 1/1 y 6/6.

with nuevos(indicador_id, mes) as (values
  (168,1),(168,2),(168,4),(168,5),
  (169,1),(169,2),(169,3),(169,4),(169,5),
  (170,1),(170,2),(170,4),(170,5)),
calc as (
  select n.indicador_id, n.mes,
    (select coalesce(sum(m.valor),0) from metas m where m.indicador_id=n.indicador_id and m.anio=2026 and m.mes between 1 and n.mes) meta_acum,
    (select coalesce(sum(a.resultado),0) from avances a where a.indicador_id=n.indicador_id and a.anio=2026 and a.mes < n.mes) res_acum,
    (select m.valor from metas m where m.indicador_id=n.indicador_id and m.anio=2026 and m.mes=n.mes) meta_mes
  from nuevos n)
insert into avances (indicador_id, anio, mes, meta_programada, meta_evaluable, resultado, pct_cumplimiento, semaforo, observaciones, validado)
select indicador_id, 2026, mes, meta_mes, meta_mes, 0,
  case when meta_acum > 0 then res_acum/meta_acum end,
  case when meta_acum > 0 then
    case when res_acum/meta_acum >= 1.10 then 'ÓPTIMO' when res_acum/meta_acum >= 0.90 then 'ADECUADO'
         when res_acum/meta_acum >= 0.70 then 'RIESGO' else 'CRÍTICO' end end,
  'Captura administrativa 09/10/2026: mes sin meta en el POA 2026 (0 / 0).', false
from calc where meta_mes = 0
on conflict (indicador_id, anio, mes) do nothing;

-- ROLLBACK:
-- delete from avances where id between 1865 and 1877
--   and observaciones like 'Captura administrativa 09/10/2026%';
