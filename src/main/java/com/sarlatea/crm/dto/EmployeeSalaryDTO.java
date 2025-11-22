package com.sarlatea.crm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for EmployeeSalary entity
 * Includes calculated PF fields based on configuration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSalaryDTO {
    private String id;
    private String employeeId;
    private String employeeName;
    
    // Base salary amount
    private BigDecimal amount;
    
    // Salary type: DAILY, WEEKLY, or MONTHLY
    private String salaryType; // Will be "DAILY", "WEEKLY", or "MONTHLY"
    
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reasonForChange;
    private Boolean isActive;
    private String notes;
    
    // Voluntary PF contribution percentage (beyond mandatory 12%)
    private BigDecimal voluntaryPfPercentage;
    
    // Calculated fields (read-only)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal baseSalary; // Same as amount, for clarity
    
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal employeePfContribution; // Mandatory + Voluntary
    
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal employerPfContribution; // Fixed 12%
    
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal totalSalaryCost; // Base + Employer PF
    
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal takeHomeSalary; // Base - Employee PF
}

