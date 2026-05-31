package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Vector RAG Service — semantic search using pgvector HNSW indexes.
 *
 * Pipeline:
 *   1. Embed user query with Gemini text-embedding-004
 *   2. Search pgvector using cosine similarity (HNSW)
 *   3. Return ranked context chunks
 *
 * Falls back to text-based search if Gemini is not configured.
 */
@Service
public class VectorRAGService {

    private static final Logger log = LoggerFactory.getLogger(VectorRAGService.class);

    private final DocumentChunkRepository chunkRepository;
    private final AIService aiService;

    public VectorRAGService(DocumentChunkRepository chunkRepository, AIService aiService) {
        this.chunkRepository = chunkRepository;
        this.aiService = aiService;
    }

    // ============================================================
    // Public API
    // ============================================================

    /**
     * Semantic search — finds top-K most relevant chunks.
     * Uses pgvector cosine similarity when Gemini API key is available.
     * Falls back to text matching otherwise.
     *
     * @param query User question
     * @param topK  Number of chunks to retrieve (default 5)
     * @param documentType Optional filter (ABOUT, SKILL, PROJECT, BLOG, etc.)
     * @return Search results with context and sources
     */
    public SearchResult semanticSearch(String query, int topK, String documentType) {
        if (query == null || query.isBlank()) {
            return SearchResult.empty();
        }

        // Count chunks available
        long indexed = chunkRepository.countIndexedChunks();
        if (indexed == 0) {
            log.warn("No indexed chunks found — falling back to text search");
            return textFallbackSearch(query, topK, documentType);
        }

        // Use vector search if Gemini is configured
        if (aiService.isConfigured()) {
            return vectorSearch(query, topK, documentType);
        } else {
            return textFallbackSearch(query, topK, documentType);
        }
    }

    // ============================================================
    // Vector Search (pgvector)
    // ============================================================

    private SearchResult vectorSearch(String query, int topK, String documentType) {
        try {
            // Step 1: Embed the query
            AIService.EmbeddingResult embedResult = aiService.createEmbedding(query);
            if (!embedResult.success || embedResult.embedding == null) {
                log.warn("Embedding query failed: {}", embedResult.error);
                return textFallbackSearch(query, topK, documentType);
            }

            float[] queryVector = embedResult.embedding;
            log.debug("Query embedding created, dims={}", queryVector.length);

            // Step 2: Vector search in pgvector (pass as pgvector literal string)
            String vectorLiteral = toPgVectorLiteral(embedResult.embedding);
            List<DocumentChunk> chunks;
            if (documentType != null && !documentType.isBlank()) {
                chunks = chunkRepository.findTopKByEmbeddingSimilarityFiltered(vectorLiteral, documentType, topK);
            } else {
                chunks = chunkRepository.findTopKByEmbeddingSimilarity(vectorLiteral, topK);
            }

            if (chunks.isEmpty()) {
                log.debug("No vector results for query '{}' — trying text fallback", query);
                return textFallbackSearch(query, topK, documentType);
            }

            return buildResult(chunks, query, true);

        } catch (Exception e) {
            log.error("Vector search error: {}", e.getMessage(), e);
            return textFallbackSearch(query, topK, documentType);
        }
    }

    // ============================================================
    // Text Fallback (when no Gemini key or no embeddings)
    // ============================================================

    private SearchResult textFallbackSearch(String query, int topK, String documentType) {
        List<DocumentChunk> chunks;
        if (documentType != null && !documentType.isBlank()) {
            chunks = chunkRepository.findByDocumentType(documentType);
        } else {
            chunks = chunkRepository.findAll();
        }

        if (chunks.isEmpty()) {
            return SearchResult.empty();
        }

        // Score by keyword + semantic proximity
        String[] keywords = query.toLowerCase()
                .replaceAll("[^a-zA-ZÀ-ỹ0-9\\s]", " ")
                .split("\\s+");

        List<ScoredChunk> scored = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            double score = computeTextScore(query, chunk.getContent(), keywords);
            if (score > 0) {
                scored.add(new ScoredChunk(chunk, score));
            }
        }

        scored.sort((a, b) -> Double.compare(b.score, a.score));
        List<ScoredChunk> top = scored.size() > topK ? scored.subList(0, topK) : scored;

