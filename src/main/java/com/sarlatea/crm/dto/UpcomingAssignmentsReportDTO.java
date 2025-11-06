package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for Upcoming Assignments Report
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingAssignmentsReportDTO {
    private LocalDate reportGeneratedDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalAssignments;
    private Integer unassignedCount;
    private Integer assignedCount;
    private List<AssignmentSummary> assignments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentSummary {
        private String assignmentId;
        private String activityName;
        private LocalDate assignmentDate;
        private WorkActivity.WorkShift workShift;
        private String location;
        private WorkAssignment.AssignmentStatus status;
        private WorkAssignment.Priority priority;
        private String assignedEmployeeId;
        private String assignedEmployeeName;
        private Double estimatedDurationHours;
        private String resourcesRequired;
    }
}

