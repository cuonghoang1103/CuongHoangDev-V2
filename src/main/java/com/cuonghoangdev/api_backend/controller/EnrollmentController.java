package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@Tag(name = "Enrollments", description = "API dang ky va hoc tap")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping("/{courseId}/enroll")
    @Operation(summary = "Dang ky khoa hoc")
    public ResponseEntity<ApiResponse<EnrollmentDto>> enroll(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok("Dang ky thanh cong!", enrollmentService.enroll(user.getId(), courseId)));
    }

    @GetMapping("/my")
    @Operation(summary = "Khoa hoc cua toi")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentDto>>> getMyCourses(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = enrollmentService.getMyEnrollments(user.getId(), status, page, size);
        return ResponseEntity.ok(ApiResponse.ok("OK", PageResponse.from(result, e -> e)));
    }

    @GetMapping("/my/all")
    @Operation(summary = "Tat ca khoa hoc cua toi (khong phan trang)")
    public ResponseEntity<ApiResponse<List<EnrollmentDto>>> getAllMyEnrollments(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.ok("OK", enrollmentService.getAllMyEnrollments(user.getId())));
    }

    @GetMapping("/{courseId}/curriculum")
    @Operation(summary = "Chuong trinh hoc")
    public ResponseEntity<ApiResponse<List<LessonDto>>> getCurriculum(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", enrollmentService.getCurriculum(courseId)));
    }

    @GetMapping("/{courseId}/lessons/{lessonId}")
    @Operation(summary = "Bai giang chi tiet")
    public ResponseEntity<ApiResponse<LessonDto>> getLesson(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long courseId,
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(ApiResponse.ok("OK",
            enrollmentService.getLessonForLearning(user.getId(), courseId, lessonId)));
    }

    @GetMapping("/{courseId}/progress")
    @Operation(summary = "Tien do hoc tap")
    public ResponseEntity<ApiResponse<List<LessonProgressDto>>> getProgress(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", enrollmentService.getLessonProgress(user.getId(), courseId)));
    }

    @PostMapping("/{courseId}/progress")
    @Operation(summary = "Cap nhat tien do")
    public ResponseEntity<ApiResponse<LessonProgressDto>> updateProgress(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long courseId,
            @Valid @RequestBody LessonProgressRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("OK",
            enrollmentService.updateProgress(user.getId(), courseId, request)));
    }

    @DeleteMapping("/{courseId}/enroll")
    @Operation(summary = "Huy dang ky")
    public ResponseEntity<ApiResponse<Void>> cancelEnrollment(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long courseId) {
        enrollmentService.cancelEnrollment(user.getId(), courseId);
        return ResponseEntity.ok(ApiResponse.ok("Huy dang ky thanh cong!", null));
    }
}
