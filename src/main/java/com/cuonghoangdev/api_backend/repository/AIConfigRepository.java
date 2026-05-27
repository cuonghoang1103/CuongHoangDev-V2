package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.AIConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIConfigRepository extends JpaRepository<AIConfig, Long> {

    Optional<AIConfig> findByConfigKey(String configKey);

    Optional<AIConfig> findByConfigKeyAndDescription(String configKey, String description);
}
