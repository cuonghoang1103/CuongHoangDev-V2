package com.cuonghoangdev.api_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.*;

/**
 * Service goi truc tiep OpenAI API khong can Spring AI.
 * Su dung WebClient (WebFlux) de goi chat completion & embedding.
 * 
 * Huong dan: them OPENAI_API_KEY vao .env hoac bien moi truong.
 * Model mac dinh: gpt-4o-mini (re, chat)
 *                 text-embedding-3-small (embedding)
 */
@Service
public class OpenAIService {

    private static final Logger log = LoggerFactory.getLogger(OpenAIService.class);

    private static final String OPENAI_BASE_URL = "https://api.openai.com/v1";

    private final WebClient webClient;
    private final String apiKey;
    private final String chatModel;
    private final String embeddingModel;
    private final int maxTokens;
    private final float temperature;

    public OpenAIService(
            @Value("${spring.ai.openai.api-key:EMPTY}") String apiKey,
            @Value("${app.ai.chat.model:gpt-4o-mini}") String chatModel,
            @Value("${app.ai.embedding.model:text-embedding-3-small}") String embeddingModel,
            @Value("${app.ai.max-tokens:2048}") int maxTokens,
            @Value("${app.ai.temperature:0.7}") float temperature) {
        this.apiKey = apiKey;
        this.chatModel = chatModel;
        this.embeddingModel = embeddingModel;
        this.maxTokens = maxTokens;
        this.temperature = temperature;
        this.webClient = WebClient.builder()
                .baseUrl(OPENAI_BASE_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("OpenAIService initialized. Chat model: {}, Embedding model: {}", chatModel, embeddingModel);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isEmpty() && !apiKey.equals("EMPTY") && !apiKey.equals("your-api-key-here");
    }

    // ===================== CHAT NON-STREAMING =====================

    /**
     * Goi OpenAI chat completion (non-streaming)
     * @param systemPrompt  System prompt (co the la RAG context)
     * @param userMessage  Tin nhan nguoi dung
     * @param chatHistory  Lich su chat (khong tinh 2 tin nhan cuoi)
     * @return Tap hop cac lua chon tra ve
     */
    public ChatResult chat(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        if (!isConfigured()) {
            return ChatResult.error("OpenAI API key chua duoc cau hinh. Vui long them OPENAI_API_KEY.");
        }

        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        // Chat history (gioi han 20 tin nhan de tranh vuot token)
        if (chatHistory != null) {
            int from = Math.max(0, chatHistory.size() - 20);
            for (int i = from; i < chatHistory.size(); i++) {
                ChatMessage msg = chatHistory.get(i);
                messages.add(Map.of("role", msg.role, "content", msg.content));
            }
        }

        // Tin nhan hien tai
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", chatModel);
        body.put("messages", messages);
        body.put("max_tokens", maxTokens);
        body.put("temperature", temperature);

        try {
            String response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseChatResponse(response);
        } catch (Exception e) {
            log.error("Loi khi goi OpenAI chat API: {}", e.getMessage(), e);
            return ChatResult.error("Loi khi goi AI: " + e.getMessage());
        }
    }

    // ===================== CHAT STREAMING (SSE) =====================

    /**
     * Chat streaming (SSE) - tra ve Flux<String> (tuyen tinh).
     * Su dung SSE de stream token-by-token.
     */
    public Flux<String> chatStream(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        if (!isConfigured()) {
            return Flux.just("OpenAI API key chua duoc cau hinh. Vui long them OPENAI_API_KEY vao bien moi truong.");
        }

        List<Map<String, String>> messages = new ArrayList<>();

        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        if (chatHistory != null) {
            int from = Math.max(0, chatHistory.size() - 20);
            for (int i = from; i < chatHistory.size(); i++) {
                ChatMessage msg = chatHistory.get(i);
                messages.add(Map.of("role", msg.role, "content", msg.content));
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", chatModel);
        body.put("messages", messages);
        body.put("max_tokens", maxTokens);
        body.put("temperature", temperature);
        body.put("stream", true);

        return webClient.post()
                .uri("/chat/completions")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> !line.isBlank())
                .filter(line -> line.startsWith("data: "))
                .map(line -> line.substring(6).trim())
                .filter(line -> !line.equals("[DONE]"))
                .flatMap(this::parseStreamLine);
    }

    private Flux<String> parseStreamLine(String data) {
        if (data.isBlank() || !data.startsWith("{")) {
            return Flux.empty();
        }
        try {
            int deltaStart = data.indexOf("\"delta\":");
            if (deltaStart == -1) return Flux.empty();
            int contentStart = data.indexOf("\"content\"", deltaStart);
            if (contentStart == -1) return Flux.empty();
            int colon = data.indexOf(":", contentStart);
            int quote = data.indexOf("\"", colon + 1);
            int quoteEnd = data.indexOf("\"", quote + 1);
            String content = data.substring(quote + 1, quoteEnd);
            return Flux.just(content);
        } catch (Exception e) {
            return Flux.empty();
        }
    }

    /**
     * Stream tu OpenAI API voi SSE (Server-Sent Events).
     * Day la method chinh duoc su dung boi AIChatService.
     */
    public Flux<StreamChunk> chatStreamSSE(String systemPrompt, String userMessage, List<ChatMessage> chatHistory) {
        if (!isConfigured()) {
            return Flux.just(new StreamChunk("error", "OpenAI API key chua duoc cau hinh. Vui long them OPENAI_API_KEY vao bien moi truong.", 0));
        }

        List<Map<String, String>> messages = new ArrayList<>();

        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }

        if (chatHistory != null) {
            int from = Math.max(0, chatHistory.size() - 20);
            for (int i = from; i < chatHistory.size(); i++) {
                ChatMessage msg = chatHistory.get(i);
                messages.add(Map.of("role", msg.role, "content", msg.content));
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", chatModel);
        body.put("messages", messages);
        body.put("max_tokens", maxTokens);
        body.put("temperature", temperature);
        body.put("stream", true);

        return webClient.post()
                .uri("/chat/completions")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> line.startsWith("data: "))
                .filter(line -> !line.equals("data: [DONE]"))
                .map(line -> line.substring(6).trim())
                .map(this::parseSSEChunk);
    }

    // ===================== EMBEDDINGS =====================

    /**
     * Tao embedding vector cho mot doan text bang OpenAI.
     * @param text Doan text can embedding
     * @return Mang float[] (1536 chieu voi text-embedding-3-small)
     */
    public EmbeddingResult createEmbedding(String text) {
        if (!isConfigured()) {
            return EmbeddingResult.error("OpenAI API key chua duoc cau hinh.");
        }

        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", text
        );

        try {
            String response = webClient.post()
                    .uri("/embeddings")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseEmbeddingResponse(response);
        } catch (Exception e) {
            log.error("Loi khi tao embedding: {}", e.getMessage(), e);
            return EmbeddingResult.error("Loi embedding: " + e.getMessage());
        }
    }

    /**
     * Tao embeddings cho nhieu texts cung luc.
     */
    public List<EmbeddingResult> createEmbeddings(List<String> texts) {
        if (!isConfigured()) {
            return texts.stream()
                    .map(t -> EmbeddingResult.error("OpenAI API key chua duoc cau hinh."))
                    .toList();
        }

        Map<String, Object> body = Map.of(
                "model", embeddingModel,
                "input", texts
        );

        try {
            String response = webClient.post()
                    .uri("/embeddings")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseEmbeddingsResponse(response);
        } catch (Exception e) {
            log.error("Loi khi tao embeddings batch: {}", e.getMessage(), e);
            return texts.stream()
                    .map(t -> EmbeddingResult.error("Loi embedding: " + e.getMessage()))
                    .toList();
        }
    }

    // ===================== PARSING HELPERS =====================

    private ChatResult parseChatResponse(String json) {
        try {
            // Simple JSON parsing khong can thu vien ngoai
            int choicesStart = json.indexOf("\"choices\"");
            if (choicesStart == -1) {
                return ChatResult.error("Khong tim thay choices trong response: " + json);
            }

            int contentStart = json.indexOf("\"content\"", choicesStart);
            if (contentStart == -1) {
                return ChatResult.error("Khong tim thay content trong response");
            }

            int colonPos = json.indexOf(":", contentStart);
            int quoteStart = json.indexOf("\"", colonPos + 1);
            int quoteEnd = json.indexOf("\"", quoteStart + 1);
            String content = json.substring(quoteStart + 1, quoteEnd);

            int usageStart = json.indexOf("\"usage\"");
            int tokens = 0;
            if (usageStart != -1) {
                int promptTokensStart = json.indexOf("\"prompt_tokens\"", usageStart);
                if (promptTokensStart != -1 && promptTokensStart - usageStart < 500) {
                    int colon = json.indexOf(":", promptTokensStart);
                    int comma = json.indexOf(",", colon);
                    String tokenStr = json.substring(colon + 1, comma).trim();
                    tokens = Integer.parseInt(tokenStr);
                }
            }

            return ChatResult.success(content, tokens);
        } catch (Exception e) {
            log.error("Loi parse chat response: {}", e.getMessage());
            return ChatResult.error("Loi parse response: " + e.getMessage());
        }
    }

    private StreamChunk parseSSEChunk(String data) {
        try {
            int deltaStart = data.indexOf("\"delta\":");
            if (deltaStart == -1) return new StreamChunk("none", "", 0);

            int contentStart = data.indexOf("\"content\"", deltaStart);
            if (contentStart == -1) return new StreamChunk("none", "", 0);

            int colon = data.indexOf(":", contentStart);
            int quote = data.indexOf("\"", colon + 1);
            int quoteEnd = data.indexOf("\"", quote + 1);
            String content = data.substring(quote + 1, quoteEnd);

            int finishStart = data.indexOf("\"finish_reason\"");
            String finish = "";
            if (finishStart != -1) {
                int colon2 = data.indexOf(":", finishStart);
                int q1 = data.indexOf("\"", colon2 + 1);
                int q2 = data.indexOf("\"", q1 + 1);
                finish = data.substring(q1 + 1, q2);
            }

            return new StreamChunk(finish, content, 0);
        } catch (Exception e) {
            return new StreamChunk("none", "", 0);
        }
    }

    private EmbeddingResult parseEmbeddingResponse(String json) {
        try {
            int dataStart = json.indexOf("\"data\"");
            int embeddingStart = json.indexOf("\"embedding\"", dataStart);
            int bracketStart = json.indexOf("[", embeddingStart);
            int bracketEnd = json.lastIndexOf("]");
            String vectorStr = json.substring(bracketStart + 1, bracketEnd);
            String[] parts = vectorStr.split(",");
            float[] embedding = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                embedding[i] = Float.parseFloat(parts[i].trim());
            }
            return EmbeddingResult.success(embedding);
        } catch (Exception e) {
            log.error("Loi parse embedding response: {}", e.getMessage());
            return EmbeddingResult.error("Loi parse embedding: " + e.getMessage());
        }
    }

    private List<EmbeddingResult> parseEmbeddingsResponse(String json) {
        try {
            List<EmbeddingResult> results = new ArrayList<>();
            int dataStart = json.indexOf("\"data\"");
            int dataEnd = json.lastIndexOf("]");
            String dataSection = json.substring(dataStart + 7, dataEnd);
            String[] items = dataSection.split("\\{\"embedding\":");
            for (String item : items) {
                if (item.isBlank()) continue;
                int bracketStart = item.indexOf("[");
                int bracketEnd = item.lastIndexOf("]");
                if (bracketStart == -1 || bracketEnd == -1) {
                    results.add(EmbeddingResult.error("Parse error"));
                    continue;
                }
                String vectorStr = item.substring(bracketStart + 1, bracketEnd);
                String[] parts = vectorStr.split(",");
                float[] embedding = new float[parts.length];
                for (int i = 0; i < parts.length; i++) {
                    embedding[i] = Float.parseFloat(parts[i].trim());
                }
                results.add(EmbeddingResult.success(embedding));
            }
            return results;
        } catch (Exception e) {
            log.error("Loi parse embeddings batch response: {}", e.getMessage());
            return List.of(EmbeddingResult.error("Loi parse embeddings: " + e.getMessage()));
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
