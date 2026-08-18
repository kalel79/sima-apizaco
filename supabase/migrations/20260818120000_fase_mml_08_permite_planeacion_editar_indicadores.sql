-- fase_mml_08: la politica indicadores_write_admin solo permitia rol='admin',
-- a diferencia de las demas tablas del modulo MML (arbol_nodos, diagnostico_programa,
-- involucrados_programa, acciones_alternativas, indicador_variables,
-- indicador_variables_valores, mir_niveles) que ya permiten 'admin' o 'planeacion'.
-- Planeacion ya tiene acceso a la pestana Expediente MML hoy (App.jsx: puedeVerMML)
-- y la pantalla SeccionMIR.jsx muestra como editables los campos de indicadores
-- (Tipo, Dimension, Sentido, Definicion, Anio linea base, Frecuencia,
-- Interpretacion, "+ Crear nuevo indicador...") sin distinguir que esa tabla
-- tenia una politica mas restrictiva -> esos guardados fallaban para planeacion
-- en produccion. Se iguala el alcance de escritura al mismo patron que el resto
-- del modulo. No se incluye 'enlace' aqui (pendiente de que Hugo decida si se
-- habilita la pestana para ese rol).
alter policy indicadores_write_admin on public.indicadores
  using (get_my_rol() = any (array['admin'::text, 'planeacion'::text]))
  with check (get_my_rol() = any (array['admin'::text, 'planeacion'::text]));
