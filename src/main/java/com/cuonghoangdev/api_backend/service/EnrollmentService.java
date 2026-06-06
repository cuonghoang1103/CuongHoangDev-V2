package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.AssignmentDto;
import com.cuonghoangdev.api_backend.dto.AssignmentSubmissionDto;
import com.cuonghoangdev.api_backend.dto.CourseDocumentDto;
import com.cuonghoangdev.api_backend.dto.EnrollmentDto;
import com.cuonghoangdev.api_backend.dto.LessonDto;
import com.cuonghoangdev.api_backend.dto.LessonProgressDto;
import com.cuonghoangdev.api_backend.dto.LessonProgressRequest;
import com.cuonghoangdev.api_backend.entity.*;
import com.cuonghoangdev.api_backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository progressRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final CourseSectionRepository sectionRepository;
    private final CourseDocumentRepository documentRepository;
    private final LessonDetailRepository lessonDetailRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final CertificateService certificateService;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             LessonProgressRepository progressRepository,
                             CourseRepository courseRepository,
                             LessonRepository lessonRepository,
                             UserRepository userRepository,
                             CourseSectionRepository sectionRepository,
                             CourseDocumentRepository documentRepository,
                             LessonDetailRepository lessonDetailRepository,
                             AssignmentRepository assignmentRepository,
                             AssignmentSubmissionRepository assignmentSubmissionRepository,
                             CertificateService certificateService) {
        this.enrollmentRepository = enrollmentRepository;
        this.progressRepository = progressRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
        this.sectionRepository = sectionRepository;
        this.documentRepository = documentRepository;
        this.lessonDetailRepository = lessonDetailRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.certificateService = certificateService;
    }

    @Transactional
    public EnrollmentDto enroll(Long userId, Long courseId) {
        if (enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new RuntimeException("Ban da dang ky khoa hoc nay roi");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        enrollment.setStatus("ACTIVE");
        enrollment.setProgressPercent(BigDecimal.ZERO);

        enrollment = enrollmentRepository.save(enrollment);
        courseRepository.incrementTotalStudents(courseId);
        return EnrollmentDto.fromEntity(enrollment);
    }

    public Page<EnrollmentDto> getMyEnrollments(Long userId, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Enrollment> enrollments;
        if (status != null && !status.isBlank()) {
            enrollments = enrollmentRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            enrollments = enrollmentRepository.findByUserId(userId, pageable);
        }
        return enrollments.map(EnrollmentDto::fromEntity);
    }

    public boolean isEnrolled(Long userId, Long courseId) {
        return enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
    }

    public List<LessonDto> getCurriculum(Long courseId) {
        List<CourseSection> sections = sectionRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        return sections.stream()
            .flatMap(s -> lessonRepository.findBySectionIdOrderBySortOrderAsc(s.getId()).stream())
            .map(lesson -> hydrateLessonDto(lesson, null, false))
            .toList();
    }

    public LessonDto getLessonForLearning(Long userId, Long courseId, Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

        boolean canWatch = Boolean.TRUE.equals(lesson.getIsFreePreview());
        if (canWatch) {
            LessonDto dto = hydrateLessonDto(lesson, userId, true);
            dto.setSectionId(lesson.getSection().getId());
            return dto;
        }

        if (userId == null) {
            throw new RuntimeException("Vui long dang nhap de xem bai hoc nay");
        }

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Ban chua dang ky khoa hoc nay"));

        canWatch = "ACTIVE".equals(enrollment.getStatus());
        if (!canWatch) {
            throw new RuntimeException("Ban can dang ky khoa hoc de xem bai nay");
        }

        LessonDto dto = hydrateLessonDto(lesson, userId, canWatch);
        dto.setSectionId(lesson.getSection().getId());

        enrollment.setLastLesson(lesson);
        enrollment.setLastAccessedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);

        return dto;
    }

    @Transactional
    public LessonProgressDto updateProgress(Long userId, Long courseId, LessonProgressRequest req) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Ban chua dang ky khoa hoc nay"));
        Lesson lesson = lessonRepository.findById(req.getLessonId())
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

        LessonProgress progress = progressRepository.findByEnrollmentIdAndLessonId(enrollment.getId(), req.getLessonId())
            .orElseGet(() -> {
                LessonProgress p = new LessonProgress();
                p.setEnrollment(enrollment);
                p.setLesson(lesson);
                return p;
            });

        if (Boolean.TRUE.equals(req.getIsCompleted()) && !Boolean.TRUE.equals(progress.getIsCompleted())) {
            progress.setIsCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
        }
        if (req.getWatchTimeSeconds() != null) {
            progress.setWatchTimeSeconds(req.getWatchTimeSeconds());
        }
        if (req.getLastPositionSeconds() != null) {
            progress.setLastPositionSeconds(req.getLastPositionSeconds());
        }
        progressRepository.save(progress);

        updateEnrollmentProgress(enrollment);
        return LessonProgressDto.of(
            req.getLessonId(),
            progress.getIsCompleted(),
            progress.getWatchTimeSeconds(),
            progress.getLastPositionSeconds()
        );
    }

    public List<LessonProgressDto> getLessonProgress(Long userId, Long courseId) {
        if (userId == null) {
            return List.of();
        }
        return enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .map(enrollment -> progressRepository.findByEnrollmentId(enrollment.getId()).stream()
                .map(p -> LessonProgressDto.of(
                    p.getLesson().getId(),
                    p.getIsCompleted(),
                    p.getWatchTimeSeconds(),
                    p.getLastPositionSeconds()
                ))
                .toList())
            .orElse(List.of());
    }

    public List<EnrollmentDto> getAllMyEnrollments(Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserIdWithCourseAndCertificate(userId);
        return enrollments.stream()
                .map(EnrollmentDto::fromEntity)
                .toList();
    }

    private void updateEnrollmentProgress(Enrollment enrollment) {
        Integer totalLessons = lessonRepository.countPublishedByCourseId(enrollment.getCourse().getId());
        if (totalLessons == null || totalLessons == 0) return;

        Integer completed = progressRepository.countCompletedByEnrollmentId(enrollment.getId());
        if (completed == null) completed = 0;

        BigDecimal percent = BigDecimal.valueOf(completed)
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(totalLessons), 2, RoundingMode.HALF_UP);

        enrollment.setProgressPercent(percent);
        enrollmentRepository.save(enrollment);

        certificateService.checkAndIssueCertificate(enrollment);
    }

    @Transactional
    public void cancelEnrollment(Long userId, Long courseId) {
        enrollmentRepository.findByUserIdAndCourseId(userId, courseId).ifPresent(e -> {
            e.setStatus("CANCELLED");
            enrollmentRepository.save(e);
            courseRepository.decrementTotalStudents(courseId);
        });
    }

    private LessonDto hydrateLessonDto(Lesson lesson, Long userId, boolean includeVideo) {
        LessonDto dto = LessonDto.fromEntity(lesson);
        if (!includeVideo) {
            dto.setVideoUrl(null);
        }

        List<CourseDocument> docs = documentRepository.findByLessonIdAndIsActiveTrue(lesson.getId());
        dto.setDocuments(docs.stream().map(CourseDocumentDto::fromEntity).toList());

        lessonDetailRepository.findByLessonId(lesson.getId()).ifPresent(detail -> {
            dto.setDetail(com.cuonghoangdev.api_backend.dto.LessonDetailDto.fromEntity(detail));
            dto.setVideoPlatform(detail.getVideoPlatform());
            dto.setSourceCodeUrl(detail.getSourceCodeUrl());
            dto.setTeachingNotes(detail.getTeachingNotes());
        });

        List<AssignmentDto> assignments = assignmentRepository.findByLessonIdOrderBySortOrderAscIdAsc(lesson.getId()).stream()
            .filter(a -> Boolean.TRUE.equals(a.getIsPublished()))
            .map(assignment -> {
                AssignmentDto assignmentDto = AssignmentDto.fromEntity(assignment);
                if (userId != null) {
                    assignmentSubmissionRepository.findByAssignmentIdAndUserId(assignment.getId(), userId)
                        .ifPresent(submission -> assignmentDto.setMySubmission(AssignmentSubmissionDto.fromEntity(submission)));
                }
                return assignmentDto;
            })
            .toList();
        dto.setAssignments(assignments);
        return dto;
    }
}
