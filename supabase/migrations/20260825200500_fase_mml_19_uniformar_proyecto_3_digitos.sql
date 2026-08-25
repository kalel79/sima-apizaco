-- ============================================================
-- FASE MML 19 — Número de Proyecto uniformado a 3 dígitos
-- Los archivos oficiales alternaban 2 y 3 dígitos en el renglón
-- "Proyecto" (003→"3", 037→"37", pero 012→"012", 033→"033"), lo que
-- hacía que la Clave Programática compuesta saliera dispareja entre
-- programas. Se rellena con ceros a la izquierda.
-- Solo toca valores puramente numéricos: si alguien capturó un código
-- con letras o puntos, se respeta tal cual.
-- ============================================================
UPDATE public.ficha_proyecto
SET proyecto_num = lpad(proyecto_num, 3, '0')
WHERE proyecto_num ~ '^[0-9]{1,2}$';
