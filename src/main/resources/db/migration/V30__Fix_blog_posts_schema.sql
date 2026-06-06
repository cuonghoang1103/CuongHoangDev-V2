-- V30__Fix_blog_posts_schema.sql
-- Fixes missing columns on the posts table caused by flyway being disabled in production.
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so this is safe to run multiple times.
-- The source_url and download_count columns were added in V29 but never ran in production.

-- Add source_url column (nullable, no constraint issues)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url VARCHAR(555);

-- Add download_count with a safe default (0), works even if table has existing rows
ALTER TABLE posts ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;

-- Make the default stick at the column level so future inserts don't need explicit values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts'
        AND column_name = 'download_count'
        AND column_default IS NULL
    ) THEN
        ALTER TABLE posts ALTER COLUMN download_count SET DEFAULT 0;
        UPDATE posts SET download_count = 0 WHERE download_count IS NULL;
        ALTER TABLE posts ALTER COLUMN download_count SET NOT NULL;
    END IF;
END $$;

-- Ensure categories table has updated_at column (auditing support)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ensure tags table has updated_at column for consistency
ALTER TABLE tags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add comments table for blog posts
-- V29 may have created it with INT post_id; fix to BIGINT for JPA compatibility
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'comments') THEN
        -- Drop FK constraint if exists (V29 may have created one)
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'comments' AND constraint_name = 'comments_post_id_fkey'
        ) THEN
            ALTER TABLE comments DROP CONSTRAINT comments_post_id_fkey;
        END IF;
        DROP TABLE comments;
    END IF;
    CREATE TABLE comments (
        id           BIGSERIAL PRIMARY KEY,
        post_id      BIGINT REFERENCES posts(id) ON DELETE CASCADE,
        user_name    VARCHAR(100) NOT NULL,
        user_avatar  VARCHAR(255),
        comment_text TEXT NOT NULL,
        created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_comments_post_id ON comments(post_id);
END $$;
