-- ============================================================
-- FASE INFORME 07 — Mapeo de los logros a sus bloques narrativos
-- Aplica mapeo_logros_bloques.csv, validado por Planeación el 27 nov 2026:
--   1. Ajusta el catálogo de la fase 06 (39 → 36 bloques).
--   2. Asigna bloque, orden dentro del bloque y referencia cruzada a los
--      161 logros incluidos en el 2.º Informe.
-- No cambia títulos, descripciones, cifras, fechas, montos ni el tema
-- capturado por las áreas. Se puede ejecutar más de una vez.
-- Sin BEGIN/COMMIT: se ejecuta completa en el editor SQL de Supabase.
-- ============================================================

-- ---------- 1. Catálogo ----------
-- Dos bloques cambian de título porque absorben un bloque de un solo logro.
UPDATE public.informe_bloques b SET titulo = 'Calles, vialidades y alumbrado'
  FROM public.ejes e, public.informe_gobierno g
 WHERE e.id = b.eje_id AND g.id = b.informe_id AND g.numero = 2
   AND e.codigo = 'E3' AND b.titulo = 'Calles y vialidades';

UPDATE public.informe_bloques b SET titulo = 'Bienestar animal y sanidad'
  FROM public.ejes e, public.informe_gobierno g
 WHERE e.id = b.eje_id AND g.id = b.informe_id AND g.numero = 2
   AND e.codigo = 'TA' AND b.titulo = 'Bienestar animal';

-- Orden editorial definitivo de cada eje.
UPDATE public.informe_bloques b SET orden = v.orden
  FROM (VALUES
    ('E1', 1, 'Una policía mejor preparada y equipada'),
    ('E1', 2, 'Tecnología y respuesta inmediata'),
    ('E1', 3, 'Prevención con la ciudadanía'),
    ('E1', 4, 'Calles ordenadas y seguras'),
    ('E1', 5, 'Justicia cívica y cultura de paz'),

    ('E2', 1, 'Apoyo a quienes más lo necesitan'),
    ('E2', 2, 'Convivencia y tradiciones familiares'),
    ('E2', 3, 'Solidaridad ante emergencias'),
    ('E2', 4, 'Salud cerca de la gente'),
    ('E2', 5, 'Juventudes'),
    ('E2', 6, 'Deporte'),

    ('E3', 1, 'Agua potable'),
    ('E3', 2, 'Drenaje y saneamiento'),
    ('E3', 3, 'Calles, vialidades y alumbrado'),
    ('E3', 4, 'Parques y espacios públicos'),

    ('E4', 1, 'Apizaco, Barrio Mágico: turismo y cultura'),
    ('E4', 2, 'Comercio, emprendimiento y mercados'),
    ('E4', 3, 'El campo apizaquense'),

    ('E5', 1, 'Planeación y evaluación del desempeño'),
    ('E5', 2, 'Finanzas públicas ordenadas'),
    ('E5', 3, 'Control interno y combate a la corrupción'),
    ('E5', 4, 'Transparencia y acceso a la información'),
    ('E5', 5, 'Gobierno digital'),
    ('E5', 6, 'Parquímetros'),

    ('TA', 1, 'Residuos y limpia'),
    ('TA', 2, 'Municipio verde'),
    ('TA', 3, 'Educación ambiental'),
    ('TA', 4, 'Energía sustentable'),
    ('TA', 5, 'Bienestar animal y sanidad'),

    ('TB', 1, 'Igualdad desde el gobierno'),
    ('TB', 2, 'Una vida libre de violencia'),
    ('TB', 3, 'Autonomía económica de las mujeres'),
    ('TB', 4, 'Niñas, niños y adolescentes'),

    ('MS', 1, 'Gobierno cercano'),
    ('MS', 2, 'Participación y orden en la vía pública'),
    ('MS', 3, 'Comunicación con la ciudadanía')
  ) AS v(eje, orden, titulo), public.ejes e, public.informe_gobierno g
 WHERE e.codigo = v.eje AND e.id = b.eje_id AND g.id = b.informe_id AND g.numero = 2
   AND b.titulo = v.titulo AND b.orden IS DISTINCT FROM v.orden;

