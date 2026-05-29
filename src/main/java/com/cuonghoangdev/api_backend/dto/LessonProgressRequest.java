package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotNull;

public class LessonProgressRequest {

    @NotNull(message = "Lesson ID khong duoc de trong")
    private Long lessonId;

    private Boolean isCompleted = false;
    private Integer watchTimeSeconds = 0;
    private Integer lastPositionSeconds = 0;

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public Integer getWatchTimeSeconds() {
        return watchTimeSeconds;
    }

    public void setWatchTimeSeconds(Integer watchTimeSeconds) {
        this.watchTimeSeconds = watchTimeSeconds;
    }

    public Integer getLastPositionSeconds() {
        return lastPositionSeconds;
    }

    public void setLastPositionSeconds(Integer lastPositionSeconds) {
        this.lastPositionSeconds = lastPositionSeconds;
    }
}
