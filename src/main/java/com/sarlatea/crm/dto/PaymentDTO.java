package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private String id;
    private LocalDate paymentDate;
    private Payment.PaymentStatus status;
    private BigDecimal totalAmount;
    private Integer paymentMonth;
    private Integer paymentYear;
    private String referenceNumber;
    private String remarks;
    
    // Workflow tracking
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String paidBy;
    private LocalDateTime paidAt;
    private String submittedBy;
    private LocalDateTime submittedAt;
    private String cancelledBy;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    
    // Audit fields
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    
    // Related data
    private List<PaymentLineItemDTO> lineItems;
    private List<PaymentDocumentDTO> documents;
    private Integer lineItemCount;
    private Integer documentCount;
}

