-- Migration: Add admin-managed tables for beauty mini program

-- users table (basic user info)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  open_id TEXT,
  session_count INTEGER NOT NULL DEFAULT 0,
  total_analyses INTEGER NOT NULL DEFAULT 0,
  total_reports INTEGER NOT NULL DEFAULT 0,
  beauty_pro INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'banned')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- beauty_creators table
CREATE TABLE IF NOT EXISTS beauty_creators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT '',
  description TEXT,
  style_tags TEXT NOT NULL DEFAULT '[]',
  works TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_creators_status ON beauty_creators(status);

-- admin_products table (admin-managed catalog)
CREATE TABLE IF NOT EXISTS admin_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  original_price REAL,
  image_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT '',
  affiliate_link TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'sold_out')),
  featured INTEGER NOT NULL DEFAULT 0,
  recommended_tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_status ON admin_products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON admin_products(category);

-- token_packages table
CREATE TABLE IF NOT EXISTS token_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  tokens INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  discount_rate REAL NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_token_packages_status ON token_packages(status);

-- beauty_orders table
CREATE TABLE IF NOT EXISTS beauty_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_id TEXT,
  product_id TEXT,
  package_id TEXT,
  product_type TEXT NOT NULL CHECK(product_type IN ('report_unlock', 'beauty_pro', 'token_purchase')),
  amount REAL NOT NULL DEFAULT 0,
  token_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled', 'refunded')),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON beauty_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON beauty_orders(status);

-- admin_operation_logs table
CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL DEFAULT '',
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL DEFAULT '',
  target_name TEXT NOT NULL DEFAULT '',
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_oplog_admin_id ON admin_operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_oplog_action_type ON admin_operation_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_oplog_created_at ON admin_operation_logs(created_at DESC);

-- Seed token packages
INSERT OR IGNORE INTO token_packages (id, name, tokens, price, discount_rate, status) VALUES
  ('pkg001', '新手包', 10, 9.9, 1.0, 'active'),
  ('pkg002', '进阶包', 50, 39.9, 0.9, 'active'),
  ('pkg003', '专业包', 200, 139.9, 0.85, 'active'),
  ('pkg004', '年度会员', 1000, 499, 0.75, 'inactive');

-- Down
-- Note: D1 does not support DROP COLUMN; recreate tables if rollback needed.
