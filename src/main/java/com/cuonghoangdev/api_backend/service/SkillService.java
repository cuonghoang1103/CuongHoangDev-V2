package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.SkillDto;
import com.cuonghoangdev.api_backend.dto.SkillRequest;
import com.cuonghoangdev.api_backend.entity.Skill;
import com.cuonghoangdev.api_backend.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    public List<SkillDto> getAllSkills() {
        return skillRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(SkillDto::fromEntity).collect(Collectors.toList());
    }

    public List<SkillDto> getFeaturedSkills() {
        return skillRepository.findByIsFeaturedTrueOrderByDisplayOrderAsc()
                .stream().map(SkillDto::fromEntity).collect(Collectors.toList());
    }

    public List<SkillDto> getSkillsByCategory(String category) {
        return skillRepository.findByCategoryOrderByDisplayOrderAsc(category)
                .stream().map(SkillDto::fromEntity).collect(Collectors.toList());
    }

    public SkillDto getBySlug(String slug) {
        return skillRepository.findBySlug(slug)
                .map(SkillDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + slug));
    }

    @Transactional
    public SkillDto createSkill(SkillRequest req) {
        Skill skill = new Skill();
        skill.setName(req.getName());
        skill.setSlug(slugify(req.getName()));
        skill.setCategory(req.getCategory() != null ? req.getCategory() : "Other");
        skill.setProficiency(req.getProficiency() != null ? req.getProficiency() : 3);
        skill.setDescription(req.getDescription());
        skill.setIsFeatured(req.getIsFeatured() != null ? req.getIsFeatured() : false);
        skill.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0);
        return SkillDto.fromEntity(skillRepository.save(skill));
    }

    @Transactional
    public SkillDto updateSkill(Long id, SkillRequest req) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
        if (req.getName() != null) skill.setName(req.getName());
        if (req.getCategory() != null) skill.setCategory(req.getCategory());
        if (req.getProficiency() != null) skill.setProficiency(req.getProficiency());
        if (req.getDescription() != null) skill.setDescription(req.getDescription());
        if (req.getIsFeatured() != null) skill.setIsFeatured(req.getIsFeatured());
        if (req.getDisplayOrder() != null) skill.setDisplayOrder(req.getDisplayOrder());
        return SkillDto.fromEntity(skillRepository.save(skill));
    }

    @Transactional
    public void deleteSkill(Long id) {
        skillRepository.deleteById(id);
    }

    private String slugify(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
