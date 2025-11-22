package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentDraftRequest {
    private Integer paymentMonth;
    private Integer paymentYear;
    private List<String> assignmentIds; // Optional: specific assignments to include
    private String remarks;
}

