package com.cuonghoangdev.api_backend.dto;

import jakarta.validation.constraints.NotBlank;

public class SkillRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String category;
    private Integer proficiency;
    private String description;
    private Boolean isFeatured;
    private Integer displayOrder;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getProficiency() { return proficiency; }
    public void setProficiency(Integer proficiency) { this.proficiency = proficiency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
