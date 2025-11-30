package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for AuditLog entity
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    /**
     * Find audit logs by username
     */
    Page<AuditLog> findByUsername(String username, Pageable pageable);

    /**
     * Find audit logs by entity type
     */
    Page<AuditLog> findByEntityType(String entityType, Pageable pageable);

    /**
     * Find audit logs by operation
     */
    Page<AuditLog> findByOperation(AuditLog.OperationType operation, Pageable pageable);

    /**
     * Find audit logs by IP address
     */
    Page<AuditLog> findByIpAddress(String ipAddress, Pageable pageable);

    /**
     * Find audit logs by entity ID
     */
    List<AuditLog> findByEntityIdOrderByTimestampDesc(String entityId);
    
    /**
     * Find audit logs by entity ID and entity type
     */
    List<AuditLog> findByEntityIdAndEntityTypeOrderByTimestampDesc(String entityId, String entityType);

    /**
     * Find audit logs within a date range
     */
    Page<AuditLog> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Find audit logs by multiple criteria
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR a.username = :username) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:operation IS NULL OR a.operation = :operation) AND " +
           "(:ipAddress IS NULL OR a.ipAddress = :ipAddress) AND " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<AuditLog> findByCriteria(
        @Param("username") String username,
        @Param("entityType") String entityType,
        @Param("operation") AuditLog.OperationType operation,
        @Param("ipAddress") String ipAddress,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("status") AuditLog.OperationStatus status,
        Pageable pageable
    );

    /**
     * Count logs by user within time range
     */
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.username = :username AND a.timestamp >= :startDate")
    long countByUsernameAndTimestampAfter(@Param("username") String username, @Param("startDate") LocalDateTime startDate);

    /**
     * Get recent activity for dashboard
     */
    List<AuditLog> findTop10ByOrderByTimestampDesc();

    /**
     * Find failed operations
     */
    Page<AuditLog> findByStatus(AuditLog.OperationStatus status, Pageable pageable);
}

