package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkActivity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for WorkActivity entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkActivityDTO {
    private String id;
    private String name;
    private String description;
    private WorkActivity.Status status;
    private Double estimatedDurationHoursPerDay;
    private String typicalLocation;
    private WorkActivity.Season season;
    private WorkActivity.WorkShift workShift;
    private WorkActivity.Frequency frequency;
    private String frequencyDetails;
    private String resourcesRequired;
    private String safetyInstructions;
    private String notes;
}

