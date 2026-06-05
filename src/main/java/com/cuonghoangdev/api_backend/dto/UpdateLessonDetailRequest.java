package com.cuonghoangdev.api_backend.dto;

public class UpdateLessonDetailRequest {
    private String videoPlatform;
    private String videoUrl;
    private String sourceCodeUrl;
    private String teachingNotes;

    public String getVideoPlatform() { return videoPlatform; }
    public void setVideoPlatform(String videoPlatform) { this.videoPlatform = videoPlatform; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getSourceCodeUrl() { return sourceCodeUrl; }
    public void setSourceCodeUrl(String sourceCodeUrl) { this.sourceCodeUrl = sourceCodeUrl; }
    public String getTeachingNotes() { return teachingNotes; }
    public void setTeachingNotes(String teachingNotes) { this.teachingNotes = teachingNotes; }
}
