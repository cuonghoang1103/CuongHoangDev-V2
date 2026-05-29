package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.CourseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseCategoryRepository extends JpaRepository<CourseCategory, Long> {

    Optional<CourseCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<CourseCategory> findByIsActiveTrueOrderBySortOrderAsc();

    List<CourseCategory> findAllByOrderBySortOrderAsc();
}
