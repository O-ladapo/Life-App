ALTER TABLE users DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_token_expires_at;
