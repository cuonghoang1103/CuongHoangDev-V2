package com.cuonghoangdev.api_backend.service;

import com.cuonghoangdev.api_backend.entity.Role;
import com.cuonghoangdev.api_backend.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    // Lấy tất cả roles
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    // Tìm role theo tên
    public Role getRoleByName(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Role not found: " + name));
    }
}