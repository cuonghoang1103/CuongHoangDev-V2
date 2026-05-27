-- V4: Bảng Blog (Categories + Posts) cho Ngày 11 - Redis Cache
-- =====================================================

-- 1. Bảng Categories (Danh mục bài viết)
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Posts (Bài viết)
CREATE TABLE posts (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(255) NOT NULL UNIQUE,
    excerpt      TEXT,
    content      TEXT NOT NULL,
    thumbnail_url VARCHAR(500),
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    category_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    author_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    view_count   INT NOT NULL DEFAULT 0,
    is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Tags (Thẻ bài viết)
CREATE TABLE tags (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(50) NOT NULL UNIQUE,
    slug      VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng trung gian Post_Tags (Many-to-Many)
CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- 5. Chỉ mục (Index) cho Posts
CREATE INDEX idx_posts_category_id  ON posts(category_id);
CREATE INDEX idx_posts_author_id    ON posts(author_id);
CREATE INDEX idx_posts_status       ON posts(status);
CREATE INDEX idx_posts_slug         ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_is_featured ON posts(is_featured);

-- 6. Chỉ mục cho Tags
CREATE INDEX idx_tags_slug ON tags(slug);

-- 7. Dữ liệu mặc định cho Categories
INSERT INTO categories (name, slug, description) VALUES
    ('Technology',      'technology',      'Bài viết về công nghệ, lập trình, framework mới'),
    ('Lifestyle',      'lifestyle',       'Chia sẻ về phong cách sống, sở thích, trải nghiệm'),
    ('Business',       'business',         'Kiến thức kinh doanh, khởi nghiệp, tài chính'),
    ('Education',      'education',        'Học tập, phát triển bản thân, kỹ năng mềm');
