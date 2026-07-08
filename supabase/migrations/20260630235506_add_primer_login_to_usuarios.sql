ALTER TABLE usuarios ADD COLUMN primer_login BOOLEAN NOT NULL DEFAULT false;

-- Los 19 enlaces creados el 30-jun-2026 arrancan con primer_login = true
UPDATE usuarios SET primer_login = true
WHERE created_at >= '2026-06-30 20:00:00+00' AND rol_id = 3;
