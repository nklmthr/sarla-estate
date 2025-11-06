package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * OperationSchedule entity representing a scheduled period for work activities
 * Used to generate work assignments for employees
 */
@Entity
@Table(name = "operation_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OperationSchedule extends BaseEntity {

    @Column(name = "period_name", nullable = false)
    private String periodName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "period_type")
    @Enumerated(EnumType.STRING)
    private PeriodType periodType;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private ScheduleStatus status;

    // Filters to apply when generating assignments
    @Column(name = "filter_frequency")
    @Enumerated(EnumType.STRING)
    private WorkActivity.Frequency filterFrequency;

    @Column(name = "filter_work_shift")
    @Enumerated(EnumType.STRING)
    private WorkActivity.WorkShift filterWorkShift;

    @Column(name = "filter_season")
    @Enumerated(EnumType.STRING)
    private WorkActivity.Season filterSeason;

    @Column(name = "filter_status")
    @Enumerated(EnumType.STRING)
    private WorkActivity.Status filterActivityStatus;

    @Column(name = "include_all_schedulable")
    private Boolean includeAllSchedulable;

    @OneToMany(mappedBy = "operationSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkAssignment> workAssignments = new ArrayList<>();

    public enum PeriodType {
        WEEKLY,
        BIWEEKLY,
        MONTHLY,
        QUARTERLY,
        YEARLY,
        CUSTOM
    }

    public enum ScheduleStatus {
        DRAFT,
        GENERATED,
        PUBLISHED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    @PrePersist
    @PreUpdate
    protected void generatePeriodName() {
        if (periodName == null || periodName.isEmpty()) {
            periodName = generateDefaultPeriodName();
        }
    }

    private String generateDefaultPeriodName() {
        if (endDate == null) {
            return "Schedule";
        }
        
        String suffix = switch (periodType) {
            case WEEKLY, BIWEEKLY -> "Week ending " + endDate;
            case MONTHLY -> "Month ending " + endDate;
            case QUARTERLY -> "Quarter ending " + endDate;
            case YEARLY -> "Year ending " + endDate;
            default -> "Period ending " + endDate;
        };
        
        return suffix;
    }
}

