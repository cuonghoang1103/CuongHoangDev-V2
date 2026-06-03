-- Add supabase_path column to music_tracks table.
-- The MusicTrack entity has a supabasePath field but the original V18 migration
-- did not include this column, causing "null value in column violates not-null constraint"
-- when saving tracks without an audioUrl, or other persistence errors.
ALTER TABLE music_tracks ADD COLUMN IF NOT EXISTS supabase_path VARCHAR(500);
