package com.cuonghoangdev.api_backend.dto;

public class LessonProgressDto {
    private Long lessonId;
    private Boolean isCompleted;
    private Integer watchTimeSeconds;
    private Integer lastPositionSeconds;

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

    public static LessonProgressDto of(Long lessonId, boolean completed, int watchTime, int position) {
        LessonProgressDto dto = new LessonProgressDto();
        dto.setLessonId(lessonId);
        dto.setIsCompleted(completed);
        dto.setWatchTimeSeconds(watchTime);
        dto.setLastPositionSeconds(position);
        return dto;
    }
}
