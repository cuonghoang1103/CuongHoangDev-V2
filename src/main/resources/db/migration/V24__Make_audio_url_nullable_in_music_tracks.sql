-- Migration: V24__Make_audio_url_nullable_in_music_tracks.sql
-- The audio_url column must be nullable because the application now stores
-- audio in Supabase and uses supabase_path for deletion. Previously this
-- column was NOT NULL, causing "null value in column violates not-null
-- constraint" when records were created.
ALTER TABLE music_tracks ALTER COLUMN audio_url DROP NOT NULL;
