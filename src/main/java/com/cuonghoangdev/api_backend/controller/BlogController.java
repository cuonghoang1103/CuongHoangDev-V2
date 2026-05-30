package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.CategoryService;
import com.cuonghoangdev.api_backend.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/blog")
public class BlogController {

    private final PostService postService;
    private final CategoryService categoryService;

    public BlogController(PostService postService, CategoryService categoryService) {
        this.postService = postService;
        this.categoryService = categoryService;
    }

    // ==================== PUBLIC ====================

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<PageResponse<PostDto>>> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPublishedPosts(page, size, category)));
    }

    @GetMapping("/posts/featured")
    public ResponseEntity<ApiResponse<List<PostDto>>> getFeaturedPosts() {
        return ResponseEntity.ok(ApiResponse.ok(postService.getFeaturedPosts()));
    }

    @GetMapping("/posts/popular")
    public ResponseEntity<ApiResponse<List<PostDto>>> getPopularPosts(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getPopularPosts(limit)));
    }

    @GetMapping("/posts/{slug}")
    public ResponseEntity<ApiResponse<PostDto>> getPostBySlug(@PathVariable String slug) {
        PostDto post = postService.getPostBySlug(slug);
        postService.incrementViewCount(slug);
        return ResponseEntity.ok(ApiResponse.ok(post));
    }

    @GetMapping("/posts/search")
    public ResponseEntity<ApiResponse<PageResponse<PostDto>>> searchPosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(postService.searchPosts(keyword, category, page, size)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @GetMapping("/categories/slug/{slug}")
    public ResponseEntity<CategoryDto> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(categoryService.getCategoryBySlug(slug));
    }

    // ==================== ADMIN ====================

    @GetMapping("/admin/posts")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<PageResponse<PostDto>> getAllPostsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getAllPostsForAdmin(page, size));
    }

    @PostMapping("/admin/posts")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (request.getSlug() == null || request.getSlug().isBlank()) {
            request.setSlug(slugify(request.getTitle()));
        }
        PostDto created = postService.createPost(request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(created, "Post created successfully"));
    }

    @PutMapping("/admin/posts/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApiResponse<PostDto>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePostRequest request) {
        PostDto updated = postService.updatePost(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Post updated successfully"));
    }

    @DeleteMapping("/admin/posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Post deleted successfully"));
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String slug = body.get("slug");
        String description = body.get("description");
        CategoryDto created = categoryService.createCategory(name, slug, description);
        return ResponseEntity.ok(ApiResponse.success(created, "Category created successfully"));
    }

    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String slug = body.get("slug");
        String description = body.get("description");
        CategoryDto updated = categoryService.updateCategory(id, name, slug, description);
        return ResponseEntity.ok(ApiResponse.success(updated, "Category updated successfully"));
    }

    @DeleteMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }

    private String slugify(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