        return buildResultFromScored(top, query);
    }

    private double computeTextScore(String query, String content, String[] keywords) {
        if (content == null || content.isBlank()) return 0;
        String lowerContent = content.toLowerCase();
        String lowerQuery = query.toLowerCase();

        double score = 0;

        // Exact phrase match — highest weight
        if (lowerContent.contains(lowerQuery)) {
            score += 5.0;
        }

        // N-gram phrase matching (2-4 words)
        String[] queryWords = lowerQuery.split("\\s+");
        if (queryWords.length >= 2) {
            for (int len = Math.min(queryWords.length, 5); len >= 2; len--) {
                for (int start = 0; start <= queryWords.length - len; start++) {
                    String phrase = String.join(" ", Arrays.copyOfRange(queryWords, start, start + len));
                    if (lowerContent.contains(phrase)) {
                        score += 2.0 * len / queryWords.length;
                    }
                }
            }
        }

        // Individual keyword match
        for (String keyword : keywords) {
            if (keyword.length() < 2) continue;
            if (lowerContent.contains(keyword)) {
                score += 1.0;
            }
        }

        // Bonus for short queries
        if (queryWords.length <= 5) score += 2.0;

        // Bonus for content length in sweet spot (200-3000 chars)
        int len = content.length();
        if (len >= 100 && len <= 3000) score += 1.5;
        else if (len >= 50 && len <= 5000) score += 0.5;

        return score;
    }

    // ============================================================
    // Result Building
    // ============================================================

    private SearchResult buildResult(List<DocumentChunk> chunks, String query, boolean fromVector) {
        StringBuilder context = new StringBuilder();
        List<String> sources = new ArrayList<>();

        int i = 1;
        for (DocumentChunk chunk : chunks) {
            context.append("--- TAI LIEU ").append(i++).append(" ---\n");
            context.append(chunk.getContent()).append("\n\n");
            sources.add(extractTitle(chunk.getMetadata()));
        }

        log.info("Vector RAG: found {} chunks for query '{}'", chunks.size(), query.substring(0, Math.min(40, query.length())));
        return new SearchResult(context.toString().trim(), sources, chunks.size(), fromVector);
    }

    private SearchResult buildResultFromScored(List<ScoredChunk> scored, String query) {
        List<DocumentChunk> chunks = scored.stream().map(s -> s.chunk).toList();
        StringBuilder context = new StringBuilder();
        List<String> sources = new ArrayList<>();

        int i = 1;
        for (ScoredChunk sc : scored) {
            context.append("--- TAI LIEU ").append(i++).append(" ---\n");
            context.append(sc.chunk.getContent()).append("\n\n");
            sources.add(extractTitle(sc.chunk.getMetadata()));
        }

        log.info("Text RAG: found {} chunks for query '{}'", chunks.size(), query.substring(0, Math.min(40, query.length())));
        return new SearchResult(context.toString().trim(), sources, chunks.size(), false);
    }

    private String extractTitle(String metadata) {
        if (metadata == null || metadata.isBlank()) return "N/A";
        try {
            // Try "title" key
            int titleIdx = metadata.indexOf("\"title\"");
            if (titleIdx == -1) {
                int nameIdx = metadata.indexOf("\"name\"");
                if (nameIdx == -1) return metadata.length() > 50 ? metadata.substring(0, 50) + "..." : metadata;
                return extractJsonValue(metadata, nameIdx);
            }
            return extractJsonValue(metadata, titleIdx);
        } catch (Exception e) {
            return "N/A";
        }
    }

    private String extractJsonValue(String json, int keyIndex) {
        int colon = json.indexOf(":", keyIndex);
        int quote1 = json.indexOf("\"", colon + 1);
        int quote2 = json.indexOf("\"", quote1 + 1);
        if (quote1 == -1 || quote2 == -1) return "N/A";
        return json.substring(quote1 + 1, quote2);
    }

    private String toPgVectorLiteral(float[] vector) {
        if (vector == null || vector.length == 0) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    // ============================================================
    // Inner Classes
    // ============================================================

    public record SearchResult(
            String context,
            List<String> sources,
            int chunksFound,
            boolean fromVector
    ) {
        public static SearchResult empty() {
            return new SearchResult("", List.of(), 0, false);
        }

        public boolean hasContext() {
            return context != null && !context.isBlank();
        }
    }

    private record ScoredChunk(DocumentChunk chunk, double score) {}
}
