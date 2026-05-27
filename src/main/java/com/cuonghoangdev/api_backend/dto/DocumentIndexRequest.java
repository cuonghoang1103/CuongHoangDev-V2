package com.cuonghoangdev.api_backend.dto;

import java.util.Map;

public class DocumentIndexRequest {

    private String documentId;
    private String documentType;  // posts, profile, skills, projects
    private String content;
    private Map<String, Object> metadata;
    private int chunkSize;       // Kích thước chunk (mặc định: 1000)
    private int chunkOverlap;    // Độ chồng lấn (mặc định: 200)

    public DocumentIndexRequest() {
        this.chunkSize = 1000;
        this.chunkOverlap = 200;
    }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public int getChunkSize() { return chunkSize; }
    public void setChunkSize(int chunkSize) { this.chunkSize = chunkSize; }

    public int getChunkOverlap() { return chunkOverlap; }
    public void setChunkOverlap(int chunkOverlap) { this.chunkOverlap = chunkOverlap; }
}
