package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_details")
@EntityListeners(AuditingEntityListener.class)
public class LessonDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false, unique = true)
    private Lesson lesson;

    @Column(name = "video_platform", length = 30)
    private String videoPlatform = "EMBED";

    @Column(name = "source_code_url", length = 500)
    private String sourceCodeUrl;

    @Column(name = "teaching_notes", columnDefinition = "TEXT")
    private String teachingNotes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }
    public String getVideoPlatform() { return videoPlatform; }
    public void setVideoPlatform(String videoPlatform) { this.videoPlatform = videoPlatform; }
    public String getSourceCodeUrl() { return sourceCodeUrl; }
    public void setSourceCodeUrl(String sourceCodeUrl) { this.sourceCodeUrl = sourceCodeUrl; }
    public String getTeachingNotes() { return teachingNotes; }
    public void setTeachingNotes(String teachingNotes) { this.teachingNotes = teachingNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
