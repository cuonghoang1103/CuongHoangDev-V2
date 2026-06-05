-- Add missing columns to lesson_details and assignment_submissions tables
-- These columns were added to the JPA entity classes but the initial migration V26
-- did not include them. Apply this AFTER V26 on production.

ALTER TABLE lesson_details ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS grade DOUBLE PRECISION;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS feedback TEXT;
