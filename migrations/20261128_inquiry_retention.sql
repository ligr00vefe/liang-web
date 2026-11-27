CREATE TABLE IF NOT EXISTS inquiry_retention (
 submission_id varchar(24) PRIMARY KEY CHECK (submission_id ~ '^[a-f0-9]{24}$'),
 closed_at timestamptz NOT NULL,
 delete_after timestamptz NOT NULL CHECK (delete_after > closed_at)
);
CREATE INDEX IF NOT EXISTS inquiry_retention_due_idx ON inquiry_retention (delete_after);
