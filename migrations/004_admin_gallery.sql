BEGIN;
CREATE TABLE IF NOT EXISTS admin_owner (
  id integer PRIMARY KEY CHECK (id = 1),
  email text NOT NULL,
  password_hash text,
  invite_hash text,
  invite_expires_at timestamptz
);
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid PRIMARY KEY,
  case_id text NOT NULL REFERENCES gallery_cases(id) ON DELETE CASCADE,
  payload text NOT NULL
);
COMMIT;
