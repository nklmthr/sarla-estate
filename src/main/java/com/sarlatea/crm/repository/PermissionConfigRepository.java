package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.PermissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionConfigRepository extends JpaRepository<PermissionConfig, String> {
    
    /**
     * Find permission config by resource and operation type
     */
    @Query("SELECT pc FROM PermissionConfig pc WHERE pc.resourceType = :resource AND pc.operationType = :operation AND pc.isActive = true")
    Optional<PermissionConfig> findByResourceAndOperation(@Param("resource") String resource, 
                                                           @Param("operation") String operation);
    
    /**
     * Find all active permission configs
     */
    List<PermissionConfig> findByIsActiveTrueOrderByResourceTypeAsc();
    
    /**
     * Find all configs for a specific resource
     */
    List<PermissionConfig> findByResourceTypeAndIsActiveTrueOrderByOperationTypeAsc(String resourceType);
    
    /**
     * Check if a config exists for resource-operation pair
     */
    boolean existsByResourceTypeAndOperationType(String resourceType, String operationType);
}

