package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    Optional<ChatSession> findBySessionId(String sessionId);

    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);

    boolean existsBySessionId(String sessionId);
}
