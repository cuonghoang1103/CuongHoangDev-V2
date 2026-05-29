package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.ProfileUpdateRequest;
import com.cuonghoangdev.api_backend.dto.UserDto;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.UserService;
import jakarta.validation.Valid;
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

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMyProfileAlt(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return getMyProfile(currentUser);
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserDto>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ProfileUpdateRequest request) {

        return userService.getUserById(currentUser.getId())
                .map(user -> {
                    if (request.getFullName() != null) user.setFullName(request.getFullName());
                    if (request.getEmail() != null) user.setEmail(request.getEmail());
                    if (request.getBio() != null) user.setBio(request.getBio());
                    if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

                    var saved = userService.updateUser(currentUser.getId(), user);
                    return ResponseEntity.ok(
                            ApiResponse.ok("Cap nhat profile thanh cong", UserDto.fromEntity(saved)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/full")
    public ResponseEntity<ApiResponse<UserDto>> getMyProfileFull(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return getMyProfile(currentUser);
    }
}
