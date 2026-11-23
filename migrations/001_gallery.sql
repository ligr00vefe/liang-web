BEGIN;

CREATE TABLE IF NOT EXISTS gallery_cases (
  id text PRIMARY KEY,
  display_order bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
