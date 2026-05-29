package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    Page<Enrollment> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    Page<Enrollment> findByUserId(Long userId, Pageable pageable);

    List<Enrollment> findByUserIdAndStatusOrderByEnrolledAtDesc(Long userId, String status);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course WHERE e.user.id = :userId AND e.status = :status")
    List<Enrollment> findByUserIdAndStatusWithCourse(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT e FROM Enrollment e WHERE e.user.id = :userId AND e.course.slug = :courseSlug AND e.status = 'ACTIVE'")
    Optional<Enrollment> findActiveByUserAndCourseSlug(@Param("userId") Long userId, @Param("courseSlug") String courseSlug);
}
