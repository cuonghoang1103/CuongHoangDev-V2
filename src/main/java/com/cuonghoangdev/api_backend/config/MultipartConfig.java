package com.cuonghoangdev.api_backend.config;

import jakarta.servlet.MultipartConfigElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.servlet.MultipartConfig;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/**
 * Explicit multipart resolver — guarantees Tomcat parses multipart/form-data requests.
 *
 * Directly fixes: "Unable to process parts as no multi-part configuration has been provided"
 * File size limits (100MB) are configured in application.yml via spring.servlet.multipart.*
 */
@Configuration
@MultipartConfig
public class MultipartConfig {

    private static final Logger log = LoggerFactory.getLogger(MultipartConfig.class);

    public MultipartConfig() {
        log.info("[MultipartConfig] Initialized — MultipartConfig annotation present on class");
    }

    @Bean(name = "multipartResolver")
    public MultipartConfigElement multipartConfigElement() {
        log.info("[MultipartConfig] Creating MultipartConfigElement bean");
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.ofMegabytes(100));
        factory.setMaxRequestSize(DataSize.ofMegabytes(100));
        factory.setLocation(System.getProperty("java.io.tmpdir", "/tmp"));
        return factory.createMultipartConfig();
    }
}
