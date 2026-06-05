package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AssignmentSubmissionRequest {
    @NotNull(message = "Assignment ID khong duoc de trong")
    private Long assignmentId;

    @NotBlank(message = "Link nop bai khong duoc de trong")
    private String submissionUrl;

    private String notes;

    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
    public String getSubmissionUrl() { return submissionUrl; }
    public void setSubmissionUrl(String submissionUrl) { this.submissionUrl = submissionUrl; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
