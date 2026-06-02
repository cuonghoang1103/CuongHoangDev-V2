package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.User;
import com.cuonghoangdev.api_backend.exception.ResourceNotFoundException;
import com.cuonghoangdev.api_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, User updated) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(updated.getUsername());
            user.setEmail(updated.getEmail());
            user.setFullName(updated.getFullName());
            user.setUpdatedAt(LocalDateTime.now());
            if (updated.getPassword() != null && !updated.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(updated.getPassword()));
            }
            if (updated.getEnabled() != null) {
                user.setEnabled(updated.getEnabled());
            }
            if (updated.getAccountNonLocked() != null) {
                user.setAccountNonLocked(updated.getAccountNonLocked());
            }
            return userRepository.save(user);
        }).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
