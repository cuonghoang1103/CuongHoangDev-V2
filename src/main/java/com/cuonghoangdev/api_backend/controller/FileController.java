package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.FileUploadResponse;
import com.cuonghoangdev.api_backend.entity.FileAttachment;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false, defaultValue = "misc") String category,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long userId = (currentUser != null) ? currentUser.getId() : null;
        FileAttachment attachment = fileStorageService.store(file, userId, category);

        FileUploadResponse response = new FileUploadResponse(
                attachment.getId(),
                attachment.getOriginalName(),
                attachment.getStoredName(),
                attachment.getContentType(),
                attachment.getFileSize(),
                fileStorageService.getDownloadUrl(attachment.getStoredName()),
                attachment.getUploadedAt().toString()
        );

        return ResponseEntity.ok(ApiResponse.ok("Upload thanh cong", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> getMyFiles(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<FileAttachment> files = fileStorageService.getFilesByUser(currentUser.getId());

        List<FileUploadResponse> responses = files.stream()
                .map(f -> new FileUploadResponse(
                        f.getId(),
                        f.getOriginalName(),
                        f.getStoredName(),
                        f.getContentType(),
                        f.getFileSize(),
                        fileStorageService.getDownloadUrl(f.getStoredName()),
                        f.getUploadedAt().toString()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("/{storedName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String storedName) {
        Resource resource = fileStorageService.loadAsResource(storedName);
        FileAttachment attachment = fileStorageService.findByStoredName(storedName);

        String filename = attachment.getOriginalName();
        String contentType = attachment.getContentType();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        fileStorageService.deleteFile(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.<Void>ok("Xoa file thanh cong", null));
    }
}
