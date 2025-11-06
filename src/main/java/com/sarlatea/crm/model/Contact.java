package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Contact entity representing interactions with employees
 */
@Entity
@Table(name = "contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Contact extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "contact_date", nullable = false)
    private LocalDate contactDate;

    @Column(name = "contact_type")
    @Enumerated(EnumType.STRING)
    private ContactType contactType;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "outcome")
    @Enumerated(EnumType.STRING)
    private ContactOutcome outcome;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "contacted_by")
    private String contactedBy;

    public enum ContactType {
        PHONE_CALL, EMAIL, MEETING, VISIT, OTHER
    }

    public enum ContactOutcome {
        POSITIVE, NEUTRAL, NEGATIVE, PENDING
    }
}

