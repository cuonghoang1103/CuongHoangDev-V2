package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.AIConfig;
import com.cuonghoangdev.api_backend.repository.AIConfigRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AIConfigService {

    private final AIConfigRepository aiConfigRepository;

    public AIConfigService(AIConfigRepository aiConfigRepository) {
        this.aiConfigRepository = aiConfigRepository;
    }

    @Cacheable(value = "aiConfig", key = "#key")
    public String getValue(String key, String defaultValue) {
        return aiConfigRepository.findByConfigKey(key)
                .map(AIConfig::getConfigValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(defaultValue);
    }

    @Cacheable(value = "aiConfigInt", key = "#key")
    public int getIntValue(String key, int defaultValue) {
        return aiConfigRepository.findByConfigKey(key)
                .map(AIConfig::getConfigValue)
                .filter(v -> v != null && !v.isBlank())
                .map(v -> {
                    try {
                        return Integer.parseInt(v);
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Cacheable(value = "aiConfigFloat", key = "#key")
    public float getFloatValue(String key, float defaultValue) {
        return aiConfigRepository.findByConfigKey(key)
                .map(AIConfig::getConfigValue)
                .filter(v -> v != null && !v.isBlank())
                .map(v -> {
                    try {
                        return Float.parseFloat(v);
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    public void saveValue(String key, String value) {
        AIConfig config = aiConfigRepository.findByConfigKey(key)
                .orElseGet(() -> new AIConfig(key, null, null));
        config.setConfigValue(value);
        aiConfigRepository.save(config);
    }
}
