-- MIGRATION 009: Add decision_answers_json to beauty_reports
-- Stores user decision answers for beauty-pro personalPlan generation

ALTER TABLE beauty_reports
  ADD COLUMN decision_answers_json TEXT NULL;
