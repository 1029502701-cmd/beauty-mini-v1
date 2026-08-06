-- Migration: Update beauty_reports to reference users by open_id compatible IDs
-- This ensures the D1 users table is properly set up for session-based auth

-- Add wechat_open_id column to beauty_reports for audit trail
ALTER TABLE beauty_reports ADD COLUMN wechat_open_id TEXT;

-- Add created_by_session column for traceability
ALTER TABLE beauty_reports ADD COLUMN session_id TEXT;
