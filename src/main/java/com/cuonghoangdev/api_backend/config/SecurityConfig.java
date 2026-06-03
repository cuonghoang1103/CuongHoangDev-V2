package com.cuonghoangdev.api_backend.config;

import com.cuonghoangdev.api_backend.security.CustomUserDetailsService;
import com.cuonghoangdev.api_backend.security.JwtAuthenticationFilter;
import com.cuonghoangdev.api_backend.security.JsonAccessDeniedHandler;
import com.cuonghoangdev.api_backend.security.JsonAuthenticationEntryPoint;
import com.cuonghoangdev.api_backend.security.OAuth2SuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.*;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private OAuth2SuccessHandler oAuth2AuthenticationSuccessHandler;

    @Autowired
    private JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint;

    @Autowired
    private JsonAccessDeniedHandler jsonAccessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        String googleClientId = System.getenv("GOOGLE_CLIENT_ID");
        String googleClientSecret = System.getenv("GOOGLE_CLIENT_SECRET");
        String githubClientId = System.getenv("GITHUB_CLIENT_ID");
        String githubClientSecret = System.getenv("GITHUB_CLIENT_SECRET");

        List<ClientRegistration> registrations = new ArrayList<>();

        if (googleClientId != null && !googleClientId.isEmpty()
                && googleClientSecret != null && !googleClientSecret.isEmpty()) {
            registrations.add(googleClientRegistration(googleClientId, googleClientSecret));
        }
        if (githubClientId != null && !githubClientId.isEmpty()
                && githubClientSecret != null && !githubClientSecret.isEmpty()) {
            registrations.add(githubClientRegistration(githubClientId, githubClientSecret));
        }

        if (registrations.isEmpty()) {
            return new InMemoryClientRegistrationRepository(
                    googleClientRegistration("placeholder", "placeholder"));
        }
        return new InMemoryClientRegistrationRepository(registrations);
    }

    private ClientRegistration googleClientRegistration(String clientId, String clientSecret) {
        return ClientRegistration.withRegistrationId("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(org.springframework.security.oauth2.core.ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(org.springframework.security.oauth2.core.AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("email", "profile")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("email")
                .build();
    }

    private ClientRegistration githubClientRegistration(String clientId, String clientSecret) {
        return ClientRegistration.withRegistrationId("github")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(org.springframework.security.oauth2.core.ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(org.springframework.security.oauth2.core.AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("read:user", "user:email")
                .authorizationUri("https://github.com/login/oauth/authorize")
                .tokenUri("https://github.com/login/oauth/access_token")
                .userInfoUri("https://api.github.com/user")
                .userNameAttributeName("login")
                .build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(HttpMethod.GET, "/api/v1/system/**").permitAll()
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    .requestMatchers("/api/v1/roles/**").permitAll()
                    .requestMatchers("/api/v1/blog/posts/**").permitAll()
                    .requestMatchers("/api/v1/blog/categories/**").permitAll()
                    .requestMatchers("/api/v1/posts/**").permitAll()
                    .requestMatchers("/api/v1/skills/**").permitAll()
                    .requestMatchers("/api/v1/projects/**").permitAll()
                    .requestMatchers("/api/v1/contact/**").permitAll()
                    .requestMatchers("/api/v1/files/**").permitAll()
                    .requestMatchers("/api/v1/music/tracks").permitAll()
                    .requestMatchers("/api/v1/music/admin/**").authenticated()
                    .requestMatchers("/api/v1/courses/featured").permitAll()
                    .requestMatchers("/api/v1/courses").permitAll()
                    .requestMatchers("/api/v1/courses/{slug}").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/courses/*/reviews").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/courses/*/curriculum").permitAll()
                    .requestMatchers("/api/v1/course-categories/**").permitAll()
                    .requestMatchers("/api/v1/ai/chat").permitAll()
                    .requestMatchers("/api/v1/ai/chat/stream").permitAll()
                    .requestMatchers("/api/v1/shop/admin/**").authenticated()
                    .requestMatchers("/api/v1/shop/**").permitAll()
                    .requestMatchers("/api/v1/discounts/**").permitAll()
                    .requestMatchers("/api/v1/orders/admin/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/v1/orders/{id}").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/v1/orders").permitAll()
                    .requestMatchers("/api/v1/orders/**").permitAll()
                    .requestMatchers("/api/v1/ai/admin/**").hasRole("ADMIN")
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                    .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                    .requestMatchers("/", "/health", "/error").permitAll()
                    .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                    .authenticationEntryPoint(jsonAuthenticationEntryPoint)
                    .accessDeniedHandler(jsonAccessDeniedHandler)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // Only enable OAuth2 if credentials are provided
        String googleClientId = System.getenv("GOOGLE_CLIENT_ID");
        String githubClientId = System.getenv("GITHUB_CLIENT_ID");
        if ((googleClientId != null && !googleClientId.isEmpty())
                || (githubClientId != null && !githubClientId.isEmpty())) {
            http.oauth2Login(oauth2 -> oauth2
                    .authorizationEndpoint(authorization -> authorization.baseUri("/oauth2/authorization"))
                    .redirectionEndpoint(redirection -> redirection.baseUri("/login/oauth2/code/*"))
                    .successHandler(oAuth2AuthenticationSuccessHandler)
            );
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003",
            "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003",
            "http://[::1]:3000", "http://[::1]:3001", "http://[::1]:3002", "http://[::1]:3003",
            "http://localhost", "http://127.0.0.1", "http://[::1]",
            "http://localhost:5173",
            "https://cuong-hoang-dev-v2.vercel.app",
            "https://*.vercel.app",
            "https://cuong-hoang-dev-v2.onrender.com",
            "https://*.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Accept-Language",
            "Origin",
            "Cache-Control"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
