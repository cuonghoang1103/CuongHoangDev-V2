-- Add multi-image gallery column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS images TEXT;
