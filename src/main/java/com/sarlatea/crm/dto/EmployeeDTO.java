package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.Employee;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Employee entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {
    private String id;
    private String name;
    private String phone;
    private String pfAccountId;
    private Employee.IdCardType idCardType;
    private String idCardValue;
    // Note: idCardPhoto is byte[] and typically handled separately for file uploads
}

