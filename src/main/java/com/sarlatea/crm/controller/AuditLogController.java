package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.AuditLogDTO;
import com.sarlatea.crm.model.AuditLog;
import com.sarlatea.crm.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for AuditLog operations
 */
@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH},
             allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Get audit logs with filtering and pagination
     */
    @GetMapping
    @PreAuthorize("hasPermission('AUDIT_LOG', 'VIEW')")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) AuditLog.OperationType operation,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) AuditLog.OperationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        log.info("GET request to fetch audit logs with filters - page: {}, size: {}", page, size);

        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<AuditLogDTO> auditLogsPage = auditLogService.getAuditLogs(
                username, entityType, operation, ipAddress, startDate, endDate, status, pageable
        );

        Map<String, Object> response = new HashMap<>();
        response.put("content", auditLogsPage.getContent());
        response.put("totalElements", auditLogsPage.getTotalElements());
        response.put("totalPages", auditLogsPage.getTotalPages());
        response.put("currentPage", auditLogsPage.getNumber());
        response.put("pageSize", auditLogsPage.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get audit history for a specific entity
     */
    @GetMapping("/entity/{entityId}")
    @PreAuthorize("hasPermission('AUDIT_LOG', 'VIEW')")
    public ResponseEntity<List<AuditLogDTO>> getEntityHistory(@PathVariable String entityId) {
        log.info("GET request to fetch audit history for entity: {}", entityId);
        List<AuditLogDTO> auditLogs = auditLogService.getEntityHistory(entityId);
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Get recent activity (last 10 entries)
     */
    @GetMapping("/recent")
    @PreAuthorize("hasPermission('AUDIT_LOG', 'VIEW')")
    public ResponseEntity<List<AuditLogDTO>> getRecentActivity() {
        log.info("GET request to fetch recent audit activity");
        List<AuditLogDTO> auditLogs = auditLogService.getRecentActivity();
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Get failed operations
     */
    @GetMapping("/failed")
    @PreAuthorize("hasPermission('AUDIT_LOG', 'VIEW')")
    public ResponseEntity<Map<String, Object>> getFailedOperations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        log.info("GET request to fetch failed operations - page: {}, size: {}", page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLogDTO> failedOps = auditLogService.getFailedOperations(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", failedOps.getContent());
        response.put("totalElements", failedOps.getTotalElements());
        response.put("totalPages", failedOps.getTotalPages());
        response.put("currentPage", failedOps.getNumber());
        response.put("pageSize", failedOps.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Get user activity count for the last 24 hours
     */
    @GetMapping("/user-activity/{username}")
    @PreAuthorize("hasPermission('AUDIT_LOG', 'VIEW')")
    public ResponseEntity<Map<String, Object>> getUserActivityCount(@PathVariable String username) {
        log.info("GET request to fetch activity count for user: {}", username);
        
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        long count = auditLogService.getUserActivityCount(username, last24Hours);

        Map<String, Object> response = new HashMap<>();
        response.put("username", username);
        response.put("activityCount", count);
        response.put("timeRange", "Last 24 hours");
        response.put("startTime", last24Hours);
        response.put("endTime", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    /**
     * Get audit log statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasPermission('AUDIT_LOG', 'VIEW')")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("GET request to fetch audit log statistics");
        
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(30); // Default to last 30 days
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }

        // This would be implemented with custom queries for aggregation
        // For now, returning basic structure
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("startDate", startDate);
        statistics.put("endDate", endDate);
        statistics.put("message", "Statistics feature can be expanded with custom aggregation queries");

        return ResponseEntity.ok(statistics);
    }
}

