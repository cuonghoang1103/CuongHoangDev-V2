package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.UserDto;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserDto>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return userService.getUserById(currentUser.getId())
                .map(user -> ResponseEntity.ok(
                        ApiResponse.ok("Lay profile thanh cong", UserDto.fromEntity(user))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password) {

        return userService.getUserById(currentUser.getId())
                .map(user -> {
                    if (fullName != null) user.setFullName(fullName);
                    if (email != null) user.setEmail(email);
                    if (password != null && !password.isBlank()) user.setPassword(password);
                    var saved = userService.updateUser(currentUser.getId(), user);
                    return ResponseEntity.ok(
                            ApiResponse.ok("Cap nhat profile thanh cong", UserDto.fromEntity(saved)));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
