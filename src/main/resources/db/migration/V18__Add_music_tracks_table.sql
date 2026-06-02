CREATE TABLE music_tracks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    cover_image VARCHAR(500),
    duration_seconds INTEGER,
    file_size BIGINT,
    public_id VARCHAR(500),
    cloudinary_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
