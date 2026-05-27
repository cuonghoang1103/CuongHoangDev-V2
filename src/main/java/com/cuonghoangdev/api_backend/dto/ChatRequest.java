package com.cuonghoangdev.api_backend.dto;

import java.util.List;

public class ChatRequest {

    private String message;
    private String sessionId;
    private String documentType;  // null = tìm kiếm tất cả
    private Integer topK;         // số kết quả vector search

    public ChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public Integer getTopK() { return topK != null ? topK : 5; }
    public void setTopK(Integer topK) { this.topK = topK; }
}
