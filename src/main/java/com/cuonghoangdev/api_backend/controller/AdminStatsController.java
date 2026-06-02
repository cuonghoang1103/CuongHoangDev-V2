package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.repository.PostRepository;
import com.cuonghoangdev.api_backend.repository.ProjectRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import com.cuonghoangdev.api_backend.repository.SkillRepository;
import com.cuonghoangdev.api_backend.repository.ChatSessionRepository;
import com.cuonghoangdev.api_backend.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    @Autowired private UserRepository userRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private SkillRepository skillRepository;
    @Autowired private ChatSessionRepository chatSessionRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverview() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers", userRepository.count());
        stats.put("totalPosts", postRepository.count());
        stats.put("totalProjects", projectRepository.count());
        stats.put("totalSkills", skillRepository.count());
        stats.put("activeSessions", chatSessionRepository.count());
        stats.put("totalSessions", chatSessionRepository.count());
        stats.put("totalMessages", chatMessageRepository.count());

        long totalViews = postRepository.findAll().stream()
                .mapToLong(p -> p.getViewCount() != null ? p.getViewCount() : 0L)
                .sum();
        stats.put("totalViews", totalViews);

        long uptimeSeconds = Duration.between(
                Instant.ofEpochMilli(ManagementFactory.getRuntimeMXBean().getStartTime()),
                Instant.now()
        ).getSeconds();
        stats.put("uptimeSeconds", uptimeSeconds);
        stats.put("uptimeFormatted", formatUptime(uptimeSeconds));

        Runtime rt = Runtime.getRuntime();
        long totalMem = rt.totalMemory();
        long freeMem = rt.freeMemory();
        long usedMem = totalMem - freeMem;
        int memoryPercent = (int) ((usedMem * 100) / totalMem);
        stats.put("memoryUsedMB", usedMem / (1024 * 1024));
        stats.put("memoryTotalMB", totalMem / (1024 * 1024));
        stats.put("memoryPercent", memoryPercent);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    private String formatUptime(long seconds) {
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long mins = (seconds % 3600) / 60;
        if (days > 0) return days + "d " + hours + "h";
        if (hours > 0) return hours + "h " + mins + "m";
        return mins + "m";
    }
}
