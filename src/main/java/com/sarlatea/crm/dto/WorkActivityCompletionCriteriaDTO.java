package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkActivityCompletionCriteria;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    private Boolean isActive;
    private String notes;
}

