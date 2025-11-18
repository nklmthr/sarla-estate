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
    private String workActivityId;
    private String assignedEmployeeId;
    private String assignedEmployeeName;
    
    private LocalDate assignmentDate;
    
    // Copied activity details
    private String activityName;
    private String activityDescription;
    
    // Assignment details
    private WorkAssignment.AssignmentStatus assignmentStatus;
    private WorkAssignment.Priority priority;
    private Double actualDurationHours;
    private Integer completionPercentage;
    private String completionNotes;
    private LocalDate completedDate;
}

