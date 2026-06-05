package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.AssignmentSubmission;

import java.time.LocalDateTime;

public class SubmissionWithUserDto {
    private Long id;
    private Long assignmentId;
    private String studentName;
    private String studentEmail;
    private String submissionUrl;
    private String notes;
    private String status;
    private Double grade;
    private String feedback;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public String getSubmissionUrl() { return submissionUrl; }
    public void setSubmissionUrl(String submissionUrl) { this.submissionUrl = submissionUrl; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getGrade() { return grade; }
    public void setGrade(Double grade) { this.grade = grade; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static SubmissionWithUserDto fromEntity(AssignmentSubmission entity) {
        SubmissionWithUserDto dto = new SubmissionWithUserDto();
        dto.setId(entity.getId());
        dto.setAssignmentId(entity.getAssignment() != null ? entity.getAssignment().getId() : null);
        dto.setSubmissionUrl(entity.getSubmissionUrl());
        dto.setNotes(entity.getNotes());
        dto.setStatus(entity.getStatus());
        dto.setGrade(entity.getGrade());
        dto.setFeedback(entity.getFeedback());
        dto.setSubmittedAt(entity.getSubmittedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        if (entity.getUser() != null) {
            dto.setStudentName(entity.getUser().getFullName() != null ? entity.getUser().getFullName() : entity.getUser().getUsername());
            dto.setStudentEmail(entity.getUser().getEmail());
        }
        return dto;
    }
}
