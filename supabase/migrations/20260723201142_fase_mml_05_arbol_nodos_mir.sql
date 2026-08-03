-- ============================================================
-- FASE MML 05 — arbol_nodos pasa a ser la fuente de la MIR
-- Corrección de arquitectura pedida por Hugo (2026-07-23): la MIR no debe
-- capturarse por separado de la Matriz de Objetivos — se deriva de ella.
-- Mapeo: Objetivo central (arbol='OBJETIVOS', tipo='OBJETIVO', raíz) = Propósito;
-- el FIN de mayor jerarquía (tipo='FIN', hijo directo del Objetivo, el de menor
-- `orden`) = Fin; cada MEDIO de primer nivel (hijo directo del Objetivo) =
-- Componente; cada nodo que cuelga de un Medio = Actividad de ese Componente.
-- indicador_id/supuestos/medios_verificacion solo tienen sentido para nodos de
-- arbol='OBJETIVOS' (no se restringe con CHECK para no complicar el resto del
-- árbol, es responsabilidad del frontend).
-- 100% aditivo: no se modifica ni se borra mir_niveles (queda como dato
-- histórico de 2026, ya no se escribe en ella para años nuevos).
-- ============================================================

ALTER TABLE public.arbol_nodos
  ADD COLUMN indicador_id integer REFERENCES public.indicadores(id),
  ADD COLUMN supuestos text,
  ADD COLUMN medios_verificacion text;
