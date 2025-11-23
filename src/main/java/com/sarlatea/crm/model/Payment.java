package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_title")
    private String paymentTitle; // User-defined payment name/title

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.DRAFT;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "payment_month")
    private Integer paymentMonth; // 1-12

    @Column(name = "payment_year")
    private Integer paymentYear;

    @Column(name = "reference_number")
    private String referenceNumber; // Transaction/Challan reference

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "paid_by")
    private String paidBy;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "cancelled_by")
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by")
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentLineItem> lineItems = new ArrayList<>();

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentHistory> history = new ArrayList<>();

    public enum PaymentStatus {
        DRAFT,              // Payment draft created, can be edited, assignments can be re-evaluated
        PENDING_APPROVAL,   // Submitted for approval - ASSIGNMENTS LOCKED, data snapshot taken
        APPROVED,           // Approved, ready for payment - assignments remain locked
        PAID,               // Payment completed - assignments remain locked
        CANCELLED           // Payment cancelled - assignments unlocked for correction
    }

    // Helper methods
    public void addLineItem(PaymentLineItem lineItem) {
        lineItems.add(lineItem);
        lineItem.setPayment(this);
    }

    public void removeLineItem(PaymentLineItem lineItem) {
        lineItems.remove(lineItem);
        lineItem.setPayment(null);
    }

    public void addDocument(PaymentDocument document) {
        documents.add(document);
        document.setPayment(this);
    }

    public void addHistory(PaymentHistory historyEntry) {
        history.add(historyEntry);
        historyEntry.setPayment(this);
    }

    public void recalculateTotalAmount() {
        this.totalAmount = lineItems.stream()
                .map(PaymentLineItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

