package com.sarlatea.crm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sarlatea.crm.dto.AuditLogDTO;
import com.sarlatea.crm.dto.IPGeolocationDTO;
import com.sarlatea.crm.model.AuditLog;
import com.sarlatea.crm.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing audit logs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final IPGeolocationService ipGeolocationService;

    /**
     * Log an audit entry asynchronously
     * Uses separate transaction to ensure audit log is saved even if main transaction fails
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(
            AuditLog.OperationType operation,
            String entityType,
            String entityId,
            String entityName,
            Object oldValue,
            Object newValue,
            AuditLog.OperationStatus status,
            String errorMessage
    ) {
        try {
            AuditLog auditLog = new AuditLog();
            
            // Get user info from SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                auditLog.setUsername(authentication.getName());
                // Try to get full name if available
                if (authentication.getDetails() instanceof String) {
                    auditLog.setUserFullName((String) authentication.getDetails());
                }
            } else {
                auditLog.setUsername("anonymous");
            }

            // Get request info
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String ipAddress = getClientIpAddress(request);
                auditLog.setIpAddress(ipAddress);
                auditLog.setRequestMethod(request.getMethod());
                auditLog.setRequestUrl(request.getRequestURI());
                auditLog.setUserAgent(request.getHeader("User-Agent"));
                
                // Get IP geolocation information
                enrichWithGeolocation(auditLog, ipAddress);
            } else {
                // No request context (e.g., background tasks, startup)
                auditLog.setIpAddress("SYSTEM");
                auditLog.setRequestMethod("INTERNAL");
                auditLog.setRequestUrl("N/A");
            }

            auditLog.setOperation(operation);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setEntityName(entityName);
            auditLog.setStatus(status);
            auditLog.setErrorMessage(errorMessage);
            auditLog.setTimestamp(LocalDateTime.now());

            // Convert old and new values to JSON
            if (oldValue != null) {
                auditLog.setOldValue(convertToJson(oldValue));
            }
            if (newValue != null) {
                auditLog.setNewValue(convertToJson(newValue));
            }

            auditLogRepository.save(auditLog);
            log.debug("Audit log created: {} {} by {}", operation, entityType, auditLog.getUsername());
            
        } catch (Exception e) {
            // Log error but don't throw exception - we don't want audit logging to break application flow
            log.error("Failed to create audit log: {}", e.getMessage(), e);
        }
    }

    /**
     * Simplified log method for quick logging
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAudit(
            AuditLog.OperationType operation,
            String entityType,
            String entityId,
            String entityName
    ) {
        logAudit(operation, entityType, entityId, entityName, null, null, AuditLog.OperationStatus.SUCCESS, null);
    }

    /**
     * Log audit with old and new values for edit operations
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditWithChanges(
            AuditLog.OperationType operation,
            String entityType,
            String entityId,
            String entityName,
            Object oldValue,
            Object newValue
    ) {
        logAudit(operation, entityType, entityId, entityName, oldValue, newValue, AuditLog.OperationStatus.SUCCESS, null);
    }

    /**
     * Log failed operation
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailedOperation(
            AuditLog.OperationType operation,
            String entityType,
            String entityId,
            AuditLog.OperationStatus status,
            String errorMessage
    ) {
        logAudit(operation, entityType, entityId, null, null, null, status, errorMessage);
    }

    /**
     * Log audit with pre-captured context (for use from AOP aspects)
     * This method receives username and request info that were captured synchronously
     * before the async call, ensuring they're not lost in the async thread
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditWithContext(
            AuditLog.OperationType operation,
            String entityType,
            String entityId,
            String entityName,
            Object oldValue,
            Object newValue,
            AuditLog.OperationStatus status,
            String errorMessage,
            String username,
            String ipAddress,
            String requestMethod,
            String requestUrl,
            String userAgent
    ) {
        try {
            AuditLog auditLog = new AuditLog();
            
            // Use pre-captured username
            auditLog.setUsername(username != null ? username : "anonymous");
            
            // Use pre-captured request info
            auditLog.setIpAddress(ipAddress != null ? ipAddress : "SYSTEM");
            auditLog.setRequestMethod(requestMethod != null ? requestMethod : "INTERNAL");
            auditLog.setRequestUrl(requestUrl != null ? requestUrl : "N/A");
            auditLog.setUserAgent(userAgent);
            
            // Get IP geolocation information
            if (ipAddress != null && !"SYSTEM".equals(ipAddress)) {
                enrichWithGeolocation(auditLog, ipAddress);
            }

            auditLog.setOperation(operation);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setEntityName(entityName);
            auditLog.setStatus(status);
            auditLog.setErrorMessage(errorMessage);
            auditLog.setTimestamp(LocalDateTime.now());

            // Convert old and new values to JSON
            if (oldValue != null) {
                auditLog.setOldValue(convertToJson(oldValue));
            }
            if (newValue != null) {
                auditLog.setNewValue(convertToJson(newValue));
            }

            auditLogRepository.save(auditLog);
            log.debug("Audit log created: {} {} by {}", operation, entityType, auditLog.getUsername());
            
        } catch (Exception e) {
            // Log error but don't throw exception - we don't want audit logging to break application flow
            log.error("Failed to create audit log: {}", e.getMessage(), e);
        }
    }

    /**
     * Log failed operation with pre-captured context
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailedOperationWithContext(
            AuditLog.OperationType operation,
            String entityType,
            String entityId,
            AuditLog.OperationStatus status,
            String errorMessage,
            String username,
            String ipAddress,
            String requestMethod,
            String requestUrl,
            String userAgent
    ) {
        logAuditWithContext(operation, entityType, entityId, null, null, null, status, errorMessage,
                           username, ipAddress, requestMethod, requestUrl, userAgent);
    }

    /**
     * Get audit logs with filtering and pagination
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getAuditLogs(
            String username,
            String entityType,
            AuditLog.OperationType operation,
            String ipAddress,
            LocalDateTime startDate,
            LocalDateTime endDate,
            AuditLog.OperationStatus status,
            Pageable pageable
    ) {
        Page<AuditLog> auditLogs = auditLogRepository.findByCriteria(
                username, entityType, operation, ipAddress, startDate, endDate, status, pageable
        );
        return auditLogs.map(this::convertToDTO);
    }

    /**
     * Get audit logs for specific entity
     */
    @Transactional(readOnly = true)
    public List<AuditLogDTO> getEntityHistory(String entityId) {
        List<AuditLog> auditLogs = auditLogRepository.findByEntityIdOrderByTimestampDesc(entityId);
        return auditLogs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent activity
     */
    @Transactional(readOnly = true)
    public List<AuditLogDTO> getRecentActivity() {
        List<AuditLog> auditLogs = auditLogRepository.findTop10ByOrderByTimestampDesc();
        return auditLogs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get failed operations
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getFailedOperations(Pageable pageable) {
        Page<AuditLog> auditLogs = auditLogRepository.findByStatus(AuditLog.OperationStatus.FAILURE, pageable);
        return auditLogs.map(this::convertToDTO);
    }

    /**
     * Get user activity count within time range
     */
    @Transactional(readOnly = true)
    public long getUserActivityCount(String username, LocalDateTime startDate) {
        return auditLogRepository.countByUsernameAndTimestampAfter(username, startDate);
    }

    /**
     * Extract client IP address from request, handling proxies
     * Normalizes IPv6 localhost to IPv4 format
     */
    private String getClientIpAddress(HttpServletRequest request) {
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
                // X-Forwarded-For can contain multiple IPs, take the first one
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
     * Convert object to JSON string
     */
    private String convertToJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            log.warn("Failed to convert object to JSON: {}", e.getMessage());
            return object.toString();
        }
    }

    /**
     * Enrich audit log with IP geolocation information
     */
    private void enrichWithGeolocation(AuditLog auditLog, String ipAddress) {
        try {
            IPGeolocationDTO geolocation = ipGeolocationService.getGeolocation(ipAddress);
            if (geolocation != null && geolocation.isSuccess()) {
                auditLog.setCountry(geolocation.getCountry());
                auditLog.setCountryCode(geolocation.getCountryCode());
                auditLog.setRegion(geolocation.getRegion());
                auditLog.setRegionName(geolocation.getRegionName());
                auditLog.setCity(geolocation.getCity());
                auditLog.setZip(geolocation.getZip());
                auditLog.setLatitude(geolocation.getLatitude());
                auditLog.setLongitude(geolocation.getLongitude());
                auditLog.setTimezone(geolocation.getTimezone());
                auditLog.setIsp(geolocation.getIsp());
                auditLog.setOrganization(geolocation.getOrganization());
            }
        } catch (Exception e) {
            // Don't fail audit logging if geolocation fails
            log.warn("Failed to get geolocation for IP {}: {}", ipAddress, e.getMessage());
        }
    }

    /**
     * Convert AuditLog entity to DTO
     */
    private AuditLogDTO convertToDTO(AuditLog auditLog) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(auditLog.getId());
        dto.setUsername(auditLog.getUsername());
        dto.setUserFullName(auditLog.getUserFullName());
        dto.setIpAddress(auditLog.getIpAddress());
        dto.setTimestamp(auditLog.getTimestamp());
        dto.setOperation(auditLog.getOperation());
        dto.setEntityType(auditLog.getEntityType());
        dto.setEntityId(auditLog.getEntityId());
        dto.setEntityName(auditLog.getEntityName());
        dto.setRequestMethod(auditLog.getRequestMethod());
        dto.setRequestUrl(auditLog.getRequestUrl());
        dto.setOldValue(auditLog.getOldValue());
        dto.setNewValue(auditLog.getNewValue());
        dto.setStatus(auditLog.getStatus());
        dto.setErrorMessage(auditLog.getErrorMessage());
        dto.setUserAgent(auditLog.getUserAgent());
        
        // Geolocation fields
        dto.setCountry(auditLog.getCountry());
        dto.setCountryCode(auditLog.getCountryCode());
        dto.setRegion(auditLog.getRegion());
        dto.setRegionName(auditLog.getRegionName());
        dto.setCity(auditLog.getCity());
        dto.setZip(auditLog.getZip());
        dto.setLatitude(auditLog.getLatitude());
        dto.setLongitude(auditLog.getLongitude());
        dto.setTimezone(auditLog.getTimezone());
        dto.setIsp(auditLog.getIsp());
        dto.setOrganization(auditLog.getOrganization());
        
        return dto;
    }
}

