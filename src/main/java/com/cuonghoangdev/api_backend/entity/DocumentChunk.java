package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

import com.cuonghoangdev.api_backend.config.JsonbStringType;
import com.cuonghoangdev.api_backend.config.VectorStringType;

@Entity
@Table(name = "document_chunks")
@EntityListeners(AuditingEntityListener.class)
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @org.hibernate.annotations.Type(value = JsonbStringType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @org.hibernate.annotations.Type(value = VectorStringType.class)
    @Column(name = "embedding", columnDefinition = "vector")
    private String embedding;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex = 0;

    @Column(name = "document_id", nullable = false, length = 100)
    private String documentId;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public DocumentChunk() {}

    public DocumentChunk(String content, String metadata, String documentId,
                         String documentType, Integer chunkIndex) {
        this.content = content;
        this.metadata = metadata;
        this.documentId = documentId;
        this.documentType = documentType;
        this.chunkIndex = chunkIndex;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getEmbedding() { return embedding; }
    public void setEmbedding(String embedding) { this.embedding = embedding; }

    public Integer getChunkIndex() { return chunkIndex; }
    public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
