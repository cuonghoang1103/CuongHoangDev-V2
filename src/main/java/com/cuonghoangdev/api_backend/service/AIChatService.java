package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ChatRequest;
import com.cuonghoangdev.api_backend.dto.ChatResponse;
import com.cuonghoangdev.api_backend.entity.ChatMessage;
import com.cuonghoangdev.api_backend.entity.ChatSession;
import com.cuonghoangdev.api_backend.repository.ChatMessageRepository;
import com.cuonghoangdev.api_backend.repository.ChatSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.UUID;

/**
 * AI Chat Service - Stub implementation
 */
@Service
public class AIChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    public AIChatService(ChatSessionRepository chatSessionRepository,
                        ChatMessageRepository chatMessageRepository) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @Transactional
    public ChatResponse chat(ChatRequest request, Long userId) {
        String userMessage = request.getMessage();
        String sessionId = ensureSession(request.getSessionId(), userMessage, userId);
        saveMessage(sessionId, "user", userMessage);
        String answer = "AI Chat dang tam thoi khong kha dung. Vui long lien he quan tri vien.";
        saveMessage(sessionId, "assistant", answer);
        return new ChatResponse(answer, sessionId);
    }

    @Transactional
    public StreamingChatResponse chatStreaming(ChatRequest request, Long userId) {
        String userMessage = request.getMessage();
        String sessionId = ensureSession(request.getSessionId(), userMessage, userId);
        saveMessage(sessionId, "user", userMessage);
        Flux<String> stream = Flux.just("AI Chat dang tam thoi khong kha dung.");
        return new StreamingChatResponse(sessionId, stream, List.of());
    }

    private String ensureSession(String sessionId, String userMessage, Long userId) {
        final String finalSessionId = (sessionId == null || sessionId.isEmpty()) 
            ? UUID.randomUUID().toString() : sessionId;
        
        chatSessionRepository.findBySessionId(finalSessionId)
                .orElseGet(() -> {
                    ChatSession newSession = new ChatSession();
                    newSession.setSessionId(finalSessionId);
                    newSession.setUserId(userId);
                    newSession.setTitle(truncate(userMessage, 50));
                    return chatSessionRepository.save(newSession);
                });
        return finalSessionId;
    }

    private void saveMessage(String sessionId, String role, String content) {
        ChatMessage message = new ChatMessage(sessionId, role, content);
        chatMessageRepository.save(message);
    }

    public List<ChatMessage> getChatHistory(String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    public List<ChatSession> getUserSessions(Long userId) {
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public void deleteSession(String sessionId) {
        chatMessageRepository.deleteBySessionId(sessionId);
        chatSessionRepository.findBySessionId(sessionId).ifPresent(chatSessionRepository::delete);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() <= maxLength ? text : text.substring(0, maxLength) + "...";
    }

    public record StreamingChatResponse(String sessionId, Flux<String> stream, List<String> sources) {}
}
