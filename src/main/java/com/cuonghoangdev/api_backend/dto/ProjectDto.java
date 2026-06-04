package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Project;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class ProjectDto {
    private static final ObjectMapper mapper = new ObjectMapper();

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String content;
    private String thumbnailUrl;
    private String projectUrl;
    private String githubUrl;
    private String videoUrl;
    private List<String> technologies;
    private String role;
    private String duration;
    private String status;
    private Boolean featured;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> skillNames;
    private List<String> images;
    private String createdAt;

    public static ProjectDto fromEntity(Project p) {
        ProjectDto d = new ProjectDto();
        d.setId(p.getId());
        d.setTitle(p.getTitle());
        d.setSlug(p.getSlug());
        d.setDescription(p.getDescription());
        d.setContent(p.getContent());
        d.setThumbnailUrl(p.getThumbnailUrl());
        d.setProjectUrl(p.getProjectUrl());
        d.setVideoUrl(p.getVideoUrl());
        d.setGithubUrl(p.getGithubUrl());
        d.setRole(p.getRole());
        d.setDuration(p.getDuration());
        d.setStatus(p.getStatus());
        d.setFeatured(p.getIsFeatured());
        d.setStartDate(p.getStartDate());
        d.setEndDate(p.getEndDate());
        d.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);

        if (p.getTechStack() != null && !p.getTechStack().isBlank()) {
            d.setTechnologies(List.of(p.getTechStack().split("\\s*,\\s*")));
        }
        if (p.getSkills() != null && !p.getSkills().isEmpty()) {
            d.setSkillNames(p.getSkills().stream()
                    .map(s -> s.getName())
                    .collect(Collectors.toList()));
        }
        if (p.getImages() != null && !p.getImages().isBlank()) {
            try {
                d.setImages(mapper.readValue(p.getImages(), new TypeReference<List<String>>() {}));
            } catch (Exception e) {
                d.setImages(List.of());
            }
        } else {
            d.setImages(List.of());
        }
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getProjectUrl() { return projectUrl; }
    public void setProjectUrl(String projectUrl) { this.projectUrl = projectUrl; }
    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public List<String> getTechnologies() { return technologies; }
    public void setTechnologies(List<String> technologies) { this.technologies = technologies; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<String> getSkillNames() { return skillNames; }
    public void setSkillNames(List<String> skillNames) { this.skillNames = skillNames; }
    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
