-- ============================================================
-- FASE MML 24 — el rol `coordinador` puede LEER los dos árboles.
--
-- Decisión de Hugo (2026-08-31). fase_mml_06 dejó a `coordinador` fuera del
-- SELECT de arbol_nodos: son 14 usuarios activos que abrían el Expediente MML
-- y no veían nada. Se les abre la lectura del Árbol del Problema y del Árbol
-- de Objetivos — que es de donde además se deriva la pestaña Riesgos/MIR.
--
-- SOLO LECTURA: no se les da ninguna política de escritura, así que siguen sin
-- poder insertar, editar ni borrar. Del lado del cliente todos los flags de
-- edición del Expediente MML (puedeEditarArbol, puedeEditarContenido,
-- puedeEditarFicha, puedeGenerarDocumentos) ya excluyen a coordinador por
-- construcción, así que la pantalla les sale de consulta sin tocar nada más.
--
-- Acompañan a esta migración dos cambios de cliente:
--   · App.jsx — `puedeVerMML` incluye a isCoordinador; antes ni siquiera les
--     aparecía el menú "Expediente MML", así que abrir la RLS sola no habría
--     cambiado nada visible.
--   · ExpedienteMML.jsx — la pestaña inicial para coordinador es
--     'arbolObjetivos' en vez de 'encabezado', que les saldría vacía.
--
-- OJO — lo que NO abre esta migración: coordinador sigue fuera del SELECT de
-- diagnostico_programa, involucrados_programa, acciones_alternativas,
-- ficha_proyecto, ficha_fuente_financiamiento, presupuesto_programa,
-- firmas_programa y mir_niveles. Esas pestañas del expediente les van a salir
-- VACÍAS (RLS filtra en silencio, no lanza error). Es deliberado: abrir el
-- presupuesto y la ficha es una decisión aparte.
-- ============================================================

DROP POLICY IF EXISTS arbol_select ON public.arbol_nodos;

CREATE POLICY arbol_select ON public.arbol_nodos
  FOR SELECT
  USING (get_my_rol() = ANY (ARRAY['admin', 'planeacion', 'directivo', 'enlace', 'coordinador']));
