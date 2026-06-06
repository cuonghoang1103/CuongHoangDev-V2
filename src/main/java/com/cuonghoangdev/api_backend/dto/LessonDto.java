package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Lesson;
import org.hibernate.Hibernate;

import java.util.List;

public class LessonDto {
    private Long id;
    private Long sectionId;
    private String title;
    private String slug;
    private String description;
    private String content;
    private String lessonType;
    private String videoUrl;
    private Integer videoDurationSeconds;
    private String thumbnailUrl;
    private Boolean isFreePreview;
    private Boolean isPublished;
    private Integer sortOrder;
    private String videoPlatform;
    private String sourceCodeUrl;
    private String teachingNotes;
    private LessonDetailDto detail;
    private List<CourseDocumentDto> documents;
    private List<AssignmentDto> assignments;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSectionId() {
        return sectionId;
    }

    public void setSectionId(Long sectionId) {
        this.sectionId = sectionId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getLessonType() {
        return lessonType;
    }

    public void setLessonType(String lessonType) {
        this.lessonType = lessonType;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public Integer getVideoDurationSeconds() {
        return videoDurationSeconds;
    }

    public void setVideoDurationSeconds(Integer videoDurationSeconds) {
        this.videoDurationSeconds = videoDurationSeconds;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public Boolean getIsFreePreview() {
        return isFreePreview;
    }

    public void setIsFreePreview(Boolean isFreePreview) {
        this.isFreePreview = isFreePreview;
    }

    public Boolean getIsPublished() {
        return isPublished;
    }

    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getVideoPlatform() { return videoPlatform; }
    public void setVideoPlatform(String videoPlatform) { this.videoPlatform = videoPlatform; }
    public String getSourceCodeUrl() { return sourceCodeUrl; }
    public void setSourceCodeUrl(String sourceCodeUrl) { this.sourceCodeUrl = sourceCodeUrl; }
    public String getTeachingNotes() { return teachingNotes; }
    public void setTeachingNotes(String teachingNotes) { this.teachingNotes = teachingNotes; }
    public LessonDetailDto getDetail() { return detail; }
    public void setDetail(LessonDetailDto detail) { this.detail = detail; }

    public List<CourseDocumentDto> getDocuments() {
        return documents;
    }

    public void setDocuments(List<CourseDocumentDto> documents) {
        this.documents = documents;
    }

    public List<AssignmentDto> getAssignments() { return assignments; }
    public void setAssignments(List<AssignmentDto> assignments) { this.assignments = assignments; }

    public static LessonDto fromEntity(Lesson entity) {
        LessonDto dto = new LessonDto();
        dto.setId(entity.getId());
        dto.setSectionId(entity.getSection() != null ? entity.getSection().getId() : null);
        dto.setTitle(entity.getTitle());
        dto.setSlug(entity.getSlug());
        dto.setDescription(entity.getDescription());
        dto.setContent(entity.getContent());
        dto.setLessonType(entity.getLessonType());
        dto.setVideoUrl(entity.getVideoUrl());
        dto.setVideoDurationSeconds(entity.getVideoDurationSeconds());
        dto.setThumbnailUrl(entity.getThumbnailUrl());
        dto.setIsFreePreview(entity.getIsFreePreview());
        dto.setIsPublished(entity.getIsPublished());
        dto.setSortOrder(entity.getSortOrder());
        if (entity.getDetail() != null) {
            dto.setVideoPlatform(entity.getDetail().getVideoPlatform());
            dto.setSourceCodeUrl(entity.getDetail().getSourceCodeUrl());
            dto.setTeachingNotes(entity.getDetail().getTeachingNotes());
            dto.setDetail(LessonDetailDto.fromEntity(entity.getDetail()));
        }
        if (Hibernate.isInitialized(entity.getAssignments()) && entity.getAssignments() != null) {
            dto.setAssignments(entity.getAssignments().stream()
                .map(AssignmentDto::fromEntity)
                .toList());
        }
        return dto;
    }

    public static LessonDto fromEntityWithDocuments(Lesson entity, boolean includeVideo) {
        LessonDto dto = fromEntity(entity);
        if (!includeVideo) {
            dto.setVideoUrl(null);
        }
        if (Hibernate.isInitialized(entity.getDocuments()) && entity.getDocuments() != null) {
            dto.setDocuments(entity.getDocuments().stream()
                .map(CourseDocumentDto::fromEntity)
                .toList());
        }
        if (Hibernate.isInitialized(entity.getAssignments()) && entity.getAssignments() != null) {
            dto.setAssignments(entity.getAssignments().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsPublished()))
                .map(AssignmentDto::fromEntity)
                .toList());
        }
        return dto;
    }
}
