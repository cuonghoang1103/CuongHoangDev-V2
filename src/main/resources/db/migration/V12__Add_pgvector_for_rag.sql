-- ============================================================
-- V12: Enable pgvector + fix embedding column for RAG
-- Only runs if pgvector extension is available
-- ============================================================

-- 1. Enable pgvector extension (superuser required once per DB)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Check if pgvector is available
DO $$
BEGIN
    -- Check if vector type exists (pgvector installed)
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'vector'
    ) THEN
        -- Check if document_chunks table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'document_chunks'
        ) THEN
            -- Check if embedding column exists as text and has data
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'document_chunks'
                AND column_name = 'embedding'
                AND data_type = 'character varying'
            ) THEN
                -- Backup existing data by renaming
                ALTER TABLE document_chunks RENAME COLUMN embedding TO embedding_text;
            END IF;

            -- Add proper vector column (768 dims for Gemini)
            ALTER TABLE document_chunks
            ADD COLUMN IF NOT EXISTS embedding vector(768);

            -- 3. Create HNSW index for fast cosine similarity search
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
            ON document_chunks
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);

            -- 4. Index for faster filtered queries
            CREATE INDEX IF NOT EXISTS idx_document_chunks_type
            ON document_chunks(document_type);

            CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id
            ON document_chunks(document_id);
        END IF;
    ELSE
        RAISE NOTICE 'pgvector extension not found. Skipping vector setup.';
    END IF;
END $$;
