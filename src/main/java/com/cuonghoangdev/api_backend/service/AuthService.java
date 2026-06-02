package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.dto.AuthResponse;
import com.cuonghoangdev.api_backend.dto.ChangePasswordRequest;
import com.cuonghoangdev.api_backend.dto.LoginRequest;
import com.cuonghoangdev.api_backend.dto.OAuthRegisterRequest;
import com.cuonghoangdev.api_backend.dto.RegisterRequest;
import com.cuonghoangdev.api_backend.entity.PasswordResetToken;
import com.cuonghoangdev.api_backend.entity.Role;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.exception.BadRequestException;
import com.cuonghoangdev.api_backend.repository.PasswordResetTokenRepository;
import com.cuonghoangdev.api_backend.repository.RoleRepository;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import com.cuonghoangdev.api_backend.security.JwtTokenProvider;
import com.cuonghoangdev.api_backend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new BadRequestException("Account is disabled");
        }
        if (!Boolean.TRUE.equals(user.getAccountNonLocked())) {
            throw new BadRequestException("Account is locked");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Bad credentials");
        }

        UserPrincipal userPrincipal = new UserPrincipal(user);
        String role = user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElse("ROLE_USER");

        var authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.getName()))
                .toList();

        var authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                userPrincipal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                role
        );
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username đã tồn tại");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setCreatedAt(LocalDateTime.now());
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new BadRequestException("Role USER không tìm thấy"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        User saved = userRepository.save(user);

        emailService.sendWelcomeEmail(saved.getEmail(), saved.getUsername());

        return saved;
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByUsername(email)
                .orElse(null);

        if (user == null) {
            return;
        }

        passwordResetTokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(user, token, expiresAt);
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Token khong hop le"));

        if (resetToken.isUsed()) {
            throw new BadRequestException("Token da duoc su dung");
        }

        if (resetToken.isExpired()) {
            throw new BadRequestException("Token da het han");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    @Transactional
    public void changePassword(UserPrincipal currentUser, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mat khau xac nhan khong khop");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new BadRequestException("Khong tim thay nguoi dung"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mat khau hien tai khong dung");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Handles OAuth sign-in: finds existing user by email/provider, or creates a
     * new account. Returns the user so NextAuth can set role in JWT.
     */
    @Transactional
    public User oauthRegister(OAuthRegisterRequest request) {
        Optional<User> byEmail = userRepository.findByEmail(request.getEmail());
        if (byEmail.isPresent()) {
            return byEmail.get();
        }

        Optional<User> byProvider = userRepository.findByProviderAndProviderId(
                request.getProvider(), request.getProviderId());
        if (byProvider.isPresent()) {
            return byProvider.get();
        }

        User user = new User();
        user.setUsername(generateOAuthUsername(request.getEmail()));
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setProvider(request.getProvider());
        user.setProviderId(request.getProviderId());
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    Role r = new Role("ROLE_USER");
                    return roleRepository.save(r);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    private String generateOAuthUsername(String email) {
        String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }
}
