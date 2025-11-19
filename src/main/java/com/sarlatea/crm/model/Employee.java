package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Employee entity representing tea estate employees
 */
@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Employee extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone")
    private String phone;

    @Column(name = "pf_account_id")
    private String pfAccountId;

    @Column(name = "id_card_type")
    @Enumerated(EnumType.STRING)
    private IdCardType idCardType;

    @Column(name = "id_card_value")
    private String idCardValue;

    @Lob
    @Column(name = "id_card_photo" , columnDefinition = "LONGBLOB")
    private byte[] idCardPhoto;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "employee_type_id", nullable = true)
    private EmployeeType employeeType;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "employee_status_id", nullable = true)
    private EmployeeStatus employeeStatus;

    public enum IdCardType {
        AADHAAR, PAN, PASSPORT, DRIVING_LICENSE
    }
}

