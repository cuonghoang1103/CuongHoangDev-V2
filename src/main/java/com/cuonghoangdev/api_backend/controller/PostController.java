package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.entity.Post;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.CategoryService;
import com.cuonghoangdev.api_backend.service.PostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostCardDto>>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<PostCardDto> result = postService.getPublishedPosts(page, size, null);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PageResponse<PostDto>>> getAllPostsAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        PageResponse<PostDto> result;
        if ((keyword != null && !keyword.isBlank()) || (status != null && !status.isBlank())) {
            result = postService.searchPostsAdmin(keyword, status, page, size);
        } else {
            result = postService.getAllPostsForAdmin(page, size);
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<PostCardDto>>> getFeaturedPosts(
            @RequestParam(defaultValue = "5") int limit) {
        List<PostCardDto> featured = postService.getFeaturedPosts();
        return ResponseEntity.ok(ApiResponse.ok(featured));
    }

    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<PostCardDto>>> getPopularPosts(
            @RequestParam(defaultValue = "5") int limit) {
        List<PostCardDto> popular = postService.getPopularPosts(limit);
        return ResponseEntity.ok(ApiResponse.ok(popular));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostDto>> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPostBySlug(String.valueOf(id))));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<PostCardDto>>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<PostCardDto> results = postService.searchPosts(keyword, null, page, size);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    // Admin CRUD
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PostDto post = postService.createPost(request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Tao bai viet thanh cong", post));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PostDto>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePostRequest request) {
        PostDto post = postService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat bai viet thanh cong", post));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.ok("Da xoa bai viet thanh cong", null));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PostDto>> createAdminPost(
            @Valid @RequestBody AdminPostRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CreatePostRequest createRequest = new CreatePostRequest();
        createRequest.setTitle(request.getTitle());
        createRequest.setSlug(slugify(request.getTitle()));
        createRequest.setContent(request.getContent());
        createRequest.setExcerpt(request.getExcerpt());
        createRequest.setThumbnailUrl(request.getThumbnailUrl());
        createRequest.setStatus(request.getStatus());
        createRequest.setTagNames(request.getTags());

        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            var cat = categoryService.getCategoryEntityByName(request.getCategory());
            createRequest.setCategoryId(cat != null ? cat.getId() : null);
        }

        PostDto post = postService.createPost(createRequest, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Tao bai viet thanh cong", post));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PostDto>> updateAdminPost(
            @PathVariable Long id,
            @Valid @RequestBody AdminPostRequest request) {
        UpdatePostRequest updateRequest = new UpdatePostRequest();
        updateRequest.setTitle(request.getTitle());
        updateRequest.setContent(request.getContent());
        updateRequest.setExcerpt(request.getExcerpt());
        updateRequest.setThumbnailUrl(request.getThumbnailUrl());
        updateRequest.setStatus(request.getStatus());
        updateRequest.setTagNames(request.getTags());

        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            var cat = categoryService.getCategoryEntityByName(request.getCategory());
            updateRequest.setCategoryId(cat != null ? cat.getId() : null);
        }

        PostDto post = postService.updatePost(id, updateRequest);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat bai viet thanh cong", post));
    }

    private String slugify(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
