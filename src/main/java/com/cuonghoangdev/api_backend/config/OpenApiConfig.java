package com.cuonghoangdev.api_backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("CuongHoangDev V2 API")
                        .description("""
                                ## Hệ thống API Backend cho Portfolio Thương mại điện tử & Tích hợp AI

                                ### Các tính năng chính:
                                - **Xác thực & Phân quyền**: JWT, OAuth2 (Google, GitHub)
                                - **Quản lý Blog**: CRUD bài viết, danh mục, tags
                                - **AI Chatbot**: Tích hợp RAG với Vector Database
                                - **Quản lý Portfolio**: Dự án, kỹ năng, hồ sơ cá nhân
                                - **Cloud Storage**: Upload file lên Cloudinary

                                ### Authentication
                                Sử dụng JWT token được trả về khi đăng nhập.
                                Thêm vào header: `Authorization: Bearer <token>`
                                """)
                        .version("0.0.1-SNAPSHOT")
                        .contact(new Contact()
                                .name("CuongHoangDev")
                                .email("contact@cuonghoangdev.com")
                                .url("https://cuonghoangdev.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.cuonghoangdev.com")
                                .description("Production Server")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập JWT token được trả về từ /api/v1/auth/login")));
    }
}
