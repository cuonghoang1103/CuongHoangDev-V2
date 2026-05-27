package com.cuonghoangdev.api_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;

import java.util.Arrays;

@Configuration
public class OAuth2ClientConfig {

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String googleClientSecret;

    @Value("${spring.security.oauth2.client.registration.github.client-id:}")
    private String githubClientId;

    @Value("${spring.security.oauth2.client.registration.github.client-secret:}")
    private String githubClientSecret;

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(
                buildGoogleClientRegistration(),
                buildGithubClientRegistration()
        );
    }

    private ClientRegistration buildGoogleClientRegistration() {
        if (googleClientId == null || googleClientId.isEmpty() || googleClientId.equals("your-google-client-id")) {
            return null;
        }

        return ClientRegistration.withRegistrationId("google")
                .clientId(googleClientId)
                .clientSecret(googleClientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:" + serverPort + "/login/oauth2/code/google")
                .scope(Arrays.asList("email", "profile"))
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .clientName("Google")
                .build();
    }

    private ClientRegistration buildGithubClientRegistration() {
        if (githubClientId == null || githubClientId.isEmpty() || githubClientId.equals("your-github-client-id")) {
            return null;
        }

        return ClientRegistration.withRegistrationId("github")
                .clientId(githubClientId)
                .clientSecret(githubClientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:" + serverPort + "/login/oauth2/code/github")
                .scope(Arrays.asList("read:user", "user:email"))
                .authorizationUri("https://github.com/login/oauth/authorize")
                .tokenUri("https://github.com/login/oauth/access_token")
                .userInfoUri("https://api.github.com/user")
                .userNameAttributeName("login")
                .clientName("GitHub")
                .build();
    }

    private static class InMemoryClientRegistrationRepository implements ClientRegistrationRepository {
        private final java.util.List<ClientRegistration> registrations;

        public InMemoryClientRegistrationRepository(ClientRegistration... registrations) {
            this.registrations = Arrays.stream(registrations)
                    .filter(r -> r != null)
                    .toList();
        }

        @Override
        public ClientRegistration findByRegistrationId(String registrationId) {
            return registrations.stream()
                    .filter(r -> r.getRegistrationId().equals(registrationId))
                    .findFirst()
                    .orElse(null);
        }
    }
}
