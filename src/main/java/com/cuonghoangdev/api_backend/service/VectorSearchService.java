package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VectorSearchService {

    private final DocumentChunkRepository documentChunkRepository;
    private final EmbeddingService embeddingService;

    @Value("${app.ai.embedding.dimensions:1536}")
    private int embeddingDimensions;

    public VectorSearchService(DocumentChunkRepository documentChunkRepository,
                            EmbeddingService embeddingService) {
        this.documentChunkRepository = documentChunkRepository;
        this.embeddingService = embeddingService;
    }

    public float[] createEmbedding(String query) {
        return embeddingService.createEmbedding(query);
    }

    public List<SearchResult> semanticSearch(String query, int topK, String documentType, double threshold) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        List<DocumentChunk> chunks;
        if (documentType != null && !documentType.isBlank()) {
            chunks = documentChunkRepository.findAllByDocumentTypeOrdered(documentType);
        } else {
            chunks = documentChunkRepository.findAll();
        }

        if (chunks.isEmpty()) {
            return List.of();
        }

        float[] queryVector = createEmbedding(query);
        boolean hasRealVectors = hasNonZeroVector(queryVector);

        List<ScoredResult> scored = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            double score;
            String chunkEmbedding = chunk.getEmbedding();
            if (hasRealVectors && chunkEmbedding != null && !chunkEmbedding.isBlank()) {
                float[] chunkVector = embeddingService.stringToVector(chunkEmbedding);
                score = embeddingService.cosineSimilarity(queryVector, chunkVector);
            } else {
                score = textSimilarity(query, chunk.getContent());
            }

            if (score >= threshold) {
                SearchResult sr = new SearchResult();
                sr.id = chunk.getId();
                sr.content = chunk.getContent();
                sr.metadata = chunk.getMetadata();
                sr.documentId = chunk.getDocumentId();
                sr.documentType = chunk.getDocumentType();
                sr.chunkIndex = chunk.getChunkIndex();
                sr.similarity = score;
                scored.add(new ScoredResult(sr, score));
            }
        }

        scored.sort((a, b) -> Double.compare(b.score, a.score));
        return scored.stream().limit(topK).map(s -> s.result).toList();
    }

    public List<SearchResult> semanticSearchAll(String query, int topK, double threshold) {
        return semanticSearch(query, topK, null, threshold);
    }

    public String buildContext(List<SearchResult> results) {
        if (results == null || results.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        int i = 1;
        for (SearchResult r : results) {
            sb.append("--- Tai lieu ").append(i++).append(" ---\n");
            sb.append(r.content).append("\n\n");
        }
        return sb.toString().trim();
    }

    private double textSimilarity(String query, String content) {
        if (query == null || content == null || query.isBlank() || content.isBlank()) {
            return 0;
        }

        String lowerQuery = query.toLowerCase();
        String lowerContent = content.toLowerCase();
        String[] queryWords = lowerQuery.split("\\s+");

        double score = 0;

        // Exact phrase match
        if (lowerContent.contains(lowerQuery)) {
            score += 5.0;
        }

        // N-gram phrases
        for (int len = 3; len >= 2; len--) {
            for (int i = 0; i <= queryWords.length - len; i++) {
                String phrase = String.join(" ", Arrays.copyOfRange(queryWords, i, i + len));
                if (lowerContent.contains(phrase)) {
                    score += 2.0 * len;
                }
            }
        }

        // Single keyword match
        for (String word : queryWords) {
            if (word.length() < 2) continue;
            if (lowerContent.contains(word)) {
                score += 1.0;
            }
        }

        score = score / (queryWords.length + 1);

        int len = content.length();
        if (len >= 100 && len <= 3000) score *= 1.3;
        else if (len >= 50 && len <= 5000) score *= 1.1;
        else if (len > 10000) score *= 0.7;

        return Math.min(score, 10.0);
    }

    private boolean hasNonZeroVector(float[] vector) {
        if (vector == null || vector.length == 0) return false;
        for (float v : vector) {
            if (Math.abs(v) > 0.0001f) return true;
        }
        return false;
    }

    public static class SearchResult {
        public Long id;
        public String content;
        public String metadata;
        public String documentId;
        public String documentType;
        public Integer chunkIndex;
        public Double similarity;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getMetadata() { return metadata; }
        public void setMetadata(String metadata) { this.metadata = metadata; }
        public String getDocumentId() { return documentId; }
        public void setDocumentId(String documentId) { this.documentId = documentId; }
        public String getDocumentType() { return documentType; }
        public void setDocumentType(String documentType) { this.documentType = documentType; }
        public Integer getChunkIndex() { return chunkIndex; }
        public void setChunkIndex(Integer chunkIndex) { this.chunkIndex = chunkIndex; }
        public Double getSimilarity() { return similarity; }
        public void setSimilarity(Double similarity) { this.similarity = similarity; }
    }

    private record ScoredResult(SearchResult result, double score) {}
}
