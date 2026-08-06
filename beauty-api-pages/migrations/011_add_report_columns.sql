-- MIGRATION 011: Add missing columns to beauty_reports
ALTER TABLE beauty_reports ADD COLUMN decision_answers_json TEXT;
