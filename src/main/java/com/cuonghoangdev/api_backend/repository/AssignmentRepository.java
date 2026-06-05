package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByLessonIdOrderBySortOrderAscIdAsc(Long lessonId);
}
