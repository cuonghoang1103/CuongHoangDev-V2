package com.cuonghoangdev.api_backend.dto;

import java.time.LocalDateTime;

public class MusicTrackDto {
    private Long id;
    private String title;
    private String artist;
    private String audioUrl;
    private String coverImage;
    private Integer durationSeconds;
    private Long fileSize;
    private Boolean active;
    private String createdAt;

    public MusicTrackDto() {}

    public static MusicTrackDto fromEntity(com.cuonghoangdev.api_backend.entity.MusicTrack t) {
        MusicTrackDto dto = new MusicTrackDto();
        dto.setId(t.getId());
        dto.setTitle(t.getTitle());
        dto.setArtist(t.getArtist());
        dto.setAudioUrl(t.getAudioUrl());
        dto.setCoverImage(t.getCoverImage());
        dto.setDurationSeconds(t.getDurationSeconds());
        dto.setFileSize(t.getFileSize());
        dto.setActive(t.getActive());
        if (t.getCreatedAt() != null) {
            dto.setCreatedAt(t.getCreatedAt().toString());
        }
        return dto;
    }

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
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
