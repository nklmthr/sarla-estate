package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * EmployeeSalary entity representing salary history for employees
 * Maintains version history - when updated, previous record gets end_date and new record is created
 * 
 * Salary Structure:
 * - amount: Base salary (the primary salary amount)
 * - Employee PF: Mandatory 12% + Optional voluntary contribution (calculated on full base salary)
 * - Employer PF: Fixed 12% (does not change with voluntary contributions, calculated on full base salary)
 * - Total Salary: Base + Employer PF contribution
 */
@Entity
@Table(name = "employee_salaries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmployeeSalary extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /**
     * Base salary amount (before PF contributions)
     */
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "reason_for_change", length = 500)
    private String reasonForChange;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "notes", length = 1000)
    private String notes;

    /**
     * Voluntary PF contribution percentage beyond the mandatory 12%
     * Example: If employee wants to contribute 15% total, set this to 3.00
     * Default: 0 (only mandatory 12%)
     */
    @Column(name = "voluntary_pf_percentage", precision = 5, scale = 2)
    private BigDecimal voluntaryPfPercentage = BigDecimal.ZERO;

    /**
     * Check if this salary record is currently active (no end date)
     */
    public boolean isCurrentlyActive() {
        return endDate == null && Boolean.TRUE.equals(isActive);
    }

    /**
     * Close this salary record by setting end date
     */
    public void closeWithEndDate(LocalDate endDate) {
        this.endDate = endDate;
        this.isActive = false;
    }

    @PrePersist
    protected void onCreateSalary() {
        if (isActive == null) {
            isActive = (endDate == null);
        }
        if (currency == null) {
            currency = "INR"; // Default currency for Indian Rupee
        }
        if (voluntaryPfPercentage == null) {
            voluntaryPfPercentage = BigDecimal.ZERO;
        }
    }

    /**
     * Calculate employee PF contribution (mandatory + voluntary)
     * @param mandatoryPfPercentage Mandatory PF percentage (default 12%)
     */
    public BigDecimal calculateEmployeePfContribution(BigDecimal mandatoryPfPercentage) {
        BigDecimal totalPfPercentage = mandatoryPfPercentage.add(voluntaryPfPercentage);
        return amount.multiply(totalPfPercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate employer PF contribution (always fixed, not affected by voluntary contributions)
     * @param employerPfPercentage Employer PF percentage (default 12%)
     */
    public BigDecimal calculateEmployerPfContribution(BigDecimal employerPfPercentage) {
        return amount.multiply(employerPfPercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate total salary cost to employer (base salary + employer PF contribution)
     * @param employerPfPercentage Employer PF percentage
     */
    public BigDecimal calculateTotalSalaryCost(BigDecimal employerPfPercentage) {
        return amount.add(calculateEmployerPfContribution(employerPfPercentage));
    }

    /**
     * Calculate employee's take-home salary (base salary - employee PF contribution)
     * @param mandatoryPfPercentage Mandatory PF percentage
     */
    public BigDecimal calculateTakeHomeSalary(BigDecimal mandatoryPfPercentage) {
        return amount.subtract(calculateEmployeePfContribution(mandatoryPfPercentage));
    }
}

