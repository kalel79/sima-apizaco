-- Fase 0.1: las tablas de respaldo no deben vivir en el esquema public
-- (expuesto vía PostgREST). Se mueven a un esquema interno sin acceso para roles de API.
CREATE SCHEMA IF NOT EXISTS backups;

ALTER TABLE public.backup_indicadores_20260617 SET SCHEMA backups;
ALTER TABLE public.backup_avances_20260617     SET SCHEMA backups;
ALTER TABLE public.backup_evidencias_20260617  SET SCHEMA backups;

REVOKE ALL ON ALL TABLES IN SCHEMA backups FROM anon, authenticated;
REVOKE USAGE ON SCHEMA backups FROM anon, authenticated;
