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
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String department;
    private Employee.EmployeeType employeeType;
    private Employee.EmployeeStatus status;
    private String notes;
}

