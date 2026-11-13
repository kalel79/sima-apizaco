-- ============================================================
-- FASE INFORME 04 — Diagramas vectoriales de las acciones del Informe
-- `diagrama` guarda los datos de un diagrama ({ tipo, ...datos }) que el PDF
-- del Informe dibuja como gráfico vectorial (svg2pdf) junto a la acción, en
-- lugar de subirlo como imagen. Las plantillas viven en
-- src/utils/informePDF/diagramas.js; un tipo desconocido se ignora.
-- 100% aditiva: columna nueva nullable y la vista la expone al final.
-- Aplicada en producción el 13 nov 2026.
-- ============================================================

ALTER TABLE public.informe_acciones ADD COLUMN IF NOT EXISTS diagrama jsonb;

COMMENT ON COLUMN public.informe_acciones.diagrama IS
  'Diagrama vectorial de la acción para el PDF del Informe: { tipo, ...datos }. Ver src/utils/informePDF/diagramas.js';

CREATE OR REPLACE VIEW public.v_informe_acciones WITH (security_invoker = true) AS
 SELECT a.id,
    a.informe_id,
    a.area_id,
    ar.nombre AS area,
    e.codigo AS eje_codigo,
    e.nombre AS eje,
    e.orden AS eje_orden,
    a.coordinacion,
    a.indicador_id,
    i.clave AS indicador_clave,
    i.nombre AS indicador,
    i.nivel_mir,
    i.programa_pmd_id,
    p.numero AS programa_pmd_numero,
    p.nombre AS programa_pmd,
    a.justificacion,
    a.accion,
    a.fecha,
    a.monto,
    a.beneficiarios,
    a.descripcion,
    a.tiene_foto,
    a.tiene_video,
    a.revisada,
    a.incluir_en_informe,
    a.created_at,
    a.updated_at,
    a.diagrama
   FROM informe_acciones a
     JOIN areas ar ON ar.id = a.area_id
     LEFT JOIN ejes e ON e.id = ar.eje_id
     LEFT JOIN indicadores i ON i.id = a.indicador_id
     LEFT JOIN programas_pmd p ON p.id = i.programa_pmd_id;
