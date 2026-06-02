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
     * Seed default users (admin & testuser) on startup
     */
    @Bean
    @Order(0)
    public CommandLineRunner seedUsers(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("ROLE_ADMIN");
                        return roleRepository.save(r);
                    });

            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName("ROLE_USER");
                        return roleRepository.save(r);
                    });

            // Tạo hoặc update admin
            User admin = userRepository.findByUsername("admin").orElse(null);
            if (admin == null) {
                admin = new User("admin", passwordEncoder.encode("admin123"), "admin@test.com");
                admin.setFullName("Admin");
                admin.getRoles().add(adminRole);
                userRepository.save(admin);
                log.info("Da tao tai khoan admin/admin123");
            } else {
                // Upgrade existing admin: đảm bảo có ROLE_ADMIN
                boolean hasAdmin = admin.getRoles().stream()
                        .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
                if (!hasAdmin) {
                    admin.getRoles().add(adminRole);
                    userRepository.save(admin);
                    log.info("Da gan quyen ADMIN cho tai khoan admin hien co");
                }
            }

            // Tạo testuser nếu chưa có
            if (!userRepository.existsByUsername("testuser")) {
                User user = new User("testuser", passwordEncoder.encode("test123"), "test@test.com");
                user.setFullName("Test User");
                user.getRoles().add(userRole);
                userRepository.save(user);
                log.info("Da tao tai khoan testuser/test123");
            }

            // Tạo cuong03dx nếu chưa có
            if (!userRepository.existsByUsername("cuong03dx")) {
                User admin2 = new User("cuong03dx", passwordEncoder.encode("cuong123"), "cuong03dx@gmail.com");
                admin2.setFullName("Cuong Admin");
                admin2.getRoles().add(adminRole);
                userRepository.save(admin2);
                log.info("Da tao tai khoan cuong03dx/cuong123 voi quyen ADMIN");
            }
        };
    }
}
