package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Enrollment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class EnrollmentDto {
    private Long id;
    private Long userId;
    private Long courseId;
    private String courseTitle;
    private String courseSlug;
    private String courseThumbnail;
    private LocalDateTime enrolledAt;
    private LocalDateTime expiresAt;
    private String status;
    private BigDecimal progressPercent;
    private Long lastLessonId;
    private String lastLessonTitle;
    private LocalDateTime lastAccessedAt;
    private Long certificateId;
    private String certificateNumber;
    private String courseCode;
    private String semesterName;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getCourseSlug() {
        return courseSlug;
    }

    public void setCourseSlug(String courseSlug) {
        this.courseSlug = courseSlug;
    }

    public String getCourseThumbnail() {
        return courseThumbnail;
    }

    public void setCourseThumbnail(String courseThumbnail) {
        this.courseThumbnail = courseThumbnail;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(BigDecimal progressPercent) {
        this.progressPercent = progressPercent;
    }

    public Long getLastLessonId() {
        return lastLessonId;
    }

    public void setLastLessonId(Long lastLessonId) {
        this.lastLessonId = lastLessonId;
    }

    public String getLastLessonTitle() {
        return lastLessonTitle;
    }

    public void setLastLessonTitle(String lastLessonTitle) {
        this.lastLessonTitle = lastLessonTitle;
    }

    public LocalDateTime getLastAccessedAt() {
        return lastAccessedAt;
    }

    public void setLastAccessedAt(LocalDateTime lastAccessedAt) {
        this.lastAccessedAt = lastAccessedAt;
    }

    public Long getCertificateId() { return certificateId; }
    public void setCertificateId(Long certificateId) { this.certificateId = certificateId; }
    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getSemesterName() { return semesterName; }
    public void setSemesterName(String semesterName) { this.semesterName = semesterName; }

    public static EnrollmentDto fromEntity(Enrollment entity) {
        EnrollmentDto dto = new EnrollmentDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
        if (entity.getCourse() != null) {
            dto.setCourseId(entity.getCourse().getId());
            dto.setCourseTitle(entity.getCourse().getTitle());
            dto.setCourseSlug(entity.getCourse().getSlug());
            dto.setCourseThumbnail(entity.getCourse().getThumbnailUrl());
        }
        dto.setEnrolledAt(entity.getEnrolledAt());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setStatus(entity.getStatus());
        dto.setProgressPercent(entity.getProgressPercent());
        if (entity.getLastLesson() != null) {
            dto.setLastLessonId(entity.getLastLesson().getId());
            dto.setLastLessonTitle(entity.getLastLesson().getTitle());
        }
        dto.setLastAccessedAt(entity.getLastAccessedAt());
        if (entity.getCourse() != null) {
            dto.setCourseCode(entity.getCourse().getCourseCode());
            if (entity.getCourse().getSemester() != null) {
                dto.setSemesterName(entity.getCourse().getSemester().getName());
            }
        }
        if (entity.getCertificate() != null) {
            dto.setCertificateId(entity.getCertificate().getId());
            dto.setCertificateNumber(entity.getCertificate().getCertificateNumber());
        }
        return dto;
    }
}
