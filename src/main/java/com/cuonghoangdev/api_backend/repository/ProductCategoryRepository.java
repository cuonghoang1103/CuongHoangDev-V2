package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    Optional<ProductCategory> findBySlug(String slug);
}
