package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for WorkAssignment entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkAssignmentDTO {
    private String id;
    private String workActivityId;
    private String assignedEmployeeId;
    private String assignedEmployeeName;
    
    private LocalDate assignmentDate;
    
    // Copied activity details
    private String activityName;
    private String activityDescription;
    
    // Assignment details
    private WorkAssignment.AssignmentStatus assignmentStatus;
    private Double actualDurationHours;
    private Integer completionPercentage;
    private Double actualValue;
    private String completionNotes;
    private LocalDate completedDate;
    
    // Audit fields for tracking assignment and evaluation times
    private LocalDateTime assignedAt;
    private LocalDateTime firstEvaluatedAt;
    private LocalDateTime lastEvaluatedAt;
    private Integer evaluationCount;
    
    // Payment tracking
    private WorkAssignment.PaymentStatus paymentStatus;
    private String includedInPaymentId;
    private String includedInPaymentReferenceNumber; // Payment reference for display
    private String paidInPaymentId;
    private String paidInPaymentReferenceNumber; // Payment reference for display
    private LocalDateTime paymentLockedAt;
    private Boolean isEditable; // Computed field - can edit activity or delete
    private Boolean isReEvaluatable; // Computed field - can update completion percentage
}

