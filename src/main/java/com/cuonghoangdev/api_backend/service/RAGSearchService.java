package com.cuonghoangdev.api_backend.service;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RAGSearchService {

    private final VectorRAGService vectorRAGService;

    public RAGSearchService(VectorRAGService vectorRAGService) {
        this.vectorRAGService = vectorRAGService;
    }

    /**
     * Tim kiem cac chunk lien quan nhat den cau hoi nguoi dung.
     * Su dung semantic search (pgvector) hoac fallback text-based.
     */
    public SearchResult search(String query, int topK, String documentType) {
        VectorRAGService.SearchResult result = vectorRAGService.semanticSearch(query, topK, documentType);
        return new SearchResult(result.context(), result.sources(), result.chunksFound());
    }

    /**
     * Tao system prompt voi RAG context.
     */
    public String buildRAGPrompt(String query) {
        VectorRAGService.SearchResult result = vectorRAGService.semanticSearch(query, 5, null);
        if (!result.hasContext()) {
            return getGeneralSystemPrompt();
        }
        return getRAGSystemPrompt(result.context(), result.sources());
    }

    private String getGeneralSystemPrompt() {
        return """
                Ban la Ai CuongMini - AI Assistant cua CuongHoangDev, mot Full Stack Developer.
                Ban co the tra loi ve:
                - Thong tin ca nhan: Hoang, Full Stack Developer, 3+ nam kinh nghiem
                - Ky nang: Java, Spring Boot, React, Next.js, PostgreSQL, Redis, Docker, AI/RAG
                - Du an: Portfolio V2 voi AI chatbot, E-commerce, Microservices
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
                Ban la Ai CuongMini - AI Assistant cua CuongHoangDev, mot Full Stack Developer.
                DUAOIBAN CO THONG TIN SAU TU HE THONG RAG:

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

    // ============================================================
    // Inner Classes (kept for backward compat)
    // ============================================================

    public record SearchResult(String context, List<String> sources, int chunksFound) {}
}
