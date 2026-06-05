package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.Size;

public class UpdateLessonRequest {

    private Long sectionId;

    @Size(max = 255)
    private String title;

    private String slug;
    private String description;
    private String content;
    private String lessonType = "VIDEO";
    private String videoUrl;
    private Integer videoDurationSeconds;
    private String thumbnailUrl;
    private Boolean isFreePreview = false;
    private Boolean isPublished = false;
    private Integer sortOrder;
    private String videoPlatform = "EMBED";
    private String sourceCodeUrl;
    private String teachingNotes;

    public Long getSectionId() { return sectionId; }
    public void setSectionId(Long sectionId) { this.sectionId = sectionId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getLessonType() { return lessonType; }
    public void setLessonType(String lessonType) { this.lessonType = lessonType; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public Integer getVideoDurationSeconds() { return videoDurationSeconds; }
    public void setVideoDurationSeconds(Integer videoDurationSeconds) { this.videoDurationSeconds = videoDurationSeconds; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public Boolean getIsFreePreview() { return isFreePreview; }
    public void setIsFreePreview(Boolean isFreePreview) { this.isFreePreview = isFreePreview; }
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getVideoPlatform() { return videoPlatform; }
    public void setVideoPlatform(String videoPlatform) { this.videoPlatform = videoPlatform; }
    public String getSourceCodeUrl() { return sourceCodeUrl; }
    public void setSourceCodeUrl(String sourceCodeUrl) { this.sourceCodeUrl = sourceCodeUrl; }
    public String getTeachingNotes() { return teachingNotes; }
    public void setTeachingNotes(String teachingNotes) { this.teachingNotes = teachingNotes; }
}
