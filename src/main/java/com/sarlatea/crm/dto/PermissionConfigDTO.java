package com.sarlatea.crm.dto;

import com.sarlatea.crm.model.Permission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionConfigDTO {
    private String id;
    private String resourceType;
    private String operationType;
    private Permission requiredPermission;
    private String description;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}