-- Bloques que ya no se usan: «Educación» (E2), «Alumbrado público» (E3) y
-- «Rastro municipal» (Eje A). Solo se borran si ningún logro los ocupa.
DELETE FROM public.informe_bloques b
 USING public.ejes e, public.informe_gobierno g
 WHERE e.id = b.eje_id AND g.id = b.informe_id AND g.numero = 2
   AND (e.codigo, b.titulo) IN (('E2', 'Educación'), ('E3', 'Alumbrado público'), ('TA', 'Rastro municipal'))
   AND NOT EXISTS (SELECT 1 FROM public.informe_acciones a WHERE a.bloque_id = b.id);

-- ---------- 2. Asignación de los logros ----------
-- (id del logro, eje, título del bloque, orden en el bloque, eje de referencia)
UPDATE public.informe_acciones a
   SET bloque_id = b.id,
       orden_en_bloque = v.orden,
       eje_referencia_id = er.id
  FROM (VALUES
    -- E1 · 1. Una policía mejor preparada y equipada
    (225, 'E1', 'Una policía mejor preparada y equipada', 1, NULL),
    (230, 'E1', 'Una policía mejor preparada y equipada', 2, NULL),
    (227, 'E1', 'Una policía mejor preparada y equipada', 3, NULL),
    (226, 'E1', 'Una policía mejor preparada y equipada', 4, NULL),
    (228, 'E1', 'Una policía mejor preparada y equipada', 5, NULL),
    -- E1 · 2. Tecnología y respuesta inmediata
    (176, 'E1', 'Tecnología y respuesta inmediata', 1, NULL),
    (147, 'E1', 'Tecnología y respuesta inmediata', 2, NULL),
    -- E1 · 3. Prevención con la ciudadanía
    (184, 'E1', 'Prevención con la ciudadanía', 1, NULL),
    (187, 'E1', 'Prevención con la ciudadanía', 2, NULL),
    (182, 'E1', 'Prevención con la ciudadanía', 3, 'MS'),
    -- E1 · 4. Calles ordenadas y seguras
    (44, 'E1', 'Calles ordenadas y seguras', 1, NULL),
    (46, 'E1', 'Calles ordenadas y seguras', 2, NULL),
    (45, 'E1', 'Calles ordenadas y seguras', 3, NULL),
    -- E1 · 5. Justicia cívica y cultura de paz
    (145, 'E1', 'Justicia cívica y cultura de paz', 1, NULL),
    (141, 'E1', 'Justicia cívica y cultura de paz', 2, NULL),

    -- E2 · 1. Apoyo a quienes más lo necesitan
    (172, 'E2', 'Apoyo a quienes más lo necesitan', 1, NULL),
    (175, 'E2', 'Apoyo a quienes más lo necesitan', 2, NULL),
    (174, 'E2', 'Apoyo a quienes más lo necesitan', 3, NULL),
    (170, 'E2', 'Apoyo a quienes más lo necesitan', 4, NULL),
    (165, 'E2', 'Apoyo a quienes más lo necesitan', 5, NULL),
    (179, 'E2', 'Apoyo a quienes más lo necesitan', 6, NULL),
    -- E2 · 2. Convivencia y tradiciones familiares
    (148, 'E2', 'Convivencia y tradiciones familiares', 1, NULL),
    (154, 'E2', 'Convivencia y tradiciones familiares', 2, NULL),
    (157, 'E2', 'Convivencia y tradiciones familiares', 3, NULL),
    (162, 'E2', 'Convivencia y tradiciones familiares', 4, NULL),
    (216, 'E2', 'Convivencia y tradiciones familiares', 5, 'E4'),
    (238, 'E2', 'Convivencia y tradiciones familiares', 6, NULL),
    (231, 'E2', 'Convivencia y tradiciones familiares', 7, NULL),
    (209, 'E2', 'Convivencia y tradiciones familiares', 8, NULL),
    (214, 'E2', 'Convivencia y tradiciones familiares', 9, NULL),
    (215, 'E2', 'Convivencia y tradiciones familiares', 10, NULL),
    (237, 'E2', 'Convivencia y tradiciones familiares', 11, NULL),
    -- E2 · 3. Solidaridad ante emergencias
    (204, 'E2', 'Solidaridad ante emergencias', 1, NULL),
    (206, 'E2', 'Solidaridad ante emergencias', 2, NULL),
    -- E2 · 4. Salud cerca de la gente
    (111, 'E2', 'Salud cerca de la gente', 1, NULL),
    (116, 'E2', 'Salud cerca de la gente', 2, NULL),
    (109, 'E2', 'Salud cerca de la gente', 3, NULL),
    -- E2 · 5. Juventudes
    (197, 'E2', 'Juventudes', 1, NULL),
    (199, 'E2', 'Juventudes', 2, NULL),
    (194, 'E2', 'Juventudes', 3, NULL),
    (193, 'E2', 'Juventudes', 4, NULL),
    (196, 'E2', 'Juventudes', 5, NULL),
    (198, 'E2', 'Juventudes', 6, NULL),
    (202, 'E2', 'Juventudes', 7, NULL),
    (195, 'E2', 'Juventudes', 8, NULL),
    (201, 'E2', 'Juventudes', 9, NULL),
    (200, 'E2', 'Juventudes', 10, 'TA'),
    -- E2 · 6. Deporte
    (205, 'E2', 'Deporte', 1, NULL),
    (212, 'E2', 'Deporte', 2, NULL),
    (219, 'E2', 'Deporte', 3, NULL),
    (222, 'E2', 'Deporte', 4, NULL),
    (211, 'E2', 'Deporte', 5, NULL),
    (207, 'E2', 'Deporte', 6, NULL),
    (208, 'E2', 'Deporte', 7, NULL),
    (203, 'E2', 'Deporte', 8, NULL),
    (241, 'E2', 'Deporte', 9, NULL),

    -- E3 · 1. Agua potable
    (100, 'E3', 'Agua potable', 1, NULL),
    (180, 'E3', 'Agua potable', 2, NULL),
    (93, 'E3', 'Agua potable', 3, NULL),
    (62, 'E3', 'Agua potable', 4, NULL),
    -- E3 · 2. Drenaje y saneamiento
    (131, 'E3', 'Drenaje y saneamiento', 1, NULL),
    (134, 'E3', 'Drenaje y saneamiento', 2, NULL),
    -- E3 · 3. Calles, vialidades y alumbrado
    (224, 'E3', 'Calles, vialidades y alumbrado', 1, NULL),
    (191, 'E3', 'Calles, vialidades y alumbrado', 2, NULL),
    (190, 'E3', 'Calles, vialidades y alumbrado', 3, NULL),
    (183, 'E3', 'Calles, vialidades y alumbrado', 4, NULL),
    -- E3 · 4. Parques y espacios públicos
    (177, 'E3', 'Parques y espacios públicos', 1, NULL),
    (188, 'E3', 'Parques y espacios públicos', 2, NULL),
    (192, 'E3', 'Parques y espacios públicos', 3, NULL),
    (229, 'E3', 'Parques y espacios públicos', 4, NULL),

    -- E4 · 1. Apizaco, Barrio Mágico: turismo y cultura
    (13, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 1, NULL),
    (83, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 2, NULL),
    (65, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 3, NULL),
    (43, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 4, NULL),
    (78, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 5, NULL),
    (108, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 6, NULL),
    (103, 'E4', 'Apizaco, Barrio Mágico: turismo y cultura', 7, NULL),
    -- E4 · 2. Comercio, emprendimiento y mercados
    (112, 'E4', 'Comercio, emprendimiento y mercados', 1, NULL),
    (115, 'E4', 'Comercio, emprendimiento y mercados', 2, NULL),
    (54, 'E4', 'Comercio, emprendimiento y mercados', 3, NULL),
    (57, 'E4', 'Comercio, emprendimiento y mercados', 4, NULL),
    (61, 'E4', 'Comercio, emprendimiento y mercados', 5, NULL),
    (12, 'E4', 'Comercio, emprendimiento y mercados', 6, NULL),
    (107, 'E4', 'Comercio, emprendimiento y mercados', 7, 'MS'),
    (118, 'E4', 'Comercio, emprendimiento y mercados', 8, NULL),
    -- E4 · 3. El campo apizaquense
    (10, 'E4', 'El campo apizaquense', 1, NULL),
    (126, 'E4', 'El campo apizaquense', 2, NULL),
    (113, 'E4', 'El campo apizaquense', 3, NULL),
    (140, 'E4', 'El campo apizaquense', 4, NULL),
    (125, 'E4', 'El campo apizaquense', 5, NULL),
    (106, 'E4', 'El campo apizaquense', 6, NULL),
    (132, 'E4', 'El campo apizaquense', 7, NULL),

    -- E5 · 1. Planeación y evaluación del desempeño
    (42, 'E5', 'Planeación y evaluación del desempeño', 1, NULL),
    (35, 'E5', 'Planeación y evaluación del desempeño', 2, NULL),
    (17, 'E5', 'Planeación y evaluación del desempeño', 3, NULL),
    (40, 'E5', 'Planeación y evaluación del desempeño', 4, NULL),
    (67, 'E5', 'Planeación y evaluación del desempeño', 5, 'E3'),
    -- E5 · 2. Finanzas públicas ordenadas
    (18, 'E5', 'Finanzas públicas ordenadas', 1, NULL),
    (53, 'E5', 'Finanzas públicas ordenadas', 2, NULL),
    (55, 'E5', 'Finanzas públicas ordenadas', 3, NULL),
    (240, 'E5', 'Finanzas públicas ordenadas', 4, NULL),
    -- E5 · 3. Control interno y combate a la corrupción
    (149, 'E5', 'Control interno y combate a la corrupción', 1, NULL),
    (114, 'E5', 'Control interno y combate a la corrupción', 2, NULL),
    (120, 'E5', 'Control interno y combate a la corrupción', 3, NULL),
    (133, 'E5', 'Control interno y combate a la corrupción', 4, NULL),
    (121, 'E5', 'Control interno y combate a la corrupción', 5, NULL),
    -- E5 · 4. Transparencia y acceso a la información
    (152, 'E5', 'Transparencia y acceso a la información', 1, NULL),
    (158, 'E5', 'Transparencia y acceso a la información', 2, NULL),
    (186, 'E5', 'Transparencia y acceso a la información', 3, NULL),
    -- E5 · 5. Gobierno digital
    (63, 'E5', 'Gobierno digital', 1, NULL),
    (85, 'E5', 'Gobierno digital', 2, NULL),
    (94, 'E5', 'Gobierno digital', 3, NULL),
    (101, 'E5', 'Gobierno digital', 4, NULL),
    (95, 'E5', 'Gobierno digital', 5, NULL),
    (96, 'E5', 'Gobierno digital', 6, NULL),
    -- E5 · 6. Parquímetros
    (91, 'E5', 'Parquímetros', 1, NULL),
    (16, 'E5', 'Parquímetros', 2, NULL),
    (223, 'E5', 'Parquímetros', 3, NULL),

    -- TA · 1. Residuos y limpia
    (24, 'TA', 'Residuos y limpia', 1, NULL),
    (90, 'TA', 'Residuos y limpia', 2, NULL),
    (50, 'TA', 'Residuos y limpia', 3, NULL),
    (217, 'TA', 'Residuos y limpia', 4, NULL),
    (218, 'TA', 'Residuos y limpia', 5, NULL),
    -- TA · 2. Municipio verde
    (156, 'TA', 'Municipio verde', 1, NULL),
    (22, 'TA', 'Municipio verde', 2, 'E2'),
    (151, 'TA', 'Municipio verde', 3, NULL),
    -- TA · 3. Educación ambiental
    (171, 'TA', 'Educación ambiental', 1, NULL),
    (178, 'TA', 'Educación ambiental', 2, NULL),
    (181, 'TA', 'Educación ambiental', 3, NULL),
    (168, 'TA', 'Educación ambiental', 4, NULL),
    -- TA · 4. Energía sustentable
    (161, 'TA', 'Energía sustentable', 1, NULL),
    (189, 'TA', 'Energía sustentable', 2, NULL),
    -- TA · 5. Bienestar animal y sanidad
    (48, 'TA', 'Bienestar animal y sanidad', 1, NULL),
    (51, 'TA', 'Bienestar animal y sanidad', 2, NULL),
    (21, 'TA', 'Bienestar animal y sanidad', 3, NULL),
    (23, 'TA', 'Bienestar animal y sanidad', 4, NULL),

    -- TB · 1. Igualdad desde el gobierno
    (122, 'TB', 'Igualdad desde el gobierno', 1, NULL),
    (146, 'TB', 'Igualdad desde el gobierno', 2, NULL),
    (84, 'TB', 'Igualdad desde el gobierno', 3, NULL),
    (72, 'TB', 'Igualdad desde el gobierno', 4, NULL),
    (77, 'TB', 'Igualdad desde el gobierno', 5, NULL),
    -- TB · 2. Una vida libre de violencia
    (80, 'TB', 'Una vida libre de violencia', 1, NULL),
    (25, 'TB', 'Una vida libre de violencia', 2, NULL),
    (155, 'TB', 'Una vida libre de violencia', 3, NULL),
    -- TB · 3. Autonomía económica de las mujeres
    (123, 'TB', 'Autonomía económica de las mujeres', 1, NULL),
    (159, 'TB', 'Autonomía económica de las mujeres', 2, NULL),
    -- TB · 4. Niñas, niños y adolescentes
    (160, 'TB', 'Niñas, niños y adolescentes', 1, NULL),
    (153, 'TB', 'Niñas, niños y adolescentes', 2, NULL),
    (142, 'TB', 'Niñas, niños y adolescentes', 3, NULL),
    (169, 'TB', 'Niñas, niños y adolescentes', 4, NULL),
    (164, 'TB', 'Niñas, niños y adolescentes', 5, NULL),
    (167, 'TB', 'Niñas, niños y adolescentes', 6, NULL),
    (129, 'TB', 'Niñas, niños y adolescentes', 7, NULL),
    (26, 'TB', 'Niñas, niños y adolescentes', 8, NULL),

    -- MS · 1. Gobierno cercano
    (28, 'MS', 'Gobierno cercano', 1, NULL),
    (32, 'MS', 'Gobierno cercano', 2, NULL),
    (66, 'MS', 'Gobierno cercano', 3, NULL),
    -- MS · 2. Participación y orden en la vía pública
    (29, 'MS', 'Participación y orden en la vía pública', 1, 'E1'),
    (58, 'MS', 'Participación y orden en la vía pública', 2, 'E4'),
    -- MS · 3. Comunicación con la ciudadanía
    (130, 'MS', 'Comunicación con la ciudadanía', 1, NULL),
    (27, 'MS', 'Comunicación con la ciudadanía', 2, NULL)
  ) AS v(id, eje, bloque, orden, ref)
  JOIN public.ejes e ON e.codigo = v.eje
  JOIN public.informe_gobierno g ON g.numero = 2
  JOIN public.informe_bloques b ON b.informe_id = g.id AND b.eje_id = e.id AND b.titulo = v.bloque
  LEFT JOIN public.ejes er ON er.codigo = v.ref
 WHERE a.id = v.id AND a.informe_id = g.id
   AND (a.bloque_id IS DISTINCT FROM b.id OR a.orden_en_bloque IS DISTINCT FROM v.orden
        OR a.eje_referencia_id IS DISTINCT FROM er.id);

