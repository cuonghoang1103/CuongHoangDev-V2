package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.DevPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevPostRepository extends JpaRepository<DevPost, Long> {

    List<DevPost> findAllByOrderByCreatedAtDesc();

    List<DevPost> findByCategoryOrderByDownloadCountDesc(String category);

    @Query("SELECT dp FROM DevPost dp ORDER BY dp.downloadCount DESC")
    List<DevPost> findTopByDownloadCount();

    @Modifying
    @Query("UPDATE DevPost dp SET dp.downloadCount = dp.downloadCount + 1 WHERE dp.id = :id")
    void incrementDownloadCount(@Param("id") Long id);

    @Query("SELECT DISTINCT dp.category FROM DevPost dp WHERE dp.category IS NOT NULL ORDER BY dp.category")
    List<String> findAllCategories();
}
