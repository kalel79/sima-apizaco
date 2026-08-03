-- ============================================================
-- FASE MML 03 — Seed del catálogo de firmas del expediente MML
-- Defaults globales (programa_id NULL) + firma ELABORO por programa
-- tomada de programas.elaboro_nombre/elaboro_cargo (sin IDs codificados).
-- Verificado post-apply 2026-07-21: 3 firmas globales + 9 ELABORO (una por
-- programa, los 9 tenían elaboro_nombre/cargo completos) = 12 filas.
-- ============================================================

-- Defaults institucionales (aplican a todos los programas salvo override)
INSERT INTO public.firmas_programa (programa_id, rol_firma, nombre, cargo, orden) VALUES
  (NULL, 'AUTORIZA',             'C. Javier Rivera Bonilla',            'Presidente Municipal', 2),
  (NULL, 'VOBO',                 'C. María de la Paz Flores Hernández', 'Síndico Municipal',    3),
  (NULL, 'ELABORO_PRESUPUESTAL', 'C.P. David Hernández Montiel',        'Tesorero Municipal',   4);

-- Firma ELABORO por programa (responsable técnico ya registrado en programas)
INSERT INTO public.firmas_programa (programa_id, rol_firma, nombre, cargo, orden)
SELECT p.id, 'ELABORO', p.elaboro_nombre, p.elaboro_cargo, 1
FROM public.programas p
WHERE p.elaboro_nombre IS NOT NULL AND p.elaboro_cargo IS NOT NULL;
