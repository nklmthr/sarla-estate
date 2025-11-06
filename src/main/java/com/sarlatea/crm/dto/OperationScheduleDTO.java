package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.OperationSchedule;
import com.sarlatea.crm.model.WorkActivity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for OperationSchedule entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OperationScheduleDTO {
    private String id;
    private String periodName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
    private OperationSchedule.PeriodType periodType;
    private OperationSchedule.ScheduleStatus status;
    
    // Filters
    private WorkActivity.Frequency filterFrequency;
    private WorkActivity.WorkShift filterWorkShift;
    private WorkActivity.Season filterSeason;
    private WorkActivity.Status filterActivityStatus;
    private Boolean includeAllSchedulable;
    
    // Count of generated assignments
    private Integer totalAssignmentsCount;
}

