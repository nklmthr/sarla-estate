package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * WorkActivity entity representing various functions and tasks in tea estate
 * Examples: Plucking, Pruning, Weeding, Fertilizing, Irrigation, Pest Control, etc.
 */
@Entity
@Table(name = "work_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WorkActivity extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "workActivity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkActivityCompletionCriteria> completionCriteria = new ArrayList<>();

    public enum Status {
        ACTIVE, INACTIVE, SEASONAL
    }
}

