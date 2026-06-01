-- ============================================================
-- V13: Update vector dimension for Gemini embeddings (768 dims)
-- Only runs if pgvector extension is available
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'vector'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks'
    ) THEN
        -- Change vector column from 1536 (OpenAI) to 768 (Gemini text-embedding-004)
        ALTER TABLE document_chunks
        ALTER COLUMN embedding TYPE vector(768);

        -- Drop old HNSW index (was built for 1536 dims)
        DROP INDEX IF EXISTS idx_document_chunks_embedding_hnsw;

        -- Recreate HNSW index with correct 768 dimensions
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
        ON document_chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    ELSE
        RAISE NOTICE 'pgvector or document_chunks not found. Skipping vector dimension update.';
    END IF;
END $$;
