package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.DocumentIndexRequest;
import com.cuonghoangdev.api_backend.entity.AIConfig;
import com.cuonghoangdev.api_backend.entity.DocumentChunk;
import com.cuonghoangdev.api_backend.repository.AIConfigRepository;
import com.cuonghoangdev.api_backend.repository.DocumentChunkRepository;
import com.cuonghoangdev.api_backend.service.DocumentIndexingService;
import com.cuonghoangdev.api_backend.service.KnowledgeIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AIAdminController {

    private final DocumentIndexingService documentIndexingService;
    private final DocumentChunkRepository documentChunkRepository;
    private final AIConfigRepository aiConfigRepository;

    public AIAdminController(DocumentIndexingService documentIndexingService,
                            DocumentChunkRepository documentChunkRepository,
                            AIConfigRepository aiConfigRepository) {
        this.documentIndexingService = documentIndexingService;
        this.documentChunkRepository = documentChunkRepository;
        this.aiConfigRepository = aiConfigRepository;
    }

    /**
     * Index một document mới
     */
    @PostMapping("/documents")
    public ResponseEntity<ApiResponse<List<DocumentChunk>>> indexDocument(
            @Valid @RequestBody DocumentIndexRequest request) {

        List<DocumentChunk> chunks = documentIndexingService.indexDocument(request);
        return ResponseEntity.ok(ApiResponse.ok(
                "Đã index thành công " + chunks.size() + " chunks", chunks));
    }

    /**
     * Tái index một document
     */
    @PutMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<List<DocumentChunk>>> reindexDocument(
            @PathVariable String documentId,
            @Valid @RequestBody DocumentIndexRequest request) {

        // Đảm bảo documentId khớp
        request.setDocumentId(documentId);
        List<DocumentChunk> chunks = documentIndexingService.reindexDocument(request);
        return ResponseEntity.ok(ApiResponse.ok(
                "Đã tái index thành công " + chunks.size() + " chunks", chunks));
    }

    /**
     * Xóa document khỏi index
     */
    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable String documentId) {

        documentIndexingService.deleteDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok(
                "Đã xóa document khỏi index", null));
    }

    /**
     * Xem tất cả chunks của một document
     */
    @GetMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<List<DocumentChunk>>> getDocumentChunks(
            @PathVariable String documentId) {

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        return ResponseEntity.ok(ApiResponse.ok(chunks));
    }

    /**
     * Xem tất cả chunks theo loại document
     */
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<DocumentChunk>>> getAllChunks(
            @RequestParam(required = false) String documentType) {

        List<DocumentChunk> chunks;
        if (documentType != null && !documentType.isEmpty()) {
            chunks = documentChunkRepository.findByDocumentType(documentType);
        } else {
            chunks = documentChunkRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.ok(chunks));
    }

    /**
     * Thống kê số lượng chunks
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<IndexStats>> getStats() {
        IndexStats stats = new IndexStats();

        stats.setTotalChunks(documentChunkRepository.count());

        List<String> types = List.of("posts", "profile", "skills", "projects");
        for (String type : types) {
            stats.setChunkCount(type, documentChunkRepository.countByDocumentType(type));
        }

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * Inner class cho stats
     */
    public static class IndexStats {
        private long totalChunks;
        private long postsCount;
        private long profileCount;
        private long skillsCount;
        private long projectsCount;

        public long getTotalChunks() { return totalChunks; }
        public void setTotalChunks(long totalChunks) { this.totalChunks = totalChunks; }

        public void setChunkCount(String type, long count) {
            switch (type) {
                case "posts" -> postsCount = count;
                case "profile" -> profileCount = count;
                case "skills" -> skillsCount = count;
                case "projects" -> projectsCount = count;
            }
        }

        public long getPostsCount() { return postsCount; }
        public long getProfileCount() { return profileCount; }
        public long getSkillsCount() { return skillsCount; }
        public long getProjectsCount() { return projectsCount; }
    }

    // ============ Knowledge Config ============

    /**
     * Lấy tất cả AI config
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<List<AIConfig>>> getAllConfig() {
        return ResponseEntity.ok(ApiResponse.ok(aiConfigRepository.findAll()));
    }

    /**
     * Cập nhật AI config
     */
    @PutMapping("/config/{key}")
    public ResponseEntity<ApiResponse<AIConfig>> updateConfig(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {

        AIConfig config = aiConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new com.cuonghoangdev.api_backend.exception.ResourceNotFoundException(
                        "AIConfig", "key", key));

        if (body.containsKey("value")) {
            config.setConfigValue(body.get("value"));
        }
        if (body.containsKey("description")) {
            config.setDescription(body.get("description"));
        }

        AIConfig saved = aiConfigRepository.save(config);
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật config", saved));
    }
}
