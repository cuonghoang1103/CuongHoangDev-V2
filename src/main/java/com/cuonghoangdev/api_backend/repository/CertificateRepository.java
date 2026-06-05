package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByUserIdAndCourseId(Long userId, Long courseId);
    Optional<Certificate> findByCertificateNumber(String certificateNumber);
    List<Certificate> findByUserIdOrderByIssuedAtDesc(Long userId);
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
}
