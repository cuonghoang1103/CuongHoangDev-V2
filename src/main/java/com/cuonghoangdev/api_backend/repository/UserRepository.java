package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String username, String email, Pageable pageable);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    Optional<User> findByEmail(String email);

    // Filter by exact provider (google, github, facebook) — excludes credentials users
    Page<User> findByProvider(String provider, Pageable pageable);

    // Filter by multiple providers (google OR github)
    Page<User> findByProviderIn(List<String> providers, Pageable pageable);

    // Filter by exact provider AND keyword
    Page<User> findByProviderAndUsernameContainingIgnoreCaseOrProviderAndEmailContainingIgnoreCase(
            String provider1, String keyword, String provider2, String keyword, Pageable pageable);

    Page<User> findByProviderInAndUsernameContainingIgnoreCaseOrProviderInAndEmailContainingIgnoreCase(
            List<String> providers, String usernameKw, List<String> providers2, String emailKw, Pageable pageable);

    // Credentials users only (provider IS NULL)
    Page<User> findByProviderIsNull(Pageable pageable);

    Page<User> findByProviderIsNullAndUsernameContainingIgnoreCaseOrProviderIsNullAndEmailContainingIgnoreCase(
            String username, String email, Pageable pageable);
}
