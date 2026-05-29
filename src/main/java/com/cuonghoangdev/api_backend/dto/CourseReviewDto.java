package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.CourseReview;

import java.time.LocalDateTime;

public class CourseReviewDto {
    private Long id;
    private Long courseId;
    private Long userId;
    private String userFullName;
    private String userAvatar;
    private Integer rating;
    private String title;
    private String content;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getUserAvatar() {
        return userAvatar;
    }

    public void setUserAvatar(String userAvatar) {
        this.userAvatar = userAvatar;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static CourseReviewDto fromEntity(CourseReview entity) {
        CourseReviewDto dto = new CourseReviewDto();
        dto.setId(entity.getId());
        dto.setCourseId(entity.getCourse() != null ? entity.getCourse().getId() : null);
        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
        dto.setUserFullName(entity.getUser() != null ? entity.getUser().getFullName() : null);
        dto.setUserAvatar(entity.getUser() != null ? entity.getUser().getAvatarUrl() : null);
        dto.setRating(entity.getRating());
        dto.setTitle(entity.getTitle());
        dto.setContent(entity.getContent());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
