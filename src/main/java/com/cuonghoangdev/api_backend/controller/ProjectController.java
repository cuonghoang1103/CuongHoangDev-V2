package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.ProjectDto;
import com.cuonghoangdev.api_backend.entity.Project;
import com.cuonghoangdev.api_backend.exception.BadRequestException;
import com.cuonghoangdev.api_backend.exception.ResourceNotFoundException;
import com.cuonghoangdev.api_backend.repository.ProjectRepository;
import com.cuonghoangdev.api_backend.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Projects", description = "Dự án cá nhân")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách dự án với phân trang")
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        Page<ProjectDto> result;
        if (keyword != null || status != null) {
            result = projectService.searchProjects(keyword, status, page, size);
        } else {
            result = projectService.getAllProjects(page, size);
        }
        return ResponseEntity.ok(ApiResponse.ok("Danh sách dự án", result));
    }

    @GetMapping("/featured")
    @Operation(summary = "Lấy dự án nổi bật")
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getFeaturedProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Dự án nổi bật", projectService.getFeaturedProjects(page, size)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Lấy chi tiết dự án theo slug")
    public ResponseEntity<ApiResponse<ProjectDto>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết dự án", projectService.getBySlug(slug)));
    }

    // Admin CRUD
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(@RequestBody ProjectRequest request) {
        if (projectRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Slug da ton tai: " + request.getSlug());
        }
        Project project = new Project();
        project.setTitle(request.getTitle());
        project.setSlug(request.getSlug());
        project.setDescription(request.getDescription());
        project.setContent(request.getContent());
        project.setThumbnailUrl(request.getThumbnailUrl());
        project.setProjectUrl(request.getProjectUrl());
        project.setGithubUrl(request.getGithubUrl());
        project.setTechStack(request.getTechStack());
        project.setRole(request.getRole());
        project.setDuration(request.getDuration());
        project.setStatus(request.getStatus() != null ? request.getStatus() : "COMPLETED");
        project.setIsFeatured(request.getFeatured() != null ? request.getFeatured() : false);
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setImages(request.getImages());
        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(ApiResponse.ok("Tao du an thanh cong", ProjectDto.fromEntity(saved)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getSlug() != null && !request.getSlug().equals(project.getSlug())) {
            if (projectRepository.existsBySlug(request.getSlug())) {
                throw new BadRequestException("Slug da ton tai: " + request.getSlug());
            }
            project.setSlug(request.getSlug());
        }
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getContent() != null) project.setContent(request.getContent());
        if (request.getThumbnailUrl() != null) project.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getProjectUrl() != null) project.setProjectUrl(request.getProjectUrl());
        if (request.getGithubUrl() != null) project.setGithubUrl(request.getGithubUrl());
        if (request.getTechStack() != null) project.setTechStack(request.getTechStack());
        if (request.getRole() != null) project.setRole(request.getRole());
        if (request.getDuration() != null) project.setDuration(request.getDuration());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getFeatured() != null) project.setIsFeatured(request.getFeatured());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());
        if (request.getImages() != null) project.setImages(request.getImages());
        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat du an thanh cong", ProjectDto.fromEntity(saved)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found: " + id);
        }
        projectRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Da xoa du an thanh cong", null));
    }

    // Inner request class
    public static class ProjectRequest {
        private String title;
        private String slug;
        private String description;
        private String content;
        private String thumbnailUrl;
        private String projectUrl;
        private String githubUrl;
        private String techStack;
        private String role;
        private String duration;
        private String status;
        private Boolean featured;
        private java.time.LocalDate startDate;
        private java.time.LocalDate endDate;
        /** JSON array string of image URLs, e.g. '["url1","url2"]' */
        private String images;

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
        public String getTechStack() { return techStack; }
        public void setTechStack(String techStack) { this.techStack = techStack; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Boolean getFeatured() { return featured; }
        public void setFeatured(Boolean featured) { this.featured = featured; }
        public java.time.LocalDate getStartDate() { return startDate; }
        public void setStartDate(java.time.LocalDate startDate) { this.startDate = startDate; }
        public java.time.LocalDate getEndDate() { return endDate; }
        public void setEndDate(java.time.LocalDate endDate) { this.endDate = endDate; }
        public String getImages() { return images; }
        public void setImages(String images) { this.images = images; }
    }
}
