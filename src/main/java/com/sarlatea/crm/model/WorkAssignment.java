package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * WorkAssignment entity representing a specific work task assignment
 * Generated from WorkActivity and can be assigned to employees
 */
@Entity
@Table(name = "work_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WorkAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_activity_id", nullable = false)
    private WorkActivity workActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_employee_id")
    private Employee assignedEmployee;

    @Column(name = "assignment_date", nullable = false)
    private LocalDate assignmentDate;
    
    // Audit fields for tracking assignment and evaluation times
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
    
    @Column(name = "first_evaluated_at")
    private LocalDateTime firstEvaluatedAt;
    
    @Column(name = "last_evaluated_at")
    private LocalDateTime lastEvaluatedAt;
    
    @Column(name = "evaluation_count")
    private Integer evaluationCount = 0;
    
    // Payment tracking fields
    @Column(name = "payment_status")
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;
    
    @Column(name = "included_in_payment_id")
    private String includedInPaymentId; // Reference to Payment draft
    
    @Column(name = "paid_in_payment_id")
    private String paidInPaymentId; // Reference to final paid Payment
    
    @Column(name = "payment_locked_at")
    private LocalDateTime paymentLockedAt; // When payment was finalized (locks editing)
    
    // Soft delete flag - assignments are never hard deleted for audit purposes
    @Column(name = "deleted")
    private Boolean deleted = false;

    // Copied from WorkActivity at time of generation
    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "activity_description", length = 2000)
    private String activityDescription;

    @Column(name = "assignment_status")
    @Enumerated(EnumType.STRING)
    private AssignmentStatus assignmentStatus;

    @Column(name = "actual_duration_hours")
    private Double actualDurationHours;

    @Column(name = "completion_percentage")
    private Integer completionPercentage;

    @Column(name = "actual_value")
    private Double actualValue;

    @Column(name = "completion_notes", length = 1000)
    private String completionNotes;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    public enum AssignmentStatus {
        ASSIGNED,    // Initial status when assignment is created
        COMPLETED    // Status after evaluation, regardless of completion percentage
    }

    public enum PaymentStatus {
        UNPAID,           // No payment drafted yet - EDITABLE
        DRAFT,            // Included in payment draft - EDITABLE (can re-evaluate)
        PENDING_PAYMENT,  // Payment request submitted (PENDING_APPROVAL) - LOCKED
        APPROVED,         // Payment approved - LOCKED
        PAID,             // Payment completed - LOCKED
        CANCELLED         // Payment cancelled - EDITABLE (unlocked for correction)
    }

    /**
     * Check if assignment can be edited (change activity, delete)
     * Assignments are editable only when:
     * - Has NOT been evaluated (evaluationCount is 0 or null) - prevents changing activity after evaluation
     * - Status is UNPAID, DRAFT, or CANCELLED
     * - NOT in PENDING_PAYMENT, APPROVED, or PAID status
     * 
     * Once ANY evaluation is done, the assignment becomes locked for editing/deletion
     * to maintain data integrity and audit trail.
     */
    public boolean isEditable() {
        // Rule 1: Cannot edit if already evaluated (evaluation count > 0)
        if (evaluationCount != null && evaluationCount > 0) {
            return false;
        }
        
        // Rule 2: Assignments are only editable if:
        // - Not in any payment (UNPAID or null)
        // - In a draft payment (DRAFT) - allows re-evaluation before submission
        // - In a cancelled payment (CANCELLED)
        // Assignments become locked when payment is submitted (PENDING_PAYMENT, APPROVED, PAID)
        return paymentStatus == PaymentStatus.UNPAID 
            || paymentStatus == PaymentStatus.DRAFT
            || paymentStatus == PaymentStatus.CANCELLED
            || paymentStatus == null; // Default state
    }

    /**
     * Check if assignment can be re-evaluated (update completion percentage)
     * Re-evaluation is allowed even after first evaluation, as long as:
     * - Assignment is not in a locked payment status (PENDING_PAYMENT, APPROVED, PAID)
     * - Assignment is UNPAID, DRAFT, or CANCELLED
     */
    public boolean isReEvaluatable() {
        // Can re-evaluate as long as payment status allows it
        // Unlike isEditable(), evaluation count doesn't matter
        return paymentStatus == PaymentStatus.UNPAID 
            || paymentStatus == PaymentStatus.DRAFT
            || paymentStatus == PaymentStatus.CANCELLED
            || paymentStatus == null; // Default state
    }

    /**
     * Lock assignment when payment request is submitted (moved to PENDING_APPROVAL)
     * This prevents changes to assignments and salaries after submission
     */
    public void lockForPaymentRequest(String paymentId) {
        this.paymentStatus = PaymentStatus.PENDING_PAYMENT;
        this.includedInPaymentId = paymentId;
        this.paymentLockedAt = LocalDateTime.now();
    }

    /**
     * Lock assignment when payment is completed
     */
    public void lockForPayment(String paymentId) {
        this.paymentStatus = PaymentStatus.PAID;
        this.paidInPaymentId = paymentId;
        this.paymentLockedAt = LocalDateTime.now();
    }

    /**
     * Unlock assignment when payment is cancelled
     * This allows corrections to be made and new payment request to be created
     */
    public void unlockFromCancelledPayment() {
        this.paymentStatus = PaymentStatus.CANCELLED;
        this.paymentLockedAt = null;
        // Keep includedInPaymentId and paidInPaymentId for audit trail
    }

    /**
     * Include in payment draft (assignment still editable)
     */
    public void includeInPaymentDraft(String paymentId) {
        this.paymentStatus = PaymentStatus.DRAFT;
        this.includedInPaymentId = paymentId;
    }

    /**
     * Helper method to copy details from WorkActivity
     */
    public void copyFromWorkActivity(WorkActivity workActivity) {
        this.workActivity = workActivity;
        this.activityName = workActivity.getName();
        this.activityDescription = workActivity.getDescription();
        this.assignmentStatus = AssignmentStatus.ASSIGNED;
        this.completionPercentage = 0; // Default to 0% completion
    }
}

