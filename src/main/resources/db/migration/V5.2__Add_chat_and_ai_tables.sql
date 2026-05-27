-- V5.2: Chat tables + AI Config (không dùng pgvector vì Spring AI đã disable)
-- Bảng chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(100) NOT NULL UNIQUE,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(100) NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    token_count     INT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng AI config
CREATE TABLE IF NOT EXISTS ai_config (
    id              BIGSERIAL PRIMARY KEY,
    config_key      VARCHAR(100) NOT NULL UNIQUE,
    config_value    TEXT,
    description     VARCHAR(500),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (IF NOT EXISTS để tránh lỗi nếu đã có)
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_key ON ai_config(config_key);

-- Dữ liệu mặc định cho AI config (ignore nếu đã có)
INSERT INTO ai_config (config_key, config_value, description) VALUES
    ('embedding_model', 'text-embedding-3-small', 'Model su dung de tao embedding'),
    ('chat_model', 'gpt-4o-mini', 'Model su dung cho chat'),
    ('max_tokens', '2048', 'So token toi da cho moi response'),
    ('temperature', '0.7', 'Do sang tao cua AI (0-1)'),
    ('chunk_size', '1000', 'Kich thuoc moi chunk khi chia nho document'),
    ('chunk_overlap', '200', 'Do chong lan giua cac chunk'),
    ('similarity_threshold', '0.7', 'Nguong similarity toi thieu')
ON CONFLICT (config_key) DO NOTHING;
