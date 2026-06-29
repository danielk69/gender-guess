-- Gender Guesser — D1 (SQLite) schema
-- Applied via: wrangler d1 migrations apply gender-guess --local

CREATE TABLE IF NOT EXISTS images (
  id              TEXT PRIMARY KEY,
  storage_path    TEXT NOT NULL UNIQUE,
  public_url      TEXT NOT NULL,
  is_transgender  INTEGER NOT NULL CHECK (is_transgender IN (0, 1)),
  source          TEXT NOT NULL DEFAULT 'seed'
    CHECK (source IN ('seed', 'llm', 'manual')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS images_is_transgender_idx
  ON images (is_transgender);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id              TEXT PRIMARY KEY,
  player_name     TEXT NOT NULL
    CHECK (length(player_name) BETWEEN 2 AND 24),
  score           INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  correct_count   INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  wrong_count     INTEGER NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  max_streak      INTEGER NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
  rounds_played   INTEGER NOT NULL DEFAULT 0 CHECK (rounds_played > 0),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (score <= rounds_played * 100 + max_streak * 25)
);

CREATE INDEX IF NOT EXISTS leaderboard_score_idx
  ON leaderboard_entries (score DESC);
