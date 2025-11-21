package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AuditLog entity for tracking all entity operations
 * Records user actions, IP addresses, timestamps, and operation details
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_username", columnList = "username"),
    @Index(name = "idx_audit_entity_type", columnList = "entity_type"),
    @Index(name = "idx_audit_operation", columnList = "operation"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_ip_address", columnList = "ip_address")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @Column(name = "id", updatable = false, nullable = false, length = 36)
    private String id;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "user_full_name", length = 200)
    private String userFullName;

    @Column(name = "ip_address", nullable = true, length = 45)
    private String ipAddress;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "operation", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private OperationType operation;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", length = 36)
    private String entityId;

    @Column(name = "entity_name", length = 500)
    private String entityName;

    @Column(name = "request_method", length = 10)
    private String requestMethod;

    @Column(name = "request_url", length = 1000)
    private String requestUrl;

    @Lob
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Lob
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "status", length = 20)
    @Enumerated(EnumType.STRING)
    private OperationStatus status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    // Geolocation fields
    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "country_code", length = 10)
    private String countryCode;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "region_name", length = 100)
    private String regionName;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "zip", length = 20)
    private String zip;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "isp", length = 200)
    private String isp;

    @Column(name = "organization", length = 200)
    private String organization;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }

    public enum OperationType {
        VIEW,
        CREATE,
        EDIT,
        DELETE,
        LOGIN,
        LOGOUT,
        EXPORT,
        IMPORT
    }

    public enum OperationStatus {
        SUCCESS,
        FAILURE,
        UNAUTHORIZED,
        FORBIDDEN
    }
}

