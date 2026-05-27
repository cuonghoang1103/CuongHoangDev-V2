package com.cuonghoangdev.api_backend.dto;

import java.util.List;

public class ChatResponse {

    private String answer;
    private String sessionId;
    private List<String> sources;  // Danh sách document nguồn
    private int tokenUsage;

    public ChatResponse() {}

    public ChatResponse(String answer, String sessionId) {
        this.answer = answer;
        this.sessionId = sessionId;
    }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public List<String> getSources() { return sources; }
    public void setSources(List<String> sources) { this.sources = sources; }

    public int getTokenUsage() { return tokenUsage; }
    public void setTokenUsage(int tokenUsage) { this.tokenUsage = tokenUsage; }
}
