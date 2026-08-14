CREATE TABLE IF NOT EXISTS toilet_ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  toilet_id TEXT NOT NULL,
  rolls INTEGER NOT NULL CHECK (rolls BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, toilet_id)
);

CREATE TABLE IF NOT EXISTS toilet_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  toilet_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS toilet_ratings_toilet_idx ON toilet_ratings (toilet_id);
CREATE INDEX IF NOT EXISTS toilet_reports_toilet_idx ON toilet_reports (toilet_id, created_at DESC);
