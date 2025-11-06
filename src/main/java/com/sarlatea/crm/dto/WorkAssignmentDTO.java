package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for WorkAssignment entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkAssignmentDTO {
    private String id;
    private String operationScheduleId;
    private String workActivityId;
    private String assignedEmployeeId;
    private String assignedEmployeeName;
    
    private LocalDate assignmentDate;
    private WorkActivity.WorkShift workShift;
    
    // Copied activity details
    private String activityName;
    private String activityDescription;
    private Double estimatedDurationHours;
    private String location;
    private String resourcesRequired;
    private String safetyInstructions;
    
    // Assignment details
    private WorkAssignment.AssignmentStatus assignmentStatus;
    private WorkAssignment.Priority priority;
    private Double actualDurationHours;
    private Integer completionPercentage;
    private String completionNotes;
    private LocalDate completedDate;
}

