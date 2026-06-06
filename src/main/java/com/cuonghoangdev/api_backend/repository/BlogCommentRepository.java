package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.BlogComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogCommentRepository extends JpaRepository<BlogComment, Long> {

    List<BlogComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    int countByPostId(Long postId);

    @Modifying
    @Query("UPDATE Post p SET p.downloadCount = p.downloadCount + 1 WHERE p.id = :postId")
    void incrementDownloadCount(@Param("postId") Long postId);
}
