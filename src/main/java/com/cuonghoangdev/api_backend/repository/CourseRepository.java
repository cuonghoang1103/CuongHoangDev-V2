package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Course> findByIsPublishedTrue(Pageable pageable);

    Page<Course> findByIsPublishedTrueAndCategoryId(Long categoryId, Pageable pageable);

    Page<Course> findByIsPublishedTrueAndLevel(String level, Pageable pageable);

    Page<Course> findByIsPublishedTrueAndCategorySlug(String categorySlug, Pageable pageable);

    List<Course> findBySemesterIdOrderByTitleAsc(Long semesterId);

    List<Course> findByIsFeaturedTrueAndIsPublishedTrue(Pageable pageable);

    /**
     * Visibility gate: a course is publicly visible when:
     *   - isPublished = true  OR  status = 'PUBLISHED'
     * This OR condition ensures backward compatibility while migrating to the
     * single-source-of-truth `status` field.
     */
    @Query(value = "SELECT c FROM Course c WHERE " +
           "(c.isPublished = true OR c.status = 'PUBLISHED') " +
           "AND (cast(:keyword as text) IS NULL OR cast(c.title as text) ILIKE cast(concat('%', cast(:keyword as text), '%') as text)) " +
           "AND (cast(:categorySlug as text) IS NULL OR c.category.slug = cast(:categorySlug as text)) " +
           "AND (cast(:level as text) IS NULL OR c.level = cast(:level as text)) " +
           "ORDER BY c.publishedAt DESC",
           countQuery = "SELECT COUNT(c) FROM Course c WHERE " +
           "(c.isPublished = true OR c.status = 'PUBLISHED') " +
           "AND (cast(:keyword as text) IS NULL OR cast(c.title as text) ILIKE cast(concat('%', cast(:keyword as text), '%') as text)) " +
           "AND (cast(:categorySlug as text) IS NULL OR c.category.slug = cast(:categorySlug as text)) " +
           "AND (cast(:level as text) IS NULL OR c.level = cast(:level as text))")
    Page<Course> searchCourses(
            @Param("keyword") String keyword,
            @Param("categorySlug") String categorySlug,
            @Param("level") String level,
            Pageable pageable
    );

    /**
     * Featured courses: isFeatured = true AND publicly visible.
     */
    @Query("SELECT c FROM Course c WHERE c.isFeatured = true AND (c.isPublished = true OR c.status = 'PUBLISHED') ORDER BY c.publishedAt DESC")
    List<Course> findFeaturedPublished(Pageable pageable);

    @Query(value = "SELECT c FROM Course c WHERE " +
           "(cast(:keyword as text) IS NULL OR cast(c.title as text) ILIKE cast(concat('%', cast(:keyword as text), '%') as text)) " +
           "AND (cast(:status as text) IS NULL OR c.status = cast(:status as text)) " +
           "AND (:categoryId IS NULL OR c.category.id = :categoryId) " +
           "ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Course c WHERE " +
           "(cast(:keyword as text) IS NULL OR cast(c.title as text) ILIKE cast(concat('%', cast(:keyword as text), '%') as text)) " +
           "AND (cast(:status as text) IS NULL OR c.status = cast(:status as text)) " +
           "AND (:categoryId IS NULL OR c.category.id = :categoryId)")
    Page<Course> searchCoursesAdmin(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE Course c SET c.totalStudents = c.totalStudents + 1 WHERE c.id = :id")
    void incrementTotalStudents(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Course c SET c.totalStudents = c.totalStudents - 1 WHERE c.id = :id AND c.totalStudents > 0")
    void decrementTotalStudents(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Course c SET " +
           "c.avgRating = (SELECT AVG(r.rating) FROM CourseReview r WHERE r.course.id = :courseId AND r.isApproved = true), " +
           "c.totalReviews = (SELECT COUNT(r) FROM CourseReview r WHERE r.course.id = :courseId AND r.isApproved = true) " +
           "WHERE c.id = :courseId")
    void updateRatingStats(@Param("courseId") Long courseId);

    @Modifying
    @Query("UPDATE Course c SET c.totalDurationSeconds = :duration, c.totalLessons = :lessonCount WHERE c.id = :id")
    void updateStats(@Param("id") Long id, @Param("duration") Integer duration, @Param("lessonCount") Integer lessonCount);
}
