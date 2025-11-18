package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * WorkActivityCompletionCriteria entity representing completion criteria for work activities
 * Defines measurable units and values for activity completion
 */
@Entity
@Table(name = "work_activity_completion_criteria")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WorkActivityCompletionCriteria extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_activity_id", nullable = false)
    private WorkActivity workActivity;

    @Column(name = "unit", nullable = false)
    @Enumerated(EnumType.STRING)
    private Unit unit;

    @Column(name = "value", nullable = false, precision = 15, scale = 2)
    private BigDecimal value;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", length = 1000)
    private String notes;

    public enum Unit {
        KG,          // Quantity in kilograms
        AREA,        // Area of land (square meters or hectares)
        PLANTS,      // Number of plants
        LITERS       // Volume of liquid in liters
    }
}

