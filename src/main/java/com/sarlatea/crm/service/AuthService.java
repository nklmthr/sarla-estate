package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.LoginRequest;
import com.sarlatea.crm.dto.LoginResponse;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.AuditLog;
import com.sarlatea.crm.model.User;
import com.sarlatea.crm.repository.UserRepository;
import com.sarlatea.crm.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.debug("Login attempt for username: {}", request.getUsername());
        
        // Capture request context for audit logging
        String ipAddress = "UNKNOWN";
        String userAgent = null;
        String requestMethod = "POST";
        String requestUrl = "/api/auth/login";
        
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest httpRequest = attributes.getRequest();
            ipAddress = getClientIpAddress(httpRequest);
            userAgent = httpRequest.getHeader("User-Agent");
            requestMethod = httpRequest.getMethod();
            requestUrl = httpRequest.getRequestURI();
        }
        
        try {
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password"));
            
            if (!user.getIsActive()) {
                // Log failed login - inactive account
                auditLogService.logAuditWithContext(
                    AuditLog.OperationType.LOGIN,
                    "User",
                    user.getId(),
                    user.getUsername(),
                    null,
                    null,
                    AuditLog.OperationStatus.FORBIDDEN,
                    "Account is inactive",
                    request.getUsername(),
                    ipAddress,
                    requestMethod,
                    requestUrl,
                    userAgent
                );
                throw new IllegalStateException("User account is inactive");
            }
            
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                // Log failed login - invalid password
                auditLogService.logAuditWithContext(
                    AuditLog.OperationType.LOGIN,
                    "User",
                    user.getId(),
                    user.getUsername(),
                    null,
                    null,
                    AuditLog.OperationStatus.UNAUTHORIZED,
                    "Invalid password",
                    request.getUsername(),
                    ipAddress,
                    requestMethod,
                    requestUrl,
                    userAgent
                );
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
            
            // Log successful login
            auditLogService.logAuditWithContext(
                AuditLog.OperationType.LOGIN,
                "User",
                user.getId(),
                user.getUsername(),
                null,
                String.format("Role: %s, Permissions: %d", roleName, permissions.size()),
                AuditLog.OperationStatus.SUCCESS,
                null,
                user.getUsername(),
                ipAddress,
                requestMethod,
                requestUrl,
                userAgent
            );
            
            log.info("User {} logged in successfully from {} with {} permissions", 
                    user.getUsername(), ipAddress, permissions.size());
            
            return new LoginResponse(
                    token,
                    user.getUsername(),
                    user.getFullName(),
                    user.getEmail(),
                    roleName,
                    new java.util.ArrayList<>(permissions)
            );
            
        } catch (ResourceNotFoundException e) {
            // Log failed login - user not found
            auditLogService.logAuditWithContext(
                AuditLog.OperationType.LOGIN,
                "User",
                null,
                request.getUsername(),
                null,
                null,
                AuditLog.OperationStatus.UNAUTHORIZED,
                "User not found",
                request.getUsername(),
                ipAddress,
                requestMethod,
                requestUrl,
                userAgent
            );
            throw e;
        }
    }
    
    /**
     * Extract client IP address from request, handling proxies and load balancers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "HTTP_CLIENT_IP",
            "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED",
            "HTTP_VIA",
            "REMOTE_ADDR"
        };
        
        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }
        
        return request.getRemoteAddr();
    }
}

