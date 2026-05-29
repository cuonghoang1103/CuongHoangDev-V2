package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.CourseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseDocumentRepository extends JpaRepository<CourseDocument, Long> {

    List<CourseDocument> findByLessonIdAndIsActiveTrue(Long lessonId);

    @Modifying
    @Query("UPDATE CourseDocument d SET d.downloadCount = d.downloadCount + 1 WHERE d.id = :id")
    void incrementDownloadCount(@Param("id") Long id);
}
