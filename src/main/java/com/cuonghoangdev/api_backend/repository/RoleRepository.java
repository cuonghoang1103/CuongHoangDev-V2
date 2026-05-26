package com.cuonghoangdev.api_backend.repository;

import com.cuonghoangdev.api_backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    // Tìm role theo tên (ví dụ: ROLE_ADMIN, ROLE_USER)
    Optional<Role> findByName(String name);
}