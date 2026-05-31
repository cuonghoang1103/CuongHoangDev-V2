package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByActiveTrueAndFeaturedTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND (:categoryId IS NULL OR p.category.id = :categoryId)")
    Page<Product> findByFilters(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> search(@Param("query") String query, Pageable pageable);

    List<Product> findTop10ByActiveTrueOrderBySoldCountDesc();
}
