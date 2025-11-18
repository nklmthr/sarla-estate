package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.WorkActivity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

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
    private String notes;
    private List<WorkActivityCompletionCriteriaDTO> completionCriteria = new ArrayList<>();
}

