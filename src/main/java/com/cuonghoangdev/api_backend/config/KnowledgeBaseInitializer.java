package com.cuonghoangdev.api_backend.config;

import com.cuonghoangdev.api_backend.service.KnowledgeIngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Runs knowledge base seed on startup if enabled.
 * Controlled by app.ai.auto-index-on-startup in application.yml.
 */
@Component
public class KnowledgeBaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseInitializer.class);

    private final KnowledgeIngestionService ingestionService;
    private final boolean autoIndexOnStartup;

    public KnowledgeBaseInitializer(
            KnowledgeIngestionService ingestionService,
            @Value("${app.ai.auto-index-on-startup:false}") boolean autoIndexOnStartup) {
        this.ingestionService = ingestionService;
        this.autoIndexOnStartup = autoIndexOnStartup;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!autoIndexOnStartup) {
            log.info("AI auto-indexing disabled (app.ai.auto-index-on-startup=false). " +
                    "Use POST /api/v1/ai/admin/knowledge/seed to populate manually.");
            return;
        }

        log.info("Auto-indexing knowledge base on startup...");
        try {
            KnowledgeIngestionService.IngestResult result = ingestionService.seedAll();
            log.info("Knowledge base auto-seed complete: {} chunks embedded, {} skipped",
                    result.embedded(), result.skipped());
        } catch (Exception e) {
            log.error("Failed to auto-seed knowledge base: {}", e.getMessage(), e);
        }
    }
}
