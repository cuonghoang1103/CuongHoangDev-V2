package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.SkillDto;
import com.cuonghoangdev.api_backend.dto.SkillRequest;
import com.cuonghoangdev.api_backend.service.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
@Tag(name = "Skills", description = "Kỹ năng & Công nghệ")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả kỹ năng")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getAllSkills() {
        return ResponseEntity.ok(ApiResponse.ok("Danh sách kỹ năng", skillService.getAllSkills()));
    }

    @GetMapping("/featured")
    @Operation(summary = "Lấy danh sách kỹ năng nổi bật")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getFeaturedSkills() {
        return ResponseEntity.ok(ApiResponse.ok("Kỹ năng nổi bật", skillService.getFeaturedSkills()));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Lấy kỹ năng theo danh mục")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.ok("Kỹ năng theo danh mục: " + category, skillService.getSkillsByCategory(category)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Lấy kỹ năng theo slug")
    public ResponseEntity<ApiResponse<SkillDto>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok("Kỹ năng: " + slug, skillService.getBySlug(slug)));
    }

    // Admin CRUD
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SkillDto>> createSkill(@Valid @RequestBody SkillRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Tạo kỹ năng thành công", skillService.createSkill(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SkillDto>> updateSkill(@PathVariable Long id, @Valid @RequestBody SkillRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật kỹ năng thành công", skillService.updateSkill(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa kỹ năng thành công", null));
    }
}
