package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private Double actualDurationHours;
    private Integer completionPercentage;
    private String completionNotes;
    private LocalDate completedDate;
    
    // Audit fields for tracking assignment and evaluation times
    private LocalDateTime assignedAt;
    private LocalDateTime lastEvaluatedAt;
    private Integer evaluationCount;
}

