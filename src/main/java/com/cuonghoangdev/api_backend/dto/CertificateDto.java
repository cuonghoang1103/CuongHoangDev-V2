package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Certificate;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;

public class CertificateDto {
    private Long id;
    private String certificateNumber;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long courseId;
    private String courseTitle;
    private String courseCode;
    private String semesterName;
    private LocalDateTime issuedAt;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getSemesterName() { return semesterName; }
    public void setSemesterName(String semesterName) { this.semesterName = semesterName; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static CertificateDto fromEntity(Certificate entity) {
        CertificateDto dto = new CertificateDto();
        dto.setId(entity.getId());
        dto.setCertificateNumber(entity.getCertificateNumber());
        dto.setIssuedAt(entity.getIssuedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        if (Hibernate.isInitialized(entity.getUser()) && entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
            dto.setUserName(entity.getUser().getFullName() != null ? entity.getUser().getFullName() : entity.getUser().getUsername());
            dto.setUserEmail(entity.getUser().getEmail());
        }
        if (entity.getCourse() != null && Hibernate.isInitialized(entity.getCourse())) {
            dto.setCourseId(entity.getCourse().getId());
            dto.setCourseTitle(entity.getCourse().getTitle());
            dto.setCourseCode(entity.getCourse().getCourseCode());
            if (Hibernate.isInitialized(entity.getCourse().getSemester()) && entity.getCourse().getSemester() != null) {
                dto.setSemesterName(entity.getCourse().getSemester().getName());
            }
        }
        return dto;
    }
}
