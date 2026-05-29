package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findBySlug(String slug);
    List<Skill> findByIsFeaturedTrueOrderByDisplayOrderAsc();
    List<Skill> findByCategoryOrderByDisplayOrderAsc(String category);
    List<Skill> findAllByOrderByDisplayOrderAsc();
}
