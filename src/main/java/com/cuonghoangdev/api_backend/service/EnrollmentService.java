package com.cuonghoangdev.api_backend.service;

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

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             LessonProgressRepository progressRepository,
                             CourseRepository courseRepository,
                             LessonRepository lessonRepository,
                             UserRepository userRepository,
                             CourseSectionRepository sectionRepository,
                             CourseDocumentRepository documentRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.progressRepository = progressRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
        this.sectionRepository = sectionRepository;
        this.documentRepository = documentRepository;
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
            .flatMap(s -> {
                List<Lesson> lessons = lessonRepository.findBySectionIdOrderBySortOrderAsc(s.getId());
                return lessons.stream().map(LessonDto::fromEntity);
            })
            .toList();
    }

    public LessonDto getLessonForLearning(Long userId, Long courseId, Long lessonId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Ban chua dang ky khoa hoc nay"));

        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

        // Check access
        boolean canWatch = Boolean.TRUE.equals(lesson.getIsFreePreview()) || "ACTIVE".equals(enrollment.getStatus());
        if (!canWatch) {
            throw new RuntimeException("Ban can dang ky khoa hoc de xem bai nay");
        }

        LessonDto dto = LessonDto.fromEntity(lesson);
        if (Boolean.TRUE.equals(lesson.getIsFreePreview()) || canWatch) {
            // full video URL
        } else {
            dto.setVideoUrl(null);
        }

        // Load documents
        List<CourseDocument> docs = documentRepository.findByLessonIdAndIsActiveTrue(lessonId);
        dto.setDocuments(docs.stream().map(CourseDocumentDto::fromEntity).toList());

        // Update last accessed
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

        // Recalculate overall progress
        updateEnrollmentProgress(enrollment);
        return LessonProgressDto.of(
            req.getLessonId(),
            progress.getIsCompleted(),
            progress.getWatchTimeSeconds(),
            progress.getLastPositionSeconds()
        );
    }

    public List<LessonProgressDto> getLessonProgress(Long userId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new RuntimeException("Ban chua dang ky khoa hoc nay"));
        return progressRepository.findByEnrollmentId(enrollment.getId()).stream()
            .map(p -> LessonProgressDto.of(
                p.getLesson().getId(),
                p.getIsCompleted(),
                p.getWatchTimeSeconds(),
                p.getLastPositionSeconds()
            ))
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
    }

    @Transactional
    public void cancelEnrollment(Long userId, Long courseId) {
        enrollmentRepository.findByUserIdAndCourseId(userId, courseId).ifPresent(e -> {
            e.setStatus("CANCELLED");
            enrollmentRepository.save(e);
            courseRepository.decrementTotalStudents(courseId);
        });
    }
}
