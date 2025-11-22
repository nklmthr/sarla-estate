package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PfReportDTO {
    private Integer month;
    private Integer year;
    private String monthName;
    private List<EmployeePfSummary> employees = new ArrayList<>();
    private PfReportTotals totals;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePfSummary {
        private String employeeId;
        private String employeeName;
        private String employeeCode;
        private String pfAccountId;
        private String phoneNumber;
        private List<PaymentDetail> payments = new ArrayList<>();
        private EmployeePfTotals totals;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDetail {
        private String paymentId;
        private String paymentDate;
        private String referenceNumber;
        private BigDecimal grossAmount;      // Total amount before deductions
        private BigDecimal employeePf;       // 12% employee contribution
        private BigDecimal voluntaryPf;      // Voluntary PF
        private BigDecimal employerPf;       // 12% employer contribution
        private BigDecimal totalPf;          // Employee PF + Voluntary PF
        private BigDecimal netAmount;        // Amount paid to employee
        private int assignmentCount;         // Number of assignments in this payment
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePfTotals {
        private int totalPayments;
        private int totalAssignments;
        private BigDecimal totalGrossAmount;
        private BigDecimal totalEmployeePf;
        private BigDecimal totalVoluntaryPf;
        private BigDecimal totalEmployerPf;
        private BigDecimal totalPfDeduction;   // Employee PF + Voluntary PF
        private BigDecimal totalNetAmount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PfReportTotals {
        private int totalEmployees;
        private int totalPayments;
        private int totalAssignments;
        private BigDecimal totalGrossAmount;
        private BigDecimal totalEmployeePf;
        private BigDecimal totalVoluntaryPf;
        private BigDecimal totalEmployerPf;
        private BigDecimal totalPfDeduction;
        private BigDecimal totalNetAmount;
    }
}

