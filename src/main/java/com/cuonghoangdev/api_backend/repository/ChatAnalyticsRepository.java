package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.ChatAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatAnalyticsRepository extends JpaRepository<ChatAnalytics, Long> {

    Optional<ChatAnalytics> findBySessionIdAndDate(String sessionId, LocalDate date);

    List<ChatAnalytics> findByDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT SUM(a.messageCount) FROM ChatAnalytics a WHERE a.date = :date")
    Integer getTotalMessagesByDate(LocalDate date);

    @Query("SELECT AVG(a.avgResponseTimeMs) FROM ChatAnalytics a WHERE a.date BETWEEN :startDate AND :endDate")
    Double getAverageResponseTime(LocalDate startDate, LocalDate endDate);
}
