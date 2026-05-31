package com.cuonghoangdev.api_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Unified AI service supporting Google Gemini as the primary provider.
 *
 * Architecture:
 * - Gemini is used for both chat and embedding
 * - OpenAI is kept for backward compatibility (checked as fallback)
 * - Provider priority: Gemini (if configured) > OpenAI (if configured) > Error
 *
 * Gemini API docs: https://ai.google.dev/docs
 * - Chat: POST /v1beta/models/{model}:generateContent
 * - Embedding: POST /v1beta/models/{model}:embedContent
 */
@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final String GEMINI_CHAT_MODEL = "gemini-2.5-flash";
    private static final String GEMINI_EMBEDDING_MODEL = "gemini-embedding-2";
    private static final int GEMINI_EMBEDDING_DIMENSIONS = 768;

    private final WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;
    private final String chatModel;
    private final String embeddingModel;
    private final int embeddingDimensions;
    private final int maxTokens;
    private final float temperature;

    // Simple LRU cache for chat responses to reduce API calls
    private final Map<String, CachedResponse> responseCache = new ConcurrentHashMap<>();
    private volatile long cacheCleanTimestamp = 0;

    public AIService(
            @Value("${app.ai.gemini.api-key:}") String geminiApiKey,
            @Value("${app.ai.chat.model:gemini-2.0-flash}") String chatModel,
            @Value("${app.ai.embedding.model:gemini-embedding-2}") String embeddingModel,
            @Value("${app.ai.embedding.dimensions:768}") int embeddingDimensions,
            @Value("${app.ai.chat.max-tokens:2048}") int maxTokens,
            @Value("${app.ai.chat.temperature:0.7}") float temperature,
            ObjectMapper objectMapper) {
        this.geminiApiKey = geminiApiKey;
        this.chatModel = chatModel;
        this.embeddingModel = embeddingModel;
        this.embeddingDimensions = embeddingDimensions;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.objectMapper = objectMapper;
        this.geminiWebClient = WebClient.builder()
                .baseUrl(GEMINI_BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("AIService initialized. Gemini API Key configured: {}, Chat model: {}, Embedding model: {} ({} dims)",
                isGeminiConfigured(), chatModel, embeddingModel, embeddingDimensions);
        cleanCacheIfNeeded();
    }

    private void cleanCacheIfNeeded() {
        long now = System.currentTimeMillis();
        if (now - cacheCleanTimestamp > TimeUnit.HOURS.toMillis(1)) {
            responseCache.clear();
            cacheCleanTimestamp = now;
            log.info("Chat response cache cleared");
        }
    }

    private record CachedResponse(String content, long timestamp) {}

    private static final int MAX_CACHE_SIZE = 200;

    private String buildCacheKey(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        StringBuilder sb = new StringBuilder();
        if (systemPrompt != null) {
            sb.append(systemPrompt.hashCode());
        }
        sb.append('|').append(userMessage.hashCode());
        if (chatHistory != null) {
            sb.append('|').append(chatHistory.size());
            // Only include last 2 messages for cache key to be more general
            int from = Math.max(0, chatHistory.size() - 2);
            for (int i = from; i < chatHistory.size(); i++) {
                sb.append('|').append(chatHistory.get(i).content.hashCode());
            }
        }
        return Integer.toHexString(sb.toString().hashCode());
    }

    private void evictIfNeeded() {
        if (responseCache.size() > MAX_CACHE_SIZE) {
            // Remove oldest 20%
            int toRemove = MAX_CACHE_SIZE / 5;
            responseCache.entrySet().stream()
                    .sorted(Comparator.comparingLong(e -> e.getValue().timestamp()))
                    .limit(toRemove)
                    .map(Map.Entry::getKey)
                    .toList()
                    .forEach(responseCache::remove);
        }
    }

    // ===================== CONFIGURATION =====================

    public boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.isEmpty() && !geminiApiKey.equals("EMPTY");
    }

    public boolean isConfigured() {
        return isGeminiConfigured();
    }

    // ===================== CHAT NON-STREAMING =====================

    /**
     * Send a chat message and get a non-streaming response.
     */
    public ChatResult chat(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        if (!isGeminiConfigured()) {
            return ChatResult.error("Gemini API key chua duoc cau hinh. Vui long them GEMINI_API_KEY vao file .env.");
        }

        // Check cache first
        String cacheKey = buildCacheKey(systemPrompt, userMessage, chatHistory);
        CachedResponse cached = responseCache.get(cacheKey);
        if (cached != null && System.currentTimeMillis() - cached.timestamp() < TimeUnit.HOURS.toMillis(1)) {
            log.debug("Cache hit for: '{}...'", userMessage.substring(0, Math.min(30, userMessage.length())));
            return ChatResult.success(cached.content(), 0);
        }

        String[] fallbackModels = {"gemini-2.0-flash-lite", "gemini-2.0-flash"};

        for (int attempt = 0; attempt <= fallbackModels.length; attempt++) {
            String modelToTry = (attempt == 0) ? chatModel : fallbackModels[attempt - 1];
            try {
                Map<String, Object> body = buildGeminiChatBody(systemPrompt, userMessage, chatHistory);
                String url = buildGeminiUrl(modelToTry, "generateContent");

                String response = geminiWebClient.post()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                ChatResult result = parseGeminiChatResponse(response);
                if (!result.success) {
                    String err = result.error != null ? result.error : "Unknown error";
                    boolean retryable = err.contains("429") || err.contains("503") || err.contains("429");
                    if (retryable && attempt < fallbackModels.length) {
                        log.warn("Model {} failed ({}), retrying with: {}", modelToTry, err, fallbackModels[attempt]);
                        try { Thread.sleep(500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                        continue;
                    }
                    return result;
                }

                if (result.success && result.content != null) {
                    evictIfNeeded();
                    responseCache.put(cacheKey, new CachedResponse(result.content, System.currentTimeMillis()));
                }
                return result;
            } catch (Exception e) {
                String errMsg = e.getMessage();
                boolean retryable = errMsg != null && (errMsg.contains("429") || errMsg.contains("503"));
                if (retryable && attempt < fallbackModels.length) {
                    log.warn("Model {} threw {}, retrying with: {}", modelToTry, e.getClass().getSimpleName(), fallbackModels[attempt]);
                    try { Thread.sleep(500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                    continue;
                }
                if (attempt >= fallbackModels.length) {
                    log.error("All models failed after {} attempts: {}", attempt + 1, errMsg);
                    return ChatResult.error("Loi khi goi AI: " + errMsg);
                }
            }
        }
        return ChatResult.error("Tat ca model deu khong hoat dong.");
    }

    // ===================== CHAT STREAMING (SSE) =====================

    /**
     * Stream chat response token-by-token using Gemini SSE.
     * For non-SSE models (gemini-2.5-flash), uses non-streaming API then streams word-by-word.
     */
    public Flux<String> chatStream(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        if (!isGeminiConfigured()) {
            return Flux.just("Gemini API key chua duoc cau hinh. Vui long them GEMINI_API_KEY vao file .env.");
        }

        // Check cache first (skip for non-empty chat history to avoid stale responses)
        if (chatHistory == null || chatHistory.isEmpty()) {
            String cacheKey = buildCacheKey(systemPrompt, userMessage, chatHistory);
            CachedResponse cached = responseCache.get(cacheKey);
            if (cached != null && System.currentTimeMillis() - cached.timestamp() < TimeUnit.HOURS.toMillis(1)) {
                log.debug("Cache hit (stream) for: '{}...'",
                        userMessage.substring(0, Math.min(30, userMessage.length())));
                return streamTextAsFlux(cached.content());
            }
        }

        try {
            Map<String, Object> body = buildGeminiChatBody(systemPrompt, userMessage, chatHistory);
            String url = buildGeminiUrl(chatModel, "generateContent");

            return Flux.defer(() -> {
                String response = geminiWebClient.post()
                        .uri(url)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                if (response == null) {
                    return Flux.just("No response from Gemini.");
                }

                ChatResult result = parseGeminiChatResponse(response);
                if (!result.success) {
                    return Flux.just("Da xay ra loi: " + result.error);
                }

                // Cache the result if no chat history
                if ((chatHistory == null || chatHistory.isEmpty()) && result.content != null) {
                    String cacheKey = buildCacheKey(systemPrompt, userMessage, chatHistory);
                    evictIfNeeded();
                    responseCache.put(cacheKey, new CachedResponse(result.content, System.currentTimeMillis()));
                }

                return streamTextAsFlux(result.content);
            });
        } catch (Exception e) {
            log.error("Loi streaming Gemini: {}", e.getMessage());
            return Flux.just("Da xay ra loi: " + e.getMessage());
        }
    }

    /**
     * Stream chat with structured SSE chunks for SSE controller support.
     * For non-SSE models (gemini-2.5-flash), uses non-streaming API then streams word-by-word.
     */
    public Flux<StreamChunk> chatStreamSSE(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        if (!isGeminiConfigured()) {
            return Flux.just(new StreamChunk("stop", "Gemini API key chua duoc cau hinh. Vui long them GEMINI_API_KEY vao file .env.", 0));
        }

        String[] fallbackModels = {"gemini-2.0-flash-lite", "gemini-2.0-flash"};

        return Flux.defer(() -> {
            Map<String, Object> body = buildGeminiChatBody(systemPrompt, userMessage, chatHistory);

            // Try primary model first, then fallbacks
            for (int attempt = 0; attempt <= fallbackModels.length; attempt++) {
                String modelToTry = (attempt == 0) ? chatModel : fallbackModels[attempt - 1];
                String url = buildGeminiUrl(modelToTry, "generateContent");

                try {
                    String response = geminiWebClient.post()
                            .uri(url)
                            .bodyValue(body)
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();

                    if (response == null) {
                        if (attempt < fallbackModels.length) {
                            log.warn("Model {} returned null, trying fallback: {}", modelToTry, fallbackModels[attempt]);
                            continue;
                        }
                        return Flux.just(new StreamChunk("stop", "No response from Gemini.", 0));
                    }

                    ChatResult result = parseGeminiChatResponse(response);
                    if (!result.success) {
                        String err = result.error != null ? result.error : "Unknown error";
                        // Retry on 429 (rate limit) or 503 (unavailable)
                        boolean retryable = err.contains("429") || err.contains("503") || err.contains("429") || err.contains("500");
                        if (retryable && attempt < fallbackModels.length) {
                            log.warn("Model {} failed ({}) retrying with: {}", modelToTry, err, fallbackModels[attempt]);
                            try { Thread.sleep(500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                            continue;
                        }
                        return Flux.just(new StreamChunk("stop", "Da xay ra loi: " + err, 0));
                    }

                    String content = result.content;
                    if (content == null || content.isBlank()) {
                        return Flux.just(new StreamChunk("stop", "", 0));
                    }

                    if (attempt > 0) {
                        log.info("Used fallback model: {} after {} attempts", modelToTry, attempt + 1);
                    }
                    return streamTextAsFlux(content)
                            .map(word -> new StreamChunk("partial", word, 0))
                            .concatWith(Flux.just(new StreamChunk("stop", "", 0)));
                } catch (Exception e) {
                    String errMsg = e.getMessage();
                    boolean retryable = errMsg != null && (errMsg.contains("429") || errMsg.contains("503") || errMsg.contains("429"));
                    if (retryable && attempt < fallbackModels.length) {
                        log.warn("Model {} threw {} trying fallback: {}", modelToTry, e.getClass().getSimpleName(), fallbackModels[attempt]);
                        try { Thread.sleep(500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                        continue;
                    }
                    if (attempt >= fallbackModels.length) {
                        return Flux.just(new StreamChunk("stop", "Da xay ra loi: " + errMsg, 0));
                    }
                }
            }
            return Flux.just(new StreamChunk("stop", "Tat ca model deu khong hoat dong. Vui long thu lai sau.", 0));
        });
    }

    // ===================== EMBEDDINGS =====================

    /**
     * Create an embedding vector for a single text using Gemini.
     * Returns float[] with dimensions matching app.ai.embedding.dimensions.
     */
    public EmbeddingResult createEmbedding(String text) {
        if (!isGeminiConfigured()) {
            return EmbeddingResult.error("Gemini API key chua duoc cau hinh.");
        }

        try {
            String modelName = "models/" + embeddingModel;
            String url = buildGeminiUrl(embeddingModel, "embedContent");

            Map<String, Object> body = Map.of(
                    "model", modelName,
                    "content", Map.of("parts", List.of(Map.of("text", text))),
                    "taskType", "RETRIEVAL_DOCUMENT",
                    "outputDimensionality", embeddingDimensions
            );

            String response = geminiWebClient.post()
                    .uri(url)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseGeminiEmbeddingResponse(response);
        } catch (Exception e) {
            log.error("Loi khi tao embedding voi Gemini: {}", e.getMessage(), e);
            return EmbeddingResult.error("Loi embedding: " + e.getMessage());
        }
    }

    /**
     * Create embeddings for multiple texts (batch).
     */
    public List<EmbeddingResult> createEmbeddings(List<String> texts) {
        if (!isGeminiConfigured()) {
            return texts.stream()
                    .map(t -> EmbeddingResult.error("Gemini API key chua duoc cau hinh."))
                    .toList();
        }

        List<EmbeddingResult> results = new ArrayList<>();
        for (String text : texts) {
            results.add(createEmbedding(text));
        }
        return results;
    }

    // ===================== INTERNAL HELPERS =====================

    private String buildGeminiUrl(String model, String endpoint) {
        return String.format("/models/%s:%s?key=%s", model, endpoint, geminiApiKey);
    }

    private Map<String, Object> buildGeminiChatBody(String systemPrompt, String userMessage,
                                                     List<ChatMessage> chatHistory) {
        List<Map<String, Object>> contents = new ArrayList<>();

        int from = chatHistory != null ? Math.max(0, chatHistory.size() - 20) : 0;
        int size = chatHistory != null ? chatHistory.size() : 0;
        for (int i = from; i < size; i++) {
            ChatMessage msg = chatHistory.get(i);
            Map<String, Object> msgMap = new LinkedHashMap<>();
            msgMap.put("role", mapRoleToGemini(msg.role));
            msgMap.put("parts", List.of(Map.of("text", msg.content)));
            contents.add(msgMap);
        }

        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("role", "user");
        userMap.put("parts", List.of(Map.of("text", userMessage)));
        contents.add(userMap);

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("maxOutputTokens", maxTokens);
        generationConfig.put("temperature", temperature);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", contents);
        body.put("generationConfig", generationConfig);

        if (systemPrompt != null && !systemPrompt.isBlank()) {
            Map<String, Object> systemInstruction = new LinkedHashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text",
                    systemPrompt + "\n\nYou are a helpful AI assistant. Answer questions based on the provided context above. If the context doesn't contain relevant information, say you don't know.")));
            body.put("systemInstruction", systemInstruction);
        }

        return body;
    }

    private String mapRoleToGemini(String role) {
        return switch (role) {
            case "assistant" -> "model";
            case "system" -> "user";
            default -> "user";
        };
    }

    private ChatResult parseGeminiChatResponse(String json) {
        try {
            int candidatesStart = json.indexOf("\"candidates\"");
            if (candidatesStart == -1) {
                int errorStart = json.indexOf("\"error\"");
                if (errorStart != -1) {
                    int msgStart = json.indexOf("\"message\"", errorStart);
                    if (msgStart != -1) {
                        int colon = json.indexOf(":", msgStart);
                        int quote = json.indexOf("\"", colon + 1);
                        int quoteEnd = json.indexOf("\"", quote + 1);
                        String errMsg = json.substring(quote + 1, quoteEnd);
                        return ChatResult.error("Gemini API error: " + errMsg);
                    }
                }
                return ChatResult.error("Khong tim thay candidates trong Gemini response: " + json);
            }

            int contentStart = json.indexOf("\"content\"", candidatesStart);
            int partsStart = json.indexOf("\"parts\"", contentStart);
            int textStart = json.indexOf("\"text\"", partsStart);
            int colon = json.indexOf(":", textStart);
            int quote = json.indexOf("\"", colon + 1);
            int quoteEnd = json.indexOf("\"", quote + 1);
            String content = json.substring(quote + 1, quoteEnd);

            int usageStart = json.indexOf("\"usageMetadata\"");
            int tokens = 0;
            if (usageStart != -1) {
                int totalStart = json.indexOf("\"totalTokenCount\"", usageStart);
                if (totalStart != -1 && totalStart - usageStart < 300) {
                    int c = json.indexOf(":", totalStart);
                    int comma = json.indexOf(",", c);
                    int end = comma != -1 ? comma : json.indexOf("}", c);
                    String tokenStr = json.substring(c + 1, end).trim();
                    tokens = Integer.parseInt(tokenStr);
                }
            }

            return ChatResult.success(content, tokens);
        } catch (Exception e) {
            log.error("Loi parse Gemini chat response: {}", e.getMessage());
            return ChatResult.error("Loi parse response: " + e.getMessage());
        }
    }

    private Flux<String> streamTextAsFlux(String text) {
        if (text == null || text.isBlank()) {
            return Flux.empty();
        }
        String[] words = text.split("(?<=\\s)|(?=\\s)");
        return Flux.fromArray(words)
                .filter(w -> !w.isBlank())
                .flatMap(word -> Flux.just(word)
                        .delaySubscription(java.time.Duration.ofMillis(5)));
    }

    private Flux<String> parseGeminiStreamLine(String data) {
        try {
            int textStart = data.indexOf("\"text\"");
            if (textStart == -1) return Flux.empty();
            int colon = data.indexOf(":", textStart);
            int quote = jsonNextQuote(data, colon + 1);
            if (quote == -1) return Flux.empty();
            int quoteEnd = jsonNextQuote(data, quote + 1);
            if (quoteEnd == -1) return Flux.empty();
            String content = data.substring(quote + 1, quoteEnd);
            return Flux.just(content);
        } catch (Exception e) {
            return Flux.empty();
        }
    }

    private Flux<StreamChunk> parseGeminiStreamChunk(String data) {
        try {
            int finishStart = data.indexOf("\"finishReason\"");
            String finish = "";
            if (finishStart != -1) {
                int colon = data.indexOf(":", finishStart);
                int quote = jsonNextQuote(data, colon + 1);
                int quoteEnd = jsonNextQuote(data, quote + 1);
                if (quote != -1 && quoteEnd != -1) {
                    finish = data.substring(quote + 1, quoteEnd);
                }
            }

            int textStart = data.indexOf("\"text\"");
            String content = "";
            if (textStart != -1) {
                int colon = data.indexOf(":", textStart);
                int quote = jsonNextQuote(data, colon + 1);
                int quoteEnd = jsonNextQuote(data, quote + 1);
                if (quote != -1 && quoteEnd != -1) {
                    content = data.substring(quote + 1, quoteEnd);
                }
            }

            return Flux.just(new StreamChunk(finish, content, 0));
        } catch (Exception e) {
            return Flux.just(new StreamChunk("stop", "", 0));
        }
    }

    private int jsonNextQuote(String s, int from) {
        for (int i = from; i < s.length(); i++) {
            if (s.charAt(i) == '"' && (i == 0 || s.charAt(i - 1) != '\\')) {
                return i;
            }
        }
        return -1;
    }

    private EmbeddingResult parseGeminiEmbeddingResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode valuesNode = root.path("embedding").path("values");
            if (valuesNode.isMissingNode()) {
                valuesNode = root.path("predictions").path(0).path("embedding").path("values");
            }
            if (valuesNode.isMissingNode()) {
                return EmbeddingResult.error("Khong tim thay embedding values trong response: " + json.substring(0, Math.min(200, json.length())));
            }

            float[] embedding = new float[valuesNode.size()];
            for (int i = 0; i < valuesNode.size(); i++) {
                embedding[i] = (float) valuesNode.get(i).asDouble();
            }
            return EmbeddingResult.success(embedding);
        } catch (Exception e) {
            log.error("Loi parse Gemini embedding response: {}", e.getMessage());
            return EmbeddingResult.error("Loi parse embedding: " + e.getMessage());
        }
    }

    // ===================== INNER CLASSES =====================

    public static class ChatMessage {
        public String role;
        public String content;
        public ChatMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }
    }

    public static class ChatResult {
        public boolean success;
        public String content;
        public String error;
        public int tokens;

        private ChatResult() {}

        public static ChatResult success(String content, int tokens) {
            ChatResult r = new ChatResult();
            r.success = true;
            r.content = content;
            r.tokens = tokens;
            return r;
        }

        public static ChatResult error(String message) {
            ChatResult r = new ChatResult();
            r.success = false;
            r.error = message;
            return r;
        }
    }

    public static class EmbeddingResult {
        public boolean success;
        public float[] embedding;
        public String error;

        private EmbeddingResult() {}

        public static EmbeddingResult success(float[] embedding) {
            EmbeddingResult r = new EmbeddingResult();
            r.success = true;
            r.embedding = embedding;
            return r;
        }

        public static EmbeddingResult error(String message) {
            EmbeddingResult r = new EmbeddingResult();
            r.success = false;
            r.error = message;
            return r;
        }
    }

    public static class StreamChunk {
        public String finishReason;
        public String content;
        public int tokens;

        public StreamChunk(String finishReason, String content, int tokens) {
            this.finishReason = finishReason;
            this.content = content;
            this.tokens = tokens;
        }
    }
}
