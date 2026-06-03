package com.cuonghoangdev.api_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Root health check — used by Render to verify the app started successfully.
 * Render does a GET on the port it finds (10000) and expects a 2xx response.
 * This endpoint MUST NOT require authentication.
 */
@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "app", "CuongHoangDev V2 API",
                "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }

    /**
     * Explicit health endpoint at /health — also no auth.
     * Render can be configured to check this path.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "CuongHoangDev V2 API"
        ));
    }
}
