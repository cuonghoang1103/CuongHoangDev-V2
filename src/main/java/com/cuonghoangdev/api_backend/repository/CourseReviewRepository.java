package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.CourseReview;
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
public interface CourseReviewRepository extends JpaRepository<CourseReview, Long> {

    Optional<CourseReview> findByCourseIdAndUserId(Long courseId, Long userId);

    boolean existsByCourseIdAndUserId(Long courseId, Long userId);

    Page<CourseReview> findByCourseIdAndIsApprovedTrue(Long courseId, Pageable pageable);

    List<CourseReview> findByCourseIdAndIsApprovedTrueOrderByCreatedAtDesc(Long courseId);

    @Modifying
    @Query("UPDATE CourseReview r SET r.isApproved = :approved WHERE r.id = :id")
    void updateApproved(@Param("id") Long id, @Param("approved") boolean approved);
}
