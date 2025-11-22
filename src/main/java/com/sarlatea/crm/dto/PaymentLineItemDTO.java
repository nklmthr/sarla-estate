package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentLineItemDTO {
    private String id;
    private String paymentId;
    private String assignmentId;
    private String employeeId;
    private String employeeName;
    private String workActivityId;
    private String workActivityName;
    
    // Calculated amounts
    private LocalDate assignmentDate;
    private BigDecimal quantity;
    private BigDecimal rate;
    private BigDecimal amount;
    private BigDecimal employeePf;  // Employee PF deduction (12%)
    private BigDecimal voluntaryPf; // Voluntary PF deduction
    private BigDecimal employerPf;  // Employer PF contribution (12%, not deducted)
    private BigDecimal pfAmount;    // Total deduction (Employee + Voluntary)
    private BigDecimal otherDeductions;
    private BigDecimal netAmount;
    private String remarks;
    
    // Snapshot data (captured at submission)
    private String snapshotEmployeeName;
    private String snapshotEmployeePhone;
    private String snapshotPfAccountId;
    private BigDecimal snapshotBasicSalary;
    private BigDecimal snapshotDaPercentage;
    private BigDecimal snapshotEmployeePfPercentage;
    private BigDecimal snapshotVoluntaryPfAmount;
    private String snapshotActivityName;
    private String snapshotActivityDescription;
    private String snapshotCriteriaType;
    private BigDecimal snapshotUnitRate;
    private String snapshotUnitOfMeasure;
    private BigDecimal snapshotSalaryPercentage;
    private Double snapshotActualDurationHours;
    private Integer snapshotCompletionPercentage;
    private Double snapshotActualValue;
    private LocalDate snapshotCompletedDate;
    private String snapshotEvaluationNotes;
    
    // Actual assignment data (for DRAFT status before snapshot is captured)
    private Integer completionPercentage; // From assignment.getCompletionPercentage()
}

