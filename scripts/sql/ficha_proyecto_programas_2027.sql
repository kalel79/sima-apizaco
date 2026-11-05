-- Ficha de proyecto 2027: programa y proyecto presupuestario conforme al
-- catálogo oficial (imagen recibida el 5 nov 2026). Corrige el programa del
-- 012 (09 Desarrollo Económico), el proyecto del 021 (021 Desarrollo Integral
-- de la Familia) y el del 033 (Apoyo a las Políticas Gubernamentales); el
-- resto unifica redacción, acentos y el programa a dos dígitos.
-- La ficha 2026 no se toca.

UPDATE public.ficha_proyecto f SET
  programa_num = v.pn, programa_texto = v.pt, proyecto_num = v.yn, proyecto_texto = v.yt
FROM (VALUES
  (18, '03', 'Administración y Procuración de Justicia', '003', 'Procuración y Defensa de los Intereses Municipales'),
  (10, '05', 'Seguridad Pública y Tránsito Vial', '005', 'Seguridad Pública y Tránsito Vial'),
  (14, '09', 'Desarrollo Económico', '012', 'Fomento a la Producción y Comercialización'),
  (16, '13', 'Fortalecimiento a la Calidad Educativa, Cultural y Deportiva', '018', 'Fortalecimiento a la Calidad Educativa, Cultural y Deportiva'),
  (4,  '14', 'Asistencia a Grupos Vulnerables', '021', 'Desarrollo Integral de la Familia'),
  (6,  '16', 'Desarrollo Urbano Sustentable', '024', 'Infraestructura y Equipamiento para el Desarrollo Urbano'),
  (20, '23', 'Protección al Ambiente', '032', 'Protección al Ambiente'),
  (8,  '24', 'Eficiencia en la Gestión de las Políticas Gubernamentales', '033', 'Apoyo a las Políticas Gubernamentales'),
  (12, '28', 'Fortalecimiento a la Fiscalización, Control y Evaluación de la Gestión Municipal', '037', 'Fiscalizar, Controlar y Evaluar la Gestión Municipal')
) AS v(id, pn, pt, yn, yt)
WHERE f.id = v.id AND f.anio = 2027;

-- Catálogo de programas (afecta 2026 y 2027): nombre oficial del 021.
UPDATE public.programas SET nombre = 'Desarrollo Integral de la Familia' WHERE id = 5 AND clave = '021';

-- Para revertir el catálogo:
-- UPDATE public.programas SET nombre = 'Desarrollo Integral para la Familia' WHERE id = 5 AND clave = '021';

-- Para revertir la ficha (valores previos al 5 nov 2026):
-- UPDATE public.ficha_proyecto f SET
--   programa_num = v.pn, programa_texto = v.pt, proyecto_num = v.yn, proyecto_texto = v.yt
-- FROM (VALUES
--   (18, '3',   'Administración y Procuración de justicia', '003', 'Procuración y Defensa de los intereses Municipales'),
--   (10, '5',   'Seguridad pública y transito víal', '005', 'Seguridad pública y transito vial'),
--   (14, '012', 'Fomento a la produccion y comercializacion', '012', 'Fomento a la produccion y comercializacion'),
--   (16, '13',  'Fortalecimiento de la calidad Educativa, Cultural y Deportiva.', '018', 'Fortalecimiento a la calidad Educativa, Cultural y Deportiva'),
--   (4,  '14',  'Asistencia a Grupos Vulnerables', '020', 'Asistencia a Grupos Vulnerables'),
--   (6,  '16',  'Desarrollo Urbano Sustentable', '024', 'Infraestructura y Equipamiento para el Desarrollo Urbano'),
--   (20, '23',  'Protección al Ambiente', '032', 'Protección al Ambiente'),
--   (8,  '24',  'Eficiencia en la Gestión de Políticas Gubernamentales', '033', 'Eficiencia en la Gestión de Políticas Gubernamentales'),
--   (12, '28',  'Fortalecimiento a la Fiscalización, Control y Evaluación de la Gestión Municipal.', '037', 'Fiscalizar, Controlar y Evaluar la Gestión Municipal.')
-- ) AS v(id, pn, pt, yn, yt)
-- WHERE f.id = v.id AND f.anio = 2027;
