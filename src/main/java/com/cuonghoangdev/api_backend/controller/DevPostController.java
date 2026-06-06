package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.DevPostDto;
import com.cuonghoangdev.api_backend.service.DevPostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dev-posts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DevPostController {

    private final DevPostService devPostService;

    public DevPostController(DevPostService devPostService) {
        this.devPostService = devPostService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DevPostDto.CardDto>>> getAllPosts(
            @RequestParam(required = false) String category) {
        List<DevPostDto.CardDto> posts;
        if (category != null && !category.isBlank()) {
            posts = devPostService.getPostsByCategory(category);
        } else {
            posts = devPostService.getAllPosts();
        }
        return ResponseEntity.ok(ApiResponse.ok(posts));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(devPostService.getAllCategories()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DevPostDto>> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(devPostService.getPostById(id)));
    }

    @PostMapping("/{id}/download")
    public ResponseEntity<ApiResponse<Map<String, String>>> recordDownload(@PathVariable Long id) {
        String url = devPostService.recordDownloadAndGetUrl(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", url != null ? url : "")));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<DevPostDto.CommentDto>> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String userName = body.get("userName");
        String userAvatar = body.get("userAvatar");
        String commentText = body.get("commentText");
        if (commentText == null || commentText.isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("commentText is required"));
        }
        return ResponseEntity.ok(ApiResponse.ok(
            devPostService.addComment(id, userName, userAvatar, commentText)));
    }
}
