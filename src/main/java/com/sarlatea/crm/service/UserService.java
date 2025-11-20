package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.UserDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.Role;
import com.sarlatea.crm.model.User;
import com.sarlatea.crm.repository.RoleRepository;
import com.sarlatea.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        log.debug("Fetching all users");
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(String id) {
        log.debug("Fetching user with id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByUsername(String username) {
        log.debug("Fetching user with username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return convertToDTO(user);
    }

    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        log.debug("Creating new user: {}", userDTO.getUsername());
        
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new DataIntegrityException("Username already exists: " + userDTO.getUsername());
        }
        
        if (userDTO.getEmail() != null && userRepository.existsByEmail(userDTO.getEmail())) {
            throw new DataIntegrityException("Email already exists: " + userDTO.getEmail());
        }
        
        if (userDTO.getPassword() == null || userDTO.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setFullName(userDTO.getFullName());
        user.setEmail(userDTO.getEmail());
        
        // Get role by ID or name
        Role role;
        if (userDTO.getRoleId() != null) {
            role = roleRepository.findById(userDTO.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + userDTO.getRoleId()));
        } else if (userDTO.getRole() != null) {
            role = roleRepository.findByName(userDTO.getRole())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + userDTO.getRole()));
        } else {
            // Default to USER role
            role = roleRepository.findByName("USER")
                    .orElseThrow(() -> new ResourceNotFoundException("Default USER role not found"));
        }
        user.setRole(role);
        
        user.setIsActive(userDTO.getIsActive() != null ? userDTO.getIsActive() : true);
        
        User savedUser = userRepository.save(user);
        log.info("User created successfully: {}", savedUser.getUsername());
        
        return convertToDTO(savedUser);
    }

    @Transactional
    public UserDTO updateUser(String id, UserDTO userDTO) {
        log.debug("Updating user with id: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // Check for duplicate username (excluding current user)
        if (!user.getUsername().equals(userDTO.getUsername()) && 
            userRepository.existsByUsername(userDTO.getUsername())) {
            throw new DataIntegrityException("Username already exists: " + userDTO.getUsername());
        }
        
        // Check for duplicate email (excluding current user)
        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail()) && 
            userRepository.existsByEmail(userDTO.getEmail())) {
            throw new DataIntegrityException("Email already exists: " + userDTO.getEmail());
        }
        
        user.setUsername(userDTO.getUsername());
        user.setFullName(userDTO.getFullName());
        user.setEmail(userDTO.getEmail());
        
        // Update role if provided
        if (userDTO.getRoleId() != null) {
            Role role = roleRepository.findById(userDTO.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + userDTO.getRoleId()));
            user.setRole(role);
        } else if (userDTO.getRole() != null) {
            Role role = roleRepository.findByName(userDTO.getRole())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + userDTO.getRole()));
            user.setRole(role);
        }
        
        if (userDTO.getIsActive() != null) {
            user.setIsActive(userDTO.getIsActive());
        }
        
        // Update password only if provided
        if (userDTO.getPassword() != null && !userDTO.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        }
        
        User updatedUser = userRepository.save(user);
        log.info("User updated successfully: {}", updatedUser.getUsername());
        
        return convertToDTO(updatedUser);
    }

    @Transactional
    public void deleteUser(String id) {
        log.debug("Deleting user with id: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        userRepository.delete(user);
        log.info("User deleted successfully: {}", user.getUsername());
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        
        if (user.getRole() != null) {
            dto.setRoleId(user.getRole().getId());
            dto.setRole(user.getRole().getName());
        }
        
        dto.setIsActive(user.getIsActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        // Never return password
        return dto;
    }
}

