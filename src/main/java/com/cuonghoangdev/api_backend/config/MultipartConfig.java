package com.cuonghoangdev.api_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.servlet.MultipartConfig;
import org.springframework.context.annotation.Configuration;

/**
 * Multipart configuration via @MultipartConfig annotation on the class.
 *
 * This registers a MultipartConfigElement on the DispatcherServlet,
 * which tells Tomcat how to parse multipart/form-data request bodies.
 *
 * spring.servlet.multipart.* in application.yml sets the actual size limits.
 *
 * Note: We intentionally do NOT define a multipartResolver() @Bean here,
 * because Spring Boot auto-configures a StandardServletMultipartResolver
 * when spring.servlet.multipart.enabled=true. Having both can cause conflicts.
 */
@Configuration
@MultipartConfig
public class MultipartConfig {

    private static final Logger log = LoggerFactory.getLogger(MultipartConfig.class);

    public MultipartConfig() {
        log.info("[MultipartConfig] Initialized — @MultipartConfig active on DispatcherServlet");
    }
}
