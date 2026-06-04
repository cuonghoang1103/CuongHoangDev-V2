package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.AIConfig;
import com.cuonghoangdev.api_backend.entity.Role;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.repository.AIConfigRepository;
import com.cuonghoangdev.api_backend.repository.RoleRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Service chạy khi ứng dụng khởi động để:
 * 1. Seed AI config mặc định
 * 2. Seed admin user từ biến môi trường (không hardcode credentials)
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

            seedConfigIfNotExists(aiConfigRepository, "embedding_model", "gemini-embedding-2",
                    "Model embedding: gemini-embedding-2");

            seedConfigIfNotExists(aiConfigRepository, "chat_model", "gemini-2.0-flash",
                    "Model chat: gemini-2.0-flash, gemini-2.5-flash");

            seedConfigIfNotExists(aiConfigRepository, "max_tokens", "2048",
                    "So token toi da cho moi response");

            seedConfigIfNotExists(aiConfigRepository, "temperature", "0.7",
                    "Do sang tao cua AI (0-1): 0 = chat that, 1 = rat sang tao");

            seedConfigIfNotExists(aiConfigRepository, "chunk_size", "1000",
                    "Kich thuoc chunk khi chia nho document");

            seedConfigIfNotExists(aiConfigRepository, "embedding_dimensions", "768",
                    "So chieu cua embedding vector");

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
     * Seed admin user from environment variables.
     *
     * IMPORTANT: Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD in .env before first run.
     * These credentials are REQUIRED — if not set, no admin account is created.
     *
     * Example .env:
     *   SEED_ADMIN_USERNAME=admin
     *   SEED_ADMIN_PASSWORD=YourSecurePassword123!
     */
    @Bean
    @Order(0)
    public CommandLineRunner seedUsers(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      PasswordEncoder passwordEncoder,
                                      @Value("${seed.admin.username:}") String adminUsername,
                                      @Value("${seed.admin.password:}") String adminPassword) {
        return args -> {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("ROLE_ADMIN");
                        return roleRepository.save(r);
                    });

            roleRepository.findByName("ROLE_USER")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("ROLE_USER");
                        return roleRepository.save(r);
                    });

            // Only create admin if both env vars are explicitly set
            if (adminUsername == null || adminUsername.isBlank()
                    || adminPassword == null || adminPassword.isBlank()) {
                log.warn("Seed admin credentials not configured. Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD in .env to create an admin account on startup.");
                return;
            }

            User admin = userRepository.findByUsername(adminUsername).orElse(null);
            if (admin == null) {
                admin = new User(adminUsername, passwordEncoder.encode(adminPassword), "admin@local");
                admin.setFullName("Admin");
                admin.getRoles().add(adminRole);
                userRepository.save(admin);
                log.info("Da tao tai khoan admin: {}", adminUsername);
            } else {
                boolean hasAdmin = admin.getRoles().stream()
                        .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
                if (!hasAdmin) {
                    admin.getRoles().add(adminRole);
                    userRepository.save(admin);
                    log.info("Da gan quyen ADMIN cho tai khoan: {}", adminUsername);
                }
            }
        };
    }
}
