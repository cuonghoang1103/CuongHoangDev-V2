package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.AIConfig;
import com.cuonghoangdev.api_backend.repository.AIConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

/**
 * Service chạy khi ứng dụng khởi động để:
 * 1. Seed AI config mặc định
 * 2. Index dữ liệu ban đầu vào vector database
 */
@Configuration
public class DataSeedingService {

    private static final Logger log = LoggerFactory.getLogger(DataSeedingService.class);

    @Value("${app.ai.auto-index-on-startup:false}")
    private boolean autoIndexOnStartup;

    @Value("${app.ai.seed-default-config:true}")
    private boolean seedDefaultConfig;

    /**
     * Seed AI config mặc định
     */
    @Bean
    @Order(1)
    public CommandLineRunner seedAIConfig(AIConfigRepository aiConfigRepository) {
        return args -> {
            if (!seedDefaultConfig) {
                log.info("Bo qua viec seed AI config (disabled)");
                return;
            }

            log.info("Kiem tra AI config...");

            seedConfigIfNotExists(aiConfigRepository, "embedding_model", "text-embedding-3-small",
                    "Model embedding: text-embedding-3-small hoac text-embedding-3-large");

            seedConfigIfNotExists(aiConfigRepository, "chat_model", "gpt-4o-mini",
                    "Model chat: gpt-4o-mini, gpt-4o, gpt-4-turbo");

            seedConfigIfNotExists(aiConfigRepository, "max_tokens", "2048",
                    "So token toi da cho moi response");

            seedConfigIfNotExists(aiConfigRepository, "temperature", "0.7",
                    "Do sang tao cua AI (0-1): 0 = chat that, 1 = rat sang tao");

            seedConfigIfNotExists(aiConfigRepository, "chunk_size", "1000",
                    "Kich thuoc chunk khi chia nho document");

            seedConfigIfNotExists(aiConfigRepository, "chunk_overlap", "200",
                    "Do chong lan giua cac chunk");

            seedConfigIfNotExists(aiConfigRepository, "similarity_threshold", "0.7",
                    "Nguong similarity toi thieu (0-1)");

            seedConfigIfNotExists(aiConfigRepository, "top_k", "5",
                    "So luong ket qua vector search tra ve");

            log.info("Hoan tat seed AI config");
        };
    }

    private void seedConfigIfNotExists(AIConfigRepository repo, String key, String value, String description) {
        if (repo.findByConfigKey(key).isEmpty()) {
            AIConfig config = new AIConfig(key, value, description);
            repo.save(config);
            log.info("Da them AI config: {} = {}", key, value);
        }
    }

    /**
     * Index dữ liệu vào vector database khi khởi động
     */
    @Bean
    @Order(2)
    public CommandLineRunner indexKnowledgeOnStartup(KnowledgeIngestionService knowledgeIngestionService,
                                                     AIConfigRepository aiConfigRepository) {
        return args -> {
            if (!autoIndexOnStartup) {
                log.info("Bo qua index tri thuc khi khoi dong (disabled)");
                return;
            }

            // Kiểm tra xem đã có API key chưa
            String apiKey = System.getenv("OPENAI_API_KEY");
            if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-api-key-here")) {
                log.warn("OPENAI_API_KEY chua duoc cau hinh. Bo qua auto-index.");
                return;
            }

            log.info("Bat dau index tri thuc khi khoi dong...");

            try {
                var result = knowledgeIngestionService.indexAllKnowledge();
                log.info("Hoan tat index tri thuc: {}", result);
            } catch (Exception e) {
                log.error("Loi khi index tri thuc: {}", e.getMessage());
            }
        };
    }
}
