-- ============================================================
-- V14: Reset vector dimension to 768 for gemini-embedding-2 with outputDimensionality
-- gemini-embedding-2 defaults to 3072 dims but we request 768 in the API call
-- HNSW index requires <= 2000 dims
-- ============================================================

-- Change vector column back to 768 dims (gemini-embedding-2 with outputDimensionality=768)
ALTER TABLE document_chunks
ALTER COLUMN embedding TYPE vector(768);

-- Drop old HNSW index
DROP INDEX IF EXISTS idx_document_chunks_embedding_hnsw;

-- Recreate HNSW index with 768 dimensions
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
