package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByDocumentId(String documentId);

    List<DocumentChunk> findByDocumentType(String documentType);

    void deleteByDocumentId(String documentId);

    @Query(value = """
            SELECT * FROM document_chunks
            WHERE document_type = :documentType
            ORDER BY chunk_index ASC
            """, nativeQuery = true)
    List<DocumentChunk> findAllByDocumentTypeOrdered(@Param("documentType") String documentType);

    @Query(value = """
            SELECT COUNT(*) FROM document_chunks
            WHERE document_type = :documentType
            """, nativeQuery = true)
    long countByDocumentType(@Param("documentType") String documentType);

    // ============================================================
    // RAG Vector Search (pgvector HNSW cosine similarity)
    // ============================================================

    /**
     * Semantic search: find top-K chunks most similar to query embedding
     * using pgvector cosine distance. Lower distance = more similar.
     *
     * @param embedding Float array as pgvector literal string, e.g. '[0.1,0.2,...]'
     * @param topK      Maximum results to return
     * @return List of DocumentChunk ordered by similarity (best first)
     */
    @Query(value = """
            SELECT dc.*,
                   1 - (dc.embedding <=> CAST(:embedding AS vector)) AS cosine_similarity
            FROM document_chunks dc
            WHERE dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> CAST(:embedding AS vector)
            LIMIT :topK
            """, nativeQuery = true)
    List<DocumentChunk> findTopKByEmbeddingSimilarity(
            @Param("embedding") String embedding,
            @Param("topK") int topK);

    /**
     * Filtered semantic search: find top-K chunks by document type
     */
    @Query(value = """
            SELECT dc.*,
                   1 - (dc.embedding <=> CAST(:embedding AS vector)) AS cosine_similarity
            FROM document_chunks dc
            WHERE dc.embedding IS NOT NULL
              AND dc.document_type = :documentType
            ORDER BY dc.embedding <=> CAST(:embedding AS vector)
            LIMIT :topK
            """, nativeQuery = true)
    List<DocumentChunk> findTopKByEmbeddingSimilarityFiltered(
            @Param("embedding") String embedding,
            @Param("documentType") String documentType,
            @Param("topK") int topK);

    /**
     * Count chunks that have valid embeddings
     */
    @Query(value = """
            SELECT COUNT(*) FROM document_chunks
            WHERE embedding IS NOT NULL
            """, nativeQuery = true)
    long countIndexedChunks();

    /**
     * Count chunks waiting for embedding
     */
    @Query(value = """
            SELECT COUNT(*) FROM document_chunks
            WHERE embedding IS NULL
            """, nativeQuery = true)
    long countPendingChunks();

    /**
     * Batch update embeddings (used by re-indexing)
     */
    @Modifying
    @Query(value = """
            UPDATE document_chunks
            SET embedding = CAST(:embedding AS vector)
            WHERE id = :id
            """, nativeQuery = true)
    void updateEmbedding(@Param("id") Long id, @Param("embedding") String embedding);

    /**
     * Hybrid search: combine vector similarity with keyword boost
     */
    @Query(value = """
            SELECT dc.*,
                   (1 - (dc.embedding <=> CAST(:embedding AS vector))) AS similarity
            FROM document_chunks dc
            WHERE dc.embedding IS NOT NULL
              AND (
                  LOWER(dc.content) LIKE '%' || LOWER(:keyword) || '%'
                  OR :keyword IS NULL OR :keyword = ''
              )
            ORDER BY dc.embedding <=> CAST(:embedding AS vector)
            LIMIT :topK
            """, nativeQuery = true)
    List<DocumentChunk> hybridSearch(
            @Param("embedding") String embedding,
            @Param("keyword") String keyword,
            @Param("topK") int topK);
}
