package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotNull;

public class GradeSubmissionRequest {

    @NotNull(message = "Assignment submission ID is required")
    private Long submissionId;

    private Double grade;

    private String feedback;

    private String status;

    public Long getSubmissionId() { return submissionId; }
    public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }
    public Double getGrade() { return grade; }
    public void setGrade(Double grade) { this.grade = grade; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
