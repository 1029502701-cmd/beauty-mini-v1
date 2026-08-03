-- MIGRATION 005: Add session tracking columns to beauty_reports
ALTER TABLE beauty_reports ADD COLUMN wechat_open_id TEXT;
ALTER TABLE beauty_reports ADD COLUMN session_id TEXT;
