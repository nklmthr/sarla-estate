package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Entity for storing dynamic permission configuration
 * Maps resource-operation pairs to required permissions
 */
@Entity
@Table(name = "permission_configs", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"resource_type", "operation_type"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PermissionConfig extends BaseEntity {

    @Column(name = "resource_type", nullable = false, length = 100)
    private String resourceType; // e.g., "EMPLOYEE", "WORK_ACTIVITY", "ASSIGNMENT"

    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType; // e.g., "VIEW", "CREATE", "EDIT", "DELETE"

    @Column(name = "required_permission", nullable = false, length = 100)
    @Enumerated(EnumType.STRING)
    private Permission requiredPermission; // The actual permission enum value

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Helper method to build the key for this config
     */
    public String getKey() {
        return resourceType + ":" + operationType;
    }
}

