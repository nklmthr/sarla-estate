package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * WorkAssignment entity representing a specific work task assignment
 * Generated from WorkActivity and can be assigned to employees
 */
@Entity
@Table(name = "work_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WorkAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_activity_id", nullable = false)
    private WorkActivity workActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_employee_id")
    private Employee assignedEmployee;

    @Column(name = "assignment_date", nullable = false)
    private LocalDate assignmentDate;
    
    // Audit fields for tracking assignment and evaluation times
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
    
    @Column(name = "first_evaluated_at")
    private LocalDateTime firstEvaluatedAt;
    
    @Column(name = "last_evaluated_at")
    private LocalDateTime lastEvaluatedAt;
    
    @Column(name = "evaluation_count")
    private Integer evaluationCount = 0;
    
    // Soft delete flag - assignments are never hard deleted for audit purposes
    @Column(name = "deleted")
    private Boolean deleted = false;

    // Copied from WorkActivity at time of generation
    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "activity_description", length = 2000)
    private String activityDescription;

    @Column(name = "assignment_status")
    @Enumerated(EnumType.STRING)
    private AssignmentStatus assignmentStatus;

    @Column(name = "actual_duration_hours")
    private Double actualDurationHours;

    @Column(name = "completion_percentage")
    private Integer completionPercentage;

    @Column(name = "actual_value")
    private Double actualValue;

    @Column(name = "completion_notes", length = 1000)
    private String completionNotes;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    public enum AssignmentStatus {
        ASSIGNED,    // Initial status when assignment is created
        COMPLETED    // Status after evaluation, regardless of completion percentage
    }

    /**
     * Helper method to copy details from WorkActivity
     */
    public void copyFromWorkActivity(WorkActivity workActivity) {
        this.workActivity = workActivity;
        this.activityName = workActivity.getName();
        this.activityDescription = workActivity.getDescription();
        this.assignmentStatus = AssignmentStatus.ASSIGNED;
        this.completionPercentage = 0; // Default to 0% completion
    }
}

