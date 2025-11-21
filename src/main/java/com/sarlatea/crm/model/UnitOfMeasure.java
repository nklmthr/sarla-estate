package com.sarlatea.crm.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * UnitOfMeasure entity for completion criteria units
 * Examples: Kilograms (KG), Area, Plants, Liters, Bags, Hours, etc.
 */
@Entity
@Table(name = "units_of_measure")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class UnitOfMeasure extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code; // e.g., "KG", "AREA", "PLANTS", "LITERS"

    @Column(name = "name", nullable = false, length = 100)
    private String name; // e.g., "Kilograms (KG)", "Area", "Plants"

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;
}

