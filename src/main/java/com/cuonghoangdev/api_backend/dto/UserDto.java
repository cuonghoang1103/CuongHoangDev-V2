package com.cuonghoangdev.api_backend.dto;

import com.cuonghoangdev.api_backend.entity.User;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public class UserDto {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private String primaryRole;
    private Set<String> roles;
    private LocalDateTime createdAt;
    /** The OAuth provider used to sign in, or "credentials" for password accounts.
        Used by the admin panel to distinguish social vs credentials users. */
    private String provider;
    /** Monotonically increasing version — increments every time roles change.
        Used by NextAuth to detect stale sessions. */
    private Long roleVersion;
    private boolean enabled;
    private Boolean accountNonLocked;

    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());
        var roleSet = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toSet());
        dto.setRoles(roleSet);
        dto.setPrimaryRole(user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName())
                .orElse("ROLE_USER"));
        dto.setProvider(user.getProvider());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setRoleVersion(user.getRoleVersion() != null ? user.getRoleVersion() : 0L);
        dto.setEnabled(user.getEnabled() != null ? user.getEnabled() : true);
        dto.setAccountNonLocked(user.getAccountNonLocked());
        return dto;
    }

    // Getter & Setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getPrimaryRole() {
        return primaryRole;
    }

    public void setPrimaryRole(String primaryRole) {
        this.primaryRole = primaryRole;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getRoleVersion() {
        return roleVersion;
    }

    public void setRoleVersion(Long roleVersion) {
        this.roleVersion = roleVersion;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getAccountNonLocked() {
        return accountNonLocked;
    }

    public void setAccountNonLocked(Boolean accountNonLocked) {
        this.accountNonLocked = accountNonLocked;
    }
}
