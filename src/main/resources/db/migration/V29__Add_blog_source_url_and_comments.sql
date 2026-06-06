-- V29__Add_blog_source_url_and_comments.sql
-- Add source URL, download counter, and comment system to existing blog posts

-- Add source_url and download_count columns to existing posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url VARCHAR(555);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS download_count INT NOT NULL DEFAULT 0;

-- Create comments table for blog posts
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_avatar VARCHAR(255),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Seed some comments on existing posts
-- (Will be populated once posts exist — the comment table is ready)
