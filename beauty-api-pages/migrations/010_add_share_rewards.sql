-- MIGRATION 010: share_rewards table — 分享奖励每日领取记录
-- 用户每天最多通过分享获得1次 style-upgrade 报告机会

CREATE TABLE IF NOT EXISTS share_rewards (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK(reward_type IN ('share_style_upgrade')),
  claimed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expire_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sr_user_id ON share_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_user_date ON share_rewards(user_id, claimed_at);
