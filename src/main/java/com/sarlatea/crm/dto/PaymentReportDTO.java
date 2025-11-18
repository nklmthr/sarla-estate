package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for Payment Report based on work completion
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReportDTO {
    private LocalDate reportGeneratedDate;
    private LocalDate periodStartDate;
    private LocalDate periodEndDate;
    private Integer totalEmployees;
    private BigDecimal totalPaymentAmount;
    private String currency;
    private List<EmployeePaymentSummary> employeePayments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePaymentSummary {
        private String employeeId;
        private String employeeName;
        private BigDecimal baseSalary;
        private String currency;
        private Integer totalAssignments;
        private Integer completedAssignments;
        private Double totalEstimatedHours;
        private Double totalActualHours;
        private Integer averageCompletionPercentage;
        private BigDecimal calculatedPayment;
        private String paymentNotes;
        private List<AssignmentDetail> assignments;
        
        // PF (Provident Fund) fields
        private BigDecimal voluntaryPfPercentage; // Voluntary PF beyond mandatory 12%
        private BigDecimal employeePfContribution; // Total employee PF deduction
        private BigDecimal employerPfContribution; // Employer's PF contribution
        private BigDecimal takeHomeSalary; // Gross salary after PF deduction
        private BigDecimal totalCostToEmployer; // Base + Employer PF
        private BigDecimal netPayment; // Actual payment after PF deductions (calculatedPayment - employeePfContribution)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentDetail {
        private String assignmentId;
        private String activityName;
        private LocalDate assignmentDate;
        private Double estimatedHours;
        private Double actualHours;
        private Integer completionPercentage;
        private BigDecimal contributionToPayment;
    }
}

