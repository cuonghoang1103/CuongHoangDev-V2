package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    List<CourseSection> findByCourseIdOrderBySortOrderAsc(Long courseId);

    @Modifying
    @Query("UPDATE CourseSection s SET s.isLocked = :locked WHERE s.id = :id")
    void updateLocked(@Param("id") Long id, @Param("locked") boolean locked);
}
