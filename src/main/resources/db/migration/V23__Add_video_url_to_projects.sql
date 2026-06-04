-- Migration: V23__Add_video_url_to_projects.sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
COMMENT ON COLUMN projects.video_url IS 'YouTube demo video URL (https://www.youtube.com/watch?v=xxx or https://youtu.be/xxx)';
