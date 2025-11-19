package com.sarlatea.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for EmployeeStatus master data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStatusDTO {
    private String id;
    private String code;
    private String name;
    private String description;
    private Boolean isActive;
    private Integer displayOrder;
}

