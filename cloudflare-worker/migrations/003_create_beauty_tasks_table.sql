-- Up
CREATE TABLE IF NOT EXISTS beauty_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'analyzing', 'completed', 'failed')),
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_beauty_tasks_user_id ON beauty_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_beauty_tasks_status ON beauty_tasks(status);
CREATE INDEX IF NOT EXISTS idx_beauty_tasks_report_id ON beauty_tasks(report_id);

-- Down
DROP INDEX IF EXISTS idx_beauty_tasks_report_id;
DROP INDEX IF EXISTS idx_beauty_tasks_status;
DROP INDEX IF EXISTS idx_beauty_tasks_user_id;
DROP TABLE IF EXISTS beauty_tasks;
