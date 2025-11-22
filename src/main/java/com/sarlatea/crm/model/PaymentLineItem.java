package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "payment_line_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private WorkAssignment assignment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "work_activity_id", nullable = false)
    private WorkActivity workActivity;

    // ========== Snapshot Data (captured at payment request submission) ==========
    // These fields preserve the state of data when payment request was raised
    
    // Employee snapshot
    @Column(name = "snapshot_employee_name")
    private String snapshotEmployeeName;
    
    @Column(name = "snapshot_employee_phone")
    private String snapshotEmployeePhone;
    
    @Column(name = "snapshot_pf_account_id")
    private String snapshotPfAccountId;

    // Salary snapshot
    @Column(name = "snapshot_basic_salary", precision = 10, scale = 2)
    private java.math.BigDecimal snapshotBasicSalary;
    
    @Column(name = "snapshot_da_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal snapshotDaPercentage;
    
    @Column(name = "snapshot_employee_pf_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal snapshotEmployeePfPercentage;
    
    @Column(name = "snapshot_voluntary_pf_amount", precision = 10, scale = 2)
    private java.math.BigDecimal snapshotVoluntaryPfAmount;

    // Activity snapshot
    @Column(name = "snapshot_activity_name")
    private String snapshotActivityName;
    
    @Column(name = "snapshot_activity_description", columnDefinition = "TEXT")
    private String snapshotActivityDescription;

    // Completion criteria snapshot
    @Column(name = "snapshot_criteria_type")
    private String snapshotCriteriaType; // UNIT_BASED or SALARY_PERCENTAGE
    
    @Column(name = "snapshot_unit_rate", precision = 10, scale = 2)
    private java.math.BigDecimal snapshotUnitRate;
    
    @Column(name = "snapshot_unit_of_measure")
    private String snapshotUnitOfMeasure;
    
    @Column(name = "snapshot_salary_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal snapshotSalaryPercentage;

    // Evaluation snapshot
    @Column(name = "snapshot_actual_duration_hours")
    private Double snapshotActualDurationHours;
    
    @Column(name = "snapshot_completion_percentage")
    private Integer snapshotCompletionPercentage;
    
    @Column(name = "snapshot_actual_value")
    private Double snapshotActualValue;
    
    @Column(name = "snapshot_completed_date")
    private java.time.LocalDate snapshotCompletedDate;
    
    @Column(name = "snapshot_evaluation_notes", columnDefinition = "TEXT")
    private String snapshotEvaluationNotes;

    // ========== Calculated Payment Fields ==========

    @Column(name = "assignment_date")
    private java.time.LocalDate assignmentDate; // Date of the work assignment

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal rate;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "employee_pf", precision = 10, scale = 2)
    private BigDecimal employeePf = BigDecimal.ZERO; // Mandatory 12%

    @Column(name = "voluntary_pf", precision = 10, scale = 2)
    private BigDecimal voluntaryPf = BigDecimal.ZERO; // Voluntary %

    @Column(name = "employer_pf", precision = 10, scale = 2)
    private BigDecimal employerPf = BigDecimal.ZERO; // Employer contribution 12%

    @Column(name = "pf_amount", precision = 10, scale = 2)
    private BigDecimal pfAmount = BigDecimal.ZERO; // Total deduction (Employee + Voluntary)

    @Column(name = "other_deductions", precision = 10, scale = 2)
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "net_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal netAmount;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    // Helper method to calculate net amount
    public void calculateNetAmount() {
        this.netAmount = this.amount
                .subtract(this.pfAmount != null ? this.pfAmount : BigDecimal.ZERO)
                .subtract(this.otherDeductions != null ? this.otherDeductions : BigDecimal.ZERO);
    }

    // Helper method to calculate amount from quantity and rate
    public void calculateAmount() {
        this.amount = this.quantity.multiply(this.rate);
        calculateNetAmount();
    }

    /**
     * Capture snapshot of all related data when payment request is submitted
     * This preserves the state of employee, salary, activity, criteria, and evaluation
     * at the exact moment the payment request was raised
     */
    public void captureSnapshot() {
        // Capture employee snapshot
        if (employee != null) {
            this.snapshotEmployeeName = employee.getName();
            this.snapshotEmployeePhone = employee.getPhone();
            this.snapshotPfAccountId = employee.getPfAccountId();
        }

        // Capture salary snapshot (from active EmployeeSalary)
        // Note: This will be called from service layer with the active salary
        
        // Capture activity snapshot
        if (workActivity != null) {
            this.snapshotActivityName = workActivity.getName();
            this.snapshotActivityDescription = workActivity.getDescription();
        }

        // Capture completion criteria snapshot
        // Note: This will be populated from service layer with active criteria
        
        // Capture evaluation snapshot from assignment
        if (assignment != null) {
            this.snapshotActualDurationHours = assignment.getActualDurationHours();
            this.snapshotCompletionPercentage = assignment.getCompletionPercentage();
            this.snapshotActualValue = assignment.getActualValue();
            this.snapshotCompletedDate = assignment.getCompletedDate();
            this.snapshotEvaluationNotes = assignment.getCompletionNotes();
        }
    }

    /**
     * Capture salary snapshot data
     * Called from service layer with active salary record
     */
    public void captureSalarySnapshot(java.math.BigDecimal basicSalary, 
                                     java.math.BigDecimal daPercentage,
                                     java.math.BigDecimal employeePfPercentage,
                                     java.math.BigDecimal voluntaryPfAmount) {
        this.snapshotBasicSalary = basicSalary;
        this.snapshotDaPercentage = daPercentage;
        this.snapshotEmployeePfPercentage = employeePfPercentage;
        this.snapshotVoluntaryPfAmount = voluntaryPfAmount;
    }

    /**
     * Capture completion criteria snapshot
     * Called from service layer with active criteria
     */
    public void captureCriteriaSnapshot(String criteriaType,
                                       java.math.BigDecimal unitRate,
                                       String unitOfMeasure,
                                       java.math.BigDecimal salaryPercentage) {
        this.snapshotCriteriaType = criteriaType;
        this.snapshotUnitRate = unitRate;
        this.snapshotUnitOfMeasure = unitOfMeasure;
        this.snapshotSalaryPercentage = salaryPercentage;
    }
}

