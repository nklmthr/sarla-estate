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
    private Integer totalAssignments;
    private Integer evaluatedAssignments;
    private Integer pendingAssignments;
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
        private LocalDateTime lastEvaluatedAt;
        private Integer evaluationCount;
        private WorkAssignment.AssignmentStatus status;
        private Integer completionPercentage;
        private Double actualValue;
        private Boolean deleted;
    }
}

