package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.entity.*;
import com.cuonghoangdev.api_backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CourseService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CourseService.class);

    private final CourseRepository courseRepository;
    private final CourseSectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final CourseDocumentRepository documentRepository;
    private final CourseReviewRepository reviewRepository;
    private final CourseTagRepository tagRepository;
    private final CourseCategoryRepository categoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final LessonDetailRepository lessonDetailRepository;
    private final AssignmentRepository assignmentRepository;

    public CourseService(CourseRepository courseRepository,
                         CourseSectionRepository sectionRepository,
                         LessonRepository lessonRepository,
                         CourseDocumentRepository documentRepository,
                         CourseReviewRepository reviewRepository,
                         CourseTagRepository tagRepository,
                         CourseCategoryRepository categoryRepository,
                         EnrollmentRepository enrollmentRepository,
                         UserRepository userRepository,
                         SemesterRepository semesterRepository,
                         LessonDetailRepository lessonDetailRepository,
                         AssignmentRepository assignmentRepository) {
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.lessonRepository = lessonRepository;
        this.documentRepository = documentRepository;
        this.reviewRepository = reviewRepository;
        this.tagRepository = tagRepository;
        this.categoryRepository = categoryRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.semesterRepository = semesterRepository;
        this.lessonDetailRepository = lessonDetailRepository;
        this.assignmentRepository = assignmentRepository;
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

    @Transactional(readOnly = true)
    public CourseDto getCourseBySlug(String slug, Long userId) {
        Course course = courseRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Course not found"));

        List<CourseSection> sections = sectionRepository.findByCourseIdOrderBySortOrderAsc(course.getId());
        course.setSections(sections);
        CourseDto dto = CourseDto.fromEntity(course);

        boolean isEnrolled = userId != null && enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId());

        dto.setSections(sections.stream()
            .map(s -> {
                List<Lesson> lessons = lessonRepository.findBySectionIdOrderBySortOrderAsc(s.getId());
                CourseSectionDto secDto = CourseSectionDto.fromEntity(s, lessons, isEnrolled);
                return secDto;
            })
            .toList());

        if (userId != null) {
            dto.setIsEnrolled(isEnrolled);
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

    public Page<CourseDto> getAdminCourses(String keyword, String status, Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return courseRepository.searchCoursesAdmin(keyword, status, categoryId, pageable)
            .map(CourseDto::fromEntity);
    }

    @Transactional
    public CourseDto createCourse(CreateCourseRequest req) {
        Course course = new Course();
        course.setTitle(req.getTitle());
        course.setCourseCode(req.getCourseCode());
        course.setSlug(generateSlug(req.getTitle()));
        course.setShortDescription(req.getShortDescription());
        course.setDescription(req.getDescription());
        course.setThumbnailUrl(req.getThumbnailUrl());
        course.setPreviewVideoUrl(req.getPreviewVideoUrl());
        course.setAcademyType(req.getAcademyType() != null ? req.getAcademyType() : "FPT");
        if (req.getPrice() != null) course.setPrice(BigDecimal.valueOf(req.getPrice()));
        if (req.getDiscountPrice() != null) course.setDiscountPrice(BigDecimal.valueOf(req.getDiscountPrice()));
        if (req.getLevel() != null) course.setLevel(req.getLevel());
        if (req.getLanguage() != null) course.setLanguage(req.getLanguage());
        if (req.getIsFree() != null) course.setIsFree(req.getIsFree());
        if (req.getIsFeatured() != null) course.setIsFeatured(req.getIsFeatured());
        course.setRequirements(req.getRequirements());
        course.setWhatYouLearn(req.getWhatYouLearn());
        if (req.getStatus() != null) {
            course.setStatus(req.getStatus());
            if ("PUBLISHED".equals(req.getStatus())) {
                course.setIsPublished(true);
                course.setPublishedAt(LocalDateTime.now());
            }
        } else {
            course.setStatus("DRAFT");
        }
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(course::setCategory);
        }
        if (req.getInstructorId() != null) {
            userRepository.findById(req.getInstructorId()).ifPresent(course::setInstructor);
        }
        if (req.getSemesterId() != null) {
            semesterRepository.findById(req.getSemesterId()).ifPresent(course::setSemester);
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
        if (req.getCourseCode() != null) course.setCourseCode(req.getCourseCode());
        if (req.getAcademyType() != null) course.setAcademyType(req.getAcademyType());
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
        if (req.getRequirements() != null) course.setRequirements(req.getRequirements());
        if (req.getWhatYouLearn() != null) course.setWhatYouLearn(req.getWhatYouLearn());
        if (req.getStatus() != null) {
            course.setStatus(req.getStatus());
            if ("PUBLISHED".equals(req.getStatus())) {
                course.setIsPublished(true);
                if (course.getPublishedAt() == null) {
                    course.setPublishedAt(LocalDateTime.now());
                }
            } else {
                course.setIsPublished(false);
            }
        }
        if (req.getIsPublished() != null) {
            course.setIsPublished(req.getIsPublished());
            if (req.getIsPublished() && course.getPublishedAt() == null) {
                course.setPublishedAt(LocalDateTime.now());
            }
        }
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId()).ifPresent(course::setCategory);
        }
        if (req.getInstructorId() != null) {
            userRepository.findById(req.getInstructorId()).ifPresent(course::setInstructor);
        }
        if (req.getSemesterId() != null) {
            semesterRepository.findById(req.getSemesterId()).ifPresent(course::setSemester);
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
    public CourseSectionDto updateSection(Long id, UpdateSectionRequest req) {
        LOGGER.info("[updateSection] id={}, title='{}', sortOrder={}", id, req.getTitle(), req.getSortOrder());
        CourseSection section = sectionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Section not found"));
        if (req.getTitle() != null) section.setTitle(req.getTitle());
        if (req.getDescription() != null) section.setDescription(req.getDescription());
        if (req.getSortOrder() != null) section.setSortOrder(req.getSortOrder());
        if (req.getIsLocked() != null) section.setIsLocked(req.getIsLocked());
        CourseSection saved = sectionRepository.save(section);
        LOGGER.info("[updateSection] saved id={}, title='{}'", saved.getId(), saved.getTitle());
        return CourseSectionDto.fromEntity(saved);
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
        LOGGER.info("[createLesson] sectionId={}, title='{}', lessonType={}",
                req.getSectionId(), req.getTitle(), req.getLessonType());
        CourseSection section = sectionRepository.findById(req.getSectionId())
            .orElseThrow(() -> new RuntimeException("Section not found: " + req.getSectionId()));
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
        Lesson saved = lessonRepository.save(lesson);
        LOGGER.info("[createLesson] Saved lesson id={}, title='{}'", saved.getId(), saved.getTitle());
        LessonDetail detail = new LessonDetail();
        detail.setLesson(saved);
        detail.setVideoPlatform(req.getVideoPlatform() != null ? req.getVideoPlatform() : "EMBED");
        detail.setVideoUrl(req.getVideoUrl());
        detail.setSourceCodeUrl(req.getSourceCodeUrl());
        detail.setTeachingNotes(req.getTeachingNotes() != null ? req.getTeachingNotes() : req.getContent());
        lessonDetailRepository.save(detail);
        updateCourseStats(section.getCourse().getId());
        return lessonRepository.findWithRelationsById(saved.getId())
            .map(lesson2 -> LessonDto.fromEntityWithDocuments(lesson2, true))
            .orElseThrow(() -> new RuntimeException("Lesson not found after create"));
    }

    @Transactional
    public LessonDto updateLesson(Long id, UpdateLessonRequest req) {
        LOGGER.info("[updateLesson] id={}, title='{}', content length={}, teachingNotes length={}",
            id, req.getTitle(),
            req.getContent() != null ? req.getContent().length() : 0,
            req.getTeachingNotes() != null ? req.getTeachingNotes().length() : 0);
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

        LessonDetail detail = lessonDetailRepository.findByLessonId(saved.getId()).orElseGet(() -> {
            LessonDetail created = new LessonDetail();
            created.setLesson(saved);
            return created;
        });
        if (req.getVideoPlatform() != null) detail.setVideoPlatform(req.getVideoPlatform());
        if (req.getVideoUrl() != null) detail.setVideoUrl(req.getVideoUrl());
        if (req.getSourceCodeUrl() != null) detail.setSourceCodeUrl(req.getSourceCodeUrl());
        if (req.getTeachingNotes() != null) detail.setTeachingNotes(req.getTeachingNotes());
        lessonDetailRepository.save(detail);

        updateCourseStats(lesson.getSection().getCourse().getId());
        return lessonRepository.findWithRelationsById(saved.getId())
            .map(lesson2 -> LessonDto.fromEntityWithDocuments(lesson2, true))
            .orElseThrow(() -> new RuntimeException("Lesson not found after update"));
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

        LessonDetail detail = lessonDetailRepository.findByLessonId(saved.getId()).orElseGet(() -> {
            LessonDetail created = new LessonDetail();
            created.setLesson(saved);
            return created;
        });
        if (req.getVideoPlatform() != null) detail.setVideoPlatform(req.getVideoPlatform());
        if (req.getVideoUrl() != null) detail.setVideoUrl(req.getVideoUrl());
        if (req.getSourceCodeUrl() != null) detail.setSourceCodeUrl(req.getSourceCodeUrl());
        if (req.getTeachingNotes() != null) detail.setTeachingNotes(req.getTeachingNotes());
        lessonDetailRepository.save(detail);

        updateCourseStats(lesson.getSection().getCourse().getId());
        return lessonRepository.findWithRelationsById(saved.getId())
            .map(lesson2 -> LessonDto.fromEntityWithDocuments(lesson2, true))
            .orElseThrow(() -> new RuntimeException("Lesson not found after update"));
    }

    @Transactional(readOnly = true)
    public LessonDto getLessonById(Long id) {
        return lessonRepository.findWithRelationsById(id)
            .map(lesson -> LessonDto.fromEntityWithDocuments(lesson, true))
            .orElseThrow(() -> new RuntimeException("Lesson not found: " + id));
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

    private void upsertLessonDetail(Lesson lesson, CreateLessonRequest req) {
        LessonDetail detail = lessonDetailRepository.findByLessonId(lesson.getId()).orElseGet(() -> {
            LessonDetail created = new LessonDetail();
            created.setLesson(lesson);
            return created;
        });
        detail.setVideoPlatform(req.getVideoPlatform() != null ? req.getVideoPlatform() : "EMBED");
        detail.setVideoUrl(req.getVideoUrl());
        detail.setSourceCodeUrl(req.getSourceCodeUrl());
        detail.setTeachingNotes(req.getTeachingNotes() != null ? req.getTeachingNotes() : req.getContent());
        lesson.setDetail(lessonDetailRepository.save(detail));
    }

    @Transactional
    public LessonDetailDto updateLessonDetail(Long lessonId, UpdateLessonDetailRequest req) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new RuntimeException("Lesson not found: " + lessonId));
        LessonDetail detail = lessonDetailRepository.findByLessonId(lessonId).orElseGet(() -> {
            LessonDetail created = new LessonDetail();
            created.setLesson(lesson);
            return created;
        });
        if (req.getVideoPlatform() != null) detail.setVideoPlatform(req.getVideoPlatform());
        if (req.getVideoUrl() != null) detail.setVideoUrl(req.getVideoUrl());
        if (req.getSourceCodeUrl() != null) detail.setSourceCodeUrl(req.getSourceCodeUrl());
        if (req.getTeachingNotes() != null) detail.setTeachingNotes(req.getTeachingNotes());
        return LessonDetailDto.fromEntity(lessonDetailRepository.save(detail));
    }

    private LessonDto hydrateLessonDto(Lesson lesson, boolean includeVideo) {
        List<CourseDocument> docs = documentRepository.findByLessonIdAndIsActiveTrue(lesson.getId());
        List<Assignment> assignments = assignmentRepository.findByLessonIdOrderBySortOrderAscIdAsc(lesson.getId());
        LessonDetail detail = lessonDetailRepository.findByLessonId(lesson.getId()).orElse(null);
        lesson.setDetail(detail);
        LessonDto dto = LessonDto.fromEntity(lesson);
        dto.setDocuments(docs.stream().map(CourseDocumentDto::fromEntity).toList());
        dto.setAssignments(assignments.stream()
            .filter(a -> Boolean.TRUE.equals(a.getIsPublished()))
            .map(AssignmentDto::fromEntity)
            .toList());
        if (!includeVideo) dto.setVideoUrl(null);
        return dto;
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
