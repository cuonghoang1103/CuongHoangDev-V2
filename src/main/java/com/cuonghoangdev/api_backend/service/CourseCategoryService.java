package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.CourseCategoryDto;
import com.cuonghoangdev.api_backend.entity.CourseCategory;
import com.cuonghoangdev.api_backend.repository.CourseCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseCategoryService {

    private final CourseCategoryRepository categoryRepository;

    public CourseCategoryService(CourseCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CourseCategoryDto> getAllActive() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAsc().stream()
            .map(c -> CourseCategoryDto.fromEntity(c))
            .toList();
    }

    public List<CourseCategoryDto> getAll() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
            .map(c -> CourseCategoryDto.fromEntity(c))
            .toList();
    }

    @Transactional
    public CourseCategoryDto create(String name, String description, String icon, Integer sortOrder) {
        CourseCategory cat = new CourseCategory();
        cat.setName(name);
        cat.setSlug(generateSlug(name));
        cat.setDescription(description);
        cat.setIcon(icon);
        cat.setSortOrder(sortOrder != null ? sortOrder : 0);
        cat.setIsActive(true);
        return CourseCategoryDto.fromEntity(categoryRepository.save(cat));
    }

    @Transactional
    public CourseCategoryDto update(Long id, String name, String description, String icon, Integer sortOrder, Boolean isActive) {
        CourseCategory cat = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        if (name != null) cat.setName(name);
        if (description != null) cat.setDescription(description);
        if (icon != null) cat.setIcon(icon);
        if (sortOrder != null) cat.setSortOrder(sortOrder);
        if (isActive != null) cat.setIsActive(isActive);
        return CourseCategoryDto.fromEntity(categoryRepository.save(cat));
    }

    @Transactional
    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    private String generateSlug(String name) {
        String slug = name.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .trim();
        return slug;
    }
}
