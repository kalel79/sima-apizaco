-- ============================================================
-- FASE MML 15 — Dos renglones nuevos de las hojas de Descripción
-- "Eje Rector o Programa del PMD" y "Programa Según Catálogo OFS"
-- encabezan la Descripción de Programa y la de Proyectos. Son
-- editables; si se dejan vacías, resolverFicha() imprime el valor
-- derivado (el Eje del programa, y clave + Unidad Responsable).
-- ============================================================
ALTER TABLE public.ficha_proyecto
  ADD COLUMN eje_pmd      text,
  ADD COLUMN programa_ofs text;

COMMENT ON COLUMN public.ficha_proyecto.eje_pmd IS
  'Eje Rector o Programa del PMD. Vacío = se imprime el eje del programa.';
COMMENT ON COLUMN public.ficha_proyecto.programa_ofs IS
  'Programa según catálogo OFS: número y áreas que lo integran (ej. "003, Sindicatura, Jurídico"). Vacío = clave + unidad responsable del programa.';
