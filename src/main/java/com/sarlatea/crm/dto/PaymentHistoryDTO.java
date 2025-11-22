package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.Payment;
import com.sarlatea.crm.model.PaymentHistory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryDTO {
    private String id;
    private String paymentId;
    private PaymentHistory.ChangeType changeType;
    private String changeDescription;
    private BigDecimal previousAmount;
    private BigDecimal newAmount;
    private Payment.PaymentStatus previousStatus;
    private Payment.PaymentStatus newStatus;
    private String changedBy;
    private LocalDateTime changedAt;
    private String remarks;
}

