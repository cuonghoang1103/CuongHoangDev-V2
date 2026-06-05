package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.LessonDetail;

public class LessonDetailDto {
    private Long id;
    private Long lessonId;
    private String videoPlatform;
    private String videoUrl;
    private String sourceCodeUrl;
    private String teachingNotes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getVideoPlatform() { return videoPlatform; }
    public void setVideoPlatform(String videoPlatform) { this.videoPlatform = videoPlatform; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getSourceCodeUrl() { return sourceCodeUrl; }
    public void setSourceCodeUrl(String sourceCodeUrl) { this.sourceCodeUrl = sourceCodeUrl; }
    public String getTeachingNotes() { return teachingNotes; }
    public void setTeachingNotes(String teachingNotes) { this.teachingNotes = teachingNotes; }

    public static LessonDetailDto fromEntity(LessonDetail entity) {
        LessonDetailDto dto = new LessonDetailDto();
        dto.setId(entity.getId());
        dto.setLessonId(entity.getLesson() != null ? entity.getLesson().getId() : null);
        dto.setVideoPlatform(entity.getVideoPlatform());
        dto.setVideoUrl(entity.getVideoUrl());
        dto.setSourceCodeUrl(entity.getSourceCodeUrl());
        dto.setTeachingNotes(entity.getTeachingNotes());
        return dto;
    }
}
