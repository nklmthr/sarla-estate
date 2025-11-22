package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    private ChangeType changeType;

    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;

    @Column(name = "previous_amount", precision = 10, scale = 2)
    private BigDecimal previousAmount;

    @Column(name = "new_amount", precision = 10, scale = 2)
    private BigDecimal newAmount;

    @Column(name = "previous_status")
    @Enumerated(EnumType.STRING)
    private Payment.PaymentStatus previousStatus;

    @Column(name = "new_status")
    @Enumerated(EnumType.STRING)
    private Payment.PaymentStatus newStatus;

    @Column(name = "changed_by")
    private String changedBy;

    @CreationTimestamp
    @Column(name = "changed_at", updatable = false)
    private LocalDateTime changedAt;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    public enum ChangeType {
        CREATED,           // Payment draft created
        REEVALUATED,       // Payment recalculated due to assignment changes
        LINE_ITEM_ADDED,   // New line item added
        LINE_ITEM_REMOVED, // Line item removed
        LINE_ITEM_UPDATED, // Line item quantity/rate changed
        SUBMITTED,         // Submitted for approval
        APPROVED,          // Payment approved
        PAID,              // Payment marked as paid
        CANCELLED,         // Payment cancelled
        DOCUMENT_ADDED,    // Document uploaded
        DOCUMENT_REMOVED,  // Document removed
        REMARKS_UPDATED    // Remarks updated
    }
}

