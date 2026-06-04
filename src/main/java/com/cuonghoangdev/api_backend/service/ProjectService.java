package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ProjectDto;
import com.cuonghoangdev.api_backend.entity.Project;
import com.cuonghoangdev.api_backend.repository.ProjectRepository;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public Page<ProjectDto> getAllProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return projectRepository.findAll(pageable)
                .map(this::toDto);
    }

    public Page<ProjectDto> getFeaturedProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return projectRepository.findByIsFeaturedTrue(pageable)
                .map(this::toDto);
    }

    public Page<ProjectDto> searchProjects(String keyword, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return projectRepository.searchProjects(keyword, status, pageable)
                .map(this::toDto);
    }

    public ProjectDto getBySlug(String slug) {
        return projectRepository.findBySlug(slug)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Project not found: " + slug));
    }

    // ─── Write operations — run in a non-readOnly transaction ────────────────
    // Hibernate.initialize() MUST be called inside a transactional boundary
    // where the Persistence Context (session) is still open.

    @Transactional
    public ProjectDto createProject(Project project) {
        Project saved = projectRepository.save(project);
        Hibernate.initialize(saved.getSkills());
        return toDto(saved);
    }

    @Transactional
    public ProjectDto updateProject(Long id, Project updates) {
        Project existing = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found: " + id));

        if (updates.getTitle() != null)           existing.setTitle(updates.getTitle());
        if (updates.getSlug() != null)            existing.setSlug(updates.getSlug());
        if (updates.getDescription() != null)     existing.setDescription(updates.getDescription());
        if (updates.getContent() != null)        existing.setContent(updates.getContent());
        if (updates.getThumbnailUrl() != null)    existing.setThumbnailUrl(updates.getThumbnailUrl());
        if (updates.getProjectUrl() != null)     existing.setProjectUrl(updates.getProjectUrl());
        if (updates.getGithubUrl() != null)       existing.setGithubUrl(updates.getGithubUrl());
        if (updates.getTechStack() != null)       existing.setTechStack(updates.getTechStack());
        if (updates.getRole() != null)            existing.setRole(updates.getRole());
        if (updates.getDuration() != null)         existing.setDuration(updates.getDuration());
        if (updates.getStatus() != null)          existing.setStatus(updates.getStatus());
        if (updates.getIsFeatured() != null)      existing.setIsFeatured(updates.getIsFeatured());
        if (updates.getStartDate() != null)       existing.setStartDate(updates.getStartDate());
        if (updates.getEndDate() != null)         existing.setEndDate(updates.getEndDate());
        if (updates.getImages() != null)           existing.setImages(updates.getImages());

        // Force-load the lazy skills collection BEFORE the session closes.
        // This is the definitive fix for:
        //   "Cannot lazily initialize collection of role 'Project.skills' (no session)"
        Hibernate.initialize(existing.getSkills());

        Project saved = projectRepository.save(existing);
        return toDto(saved);
    }

    // ─── Entity → DTO (runs inside the same transaction as the caller) ─────
    // Calling this method directly from the Controller (outside a transaction)
    // would re-introduce the LazyInitializationException. Always call
    // through a service method annotated @Transactional.
    private ProjectDto toDto(Project project) {
        // Ensure the skills proxy is fully initialized before mapping.
        // If this method is called from a @Transactional method (e.g. getAllProjects),
        // Hibernate.initialize() is a no-op because the collection is already loaded.
        // If called outside a transaction it would throw — but we guard against that.
        Hibernate.initialize(project.getSkills());
        return ProjectDto.fromEntity(project);
    }
}
