package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.entity.*;
import com.cuonghoangdev.api_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class AcademyAdminService {

    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonDetailRepository lessonDetailRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final UserRepository userRepository;

    public AcademyAdminService(
        SemesterRepository semesterRepository,
        CourseRepository courseRepository,
        LessonRepository lessonRepository,
        LessonDetailRepository lessonDetailRepository,
        AssignmentRepository assignmentRepository,
        AssignmentSubmissionRepository assignmentSubmissionRepository,
        UserRepository userRepository
    ) {
        this.semesterRepository = semesterRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.lessonDetailRepository = lessonDetailRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.userRepository = userRepository;
    }

    public List<SemesterDto> getSemesters() {
        return semesterRepository.findAllByOrderByOrdinalAsc().stream()
            .map(SemesterDto::fromEntity)
            .toList();
    }

    @Transactional
    public SemesterDto createSemester(CreateSemesterRequest req) {
        if (semesterRepository.existsByCode(req.getCode())) {
            throw new RuntimeException("Ma hoc ky '" + req.getCode() + "' da ton tai");
        }
        if (semesterRepository.existsByOrdinal(req.getOrdinal())) {
            throw new RuntimeException("Thu tu hoc ky #" + req.getOrdinal() + " da ton tai");
        }

        Semester semester = new Semester();
        semester.setName(req.getName());
        semester.setCode(req.getCode());
        semester.setOrdinal(req.getOrdinal());
        semester.setDescription(req.getDescription());
        semester.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        return SemesterDto.fromEntity(semesterRepository.save(semester));
    }

    @Transactional
    public SemesterDto updateSemester(Long id, UpdateSemesterRequest req) {
        Semester semester = semesterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Hoc ky khong tim thay: " + id));

        if (semesterRepository.existsByCodeAndIdNot(req.getCode(), id)) {
            throw new RuntimeException("Ma hoc ky '" + req.getCode() + "' da ton tai");
        }
        if (req.getOrdinal() != null && semesterRepository.existsByOrdinalAndIdNot(req.getOrdinal(), id)) {
            throw new RuntimeException("Thu tu hoc ky #" + req.getOrdinal() + " da ton tai");
        }

        semester.setName(req.getName());
        semester.setCode(req.getCode());
        if (req.getOrdinal() != null) semester.setOrdinal(req.getOrdinal());
        if (req.getDescription() != null) semester.setDescription(req.getDescription());
        if (req.getIsActive() != null) semester.setIsActive(req.getIsActive());
        return SemesterDto.fromEntity(semesterRepository.save(semester));
    }

    @Transactional
    public void deleteSemester(Long id) {
        if (!semesterRepository.existsById(id)) {
            throw new RuntimeException("Hoc ky khong tim thay: " + id);
        }
        if (semesterRepository.existsByCoursesSemesterId(id)) {
            throw new RuntimeException("Khong the xoa hoc ky dang co mon hoc. Vui long xoa cac mon hoc truoc.");
        }
        semesterRepository.deleteById(id);
    }

    public List<CourseDto> getCoursesBySemester(Long semesterId) {
        return courseRepository.findBySemesterIdOrderByTitleAsc(semesterId).stream()
            .map(CourseDto::fromEntity)
            .toList();
    }

    @Transactional
    public LessonDetailDto upsertLessonDetail(Long lessonId, CreateLessonRequest req) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

        LessonDetail detail = lessonDetailRepository.findByLessonId(lessonId).orElseGet(() -> {
            LessonDetail created = new LessonDetail();
            created.setLesson(lesson);
            return created;
        });

        detail.setVideoPlatform(req.getVideoPlatform() != null ? req.getVideoPlatform() : "EMBED");
        detail.setSourceCodeUrl(req.getSourceCodeUrl());
        detail.setTeachingNotes(req.getTeachingNotes() != null ? req.getTeachingNotes() : req.getContent());
        lesson.setDetail(detail);
        return LessonDetailDto.fromEntity(lessonDetailRepository.save(detail));
    }

    @Transactional
    public AssignmentDto createAssignment(CreateAssignmentRequest req) {
        Lesson lesson = lessonRepository.findById(req.getLessonId())
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

        Assignment assignment = new Assignment();
        assignment.setLesson(lesson);
        assignment.setTitle(req.getTitle());
        assignment.setInstructions(req.getInstructions());
        assignment.setDeadline(parseDateTime(req.getDeadline()));
        assignment.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        assignment.setIsPublished(req.getIsPublished() != null ? req.getIsPublished() : true);
        return AssignmentDto.fromEntity(assignmentRepository.save(assignment));
    }

    @Transactional
    public AssignmentDto updateAssignment(Long id, CreateAssignmentRequest req) {
        Assignment assignment = assignmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Assignment not found"));
        if (req.getTitle() != null) assignment.setTitle(req.getTitle());
        if (req.getInstructions() != null) assignment.setInstructions(req.getInstructions());
        if (req.getDeadline() != null) assignment.setDeadline(parseDateTime(req.getDeadline()));
        if (req.getSortOrder() != null) assignment.setSortOrder(req.getSortOrder());
        if (req.getIsPublished() != null) assignment.setIsPublished(req.getIsPublished());
        return AssignmentDto.fromEntity(assignmentRepository.save(assignment));
    }

    @Transactional
    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }

    @Transactional
    public AssignmentSubmissionDto submitAssignment(Long userId, AssignmentSubmissionRequest req) {
        Assignment assignment = assignmentRepository.findById(req.getAssignmentId())
            .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        AssignmentSubmission submission = assignmentSubmissionRepository
            .findByAssignmentIdAndUserId(req.getAssignmentId(), userId)
            .orElseGet(() -> {
                AssignmentSubmission created = new AssignmentSubmission();
                created.setAssignment(assignment);
                created.setUser(user);
                return created;
            });

        submission.setSubmissionUrl(req.getSubmissionUrl());
        submission.setNotes(req.getNotes());
        submission.setStatus("SUBMITTED");
        return AssignmentSubmissionDto.fromEntity(assignmentSubmissionRepository.save(submission));
    }

    public List<AssignmentDto> getAssignmentsByLesson(Long lessonId, Long userId) {
        return assignmentRepository.findByLessonIdOrderBySortOrderAscIdAsc(lessonId).stream()
            .map(assignment -> {
                AssignmentDto dto = AssignmentDto.fromEntity(assignment);
                if (userId != null) {
                    assignmentSubmissionRepository.findByAssignmentIdAndUserId(assignment.getId(), userId)
                        .ifPresent(submission -> dto.setMySubmission(AssignmentSubmissionDto.fromEntity(submission)));
                }
                return dto;
            })
            .toList();
    }

    private LocalDateTime parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDateTime.parse(raw);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}
