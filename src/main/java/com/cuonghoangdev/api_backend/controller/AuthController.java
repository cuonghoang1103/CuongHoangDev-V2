package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.*;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.entity.Role;
import com.cuonghoangdev.api_backend.exception.BadRequestException;
import com.cuonghoangdev.api_backend.exception.ResourceNotFoundException;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.security.JwtTokenProvider;
import com.cuonghoangdev.api_backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "1. Authentication", description = "Xác thực & Đăng nhập")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Tạo tài khoản người dùng mới với username, email và password")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký thành công", UserDto.fromEntity(user)));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Đăng nhập bằng username và password, trả về JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse authResponse = authService.login(request);
            return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", authResponse));
        } catch (BadRequestException ex) {
            return new ResponseEntity<>(
                    ApiResponse.error(ex.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception ex) {
            return new ResponseEntity<>(
                    ApiResponse.error(ex.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Quên mật khẩu", description = "Gửi email đặt lại mật khẩu nếu email tồn tại trong hệ thống")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.<Void>ok(
                "Neu email ton tai, link dat lai mat khau da duoc gui", null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu", description = "Đặt lại mật khẩu mới sử dụng token đã gửi qua email")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.<Void>ok("Dat lai mat khau thanh cong", null));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Đổi mật khẩu khi đã đăng nhập")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser, request);
        return ResponseEntity.ok(ApiResponse.<Void>ok("Doi mat khau thanh cong", null));
    }

    @PostMapping("/oauth/register")
    @Operation(summary = "OAuth register/login", description = "Called by NextAuth during OAuth sign-in to create or find user in backend, returns role for JWT session")
    public ResponseEntity<ApiResponse<UserDto>> oauthRegister(@Valid @RequestBody OAuthRegisterRequest request) {
        User user = authService.oauthRegister(request);
        UserDto dto = UserDto.fromEntity(user);
        dto.setRoleVersion(user.getRoleVersion() != null ? user.getRoleVersion() : 0L);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/oauth/token")
    @Operation(summary = "OAuth token", description = "Generate JWT token for an existing OAuth user by email — used to set backend_token cookie after NextAuth sign-in")
    public ResponseEntity<ApiResponse<AuthResponse>> oauthToken(@Valid @RequestBody OAuthRegisterRequest request) {
        User user = authService.oauthRegister(request);
        String token = tokenProvider.generateTokenFromUsername(user.getUsername());
        String role = user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElse("ROLE_USER");
        AuthResponse response = new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                role
        );
        response.setRoleVersion(user.getRoleVersion() != null ? user.getRoleVersion() : 0L);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/v1/auth/role?email={email}&provider={provider}
     *
     * Returns the current role and roleVersion for an OAuth user.
     * Called by NextAuth's JWT callback on every token refresh to detect
     * role changes made by the admin (cuong03dx).
     */
    @GetMapping("/role")
    @Operation(summary = "Get role by email", description = "Returns current role and roleVersion for an OAuth user — used by NextAuth to detect stale sessions")
    public ResponseEntity<ApiResponse<AuthResponse>> getRoleByEmail(
            @RequestParam String email,
            @RequestParam(required = false) String provider) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        String role = user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElse("ROLE_USER");
        AuthResponse response = new AuthResponse();
        response.setRole(role);
        response.setRoleVersion(user.getRoleVersion() != null ? user.getRoleVersion() : 0L);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/v1/auth/refresh
     *
     * Refreshes the JWT for an authenticated user. Issues a NEW token with a fresh
     * expiry, keeping the user logged in without re-entering credentials.
     * The frontend calls this before the current token expires.
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT token", description = "Issues a new JWT for an authenticated user, extending their session without re-login")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return new ResponseEntity<>(
                    ApiResponse.error("Authentication required"),
                    HttpStatus.UNAUTHORIZED
            );
        }
        User user = userRepository.findByUsername(currentUser.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String newToken = tokenProvider.generateTokenFromUsername(user.getUsername());
        String role = user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElse("ROLE_USER");
        AuthResponse response = new AuthResponse(
                newToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                role
        );
        response.setRoleVersion(user.getRoleVersion() != null ? user.getRoleVersion() : 0L);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
