package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.Skill;

public class SkillDto {
    private Long id;
    private String name;
    private String slug;
    private String category;
    private Integer proficiency;
    private String description;
    private Integer yearsExperience;
    private Boolean isFeatured;
    private Integer displayOrder;

    public static SkillDto fromEntity(Skill s) {
        SkillDto d = new SkillDto();
        d.setId(s.getId());
        d.setName(s.getName());
        d.setSlug(s.getSlug());
        d.setCategory(s.getCategory());
        d.setProficiency(s.getProficiency());
        d.setDescription(s.getDescription());
        d.setYearsExperience(s.getYearsExperience());
        d.setIsFeatured(s.getIsFeatured());
        d.setDisplayOrder(s.getDisplayOrder());
        return d;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getProficiency() { return proficiency; }
    public void setProficiency(Integer proficiency) { this.proficiency = proficiency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(Integer yearsExperience) { this.yearsExperience = yearsExperience; }
    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
