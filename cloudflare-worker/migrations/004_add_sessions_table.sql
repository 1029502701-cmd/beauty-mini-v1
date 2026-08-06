-- Migration: Add sessions table for server-side session management
-- Run this against D1 to enable session-based authentication

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    guest_id TEXT,
    wechat_open_id TEXT,
    is_guest INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_expires_at ON user_sessions(expires_at);

-- Migration: Ensure users table has open_id index (if not already present)
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);
