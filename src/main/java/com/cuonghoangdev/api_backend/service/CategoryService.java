package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.CategoryDto;
import com.cuonghoangdev.api_backend.entity.Category;
import com.cuonghoangdev.api_backend.exception.BadRequestException;
import com.cuonghoangdev.api_backend.exception.ResourceNotFoundException;
import com.cuonghoangdev.api_backend.repository.CategoryRepository;
import com.cuonghoangdev.api_backend.repository.PostRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;

    public CategoryService(CategoryRepository categoryRepository, PostRepository postRepository) {
        this.categoryRepository = categoryRepository;
        this.postRepository = postRepository;
    }

    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> toDto(c, postRepository.countByCategoryId(c.getId())))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "categories", key = "#id")
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return toDto(category, postRepository.countByCategoryId(id));
    }

    @Cacheable(value = "categories", key = "'slug:' + #slug")
    public CategoryDto getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "slug", slug));
        return toDto(category, postRepository.countByCategoryId(category.getId()));
    }

    public Category getCategoryEntityByName(String name) {
        return categoryRepository.findByName(name).orElse(null);
    }

    @Caching(evict = {
            @CacheEvict(value = "categories", key = "'all'"),
            @CacheEvict(value = "categories", allEntries = true)
    })
    public CategoryDto createCategory(String name, String slug, String description) {
        if (categoryRepository.existsByName(name)) {
            throw new BadRequestException("Category name already exists: " + name);
        }
        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category slug already exists: " + slug);
        }

        Category category = new Category(name, slug);
        category.setDescription(description);
        Category saved = categoryRepository.save(category);
        return toDto(saved, 0);
    }

    @Caching(evict = {
            @CacheEvict(value = "categories", key = "'all'"),
            @CacheEvict(value = "categories", key = "#id"),
            @CacheEvict(value = "categories", key = "'slug:' + #slug")
    })
    public CategoryDto updateCategory(Long id, String name, String slug, String description) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (!category.getName().equals(name) && categoryRepository.existsByName(name)) {
            throw new BadRequestException("Category name already exists: " + name);
        }
        if (!category.getSlug().equals(slug) && categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category slug already exists: " + slug);
        }

        category.setName(name);
        category.setSlug(slug);
        category.setDescription(description);
        Category saved = categoryRepository.save(category);
        return toDto(saved, postRepository.countByCategoryId(id));
    }

    @Caching(evict = {
            @CacheEvict(value = "categories", key = "'all'"),
            @CacheEvict(value = "categories", allEntries = true)
    })
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        categoryRepository.delete(category);
    }

    private CategoryDto toDto(Category category, int postCount) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setPostCount(postCount);
        return dto;
    }
}
