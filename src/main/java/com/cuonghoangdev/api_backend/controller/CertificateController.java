package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.CertificateDto;
import com.cuonghoangdev.api_backend.service.CertificateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/certificates")
@Tag(name = "Certificates", description = "Course completion certificate APIs")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/my")
    @Operation(summary = "Danh sach certificate cua minh")
    public ResponseEntity<ApiResponse<List<CertificateDto>>> getMyCertificates(
            @RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", certificateService.getMyCertificates(userId)));
    }

    @GetMapping("/verify/{certificateNumber}")
    @Operation(summary = "Xac minh certificate bang certificate number")
    public ResponseEntity<ApiResponse<CertificateDto>> verifyCertificate(
            @PathVariable String certificateNumber) {
        return ResponseEntity.ok(ApiResponse.ok("OK", certificateService.getCertificateByNumber(certificateNumber)));
    }

    @GetMapping("/enrollment/{enrollmentId}")
    @Operation(summary = "Lay certificate cua mot enrollment")
    public ResponseEntity<ApiResponse<CertificateDto>> getByEnrollment(
            @PathVariable Long enrollmentId) {
        return ResponseEntity.ok(ApiResponse.ok("OK", certificateService.getCertificateByEnrollment(enrollmentId)));
    }
}
