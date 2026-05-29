package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.CourseTag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseTagRepository extends JpaRepository<CourseTag, Long> {

    List<CourseTag> findByCourseId(Long courseId);

    @Modifying
    @Query("DELETE FROM CourseTag ct WHERE ct.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT ct.tag, COUNT(ct) as cnt FROM CourseTag ct GROUP BY ct.tag ORDER BY cnt DESC")
    List<Object[]> findPopularTags(Pageable pageable);
}
