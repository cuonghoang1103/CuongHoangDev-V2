package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.ChatRequest;
import com.cuonghoangdev.api_backend.dto.ChatResponse;
import com.cuonghoangdev.api_backend.dto.FeedbackRequest;
import com.cuonghoangdev.api_backend.entity.ChatFeedback;
import com.cuonghoangdev.api_backend.entity.ChatMessage;
import com.cuonghoangdev.api_backend.entity.ChatSession;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.AIChatService;
import com.cuonghoangdev.api_backend.service.ChatAnalyticsService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AIChatController {

    private final AIChatService aiChatService;
    private final ChatAnalyticsService chatAnalyticsService;

    public AIChatController(AIChatService aiChatService,
                          ChatAnalyticsService chatAnalyticsService) {
        this.aiChatService = aiChatService;
        this.chatAnalyticsService = chatAnalyticsService;
    }

    /**
     * Gửi tin nhắn chat - endpoint chính của chatbot (non-streaming)
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long userId = currentUser != null ? currentUser.getId() : null;
        ChatResponse response = aiChatService.chat(request, userId);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Gửi tin nhắn chat - endpoint streaming (Server-Sent Events)
     * Trả về từng từ một để hiển thị typing effect như ChatGPT
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long userId = currentUser != null ? currentUser.getId() : null;
        AIChatService.StreamingChatResponse streamingResponse = aiChatService.chatStreaming(request, userId);

        // Trả về SSE format
        return Flux.concat(
                Flux.just("data: {\"sessionId\": \"" + streamingResponse.sessionId() + "\"}\n\n"),
                streamingResponse.stream()
                        .map(content -> "data: " + content + "\n\n"),
                Flux.just("data: [DONE]\n\n")
        );
    }

    /**
     * Lấy lịch sử chat của một session
     */
    @GetMapping("/chat/history/{sessionId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getChatHistory(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ChatMessage> history = aiChatService.getChatHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    /**
     * Lấy danh sách sessions của user
     */
    @GetMapping("/chat/sessions")
    public ResponseEntity<ApiResponse<List<ChatSession>>> getUserSessions(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }

        List<ChatSession> sessions = aiChatService.getUserSessions(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    /**
     * Xóa một session chat
     */
    @DeleteMapping("/chat/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        aiChatService.deleteSession(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Xóa session thành công", null));
    }

    // ============ Feedback ============

    /**
     * Gửi feedback cho một câu trả lời
     */
    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<ChatFeedback>> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long userId = currentUser != null ? currentUser.getId() : null;
        ChatFeedback feedback = chatAnalyticsService.submitFeedback(request, userId);

        return ResponseEntity.ok(ApiResponse.ok("Cảm ơn bạn đã gửi feedback!", feedback));
    }

    /**
     * Lấy thống kê feedback (Admin)
     */
    @GetMapping("/feedback/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeedbackStats() {
        Map<String, Object> stats = chatAnalyticsService.getFeedbackStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    // ============ Analytics ============

    /**
     * Lấy tổng quan analytics
     */
    @GetMapping("/analytics/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverviewStats() {
        Map<String, Object> stats = chatAnalyticsService.getOverviewStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
