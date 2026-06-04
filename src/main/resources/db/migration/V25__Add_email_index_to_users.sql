-- Migration: V25__Add_email_index_to_users.sql
-- Add index on users.email column to speed up OAuth registration,
-- role lookup by email (/api/v1/auth/role), and forgot-password queries.
-- Note: UNIQUE constraint on email (V1) already creates an implicit index,
-- so this regular index is redundant but harmless.
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for chat session queries (recent sessions list)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
