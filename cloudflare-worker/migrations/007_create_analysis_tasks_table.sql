-- Up
CREATE TABLE IF NOT EXISTS analysis_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  upload_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'success', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  report_id TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_tasks_task_id ON analysis_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_user_id ON analysis_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_status ON analysis_tasks(status);
CREATE INDEX IF NOT EXISTS idx_analysis_tasks_upload_id ON analysis_tasks(upload_id);

-- Down
DROP INDEX IF EXISTS idx_analysis_tasks_upload_id;
DROP INDEX IF EXISTS idx_analysis_tasks_status;
DROP INDEX IF EXISTS idx_analysis_tasks_user_id;
DROP INDEX IF EXISTS idx_analysis_tasks_task_id;
DROP TABLE IF EXISTS analysis_tasks;
