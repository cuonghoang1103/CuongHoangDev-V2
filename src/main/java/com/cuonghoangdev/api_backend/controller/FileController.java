package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.entity.FileAttachment;
import com.cuonghoangdev.api_backend.repository.FileAttachmentRepository;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.storage.CloudinaryStorageService;
import com.cuonghoangdev.api_backend.service.storage.StorageResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    @Autowired
    private CloudinaryStorageService cloudinaryService;

    @Autowired
    private FileAttachmentRepository fileAttachmentRepository;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "misc") String category,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        log.info("[FileController] ===== uploadFile ENTRY =====");
        log.info("[FileController]   file.name        = {}", file.getOriginalFilename());
        log.info("[FileController]   file.size        = {} bytes", file.getSize());
        log.info("[FileController]   file.contentType = {}", file.getContentType());
        log.info("[FileController]   category         = {}", category);
        log.info("[FileController]   currentUser     = {}", currentUser);

        try {
            log.info("[FileController] Calling cloudinaryService.upload...");
            StorageResult result = cloudinaryService.upload(file, category);
            log.info("[FileController] cloudinaryService.upload SUCCESS");
            log.info("[FileController]   result.url              = {}", result.getUrl());
            log.info("[FileController]   result.publicId         = {}", result.getPublicId());
            log.info("[FileController]   result.originalFileName = {}", result.getOriginalFileName());

            FileAttachment attachment = new FileAttachment();
            attachment.setOriginalName(result.getOriginalFileName());
            attachment.setStoredName(result.getPublicId());
            attachment.setFilePath(result.getUrl());
            attachment.setContentType(result.getContentType());
            attachment.setFileSize(result.getFileSize());
            attachment.setFileCategory(category);
            attachment.setPublicId(result.getPublicId());
            if (currentUser != null) {
                attachment.setUploadedBy(currentUser.getId());
            }
            fileAttachmentRepository.save(attachment);

            Map<String, Object> response = new HashMap<>();
            response.put("url", result.getUrl());
            response.put("publicId", result.getPublicId());
            response.put("originalName", result.getOriginalFileName());
            response.put("contentType", result.getContentType());
            response.put("fileSize", result.getFileSize());
            response.put("category", category);
            response.put("attachmentId", attachment.getId());

            return ResponseEntity.ok(ApiResponse.ok("Upload thanh cong", response));
        } catch (IOException e) {
            log.error("[FileController] ===== uploadFile FAILED =====", e);
            log.error("[FileController]   Exception class : {}", e.getClass().getName());
            log.error("[FileController]   Exception message: {}", e.getMessage());
            log.error("[FileController]   Root cause      : {}", e.getCause());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>error("Upload that bai: " + e.getMessage()));
        } catch (Exception e) {
            log.error("[FileController] ===== uploadFile UNEXPECTED ERROR =====", e);
            log.error("[FileController]   Exception class : {}", e.getClass().getName());
            log.error("[FileController]   Exception message: {}", e.getMessage());
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
            fileAttachmentRepository.findByPublicId(publicId)
                    .ifPresent(fileAttachmentRepository::delete);
            return ResponseEntity.ok(ApiResponse.<Void>ok("Xoa file thanh cong", null));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Void>error("Xoa file that bai: " + e.getMessage()));
        }
    }
}
