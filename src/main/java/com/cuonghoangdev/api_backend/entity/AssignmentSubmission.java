package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assignment_id", "user_id"})
})
@EntityListeners(AuditingEntityListener.class)
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "submission_url", nullable = false, length = 500)
    private String submissionUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 30)
    private String status = "SUBMITTED";

    @Column
    private Double grade;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @CreatedDate
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
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
}
