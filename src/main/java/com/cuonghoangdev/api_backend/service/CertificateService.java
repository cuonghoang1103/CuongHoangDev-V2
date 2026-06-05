package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.CertificateDto;
import com.cuonghoangdev.api_backend.entity.Certificate;
import com.cuonghoangdev.api_backend.entity.Course;
import com.cuonghoangdev.api_backend.entity.Enrollment;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.repository.CertificateRepository;
import com.cuonghoangdev.api_backend.repository.CourseRepository;
import com.cuonghoangdev.api_backend.repository.EnrollmentRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public CertificateService(
            CertificateRepository certificateRepository,
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseRepository courseRepository) {
        this.certificateRepository = certificateRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public List<CertificateDto> getMyCertificates(Long userId) {
        return certificateRepository.findByUserIdOrderByIssuedAtDesc(userId).stream()
                .map(CertificateDto::fromEntity)
                .collect(Collectors.toList());
    }

    public CertificateDto getCertificateByNumber(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber)
                .map(CertificateDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    public CertificateDto getCertificateByEnrollment(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        if (enrollment.getCertificate() == null) {
            throw new RuntimeException("No certificate found for this enrollment");
        }
        return CertificateDto.fromEntity(enrollment.getCertificate());
    }

    @Transactional
    public CertificateDto issueCertificate(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (enrollment.getCertificate() != null) {
            return CertificateDto.fromEntity(enrollment.getCertificate());
        }

        Certificate cert = new Certificate();
        cert.setCertificateNumber(generateCertificateNumber());
        cert.setUser(enrollment.getUser());
        cert.setCourse(enrollment.getCourse());
        cert.setIssuedAt(LocalDateTime.now());
        cert = certificateRepository.save(cert);

        enrollment.setCertificate(cert);
        enrollment.setStatus("COMPLETED");
        enrollmentRepository.save(enrollment);

        return CertificateDto.fromEntity(cert);
    }

    @Transactional
    public void checkAndIssueCertificate(Enrollment enrollment) {
        if (enrollment.getCertificate() != null) return;

        BigDecimal progress = enrollment.getProgressPercent();
        if (progress != null && progress.compareTo(BigDecimal.valueOf(100)) >= 0) {
            issueCertificate(enrollment.getId());
        }
    }

    private String generateCertificateNumber() {
        return "FPT-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
