package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreatePostRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String slug;

    private String excerpt;

    @NotBlank(message = "Content is required")
    private String content;

    private String thumbnailUrl;
    private String status = "DRAFT";
    private Long categoryId;
    private List<String> tagNames;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getExcerpt() { return excerpt; }
    public void setExcerpt(String excerpt) { this.excerpt = excerpt; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public List<String> getTagNames() { return tagNames; }
    public void setTagNames(List<String> tagNames) { this.tagNames = tagNames; }
}
