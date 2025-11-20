package com.sarlatea.crm.security;

import com.sarlatea.crm.model.Permission;
import com.sarlatea.crm.model.PermissionConfig;
import com.sarlatea.crm.repository.PermissionConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Optional;

/**
 * Custom permission evaluator that uses database configuration
 * to determine required permissions for resource-operation pairs
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DynamicPermissionEvaluator implements PermissionEvaluator {
    
    private final PermissionConfigRepository permissionConfigRepository;
    
    /**
     * Check if the authenticated user has permission to perform an operation on a resource
     * 
     * @param authentication The current authentication
     * @param targetDomainObject The resource type (e.g., "EMPLOYEE", "WORK_ACTIVITY")
     * @param permission The operation (e.g., "VIEW", "CREATE", "EDIT", "DELETE")
     * @return true if user has required permission
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("User not authenticated");
            return false;
        }
        
        String resource = targetDomainObject.toString();
        String operation = permission.toString();
        
        log.debug("Checking permission for user {} - resource: {}, operation: {}", 
                  authentication.getName(), resource, operation);
        
        // Look up required permission from database
        Optional<PermissionConfig> config = permissionConfigRepository
                .findByResourceAndOperation(resource, operation);
        
        if (config.isEmpty()) {
            log.warn("No permission configuration found for {}:{} - defaulting to DENY", resource, operation);
            return false;
        }
        
        Permission requiredPermission = config.get().getRequiredPermission();
        log.debug("Required permission: {}", requiredPermission.name());
        
        // Check if user has the required permission
        boolean hasPermission = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .peek(auth -> log.trace("User has authority: {}", auth))
                .anyMatch(auth -> auth.equals(requiredPermission.name()));
        
        log.debug("User {} {} access to {}:{}", 
                  authentication.getName(), 
                  hasPermission ? "GRANTED" : "DENIED", 
                  resource, 
                  operation);
        
        return hasPermission;
    }
    
    /**
     * Check permission by target ID (not used in our case, but required by interface)
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, 
                                 String targetType, Object permission) {
        return hasPermission(authentication, targetType, permission);
    }
}

