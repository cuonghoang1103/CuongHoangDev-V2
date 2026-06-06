-- V31__Seed_blog_categories.sql
-- Seed blog categories and update posts with category IDs
-- Safe to run multiple times (uses INSERT ... ON CONFLICT DO NOTHING)

-- Insert categories (will skip if already exists due to unique constraint)
INSERT INTO categories (name, slug, description) VALUES
    ('Technology', 'technology', 'Bài viết về công nghệ, lập trình, framework mới'),
    ('Education', 'education', 'Học tập, phát triển bản thân, kỹ năng mềm')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs
DO $$
DECLARE
    tech_cat_id BIGINT;
    edu_cat_id BIGINT;
BEGIN
    SELECT id INTO tech_cat_id FROM categories WHERE slug = 'technology';
    SELECT id INTO edu_cat_id FROM categories WHERE slug = 'education';

    -- Update posts to assign categories (Lab211 is tech, SWP is education)
    UPDATE posts SET category_id = tech_cat_id WHERE slug = 'lab211full-source';
    UPDATE posts SET category_id = edu_cat_id WHERE slug = 'thay-i-source-swp';
END $$;
