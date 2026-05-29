package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RAGSearchService {

    private final DocumentChunkRepository chunkRepository;

    public RAGSearchService(DocumentChunkRepository chunkRepository) {
        this.chunkRepository = chunkRepository;
    }

    /**
     * Tim kiem cac chunk lien quan nhat den cau hoi nguoi dung.
     * 
     * Qua trinh RAG:
     * 1. Nhan cau hoi tu nguoi dung
     * 2. Tim kiem trong database nhung chunk lien quan (text-based similarity)
     * 3. Build prompt voi context tu cac chunk tim duoc
     * 4. Tra ve prompt da duoc enhance voi context
     */
    public SearchResult search(String query, int topK, String documentType) {
        if (query == null || query.isBlank()) {
            return new SearchResult("", List.of(), 0);
        }

        String[] keywords = query.toLowerCase()
                .replaceAll("[^a-zA-ZÀ-ỹ0-9\\s]", " ")
                .split("\\s+");

        List<DocumentChunk> chunks;
        if (documentType != null && !documentType.isBlank()) {
            chunks = chunkRepository.findAllByDocumentTypeOrdered(documentType);
        } else {
            chunks = chunkRepository.findAll();
        }

        if (chunks.isEmpty()) {
            return new SearchResult("", List.of(), 0);
        }

        // Tinh diem similarity cho tung chunk
        List<ScoredChunk> scored = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            double score = computeSimilarity(query, chunk.getContent(), keywords);
            if (score > 0) {
                scored.add(new ScoredChunk(chunk, score));
            }
        }

        // Sap xep theo diem giam dan, lay topK
        scored.sort((a, b) -> Double.compare(b.score, a.score));
        List<ScoredChunk> top = scored.size() > topK ? scored.subList(0, topK) : scored;

        // Build context
        StringBuilder context = new StringBuilder();
        List<String> sources = new ArrayList<>();
        int i = 1;
        for (ScoredChunk sc : top) {
            context.append("--- TAI LIEU ").append(i++).append(" ---\n");
            context.append(sc.chunk.getContent()).append("\n\n");
            sources.add(sc.chunk.getDocumentType() + ": " + extractTitle(sc.chunk.getMetadata()));
        }

        return new SearchResult(context.toString().trim(), sources, top.size());
    }

    /**
     * Tinh diem similarity giua cau hoi va noi dung chunk.
     */
    private double computeSimilarity(String query, String content, String[] keywords) {
        if (content == null || content.isBlank()) return 0;

        String lowerContent = content.toLowerCase();
        String lowerQuery = query.toLowerCase();

        double score = 0;

        // 1. Exact phrase match
        if (lowerContent.contains(lowerQuery)) {
            score += 5.0;
        }

        // 2. N-gram phrases (2-4 words)
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

        // 3. Single keyword match
        for (String keyword : keywords) {
            if (keyword.length() < 2) continue;
            if (lowerContent.contains(keyword)) {
                score += 1.0;
            }
        }

        // 4. Bonus cho cau hoi ngan
        if (queryWords.length <= 5) {
            score += 2.0;
        }

        // 5. Bonus cho do dai hop ly (200-2000 ky tu)
        int contentLen = content.length();
        if (contentLen >= 100 && contentLen <= 3000) {
            score += 1.5;
        } else if (contentLen >= 50 && contentLen <= 5000) {
            score += 0.5;
        }

        return score;
    }

    /**
     * Trich xuat title tu metadata JSON.
     */
    private String extractTitle(String metadata) {
        if (metadata == null || metadata.isBlank()) return "Khong co tieu de";
        try {
            int titleIdx = metadata.indexOf("\"title\"");
            if (titleIdx == -1) {
                int nameIdx = metadata.indexOf("\"name\"");
                if (nameIdx == -1) return metadata.length() > 50 ? metadata.substring(0, 50) + "..." : metadata;
                int colon = metadata.indexOf(":", nameIdx);
                int quote1 = metadata.indexOf("\"", colon + 1);
                int quote2 = metadata.indexOf("\"", quote1 + 1);
                return metadata.substring(quote1 + 1, quote2);
            }
            int colon = metadata.indexOf(":", titleIdx);
            int quote1 = metadata.indexOf("\"", colon + 1);
            int quote2 = metadata.indexOf("\"", quote1 + 1);
            return metadata.substring(quote1 + 1, quote2);
        } catch (Exception e) {
            return "Khong doc duoc metadata";
        }
    }

    /**
     * Tao system prompt voi RAG context.
     */
    public String buildRAGPrompt(String query) {
        SearchResult result = search(query, 5, null);
        if (result.context().isBlank()) {
            return getGeneralSystemPrompt();
        }
        return getRAGSystemPrompt(result.context(), result.sources());
    }

    private String getGeneralSystemPrompt() {
        return """
                Ban la AI Assistant cua CuongHoangDev - mot Full Stack Developer.
                Ban co the tra loi ve:
                - Thong tin ca nhan: Hoang, Full Stack Developer, 3+ nam kinh nghiem
                - Ky nang: Java, Spring Boot, React, Next.js, PostgreSQL, Redis, Docker
                - Du an: Cac du an portfolio, E-commerce, AI-integrated apps
                - Blog: Cac bai viet ve cong nghe, lap trinh

                Hay tra loi loi lich su, than thien, bang tieng Viet.
                Neu ban khong biet, hay noi that ban khong co thong tin ve dieu do.
                """;
    }

    private String getRAGSystemPrompt(String context, List<String> sources) {
        String sourcesList = sources.stream()
                .map(s -> "  - " + s)
                .reduce("", (a, b) -> a + b + "\n");

        return """
                Ban la AI Assistant cua CuongHoangDev - mot Full Stack Developer.
                DUAOIBAN CO THONG TIN SAU TU HE THONG:

                %s

                NGUON TAI LIEU:
                %s

                HUONG DAN TRA LOI:
                1. Dua tren THONG TIN BEN TREN de tra loi cau hoi nguoi dung
                2. Neu thong tin lien quan, hay trich dan chinh xac tu tai lieu
                3. Neu cau hoi khong lien quan den tai lieu, tra loi tuy theo kien thuc chung cua ban ve CuongHoangDev
                4. Tra loi BANG TIENG VIET, than thien, chinh xac
                5. Neu ban khong co du thong tin, hay noi "Toi khong co du thong tin de tra loi cau hoi nay."
                """.formatted(context, sourcesList);
    }

    // ===================== INNER CLASSES =====================

    public record SearchResult(String context, List<String> sources, int chunksFound) {}

    private record ScoredChunk(DocumentChunk chunk, double score) {}
}
