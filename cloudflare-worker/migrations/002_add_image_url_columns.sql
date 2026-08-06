-- Up: Add image_url and thumbnail_url columns to beauty_reports table
ALTER TABLE beauty_reports ADD COLUMN image_url TEXT;
ALTER TABLE beauty_reports ADD COLUMN thumbnail_url TEXT;

-- Down: D1 doesn't support DROP COLUMN directly. For rollback, you would need to recreate the table without these columns and migrate data.
-- Note: In development environments, simply dropping and recreating the table is acceptable.
