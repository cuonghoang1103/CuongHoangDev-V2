package com.cuonghoangdev.api_backend.security;

import com.cuonghoangdev.api_backend.dto.AuthResponse;
import com.cuonghoangdev.api_backend.entity.Role;
import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import com.cuonghoangdev.api_backend.repository.RoleRepository;
import com.cuonghoangdev.api_backend.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();

        String provider = oauthToken.getAuthorizedClientRegistrationId().toUpperCase();

        // Extract OAuth user info - use final variables
        final String finalProvider = provider;
        OAuthUserInfo userInfo = extractOAuthUserInfo(oauth2User, finalProvider);
        final String finalProviderId = userInfo.providerId();
        final String finalEmail = userInfo.email();
        final String finalName = userInfo.name();

        // Tìm hoặc tạo user
        Optional<User> existingUser = userRepository.findByProviderAndProviderId(finalProvider, finalProviderId);
        User user = existingUser.orElseGet(() -> createNewOAuthUser(finalProvider, finalProviderId, finalEmail, finalName));

        // Tạo JWT token cho user
        UserPrincipal userPrincipal = new UserPrincipal(user);
        String token = tokenProvider.generateToken(userPrincipal);

        String userRole = user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElse("ROLE_USER");

        AuthResponse authResponse = new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                userRole
        );

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of(
                "success", true,
                "message", "Đăng nhập " + finalProvider + " thành công",
                "data", authResponse
        ));
    }

    private OAuthUserInfo extractOAuthUserInfo(OAuth2User oauth2User, String provider) {
        String providerId;
        String email;
        String name;

        switch (provider) {
            case "GOOGLE":
                providerId = String.valueOf(oauth2User.getAttribute("sub"));
                email = oauth2User.getAttribute("email");
                name = oauth2User.getAttribute("name");
                break;
            case "GITHUB":
                providerId = String.valueOf(oauth2User.getAttribute("id"));
                email = oauth2User.getAttribute("email");
                name = oauth2User.getAttribute("login");
                if (email == null) {
                    email = providerId + "@github.com";
                }
                break;
            default:
                Map<String, Object> attributes = oauth2User.getAttributes();
                providerId = String.valueOf(attributes.getOrDefault("id", "unknown"));
                email = (String) attributes.getOrDefault("email", providerId + "@" + provider.toLowerCase() + ".com");
                name = (String) attributes.getOrDefault("name", provider);
        }

        return new OAuthUserInfo(providerId, email, name);
    }

    private User createNewOAuthUser(String provider, String providerId, String email, String name) {
        // Thử tìm theo email nếu đã có tài khoản
        Optional<User> existingByEmail = userRepository.findByEmail(email);
        if (existingByEmail.isPresent()) {
            User existing = existingByEmail.get();
            existing.setProvider(provider);
            existing.setProviderId(providerId);
            return userRepository.save(existing);
        }

        // Tạo user mới
        User newUser = new User();
        newUser.setUsername(generateUsername(email, provider));
        newUser.setPassword("");
        newUser.setEmail(email);
        newUser.setFullName(name);
        newUser.setProvider(provider);
        newUser.setProviderId(providerId);
        newUser.setEnabled(true);
        newUser.setAccountNonExpired(true);
        newUser.setAccountNonLocked(true);
        newUser.setCredentialsNonExpired(true);

        Set<Role> roles = new HashSet<>();
        roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
        newUser.setRoles(roles);

        return userRepository.save(newUser);
    }

    private String generateUsername(String email, String provider) {
        String baseUsername = email.split("@")[0];
        String sanitized = baseUsername.replaceAll("[^a-zA-Z0-9]", "");
        return sanitized + "_" + provider.toLowerCase();
    }

    private record OAuthUserInfo(String providerId, String email, String name) {}
}
