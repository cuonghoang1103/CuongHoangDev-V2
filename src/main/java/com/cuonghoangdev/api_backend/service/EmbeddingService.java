package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service tao embedding vector bang Gemini.
 *
 * Chu y:
 * - Su dung Gemini text-embedding-004 (768 chieu)
 * - Neu co pgvector, vector se duoc luu vao cot `embedding` (type: vector)
 * - Neu khong co pgvector, van tao vector binh thuong nhung DB chi luu text
 *   (RAG van hoat dong tot vi RAGSearchService su dung text-based search)
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private final DocumentChunkRepository chunkRepository;
    private final AIService aiService;

    @Value("${app.ai.embedding.dimensions:768}")
    private int embeddingDimensions;

    public EmbeddingService(DocumentChunkRepository chunkRepository, AIService aiService) {
        this.chunkRepository = chunkRepository;
        this.aiService = aiService;
    }

    /**
     * Tao embedding vector cho mot doan text.
     *
     * @param text Doan text can embedding
     * @return Mang float[] chieu 768 (text-embedding-004)
     */
    public float[] createEmbedding(String text) {
        if (!aiService.isConfigured()) {
            log.warn("Gemini API chua cau hinh - tra ve vector rong");
            return new float[embeddingDimensions];
        }

        try {
            AIService.EmbeddingResult result = aiService.createEmbedding(text);
            if (result.success && result.embedding != null) {
                log.debug("Da tao embedding cho '{}...' ({} chieu)",
                        text.substring(0, Math.min(30, text.length())), result.embedding.length);
                return result.embedding;
            } else {
                log.warn("Embedding that bai: {}", result.error);
            }
        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
            log.error("Loi khi tao embedding: {}", e.getMessage());
        }

        return new float[embeddingDimensions];
    }

    /**
     * Tao embeddings cho nhieu texts cung luc (batch).
     * Nhanh hon goi lan luot nhieu lan.
     */
    public List<float[]> createEmbeddings(List<String> texts) {
        if (!aiService.isConfigured()) {
            log.warn("Gemini API chua cau hinh - tra ve vector rong");
            return texts.stream().map(t -> new float[embeddingDimensions]).toList();
        }

        try {
            List<AIService.EmbeddingResult> results = aiService.createEmbeddings(texts);
            List<float[]> embeddings = new ArrayList<>();
            for (AIService.EmbeddingResult result : results) {
                if (result.success && result.embedding != null) {
                    embeddings.add(result.embedding);
                } else {
                    embeddings.add(new float[embeddingDimensions]);
                }
            }
            log.info("Da tao {} embeddings", embeddings.size());
            return embeddings;
        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
            log.error("Loi batch embedding: {}", e.getMessage());
            return texts.stream().map(t -> new float[embeddingDimensions]).toList();
        }
    }

    /**
     * Tao va luu mot embedding vao database.
     */
    @Transactional
    public DocumentChunk createAndSaveEmbedding(String content, Map<String, Object> metadata,
                                                String documentId, String documentType, int chunkIndex) {
            float[] embedding = createEmbedding(content);

        DocumentChunk chunk = new DocumentChunk();
        chunk.setContent(content);
        chunk.setMetadata(toJson(metadata));
        chunk.setDocumentId(documentId);
        chunk.setDocumentType(documentType);
        chunk.setChunkIndex(chunkIndex);
        chunk.setEmbedding(vectorToString(embedding));

        DocumentChunk saved = chunkRepository.save(chunk);
        log.info("Da save embedding cho documentId={}, chunkIndex={}", documentId, chunkIndex);
        return saved;
    }

    /**
     * Chuyen mang float[] thanh chuoi de luu vao DB.
     * Format: "[0.123,-0.456,...]"
     */
    public String vectorToString(float[] vector) {
        if (vector == null || vector.length == 0) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Chuyen chuoi vector thanh mang float[].
     * Format dau vao: "[0.123,-0.456,...]"
     */
    public float[] stringToVector(String vectorStr) {
        if (vectorStr == null || vectorStr.isBlank() || vectorStr.equals("[]")) {
            return new float[embeddingDimensions];
        }
        try {
            String content = vectorStr.substring(1, vectorStr.length() - 1);
            if (content.isBlank()) return new float[embeddingDimensions];
            String[] parts = content.split(",");
            float[] result = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                result[i] = Float.parseFloat(parts[i].trim());
            }
            return result;
        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
            log.warn("Khong the parse vector string: {}", e.getMessage());
            return new float[embeddingDimensions];
        }
    }

    /**
     * Tinh cosine similarity giua 2 vector.
     * 
     * @param a Vector thu nhat
     * @param b Vector thu hai
     * @return Gia tri similarity [-1, 1], 1 = giong nhau hoan toan
     */
    public double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length || a.length == 0) {
            return 0;
        }

        double dotProduct = 0;
        double normA = 0;
        double normB = 0;

        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA == 0 || normB == 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Chuyen Map thanh chuoi JSON thu cong (khong can thu vien ngoai).
     */
    private String toJson(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) return "{}";
        StringBuilder sb = new StringBuilder("{");
        var iterator = metadata.entrySet().iterator();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            sb.append("\"").append(entry.getKey()).append("\":");
            Object val = entry.getValue();
            if (val == null) {
                sb.append("null");
            } else if (val instanceof String) {
                sb.append("\"").append(escapeJson((String) val)).append("\"");
            } else if (val instanceof List) {
                sb.append("[");
                List<?> lst = (List<?>) val;
                for (int i = 0; i < lst.size(); i++) {
                    if (i > 0) sb.append(",");
                    Object item = lst.get(i);
                    if (item instanceof String) {
                        sb.append("\"").append(escapeJson((String) item)).append("\"");
                    } else {
                        sb.append(item);
                    }
                }
                sb.append("]");
            } else {
                sb.append(val);
            }
            if (iterator.hasNext()) sb.append(",");
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                 .replace("\"", "\\\"")
                 .replace("\n", "\\n")
                 .replace("\r", "\\r")
                 .replace("\t", "\\t");
    }
}
