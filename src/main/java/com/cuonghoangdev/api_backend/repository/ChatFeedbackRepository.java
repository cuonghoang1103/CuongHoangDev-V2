package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.ChatFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatFeedbackRepository extends JpaRepository<ChatFeedback, Long> {

    List<ChatFeedback> findByMessageId(Long messageId);

    List<ChatFeedback> findByUserId(Long userId);

    @Query("SELECT AVG(f.rating) FROM ChatFeedback f WHERE f.messageId IN :messageIds")
    Double getAverageRatingByMessageIds(List<Long> messageIds);

    @Query("SELECT f.feedbackType, COUNT(f) FROM ChatFeedback f GROUP BY f.feedbackType")
    List<Object[]> countByFeedbackType();
}
