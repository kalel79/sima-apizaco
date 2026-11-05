-- fase_informe_03: el monto ejercido de cada acción del Informe es obligatorio.
-- Debe estar proporcionado o conciliado con la Tesorería Municipal; las acciones
-- sin gasto se capturan con 0. Al aplicar esta migración la tabla no tenía filas
-- (5 nov 2026), así que el NOT NULL no requiere rellenar datos.

ALTER TABLE public.informe_acciones
  ALTER COLUMN monto SET NOT NULL;

ALTER TABLE public.informe_acciones
  DROP CONSTRAINT IF EXISTS informe_acciones_monto_chk;

ALTER TABLE public.informe_acciones
  ADD CONSTRAINT informe_acciones_monto_chk CHECK (monto >= 0);

COMMENT ON COLUMN public.informe_acciones.monto IS
  'Monto ejercido (MXN), obligatorio; proporcionado o conciliado con la Tesorería Municipal. 0 si la acción no implicó gasto.';
