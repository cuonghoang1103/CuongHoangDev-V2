package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.AcademyAdminService;
import com.cuonghoangdev.api_backend.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@Tag(name = "Courses", description = "API khoa hoc")
public class CourseController {

    private final CourseService courseService;
    private final AcademyAdminService academyAdminService;

    public CourseController(CourseService courseService, AcademyAdminService academyAdminService) {
        this.courseService = courseService;
        this.academyAdminService = academyAdminService;
    }

    @GetMapping
    @Operation(summary = "Danh sach khoa hoc", description = "Lay danh sach khoa hoc da xuat ban")
    public ResponseEntity<ApiResponse<PageResponse<CourseDto>>> getCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getId() : null;
        var result = courseService.getPublishedCourses(page, size, keyword, category, level, userId);
        return ResponseEntity.ok(ApiResponse.ok("OK", PageResponse.of(result)));
    }

    @GetMapping("/featured")
    @Operation(summary = "Khoa hoc noi bat")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getFeatured(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(ApiResponse.ok("OK", courseService.getFeaturedCourses(limit)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Chi tiet khoa hoc")
    public ResponseEntity<ApiResponse<CourseDto>> getCourse(
            @PathVariable String slug,
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("OK", courseService.getCourseBySlug(slug, userId)));
    }

    @GetMapping("/semester/{semesterId}")
    @Operation(summary = "Khoa hoc theo hoc ky")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getCoursesBySemester(@PathVariable Long semesterId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", academyAdminService.getCoursesBySemester(semesterId)));
    }

    @GetMapping("/{courseId}/reviews")
    @Operation(summary = "Danh gia khoa hoc")
    public ResponseEntity<ApiResponse<List<CourseReviewDto>>> getReviews(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", courseService.getCourseReviews(courseId)));
    }

    @PostMapping("/reviews")
    @Operation(summary = "Tao danh gia")
    public ResponseEntity<ApiResponse<CourseReviewDto>> createReview(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody CreateReviewRequest request) {
        CourseReviewDto review = courseService.createReview(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Gui danh gia thanh cong!", review));
    }

    @GetMapping("/admin/all")
    @Operation(summary = "[Admin] Tat ca khoa hoc")
    public ResponseEntity<ApiResponse<PageResponse<CourseDto>>> getAdminCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = courseService.getAdminCourses(keyword, status, categoryId, page, size);
        return ResponseEntity.ok(ApiResponse.ok("OK", PageResponse.of(result)));
    }

    @PostMapping
    @Operation(summary = "[Admin] Tao khoa hoc moi")
    public ResponseEntity<ApiResponse<CourseDto>> createCourse(
            @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tao khoa hoc thanh cong!", courseService.createCourse(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "[Admin] Cap nhat khoa hoc")
    public ResponseEntity<ApiResponse<CourseDto>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong!", courseService.updateCourse(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "[Admin] Xoa khoa hoc")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong!", null));
    }

    @PostMapping("/sections")
    @Operation(summary = "[Admin] Tao chuong")
    public ResponseEntity<ApiResponse<CourseSectionDto>> createSection(
            @Valid @RequestBody CreateSectionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tao chuong thanh cong!", courseService.createSection(request)));
    }

    @PutMapping("/sections/{id}")
    @Operation(summary = "[Admin] Cap nhat chuong")
    public ResponseEntity<ApiResponse<CourseSectionDto>> updateSection(
            @PathVariable Long id,
            @Valid @RequestBody CreateSectionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong!", courseService.updateSection(id, request)));
    }

    @DeleteMapping("/sections/{id}")
    @Operation(summary = "[Admin] Xoa chuong")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable Long id) {
        courseService.deleteSection(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong!", null));
    }

    @PostMapping("/lessons")
    @Operation(summary = "[Admin] Tao bai giang")
    public ResponseEntity<ApiResponse<LessonDto>> createLesson(
            @Valid @RequestBody CreateLessonRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tao bai giang thanh cong!", courseService.createLesson(request)));
    }

    @GetMapping("/{courseId}/lessons/{lessonId}")
    @Operation(summary = "Chi tiet bai giang")
    public ResponseEntity<ApiResponse<LessonDto>> getLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", courseService.getLessonById(lessonId)));
    }

    @PutMapping("/lessons/{id}")
    @Operation(summary = "[Admin] Cap nhat bai giang")
    public ResponseEntity<ApiResponse<LessonDto>> updateLesson(
            @PathVariable Long id,
            @Valid @RequestBody CreateLessonRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong!", courseService.updateLesson(id, request)));
    }

    @DeleteMapping("/lessons/{id}")
    @Operation(summary = "[Admin] Xoa bai giang")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable Long id) {
        courseService.deleteLesson(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong!", null));
    }

    @PutMapping("/lessons/{lessonId}/detail")
    @Operation(summary = "[Admin] Cap nhat lesson detail (video, source code, teaching notes)")
    public ResponseEntity<ApiResponse<LessonDetailDto>> updateLessonDetail(
            @PathVariable Long lessonId,
            @RequestBody UpdateLessonDetailRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong", courseService.updateLessonDetail(lessonId, req)));
    }

    @PostMapping("/documents")
    @Operation(summary = "[Admin] Tao tai lieu")
    public ResponseEntity<ApiResponse<CourseDocumentDto>> createDocument(
            @Valid @RequestBody CreateDocumentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tao tai lieu thanh cong!", courseService.createDocument(request)));
    }

    @DeleteMapping("/documents/{id}")
    @Operation(summary = "[Admin] Xoa tai lieu")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        courseService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong!", null));
    }

    @PostMapping("/assignments")
    @Operation(summary = "[Admin] Tao bai tap")
    public ResponseEntity<ApiResponse<AssignmentDto>> createAssignment(
            @Valid @RequestBody CreateAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tao bai tap thanh cong!", academyAdminService.createAssignment(request)));
    }

    @PutMapping("/assignments/{id}")
    @Operation(summary = "[Admin] Cap nhat bai tap")
    public ResponseEntity<ApiResponse<AssignmentDto>> updateAssignment(
            @PathVariable Long id,
            @Valid @RequestBody CreateAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat bai tap thanh cong!", academyAdminService.updateAssignment(id, request)));
    }

    @DeleteMapping("/assignments/{id}")
    @Operation(summary = "[Admin] Xoa bai tap")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable Long id) {
        academyAdminService.deleteAssignment(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa bai tap thanh cong!", null));
    }

    @GetMapping("/lessons/{lessonId}/assignments")
    @Operation(summary = "Danh sach bai tap cua lesson")
    public ResponseEntity<ApiResponse<List<AssignmentDto>>> getAssignments(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.ok("OK", academyAdminService.getAssignmentsByLesson(lessonId, userId)));
    }

    @PostMapping("/assignments/submit")
    @Operation(summary = "Nop bai tap")
    public ResponseEntity<ApiResponse<AssignmentSubmissionDto>> submitAssignment(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody AssignmentSubmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Nop bai thanh cong!", academyAdminService.submitAssignment(user.getId(), request)));
    }
}
