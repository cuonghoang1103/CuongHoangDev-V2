package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.FileUploadResponse;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.CloudinaryFileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    @Autowired
    private CloudinaryFileStorageService cloudinaryService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "misc") String category,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            String cloudUrl = cloudinaryService.upload(file, category);

            Map<String, Object> response = new HashMap<>();
            response.put("url", cloudUrl);
            response.put("originalName", file.getOriginalFilename());
            response.put("contentType", file.getContentType());
            response.put("fileSize", file.getSize());
            response.put("category", category);

            return ResponseEntity.ok(ApiResponse.ok("Upload thanh cong", response));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>error("Upload that bai: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @RequestParam("publicId") String publicId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            cloudinaryService.delete(publicId);
            return ResponseEntity.ok(ApiResponse.<Void>ok("Xoa file thanh cong", null));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Void>error("Xoa file that bai: " + e.getMessage()));
        }
    }
}
