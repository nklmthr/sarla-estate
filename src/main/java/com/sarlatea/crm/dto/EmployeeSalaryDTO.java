package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.EmployeeSalary;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for EmployeeSalary entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSalaryDTO {
    private String id;
    private String employeeId;
    private String employeeName;
    private BigDecimal amount;
    private String currency;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reasonForChange;
    private Boolean isActive;
    private String notes;
}

