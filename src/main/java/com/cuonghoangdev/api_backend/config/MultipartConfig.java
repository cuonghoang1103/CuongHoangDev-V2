package com.cuonghoangdev.api_backend.config;

import jakarta.servlet.MultipartConfigElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;

/**
 * Provides a MultipartConfigElement bean that Spring Boot automatically
 * applies to the auto-configured DispatcherServlet.
 *
 * This is the idiomatic Spring Boot way to configure multipart parsing
 * programmatically while still respecting spring.servlet.multipart.* YAML values.
 */
@Configuration
public class MultipartConfig {

    private static final Logger log = LoggerFactory.getLogger(MultipartConfig.class);

    @Value("${spring.servlet.multipart.max-file-size:100MB}")
    private DataSize maxFileSize;

    @Value("${spring.servlet.multipart.max-request-size:100MB}")
    private DataSize maxRequestSize;

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        log.info("[MultipartConfig] Creating MultipartConfigElement — maxFileSize={}, maxRequestSize={}",
                maxFileSize, maxRequestSize);
        MultipartConfigElement element = new MultipartConfigElement(
                System.getProperty("java.io.tmpdir"),
                maxFileSize.toBytes(),
                maxRequestSize.toBytes(),
                -1  // unlimited file size threshold (deferred to maxFileSize)
        );
        return element;
    }
}
