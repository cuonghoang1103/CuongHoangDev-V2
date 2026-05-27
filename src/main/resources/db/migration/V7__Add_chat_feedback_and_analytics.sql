-- V7: Chat Feedback and Analytics
-- Bang luu tru feedback cua user cho cac cau tra loi AI
CREATE TABLE chat_feedback (
    id              BIGSERIAL PRIMARY KEY,
    message_id      BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- 1-5 sao
    feedback_type   VARCHAR(20) NOT NULL,  -- 'helpful', 'not_helpful', 'accurate', 'inaccurate'
    comment         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bang thong ke chat
CREATE TABLE chat_analytics (
    id              BIGSERIAL PRIMARY KEY,
    session_id      VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    message_count   INT NOT NULL DEFAULT 0,
    avg_response_time_ms INT DEFAULT 0,
    tokens_used     INT DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, date)
);

-- Bang cau hinh AI (moved from ai_config)
CREATE TABLE ai_prompts (
    id              BIGSERIAL PRIMARY KEY,
    prompt_key     VARCHAR(100) NOT NULL UNIQUE,
    prompt_template TEXT NOT NULL,
    description     VARCHAR(500),
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_feedback_message_id ON chat_feedback(message_id);
CREATE INDEX idx_feedback_user_id ON chat_feedback(user_id);
CREATE INDEX idx_feedback_rating ON chat_feedback(rating);
CREATE INDEX idx_chat_analytics_date ON chat_analytics(date);
CREATE INDEX idx_ai_prompts_key ON ai_prompts(prompt_key);

-- Du lieu mac dinh cho AI prompts
INSERT INTO ai_prompts (prompt_key, prompt_template, description) VALUES
    ('system_default', 
     'Ban la tro ly ao thong minh cua CuongHoangDev Portfolio.',
     'System prompt mac dinh cho AI chatbot'),

    ('greeting',
     'Xin chao! Toi la tro ly ao cua CuongHoangDev.',
     'Loi chao khi bat dau chat'),

    ('fallback',
     'Xin loi, toi khong co du thong tin de tra loi cau hoi nay.',
     'Tin nhan khi khong tim thay thong tin');
