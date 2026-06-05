package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.CreateSemesterRequest;
import com.cuonghoangdev.api_backend.dto.GradeSubmissionRequest;
import com.cuonghoangdev.api_backend.dto.SemesterDto;
import com.cuonghoangdev.api_backend.dto.UpdateSemesterRequest;
import com.cuonghoangdev.api_backend.dto.AssignmentSubmissionDto;
import com.cuonghoangdev.api_backend.dto.SubmissionWithUserDto;
import com.cuonghoangdev.api_backend.service.AcademyAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academy")
@Tag(name = "Academy", description = "FPT Academy semester APIs")
public class AcademyController {

    private final AcademyAdminService academyAdminService;

    public AcademyController(AcademyAdminService academyAdminService) {
        this.academyAdminService = academyAdminService;
    }

    @GetMapping("/semesters")
    @Operation(summary = "Danh sach hoc ky")
    public ResponseEntity<ApiResponse<List<SemesterDto>>> getSemesters() {
        return ResponseEntity.ok(ApiResponse.ok("OK", academyAdminService.getSemesters()));
    }

    @PostMapping("/semesters")
    @Operation(summary = "[Admin] Tao hoc ky moi")
    public ResponseEntity<ApiResponse<SemesterDto>> createSemester(
            @Valid @RequestBody CreateSemesterRequest req) {
        SemesterDto created = academyAdminService.createSemester(req);
        return ResponseEntity.ok(ApiResponse.ok("Tao hoc ky thanh cong", created));
    }

    @PutMapping("/semesters/{id}")
    @Operation(summary = "[Admin] Cap nhat hoc ky")
    public ResponseEntity<ApiResponse<SemesterDto>> updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSemesterRequest req) {
        SemesterDto updated = academyAdminService.updateSemester(id, req);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat hoc ky thanh cong", updated));
    }

    @DeleteMapping("/semesters/{id}")
    @Operation(summary = "[Admin] Xoa hoc ky")
    public ResponseEntity<ApiResponse<Void>> deleteSemester(@PathVariable Long id) {
        academyAdminService.deleteSemester(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa hoc ky thanh cong", null));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    @Operation(summary = "[Admin] Danh sach nop bai cua mot assignment")
    public ResponseEntity<ApiResponse<List<SubmissionWithUserDto>>> getSubmissionsByAssignment(
            @PathVariable Long assignmentId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", academyAdminService.getSubmissionsByAssignmentWithUser(assignmentId)));
    }

    @PostMapping("/assignments/grade")
    @Operation(summary = "[Admin] Cham diem / tra loi bai nop")
    public ResponseEntity<ApiResponse<AssignmentSubmissionDto>> gradeSubmission(
            @Valid @RequestBody GradeSubmissionRequest req) {
        AssignmentSubmissionDto graded = academyAdminService.gradeSubmission(req);
        return ResponseEntity.ok(ApiResponse.ok("Cham diem thanh cong", graded));
    }
}
