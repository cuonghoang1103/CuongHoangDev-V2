package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.*;
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
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseSectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final CourseDocumentRepository documentRepository;
    private final CourseReviewRepository reviewRepository;
    private final CourseTagRepository tagRepository;
    private final CourseCategoryRepository categoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public CourseService(CourseRepository courseRepository,
                         CourseSectionRepository sectionRepository,
                         LessonRepository lessonRepository,
                         CourseDocumentRepository documentRepository,
                         CourseReviewRepository reviewRepository,
                         CourseTagRepository tagRepository,
                         CourseCategoryRepository categoryRepository,
                         EnrollmentRepository enrollmentRepository,
                         UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.lessonRepository = lessonRepository;
        this.documentRepository = documentRepository;
        this.reviewRepository = reviewRepository;
        this.tagRepository = tagRepository;
        this.categoryRepository = categoryRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    public Page<CourseDto> getPublishedCourses(int page, int size,
            String keyword, String categorySlug, String level, Long userId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Course> courses = courseRepository.searchCourses(keyword, categorySlug, level, pageable);
        return courses.map(c -> {
            CourseDto dto = CourseDto.fromEntity(c);
            if (userId != null) {
                dto.setIsEnrolled(enrollmentRepository.existsByUserIdAndCourseId(userId, c.getId()));
            }
            return dto;
        });
    }

    public CourseDto getCourseBySlug(String slug, Long userId) {
        Course course = courseRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        CourseDto dto = CourseDto.fromEntity(course);

        // Load sections with lessons
        List<CourseSection> sections = sectionRepository.findByCourseIdOrderBySortOrderAsc(course.getId());
        dto.setSections(sections.stream()
            .map(s -> {
                CourseSectionDto secDto = CourseSectionDto.fromEntity(s);
                List<Lesson> lessons = lessonRepository.findBySectionIdOrderBySortOrderAsc(s.getId());
                secDto.setLessons(lessons.stream()
                    .map(l -> {
                        List<CourseDocument> docs = documentRepository.findByLessonIdAndIsActiveTrue(l.getId());
                        l.setDocuments(docs);
                        boolean canWatch = Boolean.TRUE.equals(l.getIsFreePreview()) ||
                            (userId != null && enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId()));
                        return LessonDto.fromEntityWithDocuments(l, canWatch);
                    })
                    .toList());
                return secDto;
            })
            .toList());

        if (userId != null) {
            dto.setIsEnrolled(enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId()));
            enrollmentRepository.findByUserIdAndCourseId(userId, course.getId())
                .ifPresent(e -> dto.setEnrollmentProgress(e.getProgressPercent()));
        }
        return dto;
    }

    public List<CourseDto> getFeaturedCourses(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return courseRepository.findFeaturedPublished(pageable).stream()
            .map(CourseDto::fromEntity)
            .toList();
    }

    // === ADMIN ===

    public Page<CourseDto> getAdminCourses(String keyword, String status, Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return courseRepository.searchCoursesAdmin(keyword, status, categoryId, pageable)
            .map(CourseDto::fromEntity);
    }

    @Transactional
    public CourseDto createCourse(CreateCourseRequest req) {
        Course course = new Course();
        course.setTitle(req.getTitle());
        course.setSlug(generateSlug(req.getTitle()));
        course.setShortDescription(req.getShortDescription());
        course.setDescription(req.getDescription());
        course.setThumbnailUrl(req.getThumbnailUrl());
        course.setPreviewVideoUrl(req.getPreviewVideoUrl());
        if (req.getPrice() != null) course.setPrice(BigDecimal.valueOf(req.getPrice()));
        if (req.getDiscountPrice() != null) course.setDiscountPrice(BigDecimal.valueOf(req.getDiscountPrice()));
        if (req.getLevel() != null) course.setLevel(req.getLevel());
        if (req.getLanguage() != null) course.setLanguage(req.getLanguage());
        if (req.getIsFree() != null) course.setIsFree(req.getIsFree());
        if (req.getIsFeatured() != null) course.setIsFeatured(req.getIsFeatured());
        course.setRequirements(req.getRequirements());
        course.setWhatYouLearn(req.getWhatYouLearn());
        // Status + auto-sync with isPublished for backward compatibility
        if (req.getStatus() != null) {
            course.setStatus(req.getStatus());
            // Auto-set publishedAt when creating with status = PUBLISHED (for the first time)
            if ("PUBLISHED".equals(req.getStatus())) {
                course.setIsPublished(true);
                course.setPublishedAt(LocalDateTime.now());
            }
        } else {
            course.setStatus("DRAFT");
        }
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId())
                .ifPresent(course::setCategory);
        }
        if (req.getInstructorId() != null) {
            userRepository.findById(req.getInstructorId())
                .ifPresent(course::setInstructor);
        }
        course = courseRepository.save(course);
        if (req.getTags() != null) saveTags(course, req.getTags());
        return CourseDto.fromEntity(course);
    }

    @Transactional
    public CourseDto updateCourse(Long id, UpdateCourseRequest req) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        if (req.getTitle() != null) {
            course.setTitle(req.getTitle());
            course.setSlug(generateSlug(req.getTitle()));
        }
        if (req.getShortDescription() != null) course.setShortDescription(req.getShortDescription());
        if (req.getDescription() != null) course.setDescription(req.getDescription());
        if (req.getThumbnailUrl() != null) course.setThumbnailUrl(req.getThumbnailUrl());
        if (req.getPreviewVideoUrl() != null) course.setPreviewVideoUrl(req.getPreviewVideoUrl());
        if (req.getPrice() != null) course.setPrice(BigDecimal.valueOf(req.getPrice()));
        if (req.getDiscountPrice() != null) course.setDiscountPrice(BigDecimal.valueOf(req.getDiscountPrice()));
        if (req.getLevel() != null) course.setLevel(req.getLevel());
        if (req.getLanguage() != null) course.setLanguage(req.getLanguage());
        if (req.getIsFree() != null) course.setIsFree(req.getIsFree());
        if (req.getIsFeatured() != null) course.setIsFeatured(req.getIsFeatured());
        if (req.getIsPublished() != null) {
            course.setIsPublished(req.getIsPublished());
            if (req.getIsPublished() && course.getPublishedAt() == null) {
                course.setPublishedAt(LocalDateTime.now());
            }
        }
        if (req.getRequirements() != null) course.setRequirements(req.getRequirements());
        if (req.getWhatYouLearn() != null) course.setWhatYouLearn(req.getWhatYouLearn());
        // Status + auto-sync with isPublished for backward compatibility
        if (req.getStatus() != null) {
            course.setStatus(req.getStatus());
            // Auto-set publishedAt when transitioning to PUBLISHED (for the first time)
            if ("PUBLISHED".equals(req.getStatus())) {
                course.setIsPublished(true);
                if (course.getPublishedAt() == null) {
                    course.setPublishedAt(LocalDateTime.now());
                }
            } else {
                // Unpublishing: set isPublished = false
                course.setIsPublished(false);
            }
        }
        // isPublished checkbox still respected for backward compat
        if (req.getIsPublished() != null) {
            course.setIsPublished(req.getIsPublished());
            if (req.getIsPublished() && course.getPublishedAt() == null) {
                course.setPublishedAt(LocalDateTime.now());
            }
        }
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId())
                .ifPresent(course::setCategory);
        }
        if (req.getInstructorId() != null) {
            userRepository.findById(req.getInstructorId())
                .ifPresent(course::setInstructor);
        }
        if (req.getTags() != null) {
            tagRepository.deleteByCourseId(id);
            saveTags(course, req.getTags());
        }
        return CourseDto.fromEntity(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    @Transactional
    public CourseSectionDto createSection(CreateSectionRequest req) {
        Course course = courseRepository.findById(req.getCourseId())
            .orElseThrow(() -> new RuntimeException("Course not found"));
        CourseSection section = new CourseSection();
        section.setCourse(course);
        section.setTitle(req.getTitle());
        section.setDescription(req.getDescription());
        section.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        section.setIsLocked(req.getIsLocked() != null ? req.getIsLocked() : false);
        section = sectionRepository.save(section);
        updateCourseStats(course.getId());
        return CourseSectionDto.fromEntity(section);
    }

    @Transactional
    public CourseSectionDto updateSection(Long id, CreateSectionRequest req) {
        CourseSection section = sectionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Section not found"));
        if (req.getTitle() != null) section.setTitle(req.getTitle());
        if (req.getDescription() != null) section.setDescription(req.getDescription());
        if (req.getSortOrder() != null) section.setSortOrder(req.getSortOrder());
        if (req.getIsLocked() != null) section.setIsLocked(req.getIsLocked());
        return CourseSectionDto.fromEntity(sectionRepository.save(section));
    }

    @Transactional
    public void deleteSection(Long id) {
        sectionRepository.findById(id).ifPresent(s -> {
            Long courseId = s.getCourse().getId();
            sectionRepository.deleteById(id);
            updateCourseStats(courseId);
        });
    }

    @Transactional
    public LessonDto createLesson(CreateLessonRequest req) {
        CourseSection section = sectionRepository.findById(req.getSectionId())
            .orElseThrow(() -> new RuntimeException("Section not found"));
        Lesson lesson = new Lesson();
        lesson.setSection(section);
        lesson.setTitle(req.getTitle());
        lesson.setSlug(req.getSlug());
        lesson.setDescription(req.getDescription());
        lesson.setContent(req.getContent());
        lesson.setLessonType(req.getLessonType() != null ? req.getLessonType() : "VIDEO");
        lesson.setVideoUrl(req.getVideoUrl());
        lesson.setVideoDurationSeconds(req.getVideoDurationSeconds() != null ? req.getVideoDurationSeconds() : 0);
        lesson.setThumbnailUrl(req.getThumbnailUrl());
        lesson.setIsFreePreview(req.getIsFreePreview() != null ? req.getIsFreePreview() : false);
        lesson.setIsPublished(req.getIsPublished() != null ? req.getIsPublished() : false);
        lesson.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        lesson = lessonRepository.save(lesson);
        updateCourseStats(section.getCourse().getId());
        return LessonDto.fromEntity(lesson);
    }

    @Transactional
    public LessonDto updateLesson(Long id, CreateLessonRequest req) {
        Lesson lesson = lessonRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Lesson not found"));
        if (req.getTitle() != null) lesson.setTitle(req.getTitle());
        if (req.getSlug() != null) lesson.setSlug(req.getSlug());
        if (req.getDescription() != null) lesson.setDescription(req.getDescription());
        if (req.getContent() != null) lesson.setContent(req.getContent());
        if (req.getLessonType() != null) lesson.setLessonType(req.getLessonType());
        if (req.getVideoUrl() != null) lesson.setVideoUrl(req.getVideoUrl());
        if (req.getVideoDurationSeconds() != null) lesson.setVideoDurationSeconds(req.getVideoDurationSeconds());
        if (req.getThumbnailUrl() != null) lesson.setThumbnailUrl(req.getThumbnailUrl());
        if (req.getIsFreePreview() != null) lesson.setIsFreePreview(req.getIsFreePreview());
        if (req.getIsPublished() != null) lesson.setIsPublished(req.getIsPublished());
        if (req.getSortOrder() != null) lesson.setSortOrder(req.getSortOrder());
        Lesson saved = lessonRepository.save(lesson);
        updateCourseStats(lesson.getSection().getCourse().getId());
        return LessonDto.fromEntity(saved);
    }

    @Transactional
    public void deleteLesson(Long id) {
        lessonRepository.findById(id).ifPresent(l -> {
            Long courseId = l.getSection().getCourse().getId();
            lessonRepository.deleteById(id);
            updateCourseStats(courseId);
        });
    }

    @Transactional
    public CourseDocumentDto createDocument(CreateDocumentRequest req) {
        Lesson lesson = lessonRepository.findById(req.getLessonId())
            .orElseThrow(() -> new RuntimeException("Lesson not found"));
        CourseDocument doc = new CourseDocument();
        doc.setLesson(lesson);
        doc.setTitle(req.getTitle());
        doc.setFileUrl(req.getFileUrl());
        doc.setFileSizeBytes(req.getFileSizeBytes() != null ? req.getFileSizeBytes() : 0L);
        doc.setFileType(req.getFileType());
        return CourseDocumentDto.fromEntity(documentRepository.save(doc));
    }

    @Transactional
    public void deleteDocument(Long id) {
        documentRepository.deleteById(id);
    }

    public List<CourseReviewDto> getCourseReviews(Long courseId) {
        return reviewRepository.findByCourseIdAndIsApprovedTrueOrderByCreatedAtDesc(courseId).stream()
            .map(CourseReviewDto::fromEntity)
            .toList();
    }

    @Transactional
    public CourseReviewDto createReview(Long userId, CreateReviewRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(req.getCourseId())
            .orElseThrow(() -> new RuntimeException("Course not found"));
        if (reviewRepository.existsByCourseIdAndUserId(course.getId(), userId)) {
            throw new RuntimeException("Ban da danh gia khoa hoc nay roi");
        }
        CourseReview review = new CourseReview();
        review.setCourse(course);
        review.setUser(user);
        review.setRating(req.getRating());
        review.setTitle(req.getTitle());
        review.setContent(req.getContent());
        review.setIsApproved(false);
        review = reviewRepository.save(review);
        courseRepository.updateRatingStats(course.getId());
        return CourseReviewDto.fromEntity(review);
    }

    private void saveTags(Course course, List<String> tags) {
        for (String tagName : tags) {
            CourseTag tag = new CourseTag();
            tag.setCourse(course);
            tag.setTag(tagName.trim().toLowerCase());
            tagRepository.save(tag);
        }
    }

    private void updateCourseStats(Long courseId) {
        Integer duration = lessonRepository.sumDurationByCourseId(courseId);
        Integer count = lessonRepository.countPublishedByCourseId(courseId);
        courseRepository.updateStats(courseId, duration != null ? duration : 0, count != null ? count : 0);
    }

    private String generateSlug(String title) {
        String slug = title.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .trim();
        String base = slug;
        int i = 1;
        while (courseRepository.existsBySlug(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }
}
