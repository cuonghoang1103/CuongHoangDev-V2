package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.ProjectDto;
import com.cuonghoangdev.api_backend.entity.Project;
import com.cuonghoangdev.api_backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public Page<ProjectDto> getAllProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return projectRepository.findAll(pageable)
                .map(ProjectDto::fromEntity);
    }

    public Page<ProjectDto> getFeaturedProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return projectRepository.findByIsFeaturedTrue(pageable)
                .map(ProjectDto::fromEntity);
    }

    public Page<ProjectDto> searchProjects(String keyword, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return projectRepository.searchProjects(keyword, status, pageable)
                .map(ProjectDto::fromEntity);
    }

    public ProjectDto getBySlug(String slug) {
        return projectRepository.findBySlug(slug)
                .map(ProjectDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Project not found: " + slug));
    }
}
