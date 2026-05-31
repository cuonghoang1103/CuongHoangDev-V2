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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/ai")
public class AIChatController {

    private static final Logger log = LoggerFactory.getLogger(AIChatController.class);

    private final AIChatService aiChatService;
    private final ChatAnalyticsService chatAnalyticsService;

    public AIChatController(AIChatService aiChatService,
                          ChatAnalyticsService chatAnalyticsService) {
        this.aiChatService = aiChatService;
        this.chatAnalyticsService = chatAnalyticsService;
    }

    /**
     * Gui tin nhan chat - non-streaming
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
     * Gui tin nhan chat - streaming (SSE).
     * Tra ve tung tu theo thoi gian thuc nhu ChatGPT.
     * 
     * Frontend can su dung EventSource de nhan stream.
     */
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long userId = currentUser != null ? currentUser.getId() : null;

        // Tao emitter voi timeout 5 phut
        SseEmitter emitter = new SseEmitter(TimeUnit.MINUTES.toMillis(5));

        // Bat dau xu ly bat dong bo
        AIChatService.StreamingChatResponse streamingResponse =
                aiChatService.chatStreaming(request, userId);

        String sessionId = streamingResponse.sessionId();
        Flux<String> stream = streamingResponse.stream();

        // Gui sessionId dau tien
        try {
            emitter.send(SseEmitter.event()
                    .name("session")
                    .data("{\"sessionId\": \"" + sessionId + "\"}"));
        } catch (IOException e) {
            log.warn("Khong the gui sessionId: {}", e.getMessage());
        }

        // Stream tung phan du lieu
        stream.subscribe(
                (content) -> {
                    try {
                        // Gui tung chunk content
                        emitter.send(SseEmitter.event()
                                .name("content")
                                .data("{\"content\": " + escapeJson(content) + "}"));
                    } catch (IOException e) {
                        log.warn("Stream send failed: {}", e.getMessage());
                    }
                },
                (error) -> {
                    log.error("Stream error: {}", error.getMessage());
                    try {
                        emitter.send(SseEmitter.event()
                                .name("error")
                                .data("{\"error\": " + escapeJson(error.getMessage()) + "}"));
                        emitter.completeWithError(error);
                    } catch (IOException e) {
                        emitter.completeWithError(error);
                    }
                },
                () -> {
                    // Stream hoan tat
                    try {
                        emitter.send(SseEmitter.event()
                                .name("done")
                                .data("{\"done\": true}"));
                        emitter.complete();
                    } catch (IOException e) {
                        log.warn("Complete send failed: {}", e.getMessage());
                        emitter.complete();
                    }
                }
        );

        // Timeout handler
        emitter.onTimeout(() -> {
            log.warn("SSE timeout for session {}", sessionId);
        });

        emitter.onCompletion(() -> {
            log.info("SSE completed for session {}", sessionId);
        });

        emitter.onError(e -> {
            log.error("SSE error for session {}: {}", sessionId, e.getMessage());
        });

        return emitter;
    }

    /**
     * Lay lich su chat cua mot session
     */
    @GetMapping("/chat/history/{sessionId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getChatHistory(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ChatMessage> history = aiChatService.getChatHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    /**
     * Lay danh sach session cua user
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
     * Xoa mot session chat
     */
    @DeleteMapping("/chat/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String sessionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        aiChatService.deleteSession(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Xoa session thanh cong", null));
    }

    // ============ Feedback ============

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<ChatFeedback>> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long userId = currentUser != null ? currentUser.getId() : null;
        ChatFeedback feedback = chatAnalyticsService.submitFeedback(request, userId);

        return ResponseEntity.ok(ApiResponse.ok("Cam on ban da gui feedback!", feedback));
    }

    @GetMapping("/feedback/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFeedbackStats() {
        Map<String, Object> stats = chatAnalyticsService.getFeedbackStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    // ============ Analytics ============

    @GetMapping("/analytics/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverviewStats() {
        Map<String, Object> stats = chatAnalyticsService.getOverviewStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    // ============ Helper ============

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t")
                .replace("\u008B", "")
                .replace("\u009B", "");
    }
}
