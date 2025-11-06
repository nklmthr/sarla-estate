package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * EmployeeSalary entity representing salary history for employees
 * Maintains version history - when updated, previous record gets end_date and new record is created
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

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "salary_type")
    @Enumerated(EnumType.STRING)
    private SalaryType salaryType;

    @Column(name = "payment_frequency")
    @Enumerated(EnumType.STRING)
    private PaymentFrequency paymentFrequency;

    @Column(name = "reason_for_change", length = 500)
    private String reasonForChange;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "notes", length = 1000)
    private String notes;

    public enum SalaryType {
        BASE_SALARY,
        HOURLY_WAGE,
        DAILY_WAGE,
        CONTRACT,
        PIECE_RATE
    }

    public enum PaymentFrequency {
        MONTHLY,
        BIWEEKLY,
        WEEKLY,
        DAILY,
        HOURLY
    }

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
    }
}

