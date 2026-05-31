-- ============================================================
-- V12: Enable pgvector + fix embedding column for RAG
-- ============================================================

-- 1. Enable pgvector extension (superuser required once per DB)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create embedding index on existing document_chunks if not exists
--    Drop old column and re-add as proper vector type for HNSW search
DO $$
BEGIN
   -- Check if column exists as text and has data
   IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'document_chunks'
       AND column_name = 'embedding'
   ) THEN
       -- Backup existing data by renaming
       ALTER TABLE document_chunks RENAME COLUMN embedding TO embedding_text;
   END IF;
END $$;

-- 3. Add proper vector column (1536 dims = OpenAI text-embedding-3-small)
ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 4. Backfill: convert string embeddings to vector from metadata/similarity if available
--    For now, new chunks will be inserted with proper vectors.
--    Old chunks can be re-embedded via admin endpoint.

-- 5. Create HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. Index for faster filtered queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_type
ON document_chunks(document_type);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id
ON document_chunks(document_id);
