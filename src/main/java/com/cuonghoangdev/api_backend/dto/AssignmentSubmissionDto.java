package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.AssignmentSubmission;

import java.time.LocalDateTime;

public class AssignmentSubmissionDto {
    private Long id;
    private Long assignmentId;
    private Long userId;
    private String submissionUrl;
    private String notes;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getSubmissionUrl() { return submissionUrl; }
    public void setSubmissionUrl(String submissionUrl) { this.submissionUrl = submissionUrl; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static AssignmentSubmissionDto fromEntity(AssignmentSubmission entity) {
        AssignmentSubmissionDto dto = new AssignmentSubmissionDto();
        dto.setId(entity.getId());
        dto.setAssignmentId(entity.getAssignment() != null ? entity.getAssignment().getId() : null);
        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
        dto.setSubmissionUrl(entity.getSubmissionUrl());
        dto.setNotes(entity.getNotes());
        dto.setStatus(entity.getStatus());
        dto.setSubmittedAt(entity.getSubmittedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
