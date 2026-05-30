package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.CourseCategoryDto;
import com.cuonghoangdev.api_backend.service.CourseCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/course-categories")
@Tag(name = "Course Categories", description = "API danh muc khoa hoc")
public class CourseCategoryController {

    private final CourseCategoryService categoryService;

    public CourseCategoryController(CourseCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Danh sach danh muc")
    public ResponseEntity<ApiResponse<List<CourseCategoryDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("OK", categoryService.getAllActive()));
    }

    @GetMapping("/admin/all")
    @Operation(summary = "[Admin] Tat ca danh muc")
    public ResponseEntity<ApiResponse<List<CourseCategoryDto>>> getAllAdmin() {
        return ResponseEntity.ok(ApiResponse.ok("OK", categoryService.getAll()));
    }

    @PostMapping
    @Operation(summary = "[Admin] Tao danh muc")
    public ResponseEntity<ApiResponse<CourseCategoryDto>> create(@Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tao danh muc thanh cong!",
            categoryService.create(req.getName(), req.getDescription(), req.getIcon(), req.getSortOrder())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "[Admin] Cap nhat danh muc")
    public ResponseEntity<ApiResponse<CourseCategoryDto>> update(@PathVariable Long id, @RequestBody CategoryUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat thanh cong!",
            categoryService.update(id, req.getName(), req.getDescription(), req.getIcon(), req.getSortOrder(), req.getIsActive())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "[Admin] Xoa danh muc")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Xoa thanh cong!", null));
    }

    public static class CategoryRequest {
        @NotBlank private String name;
        private String description;
        private String icon;
        private Integer sortOrder;

        public String getName() { return name; }
        public String getDescription() { return description; }
        public String getIcon() { return icon; }
        public Integer getSortOrder() { return sortOrder; }
    }

    public static class CategoryUpdateRequest {
        private String name;
        private String description;
        private String icon;
        private Integer sortOrder;
        private Boolean isActive;

        public String getName() { return name; }
        public String getDescription() { return description; }
        public String getIcon() { return icon; }
        public Integer getSortOrder() { return sortOrder; }
        public Boolean getIsActive() { return isActive; }
    }
}
