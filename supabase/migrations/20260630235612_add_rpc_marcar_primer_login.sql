CREATE OR REPLACE FUNCTION marcar_primer_login_completado()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE usuarios SET primer_login = false WHERE auth_uid = auth.uid();
END;
$$;
