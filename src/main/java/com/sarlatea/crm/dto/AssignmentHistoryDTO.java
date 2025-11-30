package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Assignment History with audit logs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentHistoryDTO {
    private String assignmentId;
    private String assignmentDate;
    private String activityName;
    private String employeeName;
    
    // Assignment lifecycle events
    private LocalDateTime assignedAt;
    private LocalDateTime firstEvaluatedAt;
    private LocalDateTime lastEvaluatedAt;
    private Integer evaluationCount;
    private LocalDateTime paymentLockedAt;
    
    // Current state
    private String assignmentStatus;
    private String paymentStatus;
    private Integer completionPercentage;
    private String includedInPaymentId;
    private String includedInPaymentReferenceNumber;
    private String paidInPaymentId;
    private String paidInPaymentReferenceNumber;
    
    // Audit logs
    private List<AuditLogEntry> auditLogs;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLogEntry {
        private LocalDateTime timestamp;
        private String operation; // CREATE, UPDATE, EVALUATE, DELETE, PAYMENT_ADD, PAYMENT_REMOVE, etc.
        private String username;
        private String userFullName;
        private String ipAddress;
        private String description; // Human-readable description of the change
        private String oldValue;
        private String newValue;
        private String status; // SUCCESS, FAILED
    }
}

