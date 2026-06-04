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

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Projects", description = "Dự án cá nhân")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    // ══════════════════════════════════════════════════════════════
    // READ endpoints — handled entirely by the service layer
    // ══════════════════════════════════════════════════════════════

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
        return ResponseEntity.ok(
                ApiResponse.ok("Dự án nổi bật", projectService.getFeaturedProjects(page, size)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Lấy chi tiết dự án theo slug")
    public ResponseEntity<ApiResponse<ProjectDto>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(
                ApiResponse.ok("Chi tiết dự án", projectService.getBySlug(slug)));
    }

    // ══════════════════════════════════════════════════════════════
    // WRITE endpoints — delegate to service
    // ProjectService is @Transactional and calls Hibernate.initialize()
    // so the lazy 'skills' collection is always loaded before the
    // session closes. Calling ProjectDto.fromEntity() HERE (in the
    // controller, outside a transaction) would throw:
    //   LazyInitializationException: no session
    // ══════════════════════════════════════════════════════════════

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(
            @RequestBody ProjectRequest request) {
        if (projectRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Slug đã tồn tại: " + request.getSlug());
        }
        Project project = request.toEntity();
        ProjectDto created = projectService.createProject(project);
        return ResponseEntity.ok(ApiResponse.ok("Tạo dự án thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectRequest request) {
        // Slug uniqueness check is inside the service updateProject method
        ProjectDto updated = projectService.updateProject(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật dự án thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found: " + id);
        }
        projectRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa dự án thành công", null));
    }

    // ══════════════════════════════════════════════════════════════
    // Request DTO — plain data carrier, no Hibernate involvement
    // ══════════════════════════════════════════════════════════════

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

        public String getTitle()              { return title; }
        public void setTitle(String title)    { this.title = title; }
        public String getSlug()               { return slug; }
        public void setSlug(String slug)      { this.slug = slug; }
        public String getDescription()        { return description; }
        public void setDescription(String d)  { this.description = d; }
        public String getContent()            { return content; }
        public void setContent(String c)     { this.content = c; }
        public String getThumbnailUrl()       { return thumbnailUrl; }
        public void setThumbnailUrl(String u) { this.thumbnailUrl = u; }
        public String getProjectUrl()         { return projectUrl; }
        public void setProjectUrl(String u)  { this.projectUrl = u; }
        public String getGithubUrl()          { return githubUrl; }
        public void setGithubUrl(String u)   { this.githubUrl = u; }
        public String getTechStack()         { return techStack; }
        public void setTechStack(String t)   { this.techStack = t; }
        public String getRole()               { return role; }
        public void setRole(String r)         { this.role = r; }
        public String getDuration()           { return duration; }
        public void setDuration(String d)     { this.duration = d; }
        public String getStatus()             { return status; }
        public void setStatus(String s)       { this.status = s; }
        public Boolean getFeatured()          { return featured; }
        public void setFeatured(Boolean f)    { this.featured = f; }
        public java.time.LocalDate getStartDate() { return startDate; }
        public void setStartDate(java.time.LocalDate d) { this.startDate = d; }
        public java.time.LocalDate getEndDate()   { return endDate; }
        public void setEndDate(java.time.LocalDate d)   { this.endDate = d; }
        public String getImages()             { return images; }
        public void setImages(String i)       { this.images = i; }

        /** Maps request fields to a transient Project entity.
         *  The entity has no ID yet — the service layer will save it
         *  and Hibernate.initialize() the lazy 'skills' collection. */
        public Project toEntity() {
            Project p = new Project();
            p.setTitle(title);
            p.setSlug(slug);
            p.setDescription(description);
            p.setContent(content);
            p.setThumbnailUrl(thumbnailUrl);
            p.setProjectUrl(projectUrl);
            p.setGithubUrl(githubUrl);
            p.setTechStack(techStack);
            p.setRole(role);
            p.setDuration(duration);
            p.setStatus(status != null ? status : "COMPLETED");
            p.setIsFeatured(featured != null ? featured : false);
            p.setStartDate(startDate);
            p.setEndDate(endDate);
            p.setImages(images);
            return p;
        }
    }
}
