package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.LessonDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LessonDetailRepository extends JpaRepository<LessonDetail, Long> {
    Optional<LessonDetail> findByLessonId(Long lessonId);
}
