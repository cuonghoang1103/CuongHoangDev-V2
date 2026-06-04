-- Music Playlists
CREATE TABLE music_playlists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_url VARCHAR(700),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playlists_user ON music_playlists(user_id);

-- Junction table: track <-> playlist (many-to-many)
CREATE TABLE music_playlist_tracks (
    id BIGSERIAL PRIMARY KEY,
    playlist_id BIGINT NOT NULL REFERENCES music_playlists(id) ON DELETE CASCADE,
    track_id BIGINT NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
    position INT DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(playlist_id, track_id)
);

CREATE INDEX idx_playlist_tracks_playlist ON music_playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track ON music_playlist_tracks(track_id);
