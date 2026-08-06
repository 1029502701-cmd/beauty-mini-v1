-- AI Beauty Mini D1 Database Schema (Production-Aligned)
-- Source of truth: cloudflare-worker/migrations/
-- id/user_id/report_id all use TEXT consistently

-- ==================== Core Tables ====================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    open_id TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beauty_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_id TEXT,
    image_url TEXT,
    thumbnail_url TEXT,
    level TEXT NOT NULL,
    status TEXT NOT NULL,
    face_metrics_json TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    analysis_version TEXT DEFAULT 'v1',
    created_at TEXT NOT NULL,
    expire_at TEXT,
    wechat_open_id TEXT,
    session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_beauty_reports_user_id ON beauty_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_beauty_reports_status ON beauty_reports(status);

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

-- ==================== Session Table ====================

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
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);

-- ==================== Beauty Creator Tables ====================

CREATE TABLE IF NOT EXISTS beauty_creators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('xiaohongshu', 'douyin', 'weibo', 'bilibili')),
    description TEXT,
    style_tags TEXT NOT NULL,
    works TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_status ON beauty_creators(status);
CREATE INDEX IF NOT EXISTS idx_creator_platform ON beauty_creators(platform);

CREATE TABLE IF NOT EXISTS beauty_creator_applications (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    face_image_deleted BOOLEAN DEFAULT 0,
    work_images TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES beauty_creators(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_creator_id ON beauty_creator_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_app_status ON beauty_creator_applications(status);

-- ==================== Commerce Order Tables ====================

CREATE TABLE IF NOT EXISTS beauty_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    report_id TEXT,
    product_type TEXT NOT NULL CHECK(product_type IN ('report_unlock', 'beauty_pro')),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'paid', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (report_id) REFERENCES beauty_reports(id)
);

CREATE INDEX IF NOT EXISTS idx_order_user_id ON beauty_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_product_type ON beauty_orders(product_type);
CREATE INDEX IF NOT EXISTS idx_order_status ON beauty_orders(status);
