-- ============================================================
-- FASE MML 20 — El renglón anual de `metas` lo calcula la base
-- El Anual (mes = 0) no se captura: es la suma de los 12 meses. Hasta
-- ahora esa suma la hacía el navegador (SeccionMetas.handleGuardar),
-- partiendo de la foto de props del render en curso — al capturar varios
-- meses seguidos sin esperar la recarga, el segundo guardado usaba una
-- foto vieja y pisaba el anual con una suma desfasada, en silencio.
-- Detectado 2026-08-25 en 4 indicadores de 2027 (3 del programa 003 y
-- 1 del 005); 2026 estaba sano en sus 170.
-- Con el trigger la suma ya no depende del navegador ni del orden de
-- tecleo, y cubre también copiarMetasDeAnioAnterior y cargas por SQL.
-- ============================================================

-- Convención de funciones trigger del proyecto (fase 0.1): search_path = ''.
CREATE FUNCTION public.metas_recalcula_anual() RETURNS trigger
  LANGUAGE plpgsql SET search_path = ''
  AS $$
DECLARE
  v_indicador integer;
  v_anio      smallint;
  v_suma      numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_indicador := OLD.indicador_id; v_anio := OLD.anio;
    -- El renglón anual lo escribe este mismo trigger: ignorarlo corta la
    -- recursión (si no, cada recálculo se dispararía a sí mismo).
    IF OLD.mes = 0 THEN RETURN OLD; END IF;
  ELSE
    v_indicador := NEW.indicador_id; v_anio := NEW.anio;
    IF NEW.mes = 0 THEN RETURN NEW; END IF;
  END IF;

  SELECT coalesce(sum(valor), 0) INTO v_suma
  FROM public.metas
  WHERE indicador_id = v_indicador AND anio = v_anio AND mes BETWEEN 1 AND 12;

  INSERT INTO public.metas (indicador_id, anio, mes, valor)
  VALUES (v_indicador, v_anio, 0, v_suma)
  ON CONFLICT (indicador_id, anio, mes) DO UPDATE SET valor = EXCLUDED.valor;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.metas_recalcula_anual() FROM anon;

CREATE TRIGGER trg_metas_recalcula_anual
  AFTER INSERT OR UPDATE OR DELETE ON public.metas
  FOR EACH ROW EXECUTE FUNCTION public.metas_recalcula_anual();

-- Corrección de lo ya desfasado (4 renglones de 2027 al momento de aplicar).
WITH suma AS (
  SELECT indicador_id, anio, coalesce(sum(valor), 0) AS total
  FROM public.metas WHERE mes BETWEEN 1 AND 12
  GROUP BY indicador_id, anio
)
UPDATE public.metas m
SET valor = s.total
FROM suma s
WHERE m.indicador_id = s.indicador_id AND m.anio = s.anio AND m.mes = 0
  AND m.valor IS DISTINCT FROM s.total;
