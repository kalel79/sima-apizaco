-- FIX: indicador 166 "Porcentaje de convenios firmados respecto a los previstos
-- en el programa anual" (clave E9-DJ-C4-01) mostraba 0% / CRÍTICO en la pestaña
-- Alertas, mientras que el Excel mostraba ADECUADO 100%.
--
-- Causa: el avance de junio 2026 (id 1092) se capturó originalmente con
-- resultado > 0, lo que activó la "regla meta=1" en guardarAvance()
-- (meta_evaluable = 1 cuando meta_programada = 0 pero resultado > 0). Minutos
-- después el registro se corrigió a resultado = 0 (los convenios se
-- devolvieron sin firmar), pero corregirAvance() no recalculaba
-- meta_evaluable, que quedó atorado en 1.
--
-- La vista v_alertas_logros calcula su propio pct = SUM(resultado)/SUM(meta_evaluable)
-- en vez de confiar en avances.pct_cumplimiento ya corregido, así que con
-- meta_evaluable=1 y resultado=0 dio 0% / CRÍTICO. v_indicadores_acum, en
-- cambio, calcula el denominador desde el catálogo (meta_ene..meta_dic) y
-- excluye el indicador por completo (meta acumulada a junio = 0), que es el
-- comportamiento correcto: "aún no evaluable" hasta diciembre.
--
-- Verificado (2026-07-31): es el único registro en toda la tabla avances 2026
-- con este patrón (meta_evaluable > 0, meta_programada = 0, resultado = 0), y
-- el único indicador donde v_alertas_logros y v_indicadores_acum discrepan.
--
-- Aplicado en supabase vía mcp__supabase__execute_sql el 2026-07-31.

update avances
set meta_evaluable = 0, updated_at = now()
where id = 1092 and indicador_id = 166 and meta_programada = 0 and resultado = 0;
