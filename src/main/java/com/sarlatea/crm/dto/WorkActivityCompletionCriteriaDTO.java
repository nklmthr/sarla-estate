package com.sarlatea.crm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sarlatea.crm.model.WorkActivityCompletionCriteria;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for WorkActivityCompletionCriteria
 * Note: isActive is a calculated field based on date ranges and is read-only.
 * It cannot be set via API requests.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkActivityCompletionCriteriaDTO {
    private String id;
    private String workActivityId;
    private WorkActivityCompletionCriteria.Unit unit;
    private BigDecimal value;
    private LocalDate startDate;
    private LocalDate endDate;
    
    /**
     * Read-only field calculated based on date range
     * Active if:
     * 1. Today is between startDate and endDate (inclusive), OR
     * 2. endDate is null and startDate is in past or today
     * This field is ignored on create/update requests
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Boolean isActive;
    
    private String notes;
}

