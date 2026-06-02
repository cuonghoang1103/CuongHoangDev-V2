package com.cuonghoangdev.api_backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DTO for combined music track upload.
 * Both audio and cover are uploaded server-side in one request.
 */
@Schema(description = "Request to create a music track with audio and cover image")
public class MusicUploadRequest {

    @Schema(description = "Track title", example = "Midnight Code Session")
    private String title;

    @Schema(description = "Artist name", example = "Cuong Hoang")
    private String artist;

    @Schema(description = "Duration in seconds", example = "245")
    private Integer durationSeconds;

    @Schema(description = "Cover image URL (optional — if not provided, use existing or default)")
    private String coverImageUrl;

    @Schema(description = "Audio URL (returned after Supabase upload)", example = "https://...supabase.../tracks/uuid.mp3")
    private String audioUrl;

    @Schema(description = "Supabase storage path (e.g. 'tracks/uuid.mp3') — used for deletion")
    private String supabasePath;

    @Schema(description = "Mark track as active/visible", example = "true")
    private Boolean active = true;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public String getSupabasePath() { return supabasePath; }
    public void setSupabasePath(String supabasePath) { this.supabasePath = supabasePath; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
