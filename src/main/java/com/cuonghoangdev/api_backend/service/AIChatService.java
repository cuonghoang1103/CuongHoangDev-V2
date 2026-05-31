package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ChatRequest;
import com.cuonghoangdev.api_backend.dto.ChatResponse;
import com.cuonghoangdev.api_backend.entity.ChatMessage;
import com.cuonghoangdev.api_backend.entity.ChatSession;
import com.cuonghoangdev.api_backend.repository.ChatMessageRepository;
import com.cuonghoangdev.api_backend.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * AI Chat Service - Full RAG Implementation.
 *
 * Su dung AIService (Gemini) de goi AI thong qua RAG pipeline.
 *
 * Qua trinh xu ly:
 * 1. Nhan cau hoi tu nguoi dung
 * 2. Tim kiem trong kho tri thuc (RAGSearchService)
 * 3. Build prompt voi context tu RAG
 * 4. Goi Gemini (streaming hoac non-streaming)
 * 5. Luu lich su vao DB
 */
@Service
public class AIChatService {

    private static final Logger log = LoggerFactory.getLogger(AIChatService.class);

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AIService aiService;
    private final RAGSearchService ragSearchService;

    public AIChatService(
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            AIService aiService,
            RAGSearchService ragSearchService) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.aiService = aiService;
        this.ragSearchService = ragSearchService;
    }

    /**
     * Chat non-streaming (mot lan response)
     */
    @Transactional
    public ChatResponse chat(ChatRequest request, Long userId) {
        String userMessage = request.getMessage().trim();
        String sessionId = ensureSession(request.getSessionId(), userMessage, userId);
        int topK = Optional.ofNullable(request.getTopK()).orElse(5);

        // Luu tin nhan nguoi dung
        saveMessage(sessionId, "user", userMessage);

        // RAG: Tim context trong kho tri thuc
        String systemPrompt = ragSearchService.buildRAGPrompt(userMessage);
        log.debug("RAG search cho: '{}...'", userMessage.substring(0, Math.min(50, userMessage.length())));

        // Lay lich su chat (5 tin nhan cuoi)
        List<ChatMessage> history = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<AIService.ChatMessage> chatHistory = history.stream()
                .filter(m -> m.getRole() != null && m.getContent() != null)
                .map(m -> new AIService.ChatMessage(m.getRole(), m.getContent()))
                .toList();

        // Goi Gemini
        String answer;
        if (!aiService.isConfigured()) {
            answer = buildFallbackResponse(userMessage);
        } else {
            AIService.ChatResult result = aiService.chat(systemPrompt, userMessage, chatHistory);
            if (result.success) {
                answer = result.content;
            } else {
                log.warn("Gemini tra ve loi: {}", result.error);
                answer = "Xin loi, gap loi khi xu ly yeu cau cua ban: " + result.error;
            }
        }

        // Luu tra loi vao DB
        saveMessage(sessionId, "assistant", answer);

        // Tra ve response
        ChatResponse response = new ChatResponse(answer, sessionId);
        RAGSearchService.SearchResult ragResult = ragSearchService.search(userMessage, topK, request.getDocumentType());
        response.setSources(ragResult.sources());
        return response;
    }

    /**
     * Chat streaming (SSE - Server-Sent Events).
     * Tra ve tung phan tu theo thoi gian thuc nhu ChatGPT.
     */
    @Transactional
    public StreamingChatResponse chatStreaming(ChatRequest request, Long userId) {
        String userMessage = request.getMessage().trim();
        String sessionId = ensureSession(request.getSessionId(), userMessage, userId);
        int topK = Optional.ofNullable(request.getTopK()).orElse(5);

        // Luu tin nhan nguoi dung
        saveMessage(sessionId, "user", userMessage);

        // RAG: Tim context
        String systemPrompt = ragSearchService.buildRAGPrompt(userMessage);
        RAGSearchService.SearchResult ragResult = ragSearchService.search(userMessage, topK, request.getDocumentType());
        log.debug("RAG found {} chunks cho: '{}...'", ragResult.chunksFound(),
                userMessage.substring(0, Math.min(50, userMessage.length())));

        // Lay lich su chat
        List<ChatMessage> history = chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<AIService.ChatMessage> chatHistory = history.stream()
                .filter(m -> m.getRole() != null && m.getContent() != null)
                .map(m -> new AIService.ChatMessage(m.getRole(), m.getContent()))
                .toList();

        if (!aiService.isConfigured()) {
            // Tra loi fallback voi streaming gia
            String fallback = buildFallbackResponse(userMessage);
            Flux<String> fallbackStream = streamText(fallback);
            saveMessage(sessionId, "assistant", fallback);
            return new StreamingChatResponse(sessionId, fallbackStream, ragResult.sources());
        }

        // Streaming tu Gemini
        Flux<String> stream = aiService.chatStreamSSE(systemPrompt, userMessage, chatHistory)
                .filter(sc -> !sc.content.isBlank())
                .map(sc -> {
                    // Chi tra ve content cua chunk
                    String content = sc.content;
                    // Luu tung phan cua tra loi vao DB (se duoc luu day du sau khi stream xong)
                    return content;
                })
                .cache(1) // cache de co the consume nhieu lan
                .doOnCancel(() -> {
                    log.debug("Stream cancelled for session {}", sessionId);
                })
                .doOnError(e -> {
                    log.error("Stream error for session {}: {}", sessionId, e.getMessage());
                });

        // Collect full response de luu vao DB
        final StringBuilder fullAnswer = new StringBuilder();
        Flux<String> savableStream = stream
                .doOnNext(fullAnswer::append)
                .doOnComplete(() -> {
                    String full = fullAnswer.toString();
                    if (!full.isBlank()) {
                        saveMessage(sessionId, "assistant", full);
                        log.info("Da luu {} ky tu vao chat history session {}", full.length(), sessionId);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Stream failed, saving error message: {}", e.getMessage());
                    saveMessage(sessionId, "assistant", "Da xay ra loi: " + e.getMessage());
                    return Flux.just("Da xay ra loi: " + e.getMessage());
                });

        return new StreamingChatResponse(sessionId, savableStream, ragResult.sources());
    }

    /**
     * Streaming text mot ky tu mot theo thoi gian.
     * Su dung khi khong co OpenAI API key.
     */
    private Flux<String> streamText(String text) {
        String[] words = text.split("(?<=\\s)|(?=\\s)");
        return Flux.fromArray(words)
                .flatMap(word -> Flux.just(word)
                        .delayElements(java.time.Duration.ofMillis(20)));
    }

    /**
     * Tra loi fallback khi khong co OpenAI API key.
     */
    private String buildFallbackResponse(String question) {
        String lowerQ = question.toLowerCase();

        if (lowerQ.contains("gioi thieu") || lowerQ.contains("ban la ai") || lowerQ.contains("who are you")) {
            return "Toi la Ai CuongMini cua CuongHoangDev - mot Full Stack Developer. Toi co 3+ nam kinh nghiem voi Java, Spring Boot, React, Next.js, PostgreSQL va Redis. Toi co the giup ban tra loi ve portfolio, ky nang, du an va blog cua Hoang.";
        }
        if (lowerQ.contains("ky nang") || lowerQ.contains("skill") || lowerQ.contains("cong nghe") || lowerQ.contains("technology")) {
            return "Hoang co cac ky nang chinh:\n\n**Frontend:** React, Next.js, TypeScript, Tailwind CSS\n**Backend:** Java, Spring Boot, Node.js\n**Database:** PostgreSQL, Redis, MongoDB\n**DevOps:** Docker, GitHub Actions, Linux\n**AI:** OpenAI API, RAG Architecture, Vector Databases, pgvector\n\nBan muon biet them ve ky nang nao?";
        }
        if (lowerQ.contains("du an") || lowerQ.contains("project") || lowerQ.contains("portfolio")) {
            return "Hoang da lam nhieu du an, bao gom:\n\n1. **CuongHoangDev V2** - Portfolio + AI Chatbot tich hop kien truc RAG voi pgvector\n2. **E-Commerce Platform** - Nen tang TMĐT voi Spring Boot + React\n3. **Microservices Demo** - He thong microservice voi Spring Cloud\n\nBan muon xem chi tiet du an nao?";
        }
        if (lowerQ.contains("blog") || lowerQ.contains("bai viet") || lowerQ.contains("article")) {
            return "Hoang co nhieu bai viet ve:\n- Java & Spring Boot\n- React & Next.js\n- AI Integration & RAG\n- DevOps & Docker\n\nTruy cap /blog de xem danh sach day du cac bai viet.";
        }
        if (lowerQ.contains("lien he") || lowerQ.contains("contact") || lowerQ.contains("email")) {
            return "Ban co the lien he Hoang qua:\n- GitHub: github.com/cuonghoangdev\n- LinkedIn: linkedin.com/in/cuonghoangdev\n- Email: cuonghoang1103@gmail.com\n\nHoac gui email neu ban muon trao doi truc tiep!";
        }
        if (lowerQ.contains("kinh nghiem") || lowerQ.contains("experience") || lowerQ.contains("nam")) {
            return "Hoang co 3+ nam kinh nghiem lam viec voi cac cong nghe:\n- **Backend:** Java, Spring Boot, Node.js (3+ nam)\n- **Frontend:** React, Next.js, TypeScript (3+ nam)\n- **Database:** PostgreSQL, Redis, MongoDB (2+ nam)\n- **AI:** RAG, pgvector, OpenAI API (2+ nam)\n- **DevOps:** Docker, CI/CD, Linux (1+ nam)\n\nHoang lien tuc hoc tap va cap nhat cong nghe moi.";
        }

        return "Cam on ban da hoi! Toi la Ai CuongMini cua Hoang. Toi co the tra loi ve portfolio, ky nang, du an va blog cua Hoang. Ban muon hoi gi? Hay thu:\n- 'Gioi thieu ve Hoang'\n- 'Ky nang cua Hoang'\n- 'Du an da lam'\n- 'Blog gần đây'\n\n*(Luu y: Chatbot se hoat dong tot hon khi co GEMINI_API_KEY duoc cau hinh)*";
    }

    // ===================== SESSION MANAGEMENT =====================

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
        if (content == null || content.isBlank()) return;
        try {
            ChatMessage message = new ChatMessage(sessionId, role, content);
            chatMessageRepository.save(message);
            log.debug("Da luu message (role={}, session={})", role, sessionId);
        } catch (Exception e) {
            log.error("Loi khi luu message: {}", e.getMessage());
        }
    }

    public List<ChatMessage> getChatHistory(String sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    public List<ChatSession> getUserSessions(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public void deleteSession(String sessionId) {
        chatMessageRepository.deleteBySessionId(sessionId);
        chatSessionRepository.findBySessionId(sessionId)
                .ifPresent(chatSessionRepository::delete);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        String cleaned = text.replaceAll("\\s+", " ").trim();
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength) + "...";
    }

    // ===================== INNER RECORD =====================

    public record StreamingChatResponse(
            String sessionId,
            Flux<String> stream,
            List<String> sources
    ) {}
}
