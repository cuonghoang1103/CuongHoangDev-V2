package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Page<Project> findByIsFeaturedTrue(Pageable pageable);
    Page<Project> findByStatus(String status, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR p.status = :status)")
    Page<Project> searchProjects(@Param("keyword") String keyword,
                                 @Param("status") String status,
                                 Pageable pageable);

    @Query("SELECT p FROM Project p WHERE LOWER(p.techStack) LIKE LOWER(CONCAT('%', :tech, '%'))")
    Page<Project> findByTechStack(@Param("tech") String tech, Pageable pageable);
}
