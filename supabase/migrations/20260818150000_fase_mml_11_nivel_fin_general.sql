-- ============================================================
-- FASE MML 11 — nivel "Fin general" / "Efecto general" en los arboles.
--
-- La metodologia MML estandar es simetrica: arriba del Proposito/Problema
-- central va un Fin/Efecto general unico, y debajo de el los Fines/Efectos
-- directos (varios); del lado de Medios/Causas SIMA ya tenia esta simetria
-- (Medios directos -> sus propios sub-medios), pero del lado de Fines/
-- Efectos solo existia UNA fila plana, sin el nivel general de arriba.
--
-- Se agregan 2 tipos de nodo nuevos: FIN_GENERAL (arbol=OBJETIVOS) y
-- EFECTO_GENERAL (arbol=PROBLEMA). Un nodo de este tipo es hijo directo de
-- la raiz (mismo lugar donde hoy cuelgan los Fines/Efectos); los Fines/
-- Efectos existentes se cuelgan de el en vez de la raiz cuando se quiera
-- adoptar la estructura simetrica. 100% opcional y retrocompatible: un
-- programa sin este nodo se sigue viendo exactamente igual que hoy (ver
-- derivarNivelesMIR en lib/mml.js y drawArbolDiagrama en
-- expedienteMMLSecciones.js, ambos con fallback explicito a la raiz).
--
-- Sin CHECK de jerarquia (mismo criterio ya documentado en fase_mml_05: la
-- validez de la anidacion es responsabilidad del frontend, no de la base de
-- datos).
-- ============================================================

ALTER TABLE public.arbol_nodos DROP CONSTRAINT arbol_nodos_tipo_check;
ALTER TABLE public.arbol_nodos ADD CONSTRAINT arbol_nodos_tipo_check
  CHECK (tipo IN ('CENTRAL','CAUSA','EFECTO','EFECTO_GENERAL','OBJETIVO','MEDIO','FIN','FIN_GENERAL'));
