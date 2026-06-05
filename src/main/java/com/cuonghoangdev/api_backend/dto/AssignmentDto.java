package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Assignment;

import java.time.LocalDateTime;

public class AssignmentDto {
    private Long id;
    private Long lessonId;
    private String title;
    private String instructions;
    private LocalDateTime deadline;
    private Integer sortOrder;
    private Boolean isPublished;
    private Double maxScore;
    private AssignmentSubmissionDto mySubmission;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }
    public AssignmentSubmissionDto getMySubmission() { return mySubmission; }
    public void setMySubmission(AssignmentSubmissionDto mySubmission) { this.mySubmission = mySubmission; }

    public static AssignmentDto fromEntity(Assignment entity) {
        AssignmentDto dto = new AssignmentDto();
        dto.setId(entity.getId());
        dto.setLessonId(entity.getLesson() != null ? entity.getLesson().getId() : null);
        dto.setTitle(entity.getTitle());
        dto.setInstructions(entity.getInstructions());
        dto.setDeadline(entity.getDeadline());
        dto.setSortOrder(entity.getSortOrder());
        dto.setIsPublished(entity.getIsPublished());
        dto.setMaxScore(entity.getMaxScore());
        return dto;
    }
}
