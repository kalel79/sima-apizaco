-- ============================================================
-- FASE MML 17 — Siembra de la Ficha de Proyecto desde los formatos oficiales
-- Origen: "POA 2026/PROGRAMATICOS PRESUPUESTO TESORERIA/*.xlsx", hoja de
-- Ficha de Proyecto de cada uno de los 9 programas (extraída y cotejada
-- 2026-08-25). La clasificación funcional-programática no cambia de un año a
-- otro, así que se siembra igual en 2026 y 2027; los importes por capítulo
-- son cifras de 2026 y SOLO se siembran en ese año.
-- Idempotente: ON CONFLICT DO NOTHING sobre los UNIQUE ya existentes, así que
-- no pisa nada que se haya capturado a mano.
-- ============================================================
WITH ref (clave, ramo_numero, ramo_texto, unidad_resp_numero, unidad_resp_texto,
          finalidad_num, finalidad_texto, funcion_num, funcion_texto,
          subfuncion_num, subfuncion_texto, programa_num, programa_texto,
          proyecto_num, proyecto_texto, clasif_prog_num, clasif_prog_texto) AS (
  VALUES
  ('003', '05', 'Municipios', '3', 'Sindico Municipal',
   '1', 'Gobierno', '2', 'Justicia',
   '2', 'Procuración de Justicia', '3', 'Administración y Procuración de justicia',
   '3', 'Procuración y Defensa de los intereses Municipales', 'B', 'Provisión de los Bienes Públicos'),
  ('005', '05', 'Municipios', '7', 'Seguridad pública y tránsito vial',
   '1', 'Gobierno', '1.7', 'Asuntos de órden público y seguridad interior',
   '1.7.1', 'Policía', '5', 'Seguridad pública y transito víal',
   '5', 'Seguridad pública y transito vial', 'E', 'Prestación de servicios públicos'),
  ('012', '05', 'Municipios', '036', 'Economia',
   '1', 'Gobierno', '3.1.1', 'Asuntos economicos y comerciales en general',
   '2', 'Asuntos Hacendarios', '012', 'Fomento a la produccion y comercializacion',
   '012', 'Fomento a la produccion y comercializacion', 'F', 'Desempeño de las funciones: Promocion y fomento'),
  ('018', '05', 'Municipios', '11', 'Dirección de Cultura y Deporte',
   '2', 'Desarrollo social', '5', 'Educación',
   '6', 'Otros Servicios Educativos y Actividades inherentes.', '13', 'Fortalecimiento de la calidad Educativa, Cultural y Deportiva.',
   '18', 'Fortalecimiento a la calidad Educativa, Cultural y Deportiva', 'F', 'Promosión y Fomento'),
  ('021', '05', 'Municipios', '20', 'Dif Municipal',
   '1', 'Gobierno', '3', 'Coordinacion de la politica de gobierno',
   '1', 'Presidencia Gubernatura', '14', 'Asistencia a Grupos Vulnerables',
   '20', 'Asistencia a Grupos Vulnerables', 'P', 'Planeación, seguimiento y evaluación de políticas públicas'),
  ('024', '05', 'Municipios', '006', 'Obras Públicas',
   '2', 'Desarrollo Social', '2', 'Vivienda y Servicios a la Comunidad',
   '1', 'Urbanización', '16', 'Desarrollo Urbano Sustentable',
   NULL, NULL, NULL, NULL),
  ('032', '05', 'Municipios', '8', NULL,
   '2', 'Desarrollo social', '1', 'Protección Ambiental',
   '1', 'Ordenación de Desechos', '23', 'Protección al Ambiente',
   '32', 'Protección al Ambiente', 'E', 'Prestación de Servicios Publicos'),
  ('033', '05', 'Municipios', '05', 'Secretaria del Ayuntamiento',
   '1', 'Gobierno', '3', 'Coordinacion de la politica de gobierno',
   '1', 'Presidencia Gubernatura', '24', 'Eficiencia en la Gestión de Políticas Gubernamentales',
   '033', 'Eficiencia en la Gestión de Políticas Gubernamentales', 'P', 'Planeación, seguimiento y evaluación de políticas públicas'),
  ('037', '05', 'Municipios', '04', 'Tesorería Municipal',
   '1', 'Gobierno', '1.3.4', 'Asuntos Financieros y Hacendarios',
   '2', 'Asuntos Hacendarios', '28', 'Fortalecimiento a la Fiscalización, Control y Evaluación de la Gestión Municipal.',
   '37', 'Fiscalizar, Controlar y Evaluar la Gestión Municipal.', 'O', 'Apoyo al proceso presupuestario y para mejorar la eficiencia institucional')
), anios (anio) AS (VALUES (2026::smallint), (2027::smallint))
INSERT INTO public.ficha_proyecto (
  programa_id, anio, ramo_numero, ramo_texto, unidad_resp_numero, unidad_resp_texto,
  finalidad_num, finalidad_texto, funcion_num, funcion_texto,
  subfuncion_num, subfuncion_texto, programa_num, programa_texto,
  proyecto_num, proyecto_texto, clasif_prog_num, clasif_prog_texto)
