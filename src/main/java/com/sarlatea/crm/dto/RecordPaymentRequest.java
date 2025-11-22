package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordPaymentRequest {
    private LocalDate paymentDate;
    private String referenceNumber;
    private String remarks;
}

