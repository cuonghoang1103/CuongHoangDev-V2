package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Post;
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
public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlug(String slug);
    boolean existsBySlug(String slug);

    Page<Post> findByStatus(String status, Pageable pageable);

    List<Post> findByStatus(String status);

    Page<Post> findByStatusAndCategoryId(String status, Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.tags WHERE p.id = :id")
    Optional<Post> findByIdWithTags(@Param("id") Long id);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' ORDER BY p.viewCount DESC")
    List<Post> findTopByViewCount(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' AND p.isFeatured = true")
    List<Post> findFeaturedPosts(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' " +
           "AND (:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:categorySlug IS NULL OR p.category.slug = :categorySlug) " +
           "ORDER BY p.publishedAt DESC")
    Page<Post> searchPosts(
            @Param("keyword") String keyword,
            @Param("categorySlug") String categorySlug,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.category.id = :categoryId")
    int countByCategoryId(@Param("categoryId") Long categoryId);
}
