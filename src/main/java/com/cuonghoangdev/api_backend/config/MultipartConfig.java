package com.cuonghoangdev.api_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

/**
 * Explicit multipart resolver — guarantees Tomcat parses multipart/form-data requests.
 *
 * Directly fixes: "Unable to process parts as no multi-part configuration has been provided"
 * File size limits (100MB) are configured in application.yml via spring.servlet.multipart.*
 */
@Configuration
public class MultipartConfig {

    @Bean(name = "multipartResolver")
    public StandardServletMultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }
}
