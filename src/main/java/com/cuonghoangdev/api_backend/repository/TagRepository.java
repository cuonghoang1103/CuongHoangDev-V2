package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findBySlug(String slug);
    Optional<Tag> findByName(String name);
    boolean existsBySlug(String slug);
    boolean existsByName(String name);
}