SELECT p.id, a.anio, r.ramo_numero, r.ramo_texto, r.unidad_resp_numero, r.unidad_resp_texto,
       r.finalidad_num, r.finalidad_texto, r.funcion_num, r.funcion_texto,
       r.subfuncion_num, r.subfuncion_texto, r.programa_num, r.programa_texto,
       r.proyecto_num, r.proyecto_texto, r.clasif_prog_num, r.clasif_prog_texto
FROM ref r
JOIN public.programas p ON p.clave = r.clave
CROSS JOIN anios a
ON CONFLICT (programa_id, anio) DO NOTHING;

-- Importes por capítulo del POA 2026 (solo 2026).
WITH cap (clave, capitulo, importe) AS (
  VALUES
  ('003', 1000, 4392561.03),
  ('003', 2000, 281180.58),
  ('003', 3000, 1645000),
  ('003', 4000, 100000),
  ('003', 5000, 95000),
  ('003', 6000, 0),
  ('003', 9000, 0),
  ('005', 1000, 64784911.67),
  ('005', 2000, 6805104.27),
  ('005', 3000, 7730000),
  ('005', 4000, 4481303.87),
  ('005', 5000, 3435000),
  ('012', 1000, 20624133.59),
  ('012', 2000, 806320.69),
  ('012', 3000, 9107595.4),
  ('012', 4000, 0),
  ('012', 5000, 447046),
  ('012', 6000, 0),
  ('012', 9000, 0),
  ('018', 1000, 18400302.96),
  ('018', 2000, 1245300),
  ('018', 3000, 2039100),
  ('018', 4000, 2388000),
  ('018', 5000, 170000),
  ('018', 6000, 0),
  ('021', 1000, 1890738.86),
  ('021', 2000, 68000),
  ('021', 3000, 300000),
  ('021', 4000, 3500),
  ('021', 5000, 15000),
  ('021', 6000, 0),
  ('021', 9000, 0),
  ('024', 1000, 19494028.51),
  ('024', 2000, 2865700),
  ('024', 3000, 19866477.65),
  ('024', 4000, 0),
  ('024', 5000, 172400),
  ('024', 6000, 24755940),
  ('024', 9000, 0),
  ('032', 1000, 25922794.6),
  ('032', 2000, 1544675.64),
  ('032', 3000, 162810),
  ('032', 4000, 0),
  ('032', 5000, 101650),
  ('032', 6000, 0),
  ('032', 9000, 0),
  ('033', 1000, 24109904.86),
  ('033', 2000, 2917675),
  ('033', 3000, 22448971),
  ('033', 4000, 10351530.01),
  ('033', 5000, 405000),
  ('033', 6000, 0),
  ('033', 9000, 0),
  ('037', 1000, 39062463.64),
  ('037', 2000, 1895300),
  ('037', 3000, 10021637.61),
  ('037', 4000, 15063501.57),
  ('037', 5000, 865000),
  ('037', 6000, 0),
  ('037', 9000, 0)
)
INSERT INTO public.presupuesto_programa (programa_id, anio, capitulo, importe)
SELECT p.id, 2026, c.capitulo, c.importe
FROM cap c JOIN public.programas p ON p.clave = c.clave
ON CONFLICT DO NOTHING;
