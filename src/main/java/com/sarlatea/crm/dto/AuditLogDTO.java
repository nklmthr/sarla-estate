package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for AuditLog entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {

    private String id;
    private String username;
    private String userFullName;
    private String ipAddress;
    private LocalDateTime timestamp;
    private AuditLog.OperationType operation;
    private String entityType;
    private String entityId;
    private String entityName;
    private String requestMethod;
    private String requestUrl;
    private String oldValue;
    private String newValue;
    private AuditLog.OperationStatus status;
    private String errorMessage;
    private String userAgent;
    
    // Geolocation fields
    private String country;
    private String countryCode;
    private String region;
    private String regionName;
    private String city;
    private String zip;
    private Double latitude;
    private Double longitude;
    private String timezone;
    private String isp;
    private String organization;
}

