package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.LoginRequest;
import com.sarlatea.crm.dto.LoginResponse;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.User;
import com.sarlatea.crm.repository.UserRepository;
import com.sarlatea.crm.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.debug("Login attempt for username: {}", request.getUsername());
        
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password"));
        
        if (!user.getIsActive()) {
            throw new IllegalStateException("User account is inactive");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResourceNotFoundException("Invalid username or password");
        }
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate JWT token with permissions
        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        Set<String> permissions = user.getRole() != null && user.getRole().getPermissions() != null 
            ? user.getRole().getPermissions().stream()
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toSet())
            : new java.util.HashSet<>();
        
        String token = jwtUtil.generateToken(user.getUsername(), roleName, permissions);
        
        log.info("User {} logged in successfully with {} permissions", user.getUsername(), permissions.size());
        
        return new LoginResponse(
                token,
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                roleName,
                new java.util.ArrayList<>(permissions)
        );
    }
}

