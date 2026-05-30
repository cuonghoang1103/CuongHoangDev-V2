package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.CourseCategory;

public class CourseCategoryDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String icon;
    private Integer sortOrder;
    private Integer courseCount;
    private Boolean isActive;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Integer getCourseCount() {
        return courseCount;
    }

    public void setCourseCount(Integer courseCount) {
        this.courseCount = courseCount;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public static CourseCategoryDto fromEntity(CourseCategory entity) {
        CourseCategoryDto dto = new CourseCategoryDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setSlug(entity.getSlug());
        dto.setDescription(entity.getDescription());
        dto.setIcon(entity.getIcon());
        dto.setSortOrder(entity.getSortOrder());
        dto.setIsActive(entity.getIsActive());
        return dto;
    }

    public static CourseCategoryDto fromEntity(CourseCategory entity, int courseCount) {
        CourseCategoryDto dto = fromEntity(entity);
        dto.setCourseCount(courseCount);
        return dto;
    }
}
