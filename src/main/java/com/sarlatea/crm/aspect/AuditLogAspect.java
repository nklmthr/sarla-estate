package com.sarlatea.crm.aspect;

import com.sarlatea.crm.model.AuditLog;
import com.sarlatea.crm.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

/**
 * AOP Aspect for automatic audit logging of controller operations
 * Intercepts all controller methods with @PreAuthorize annotations
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final AuditLogService auditLogService;

    /**
     * Intercept all controller methods with @PreAuthorize annotation
     */
    @Around("@annotation(org.springframework.security.access.prepost.PreAuthorize) && " +
            "execution(* com.sarlatea.crm.controller..*(..))")
    public Object logControllerAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // Extract entity type from controller class name
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String entityType = extractEntityType(className);
        
        // Determine operation type based on HTTP method and method name
        AuditLog.OperationType operationType = determineOperationType(method);
        
        // Extract entity ID from method parameters
        String entityId = extractEntityId(joinPoint.getArgs(), signature);
        String entityName = extractEntityName(joinPoint.getArgs(), signature);
        
        // Capture username and request info BEFORE async call
        // (SecurityContext and RequestAttributes might not be available in async thread)
        String username = getCurrentUsername();
        String ipAddress = getCurrentIpAddress();
        String requestMethod = getCurrentRequestMethod();
        String requestUrl = getCurrentRequestUrl();
        String userAgent = getCurrentUserAgent();
        
        Object result = null;
        AuditLog.OperationStatus status = AuditLog.OperationStatus.SUCCESS;
        String errorMessage = null;

        try {
            // Execute the actual method
            result = joinPoint.proceed();
            
            // Extract entity information from result if available
            if (entityId == null || entityName == null) {
                Object[] extracted = extractEntityInfoFromResult(result);
                if (entityId == null) entityId = (String) extracted[0];
                if (entityName == null) entityName = (String) extracted[1];
            }

            // Log successful operation with captured context
            auditLogService.logAuditWithContext(
                operationType,
                entityType,
                entityId,
                entityName,
                null,
                null,
                status,
                null,
                username,
                ipAddress,
                requestMethod,
                requestUrl,
                userAgent
            );

            return result;

        } catch (AccessDeniedException e) {
            status = AuditLog.OperationStatus.FORBIDDEN;
            errorMessage = "Access denied: " + e.getMessage();
            
            auditLogService.logFailedOperationWithContext(
                operationType,
                entityType,
                entityId,
                status,
                errorMessage,
                username,
                ipAddress,
                requestMethod,
                requestUrl,
                userAgent
            );
            
            throw e;

        } catch (Exception e) {
            status = AuditLog.OperationStatus.FAILURE;
            errorMessage = e.getMessage();
            
            auditLogService.logFailedOperationWithContext(
                operationType,
                entityType,
                entityId,
                status,
                errorMessage,
                username,
                ipAddress,
                requestMethod,
                requestUrl,
                userAgent
            );
            
            throw e;
        }
    }

    /**
     * Get current username from SecurityContext
     */
    private String getCurrentUsername() {
        try {
            org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getPrincipal())) {
                return authentication.getName();
            }
        } catch (Exception e) {
            log.warn("Failed to get current username: {}", e.getMessage());
        }
        return "anonymous";
    }

    /**
     * Get current IP address from request
     * Returns normalized IP address (IPv6 localhost converted to IPv4)
     */
    private String getCurrentIpAddress() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String ip = getClientIpAddress(request);
                return normalizeIpAddress(ip);
            }
        } catch (Exception e) {
            log.warn("Failed to get IP address: {}", e.getMessage());
        }
        return "SYSTEM";
    }

    /**
     * Get current request method
     */
    private String getCurrentRequestMethod() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                return attributes.getRequest().getMethod();
            }
        } catch (Exception e) {
            log.warn("Failed to get request method: {}", e.getMessage());
        }
        return "INTERNAL";
    }

    /**
     * Get current request URL
     */
    private String getCurrentRequestUrl() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                return attributes.getRequest().getRequestURI();
            }
        } catch (Exception e) {
            log.warn("Failed to get request URL: {}", e.getMessage());
        }
        return "N/A";
    }

    /**
     * Get current user agent
     */
    private String getCurrentUserAgent() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                return attributes.getRequest().getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.warn("Failed to get user agent: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Extract client IP address from request, handling proxies
     * Normalizes IPv6 localhost to IPv4 format for consistency
     */
    private String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
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
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return normalizeIpAddress(ip);
            }
        }

        return normalizeIpAddress(request.getRemoteAddr());
    }
    
    /**
     * Normalize IP address - convert IPv6 localhost to IPv4 format
     */
    private String normalizeIpAddress(String ip) {
        if (ip == null) return "UNKNOWN";
        
        // IPv6 localhost variations to IPv4
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }
        
        // IPv6 any address to IPv4
        if ("0:0:0:0:0:0:0:0".equals(ip) || "::".equals(ip)) {
            return "0.0.0.0";
        }
        
        return ip;
    }

    /**
     * Extract entity type from controller class name
     */
    private String extractEntityType(String className) {
        if (className.endsWith("Controller")) {
            className = className.substring(0, className.length() - "Controller".length());
        }
        // Convert camelCase to UPPER_CASE with underscores
        return className.replaceAll("([a-z])([A-Z])", "$1_$2").toUpperCase();
    }

    /**
     * Determine operation type from HTTP method annotation and method name
     */
    private AuditLog.OperationType determineOperationType(Method method) {
        // Check HTTP method annotations
        if (method.isAnnotationPresent(GetMapping.class)) {
            return AuditLog.OperationType.VIEW;
        } else if (method.isAnnotationPresent(PostMapping.class)) {
            return AuditLog.OperationType.CREATE;
        } else if (method.isAnnotationPresent(PutMapping.class) || method.isAnnotationPresent(PatchMapping.class)) {
            return AuditLog.OperationType.EDIT;
        } else if (method.isAnnotationPresent(DeleteMapping.class)) {
            return AuditLog.OperationType.DELETE;
        }

        // Fallback to method name analysis
        String methodName = method.getName().toLowerCase();
        if (methodName.contains("create") || methodName.contains("add")) {
            return AuditLog.OperationType.CREATE;
        } else if (methodName.contains("update") || methodName.contains("edit") || methodName.contains("modify")) {
            return AuditLog.OperationType.EDIT;
        } else if (methodName.contains("delete") || methodName.contains("remove")) {
            return AuditLog.OperationType.DELETE;
        } else if (methodName.contains("export")) {
            return AuditLog.OperationType.EXPORT;
        } else if (methodName.contains("import")) {
            return AuditLog.OperationType.IMPORT;
        }

        return AuditLog.OperationType.VIEW;
    }

    /**
     * Extract entity ID from method parameters
     * Checks for @PathVariable annotations and parameter names
     */
    private String extractEntityId(Object[] args, MethodSignature signature) {
        Method method = signature.getMethod();
        Parameter[] parameters = method.getParameters();
        String[] parameterNames = signature.getParameterNames();
        
        for (int i = 0; i < args.length && i < parameters.length; i++) {
            if (args[i] == null) continue;
            
            // Check if parameter has @PathVariable annotation
            boolean isPathVariable = false;
            for (Annotation annotation : parameters[i].getAnnotations()) {
                if (annotation instanceof PathVariable) {
                    isPathVariable = true;
                    break;
                }
            }
            
            // Extract ID if it's a String and matches our criteria
            if (args[i] instanceof String) {
                String paramName = parameterNames[i].toLowerCase();
                // Check if it's an ID parameter (name is "id" or ends with "id", or is a @PathVariable)
                if (paramName.equals("id") || paramName.endsWith("id") || isPathVariable) {
                    return (String) args[i];
                }
            }
        }
        return null;
    }

    /**
     * Extract entity name from method parameters (usually from DTO)
     */
    private String extractEntityName(Object[] args, MethodSignature signature) {
        for (Object arg : args) {
            if (arg == null) continue;
            
            // Try to get name field using reflection
            try {
                Method getNameMethod = arg.getClass().getMethod("getName");
                Object name = getNameMethod.invoke(arg);
                if (name instanceof String) {
                    return (String) name;
                }
            } catch (Exception e) {
                // Method doesn't exist or failed, try next
            }

            // Try to get username field
            try {
                Method getUsernameMethod = arg.getClass().getMethod("getUsername");
                Object username = getUsernameMethod.invoke(arg);
                if (username instanceof String) {
                    return (String) username;
                }
            } catch (Exception e) {
                // Method doesn't exist or failed, continue
            }

            // Try to get fullName field
            try {
                Method getFullNameMethod = arg.getClass().getMethod("getFullName");
                Object fullName = getFullNameMethod.invoke(arg);
                if (fullName instanceof String) {
                    return (String) fullName;
                }
            } catch (Exception e) {
                // Method doesn't exist or failed, continue
            }
        }
        return null;
    }

    /**
     * Extract entity information from method result
     */
    private Object[] extractEntityInfoFromResult(Object result) {
        String entityId = null;
        String entityName = null;

        if (result instanceof ResponseEntity) {
            Object body = ((ResponseEntity<?>) result).getBody();
            if (body != null) {
                // Try to get ID
                try {
                    Method getIdMethod = body.getClass().getMethod("getId");
                    Object id = getIdMethod.invoke(body);
                    if (id instanceof String) {
                        entityId = (String) id;
                    }
                } catch (Exception e) {
                    // Ignore
                }

                // Try to get name
                try {
                    Method getNameMethod = body.getClass().getMethod("getName");
                    Object name = getNameMethod.invoke(body);
                    if (name instanceof String) {
                        entityName = (String) name;
                    }
                } catch (Exception e) {
                    // Try username
                    try {
                        Method getUsernameMethod = body.getClass().getMethod("getUsername");
                        Object username = getUsernameMethod.invoke(body);
                        if (username instanceof String) {
                            entityName = (String) username;
                        }
                    } catch (Exception ex) {
                        // Ignore
                    }
                }
            }
        }

        return new Object[]{entityId, entityName};
    }
}

