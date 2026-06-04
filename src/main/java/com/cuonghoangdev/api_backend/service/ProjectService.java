package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ProjectDto;
import com.cuonghoangdev.api_backend.entity.Project;
import com.cuonghoangdev.api_backend.repository.ProjectRepository;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

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

    @Transactional
    public ProjectDto createProject(Project project) {
        Project saved = projectRepository.save(project);
        Hibernate.initialize(saved.getSkills());
        return toDto(saved);
    }

    @Transactional
    public ProjectDto updateProject(Long id, Project updates) {
        log.info("[ProjectService] updateProject called with id={}", id);
        try {
            Project existing = projectRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Project not found: " + id));

            if (updates.getTitle() != null)            existing.setTitle(updates.getTitle());
            if (updates.getSlug() != null)             existing.setSlug(updates.getSlug());
            if (updates.getDescription() != null)      existing.setDescription(updates.getDescription());
            if (updates.getContent() != null)           existing.setContent(updates.getContent());
            if (updates.getThumbnailUrl() != null)     existing.setThumbnailUrl(updates.getThumbnailUrl());
            if (updates.getProjectUrl() != null)       existing.setProjectUrl(updates.getProjectUrl());
            if (updates.getVideoUrl() != null)        existing.setVideoUrl(updates.getVideoUrl());
            if (updates.getGithubUrl() != null)        existing.setGithubUrl(updates.getGithubUrl());
            if (updates.getTechStack() != null)        existing.setTechStack(updates.getTechStack());
            if (updates.getRole() != null)              existing.setRole(updates.getRole());
            if (updates.getDuration() != null)          existing.setDuration(updates.getDuration());
            if (updates.getStatus() != null)           existing.setStatus(updates.getStatus());
            if (updates.getIsFeatured() != null)       existing.setIsFeatured(updates.getIsFeatured());
            if (updates.getStartDate() != null)        existing.setStartDate(updates.getStartDate());
            if (updates.getEndDate() != null)          existing.setEndDate(updates.getEndDate());
            if (updates.getImages() != null)           existing.setImages(updates.getImages());

            Hibernate.initialize(existing.getSkills());

            Project saved = projectRepository.save(existing);
            log.info("[ProjectService] updateProject success for id={}", id);
            return toDto(saved);
        } catch (Exception e) {
            log.error("[ProjectService] updateProject failed for id={}: {} — {}",
                    id, e.getClass().getSimpleName(), e.getMessage(), e);
            throw e;
        }
    }

    private ProjectDto toDto(Project project) {
        Hibernate.initialize(project.getSkills());
        return ProjectDto.fromEntity(project);
    }
}
