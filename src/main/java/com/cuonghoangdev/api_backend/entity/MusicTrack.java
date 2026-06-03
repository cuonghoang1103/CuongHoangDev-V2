package com.cuonghoangdev.api_backend.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "music_tracks")
@EntityListeners(AuditingEntityListener.class)
public class MusicTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 255)
    private String artist;

    /**
     * Public URL of the audio file.
     * Currently sourced from Supabase Storage (previously Cloudinary).
     */
    @Column(name = "audio_url", length = 700)
    private String audioUrl;

    /**
     * Cover image URL — stored in Cloudinary.
     */
    @Column(name = "cover_image", length = 700)
    private String coverImage;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "file_size")
    private Long fileSize;

    /**
     * Cloudinary public ID for the audio file (if still using Cloudinary for audio).
     * Kept for backward compatibility and cleanup.
     */
    @Column(name = "public_id", length = 500)
    private String publicId;

    @Column(name = "cloudinary_url", length = 700)
    private String cloudinaryUrl;

    /**
     * Supabase Storage path for the audio file.
     * Example: "tracks/abc123-def456.mp3"
     * Used to delete files from Supabase when the track is deleted.
     */
    @Column(name = "supabase_path", length = 500)
    private String supabasePath;

    @Column(nullable = false)
    private Boolean active = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public MusicTrack() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
    public String getCloudinaryUrl() { return cloudinaryUrl; }
    public void setCloudinaryUrl(String cloudinaryUrl) { this.cloudinaryUrl = cloudinaryUrl; }
    public String getSupabasePath() { return supabasePath; }
    public void setSupabasePath(String supabasePath) { this.supabasePath = supabasePath; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return "MusicTrack{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", artist='" + artist + '\'' +
                ", audioUrl='" + audioUrl + '\'' +
                ", coverImage='" + coverImage + '\'' +
                ", durationSeconds=" + durationSeconds +
                ", fileSize=" + fileSize +
                ", publicId='" + publicId + '\'' +
                ", cloudinaryUrl='" + cloudinaryUrl + '\'' +
                ", supabasePath='" + supabasePath + '\'' +
                ", active=" + active +
                '}';
    }
}
