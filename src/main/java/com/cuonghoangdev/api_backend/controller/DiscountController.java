package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.entity.DiscountCode;
import com.cuonghoangdev.api_backend.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/discounts")
@CrossOrigin(origins = "*")
public class DiscountController {

    @Autowired
    private DiscountService discountService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllCodes() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", discountService.getAllCodes()
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<?> createCode(@RequestBody DiscountCode code) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", discountService.createCode(code)
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateCode(@PathVariable Long id, @RequestBody DiscountCode code) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", discountService.updateCode(id, code)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteCode(@PathVariable Long id) {
        discountService.deleteCode(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/seed")
    public ResponseEntity<?> seedDemo() {
        discountService.seedDemoCodes();
        return ResponseEntity.ok(Map.of("success", true, "message", "Demo codes seeded"));
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validateCode(@PathVariable String code) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", discountService.validateCode(code)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
