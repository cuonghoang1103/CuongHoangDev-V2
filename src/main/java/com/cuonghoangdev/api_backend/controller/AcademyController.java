package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.SemesterDto;
import com.cuonghoangdev.api_backend.service.AcademyAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
