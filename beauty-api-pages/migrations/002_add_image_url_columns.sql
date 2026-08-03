-- Up: Add image_url and thumbnail_url columns to beauty_reports table
ALTER TABLE beauty_reports ADD COLUMN image_url TEXT;
ALTER TABLE beauty_reports ADD COLUMN thumbnail_url TEXT;

-- Down: D1 does not support DROP COLUMN directly.
