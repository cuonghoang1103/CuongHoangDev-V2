package com.cuonghoangdev.api_backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.lang.annotation.*;

@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ConditionalOnClass(name = "org.springframework.ai.embedding.EmbeddingModel")
@ConditionalOnProperty(name = "spring.ai.enabled", havingValue = "true", matchIfMissing = false)
public @interface ConditionalOnSpringAI {
}
