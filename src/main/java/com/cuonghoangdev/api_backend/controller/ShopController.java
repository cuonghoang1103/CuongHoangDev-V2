package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ProductDto;
import com.cuonghoangdev.api_backend.entity.Product;
import com.cuonghoangdev.api_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/shop")
@CrossOrigin(origins = "*")
public class ShopController {

    @Autowired
    private ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<?> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        Page<ProductDto> products;
        if (search != null && !search.isBlank()) {
            products = productService.searchProducts(search, page, size);
        } else if (categoryId != null) {
            products = productService.getProductsByCategory(categoryId, page, size);
        } else {
            products = productService.getAllProducts(page, size);
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "content", products.getContent(),
                "totalElements", products.getTotalElements(),
                "totalPages", products.getTotalPages(),
                "currentPage", products.getNumber()
            )
        ));
    }

    @GetMapping("/products/featured")
    public ResponseEntity<?> getFeaturedProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        Page<ProductDto> products = productService.getFeaturedProducts(page, size);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", products.getContent()
        ));
    }

    @GetMapping("/products/top-selling")
    public ResponseEntity<?> getTopSelling(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", productService.getTopSelling(limit)
        ));
    }

    @GetMapping("/products/{slug}")
    public ResponseEntity<?> getProduct(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", productService.getProductBySlug(slug)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", productService.getAllCategories()
        ));
    }

    @PostMapping("/admin/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", productService.createProduct(product)
        ));
    }

    @PutMapping("/admin/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", productService.updateProduct(id, product)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
