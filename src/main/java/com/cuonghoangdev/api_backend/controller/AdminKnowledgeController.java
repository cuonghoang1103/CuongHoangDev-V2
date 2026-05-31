package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import com.cuonghoangdev.api_backend.service.AIService;
import com.cuonghoangdev.api_backend.service.KnowledgeIngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin controller for AI Knowledge Base management.
 * Only ADMIN role can access these endpoints.
 *
 * Endpoints:
 *   POST /api/v1/ai/admin/knowledge/seed      — Seed all portfolio data
 *   POST /api/v1/ai/admin/knowledge/reembed  — Re-embed pending chunks
 *   GET  /api/v1/ai/admin/knowledge/stats    — Get knowledge base stats
 */
@RestController
@RequestMapping("/api/v1/ai/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminKnowledgeController {

    private static final Logger log = LoggerFactory.getLogger(AdminKnowledgeController.class);

    private final KnowledgeIngestionService ingestionService;
    private final DocumentChunkRepository chunkRepository;
    private final AIService aiService;

    public AdminKnowledgeController(
            KnowledgeIngestionService ingestionService,
            DocumentChunkRepository chunkRepository,
            AIService aiService) {
        this.ingestionService = ingestionService;
        this.chunkRepository = chunkRepository;
        this.aiService = aiService;
    }

    /**
     * Seed the entire knowledge base with portfolio data.
     * This clears existing chunks and ingests fresh ones.
     *
     * Requires: GEMINI_API_KEY environment variable to be set.
     */
    @PostMapping("/knowledge/seed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> seedKnowledgeBase() {
        if (!aiService.isConfigured()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Gemini API key not configured. Set GEMINI_API_KEY in the .env file.")
            );
        }

        log.info("Admin triggered knowledge base seed");
        KnowledgeIngestionService.IngestResult result = ingestionService.seedAll();

        Map<String, Object> stats = Map.of(
                "totalChunks", result.totalChunks(),
                "embedded", result.embedded(),
                "skipped", result.skipped(),
                "errors", result.errors(),
                "geminiConfigured", true
        );

        return ResponseEntity.ok(ApiResponse.ok(
                "Knowledge base seeded successfully: " + result.embedded() + " chunks embedded",
                stats
        ));
    }

    /**
     * Re-embed only chunks that are missing embeddings.
     * Use this to fill in gaps after manual data inserts.
     */
    @PostMapping("/knowledge/reembed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reembedPending() {
        if (!aiService.isConfigured()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Gemini API key not configured.")
            );
        }

        long pendingBefore = chunkRepository.countPendingChunks();
        int embedded = ingestionService.embedPendingChunks();
        long pendingAfter = chunkRepository.countPendingChunks();

        Map<String, Object> stats = Map.of(
                "pendingBefore", pendingBefore,
                "embedded", embedded,
                "pendingAfter", pendingAfter
        );

        return ResponseEntity.ok(ApiResponse.ok(
                "Re-embedded " + embedded + " chunks",
                stats
        ));
    }

    /**
     * Get knowledge base statistics.
     */
    @GetMapping("/knowledge/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        long totalChunks = chunkRepository.count();
        long indexedChunks = chunkRepository.countIndexedChunks();
        long pendingChunks = chunkRepository.countPendingChunks();
        boolean geminiConfigured = aiService.isConfigured();

        // Count by document type
        Map<String, Long> byType = Map.of(
                "ABOUT", chunkRepository.countByDocumentType("ABOUT"),
                "SKILL", chunkRepository.countByDocumentType("SKILL"),
                "PROJECT", chunkRepository.countByDocumentType("PROJECT"),
                "BLOG", chunkRepository.countByDocumentType("BLOG"),
                "FEATURE", chunkRepository.countByDocumentType("FEATURE"),
                "EXPERIENCE", chunkRepository.countByDocumentType("EXPERIENCE")
        );

        Map<String, Object> stats = Map.of(
                "totalChunks", totalChunks,
                "indexedChunks", indexedChunks,
                "pendingChunks", pendingChunks,
                "byDocumentType", byType,
                "geminiConfigured", geminiConfigured
        );

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * Clear all knowledge base chunks.
     */
    @DeleteMapping("/knowledge/clear")
    public ResponseEntity<ApiResponse<Void>> clearKnowledgeBase() {
        long count = chunkRepository.count();
        chunkRepository.deleteAll();
        log.info("Cleared {} chunks from knowledge base", count);
        return ResponseEntity.ok(ApiResponse.ok("Cleared " + count + " chunks", null));
    }
}