-- ---------- 3. Comprobación (solo lectura) ----------
-- Debe devolver: bloques = 36, logros_incluidos = 161, con_bloque = 161,
-- sin_bloque = 0, con_referencia = 8, bloques_de_un_logro = 0, bloques_vacios = 0.
SELECT
  (SELECT count(*) FROM public.informe_bloques b JOIN public.informe_gobierno g ON g.id = b.informe_id WHERE g.numero = 2) AS bloques,
  count(*) AS logros_incluidos,
  count(a.bloque_id) AS con_bloque,
  count(*) - count(a.bloque_id) AS sin_bloque,
  count(a.eje_referencia_id) AS con_referencia,
  (SELECT count(*) FROM (SELECT x.bloque_id FROM public.informe_acciones x
     WHERE x.incluir_en_informe AND x.bloque_id IS NOT NULL GROUP BY x.bloque_id HAVING count(*) = 1) u) AS bloques_de_un_logro,
  (SELECT count(*) FROM public.informe_bloques b JOIN public.informe_gobierno g ON g.id = b.informe_id
     WHERE g.numero = 2 AND NOT EXISTS (SELECT 1 FROM public.informe_acciones x WHERE x.bloque_id = b.id AND x.incluir_en_informe)) AS bloques_vacios
FROM public.informe_acciones a
JOIN public.informe_gobierno g ON g.id = a.informe_id
WHERE g.numero = 2 AND a.incluir_en_informe;
