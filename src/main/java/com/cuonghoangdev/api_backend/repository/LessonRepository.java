package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Lesson;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findBySectionIdOrderBySortOrderAsc(Long sectionId);

    Optional<Lesson> findBySectionIdAndSlug(Long sectionId, String slug);

    @EntityGraph(attributePaths = {"section", "section.course", "detail", "documents", "assignments"})
    Optional<Lesson> findWithRelationsById(Long id);

    @Query("SELECT l FROM Lesson l WHERE l.section.course.id = :courseId AND (l.isPublished = true OR l.section.course.status = 'PUBLISHED') ORDER BY l.section.sortOrder ASC, l.sortOrder ASC")
    List<Lesson> findPublishedByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COALESCE(SUM(l.videoDurationSeconds), 0) FROM Lesson l WHERE l.section.course.id = :courseId AND (l.isPublished = true OR l.section.course.status = 'PUBLISHED')")
    Integer sumDurationByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT COUNT(l) FROM Lesson l WHERE l.section.course.id = :courseId AND (l.isPublished = true OR l.section.course.status = 'PUBLISHED')")
    Integer countPublishedByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT l FROM Lesson l WHERE l.section.course.id = :courseId AND (l.isPublished = true OR l.section.course.status = 'PUBLISHED') ORDER BY l.section.sortOrder ASC, l.sortOrder ASC")
    List<Lesson> findAllPublishedOrdered(@Param("courseId") Long courseId);

    @Modifying
    @Query("UPDATE Lesson l SET l.isFreePreview = :free WHERE l.id = :id")
    void updateFreePreview(@Param("id") Long id, @Param("free") boolean free);
}
