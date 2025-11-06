package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * WorkActivity entity representing various functions and tasks in tea estate
 * Examples: Plucking, Pruning, Weeding, Fertilizing, Irrigation, Pest Control, etc.
 */
@Entity
@Table(name = "work_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WorkActivity extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "estimated_duration_hours_per_day")
    private Double estimatedDurationHoursPerDay;

    @Column(name = "typical_location")
    private String typicalLocation;

    @Column(name = "season")
    @Enumerated(EnumType.STRING)
    private Season season;

    @Column(name = "work_shift")
    @Enumerated(EnumType.STRING)
    private WorkShift workShift;

    @Column(name = "frequency")
    @Enumerated(EnumType.STRING)
    private Frequency frequency;

    @Column(name = "frequency_details", length = 500)
    private String frequencyDetails;

    @Column(name = "resources_required", length = 1000)
    private String resourcesRequired;

    @Column(name = "safety_instructions", length = 1000)
    private String safetyInstructions;

    @Column(name = "notes", length = 1000)
    private String notes;

    public enum Status {
        ACTIVE, INACTIVE, SEASONAL
    }

    public enum Season {
        SPRING, SUMMER, AUTUMN, WINTER, ALL_SEASON
    }

    public enum WorkShift {
        MORNING, EVENING, FULL_DAY
    }

    public enum Frequency {
        DAILY,           // Occurs every day
        WEEKLY,          // Occurs once per week
        BIWEEKLY,        // Occurs every two weeks
        MONTHLY,         // Occurs once per month
        QUARTERLY,       // Occurs once per quarter
        AS_NEEDED,       // Occurs on an as-needed basis
        MULTIPLE_DAILY   // Occurs multiple times per day
    }
}

