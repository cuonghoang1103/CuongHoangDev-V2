package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.FeedbackRequest;
import com.cuonghoangdev.api_backend.entity.ChatAnalytics;
import com.cuonghoangdev.api_backend.entity.ChatFeedback;
import com.cuonghoangdev.api_backend.repository.ChatAnalyticsRepository;
import com.cuonghoangdev.api_backend.repository.ChatFeedbackRepository;
import com.cuonghoangdev.api_backend.repository.ChatMessageRepository;
import com.cuonghoangdev.api_backend.repository.ChatSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatAnalyticsService {

    private final ChatFeedbackRepository chatFeedbackRepository;
    private final ChatAnalyticsRepository chatAnalyticsRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;

    public ChatAnalyticsService(ChatFeedbackRepository chatFeedbackRepository,
                              ChatAnalyticsRepository chatAnalyticsRepository,
                              ChatMessageRepository chatMessageRepository,
                              ChatSessionRepository chatSessionRepository) {
        this.chatFeedbackRepository = chatFeedbackRepository;
        this.chatAnalyticsRepository = chatAnalyticsRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatSessionRepository = chatSessionRepository;
    }

    /**
     * Lưu feedback của user
     */
    @Transactional
    public ChatFeedback submitFeedback(FeedbackRequest request, Long userId) {
        ChatFeedback feedback = new ChatFeedback();
        feedback.setMessageId(request.getMessageId());
        feedback.setUserId(userId);
        feedback.setRating(request.getRating());
        feedback.setFeedbackType(request.getFeedbackType());
        feedback.setComment(request.getComment());

        return chatFeedbackRepository.save(feedback);
    }

    /**
     * Lấy feedback theo message
     */
    public List<ChatFeedback> getFeedbackByMessage(Long messageId) {
        return chatFeedbackRepository.findByMessageId(messageId);
    }

    /**
     * Thống kê feedback tổng quan
     */
    public Map<String, Object> getFeedbackStats() {
        Map<String, Object> stats = new HashMap<>();

        // Đếm theo loại feedback
        List<Object[]> typeCounts = chatFeedbackRepository.countByFeedbackType();
        Map<String, Long> typeMap = new HashMap<>();
        long total = 0;
        for (Object[] row : typeCounts) {
            String type = (String) row[0];
            Long count = (Long) row[1];
            typeMap.put(type, count);
            total += count;
        }
        stats.put("feedbackByType", typeMap);
        stats.put("totalFeedbacks", total);

        // Trung bình rating
        List<ChatFeedback> allFeedbacks = chatFeedbackRepository.findAll();
        if (!allFeedbacks.isEmpty()) {
            double avgRating = allFeedbacks.stream()
                    .mapToInt(ChatFeedback::getRating)
                    .average()
                    .orElse(0.0);
            stats.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
        } else {
            stats.put("averageRating", 0.0);
        }

        return stats;
    }

    /**
     * Cập nhật analytics cho session
     */
    @Transactional
    public void updateSessionAnalytics(String sessionId, int responseTimeMs) {
        LocalDate today = LocalDate.now();

        ChatAnalytics analytics = chatAnalyticsRepository.findBySessionIdAndDate(sessionId, today)
                .orElseGet(() -> {
                    ChatAnalytics newAnalytics = new ChatAnalytics(sessionId, today);
                    return newAnalytics;
                });

        // Cập nhật số message
        analytics.setMessageCount(analytics.getMessageCount() + 1);

        // Cập nhật thời gian response trung bình
        int currentTotal = analytics.getAvgResponseTimeMs() * (analytics.getMessageCount() - 1);
        int newTotal = currentTotal + responseTimeMs;
        analytics.setAvgResponseTimeMs(newTotal / analytics.getMessageCount());

        chatAnalyticsRepository.save(analytics);
    }

    /**
     * Lấy analytics theo khoảng thời gian
     */
    public List<ChatAnalytics> getAnalyticsByDateRange(LocalDate startDate, LocalDate endDate) {
        return chatAnalyticsRepository.findByDateBetween(startDate, endDate);
    }

    /**
     * Lấy tổng quan analytics
     */
    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalSessions", chatSessionRepository.count());
        stats.put("totalMessages", chatMessageRepository.count());
        stats.put("totalTokens", chatAnalyticsRepository.sumTokens());

        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);
        LocalDate monthAgo = today.minusDays(30);

        // Messages hôm nay
        Integer todayMessages = chatAnalyticsRepository.getTotalMessagesByDate(today);
        stats.put("todayMessages", todayMessages != null ? todayMessages : 0);

        // Messages tuần này
        List<ChatAnalytics> weekData = chatAnalyticsRepository.findByDateBetween(weekAgo, today);
        int weekMessages = weekData.stream().mapToInt(ChatAnalytics::getMessageCount).sum();
        stats.put("weekMessages", weekMessages);

        // Messages tháng này
        List<ChatAnalytics> monthData = chatAnalyticsRepository.findByDateBetween(monthAgo, today);
        int monthMessages = monthData.stream().mapToInt(ChatAnalytics::getMessageCount).sum();
        stats.put("monthMessages", monthMessages);

        // Average response time (tuần này)
        Double avgResponseTime = chatAnalyticsRepository.getAverageResponseTime(weekAgo, today);
        stats.put("avgResponseTimeMs", avgResponseTime != null ? avgResponseTime.intValue() : 0);

        // Positive feedback percent
        long totalFeedbacks = chatFeedbackRepository.count();
        long positiveCount = 0;
        long negativeCount = 0;
        if (totalFeedbacks > 0) {
            List<Object[]> typeCounts = chatFeedbackRepository.countByFeedbackType();
            for (Object[] row : typeCounts) {
                String type = (String) row[0];
                Long count = (Long) row[1];
                if ("helpful".equalsIgnoreCase(type) || "accurate".equalsIgnoreCase(type)) {
                    positiveCount += count;
                } else if ("not_helpful".equalsIgnoreCase(type) || "inaccurate".equalsIgnoreCase(type)) {
                    negativeCount += count;
                }
            }
        }
        stats.put("totalFeedbacks", totalFeedbacks);
        stats.put("positiveCount", positiveCount);
        stats.put("negativeCount", negativeCount);
        stats.put("positiveFeedbackPercent", totalFeedbacks > 0
                ? Math.round((positiveCount * 100.0) / totalFeedbacks)
                : 0);

        return stats;
    }
}
