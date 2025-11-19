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

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @OneToMany(mappedBy = "workActivity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkActivityCompletionCriteria> completionCriteria = new ArrayList<>();

    /**
     * Calculates the status based on whether there are active completion criteria
     * Status is ACTIVE if there's at least one active (non-deleted) completion criteria
     * Status is INACTIVE otherwise
     */
    @Transient
    public Status getStatus() {
        if (completionCriteria == null || completionCriteria.isEmpty()) {
            return Status.INACTIVE;
        }
        
        // Check if any criteria is active and not deleted
        boolean hasActiveCriteria = completionCriteria.stream()
            .anyMatch(c -> !c.getDeleted() && c.calculateIsActive());
        
        return hasActiveCriteria ? Status.ACTIVE : Status.INACTIVE;
    }

    public enum Status {
        ACTIVE, INACTIVE
    }
}

