-- ============================================================
-- fix_blog_schema.sql
-- Run this against the production database (Render PostgreSQL).
--
-- Fixes missing columns that prevent blog posts from being created.
-- Root cause: Flyway is disabled in production, so V29 never ran.
--
-- SAFE: Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so it can
-- be run multiple times without error.
-- ============================================================

-- Step 1: Fix posts table — add missing Dev Sharing columns
-- source_url: nullable, safe to add to any table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url VARCHAR(555);

-- download_count: add with DEFAULT first (works even if table has rows),
-- then enforce NOT NULL so Hibernate JPA inserts without explicit value
ALTER TABLE posts ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;
ALTER TABLE posts ALTER COLUMN download_count SET DEFAULT 0;
UPDATE posts SET download_count = 0 WHERE download_count IS NULL;
ALTER TABLE posts ALTER COLUMN download_count SET NOT NULL;

-- Step 2: Create comments table for blog post discussions
-- Matches BlogComment entity: @Table(name = "comments")
CREATE TABLE IF NOT EXISTS comments (
    id           BIGSERIAL PRIMARY KEY,
    post_id      BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    user_name    VARCHAR(100) NOT NULL,
    user_avatar  VARCHAR(255),
    comment_text TEXT NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Step 3: Ensure categories table has updated_at for JPA auditing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Ensure tags table has updated_at for consistency
ALTER TABLE tags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
