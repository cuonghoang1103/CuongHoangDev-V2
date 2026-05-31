package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.CreateOrderRequest;
import com.cuonghoangdev.api_backend.dto.OrderDto;
import com.cuonghoangdev.api_backend.service.OrderService;
import com.cuonghoangdev.api_backend.service.DiscountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private DiscountService discountService;

    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        try {
            OrderDto order = orderService.createOrder(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", order
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getOrderByCode(@PathVariable String code) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", orderService.getOrderByCode(code)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderDto> orders = orderService.getOrdersByUser(userId, page, size);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "content", orders.getContent(),
                "totalElements", orders.getTotalElements(),
                "totalPages", orders.getTotalPages()
            )
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", orderService.getOrderById(id)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getOrderByCode(@PathVariable String code) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", orderService.getOrderByCode(code)
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/validate-coupon")
    public ResponseEntity<?> validateCoupon(
            @RequestParam String code,
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", discountService.validateCode(code, amount)
        ));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<OrderDto> orders = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "content", orders.getContent(),
                "totalElements", orders.getTotalElements(),
                "totalPages", orders.getTotalPages()
            )
        ));
    }

    @PutMapping("/admin/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", orderService.updateOrderStatus(id, body.get("status"))
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
