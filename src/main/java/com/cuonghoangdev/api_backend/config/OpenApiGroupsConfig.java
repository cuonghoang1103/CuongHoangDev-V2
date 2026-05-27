package com.cuonghoangdev.api_backend.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiGroupsConfig {

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("1. Authentication")
                .pathsToMatch("/api/v1/auth/**")
                .displayName("Xác thực & Đăng nhập")
                .build();
    }

    @Bean
    public GroupedOpenApi blogApi() {
        return GroupedOpenApi.builder()
                .group("2. Blog Management")
                .pathsToMatch("/api/v1/blog/**")
                .displayName("Quản lý Blog")
                .build();
    }

    @Bean
    public GroupedOpenApi aiChatApi() {
        return GroupedOpenApi.builder()
                .group("3. AI Chatbot")
                .pathsToMatch("/api/v1/ai/**")
                .displayName("AI Chat & RAG")
                .build();
    }

    @Bean
    public GroupedOpenApi userApi() {
        return GroupedOpenApi.builder()
                .group("4. User Management")
                .pathsToMatch("/api/v1/users/**", "/api/v1/profile/**")
                .displayName("Quản lý Người dùng")
                .build();
    }

    @Bean
    public GroupedOpenApi systemApi() {
        return GroupedOpenApi.builder()
                .group("5. System")
                .pathsToMatch("/api/v1/system/**")
                .displayName("Hệ thống")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("6. Admin")
                .pathsToMatch("/api/v1/admin/**")
                .displayName("Quản trị Admin")
                .build();
    }
}
