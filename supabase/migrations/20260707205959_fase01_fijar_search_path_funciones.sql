-- Fase 0.1: search_path fijo para evitar secuestro de resolución de objetos.
-- Ninguna de las tres referencia tablas sin calificar (auth.uid() y NOW() son calificados/pg_catalog).
ALTER FUNCTION public.calcular_semaforo(numeric)       SET search_path = '';
ALTER FUNCTION public.fn_set_updated_at()              SET search_path = '';
ALTER FUNCTION public.configuracion_set_actualizado()  SET search_path = '';
