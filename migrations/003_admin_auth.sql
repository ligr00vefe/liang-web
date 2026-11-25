CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  bucket bigint PRIMARY KEY,
  attempts integer NOT NULL
);
