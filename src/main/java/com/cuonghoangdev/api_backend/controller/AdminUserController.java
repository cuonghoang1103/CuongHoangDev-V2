package com.cuonghoangdev.api_backend.controller;

import com.cuonghoangdev.api_backend.dto.ApiResponse;
import com.cuonghoangdev.api_backend.dto.CreateUserRequest;
import com.cuonghoangdev.api_backend.dto.UpdateUserRequest;
import com.cuonghoangdev.api_backend.entity.Role;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.exception.BadRequestException;
import com.cuonghoangdev.api_backend.exception.ResourceNotFoundException;
import com.cuonghoangdev.api_backend.repository.RoleRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import com.cuonghoangdev.api_backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        Page<User> userPage;
        if (keyword != null && !keyword.isBlank()) {
            userPage = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, keyword, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.ok(userPage));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username da ton tai");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email da duoc su dung");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);

        Role role = roleRepository.findByName(request.getRoleName() != null ? request.getRoleName() : "ROLE_USER")
                .orElseThrow(() -> new BadRequestException("Role khong ton tai: " + request.getRoleName()));

        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        User saved = userService.createUser(user);
        return ResponseEntity.ok(ApiResponse.ok("Tao user thanh cong", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        // Only cuong03dx can edit other users' info and roles
        if (!"cuong03dx".equalsIgnoreCase(currentUser.getUsername())) {
            throw new BadRequestException("Chi cuong03dx moi co quyen chinh sua thong tin user khac");
        }

        if (currentUser.getId().equals(id)) {
            throw new BadRequestException("Ban khong the sua chinh minh tai day — dung /profile");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new BadRequestException("Username da ton tai");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email da duoc su dung");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(request.getPassword());
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        if (request.getAccountNonLocked() != null) {
            user.setAccountNonLocked(request.getAccountNonLocked());
        }

        if (request.getRoleName() != null) {
            Role newRole = roleRepository.findByName(request.getRoleName())
                    .orElseThrow(() -> new BadRequestException("Role khong ton tai: " + request.getRoleName()));
            Set<Role> roles = new HashSet<>();
            roles.add(newRole);
            user.setRoles(roles);
            long currentVersion = user.getRoleVersion() != null ? user.getRoleVersion() : 0L;
            user.setRoleVersion(currentVersion + 1L);
        }

        User saved = userService.updateUser(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat user thanh cong", saved));
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<User>> updateUserRoles(
            @PathVariable Long id,
            @RequestBody Map<String, List<String>> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        // Only cuong03dx can change other users' roles
        if (!"cuong03dx".equalsIgnoreCase(currentUser.getUsername())) {
            throw new BadRequestException("Chi cuong03dx moi co quyen thay doi quyen cua user khac");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        List<String> roleNames = body.get("roles");
        if (roleNames == null || roleNames.isEmpty()) {
            throw new BadRequestException("Roles cannot be empty");
        }

        // cuong03dx cannot change their own role (prevent self-lockout)
        if (currentUser.getId().equals(id)) {
            throw new BadRequestException("Ban khong the thay doi quyen cua chinh minh");
        }

        Set<Role> newRoles = new HashSet<>();
        for (String roleName : roleNames) {
            String normalized = roleName.toUpperCase().startsWith("ROLE_")
                    ? roleName.toUpperCase()
                    : "ROLE_" + roleName.toUpperCase();
            Role role = roleRepository.findByName(normalized)
                    .orElseThrow(() -> new BadRequestException("Role not found: " + roleName));
            newRoles.add(role);
        }

        user.setRoles(newRoles);
        user.setRoleVersion((user.getRoleVersion() != null ? user.getRoleVersion() : 0L) + 1L);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat roles thanh cong", saved));
    }

    @PatchMapping("/{id}/toggle-enabled")
    public ResponseEntity<ApiResponse<Void>> toggleEnabled(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setEnabled(!user.getEnabled());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok(
                user.getEnabled() ? "Da kich hoat tai khoan" : "Da vo hieu hoa tai khoan", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        // Only cuong03dx can delete users
        if (!"cuong03dx".equalsIgnoreCase(currentUser.getUsername())) {
            throw new BadRequestException("Chi cuong03dx moi co quyen xoa user");
        }

        if (currentUser.getId().equals(id)) {
            throw new BadRequestException("Ban khong the xoa chinh minh");
        }

        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }

        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.<Void>ok("Da xoa user thanh cong", null));
    }
}
