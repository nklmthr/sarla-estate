package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkAssignment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Assignment Audit Report
 * Shows when assignments were created and evaluated, including deleted assignments
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentAuditReportDTO {
    private LocalDate reportGeneratedDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalEvaluatedAssignments; // Only evaluated assignments
    private Integer reEvaluatedAssignments; // Assignments with evaluation count > 1
    private Integer deletedAssignments;
    private List<AssignmentAuditDetail> assignments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentAuditDetail {
        private String assignmentId;
        private String activityName;
        private String employeeName;
        private LocalDate assignmentDate;
        private LocalDateTime assignedAt;
        private LocalDateTime firstEvaluatedAt;
        private LocalDateTime lastEvaluatedAt;
        private Integer evaluationCount;
        private Long minEvalTimeMinutes; // Min time = from assignment to first evaluation
        private Long maxEvalTimeMinutes; // Max time = from assignment to last evaluation (same as min if only 1 eval)
        private WorkAssignment.AssignmentStatus status;
        private Integer completionPercentage;
        private Double actualValue;
        private Boolean deleted;
    }
}

