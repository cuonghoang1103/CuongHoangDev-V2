package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
