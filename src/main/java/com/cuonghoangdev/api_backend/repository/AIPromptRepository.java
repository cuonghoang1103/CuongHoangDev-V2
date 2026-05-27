package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.AIPrompt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIPromptRepository extends JpaRepository<AIPrompt, Long> {

    Optional<AIPrompt> findByPromptKey(String promptKey);

    List<AIPrompt> findByIsActiveTrue();

    Optional<AIPrompt> findByPromptKeyAndIsActiveTrue(String promptKey);
}
