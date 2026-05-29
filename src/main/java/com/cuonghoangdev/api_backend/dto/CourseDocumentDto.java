package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.CourseDocument;

public class CourseDocumentDto {
    private Long id;
    private Long lessonId;
    private String title;
    private String fileUrl;
    private Long fileSizeBytes;
    private String fileType;
    private Integer downloadCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Integer getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }

    public static CourseDocumentDto fromEntity(CourseDocument entity) {
        CourseDocumentDto dto = new CourseDocumentDto();
        dto.setId(entity.getId());
        dto.setLessonId(entity.getLesson() != null ? entity.getLesson().getId() : null);
        dto.setTitle(entity.getTitle());
        dto.setFileUrl(entity.getFileUrl());
        dto.setFileSizeBytes(entity.getFileSizeBytes());
        dto.setFileType(entity.getFileType());
        dto.setDownloadCount(entity.getDownloadCount());
        return dto;
    }
}
