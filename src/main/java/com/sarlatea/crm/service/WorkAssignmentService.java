package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.AssignmentHistoryDTO;
import com.sarlatea.crm.dto.WorkActivityCompletionCriteriaDTO;
import com.sarlatea.crm.dto.WorkAssignmentDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.AuditLog;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkAssignment;
import com.sarlatea.crm.repository.AuditLogRepository;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeSalaryRepository;
import com.sarlatea.crm.repository.PaymentRepository;
import com.sarlatea.crm.repository.WorkActivityRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for WorkAssignment operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkAssignmentService {

    private final WorkAssignmentRepository workAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final WorkActivityRepository workActivityRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final WorkActivityCompletionCriteriaService completionCriteriaService;

    @Transactional(readOnly = true)
    public List<WorkAssignmentDTO> getAllAssignments() {
        log.debug("Fetching all non-deleted work assignments");
        return workAssignmentRepository.findByDeletedFalse().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkAssignmentDTO getAssignmentById(String id) {
        log.debug("Fetching work assignment with id: {}", id);
        WorkAssignment assignment = workAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + id));
        return convertToDTO(assignment);
    }

    @Transactional(readOnly = true)
    public List<WorkAssignmentDTO> getAssignmentsByEmployee(String employeeId) {
        log.debug("Fetching non-deleted work assignments for employee: {}", employeeId);
        return workAssignmentRepository.findByAssignedEmployeeIdAndDeletedFalse(employeeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkAssignmentDTO> getAssignmentsByDateRangeAndEmployees(
            LocalDate startDate, LocalDate endDate, List<String> employeeIds) {
        log.debug("Fetching assignments from {} to {} for {} employees", 
                startDate, endDate, employeeIds != null ? employeeIds.size() : "all");
        
        List<WorkAssignment> assignments;
        if (employeeIds == null || employeeIds.isEmpty()) {
            // Get all assignments in date range using database query
            assignments = workAssignmentRepository.findByAssignmentDateBetweenAndDeletedFalse(startDate, endDate);
        } else {
            // Get assignments for specific employees in date range using database IN clause
            assignments = workAssignmentRepository.findByEmployeeIdsAndDateRange(employeeIds, startDate, endDate);
        }
        
        return assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkAssignmentDTO createAssignment(WorkAssignmentDTO dto) {
        log.debug("Creating new work assignment for activity: {}", dto.getWorkActivityId());
        
        // Fetch the work activity
        WorkActivity workActivity = workActivityRepository.findById(dto.getWorkActivityId())
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + dto.getWorkActivityId()));
        
        // Fetch employee if provided
        Employee employee = null;
        if (dto.getAssignedEmployeeId() != null) {
            employee = employeeRepository.findById(dto.getAssignedEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + dto.getAssignedEmployeeId()));
            
            // Validate that employee has an active salary
            if (!employeeSalaryRepository.hasActiveSalary(dto.getAssignedEmployeeId())) {
                String errorMessage = String.format(
                    "Cannot create assignment: Employee '%s' does not have an active salary record. " +
                    "Please add salary information before creating assignments.",
                    employee.getName()
                );
                log.warn(errorMessage);
                throw new DataIntegrityException(errorMessage);
            }
        }
        
        // Create new assignment
        WorkAssignment assignment = new WorkAssignment();
        assignment.copyFromWorkActivity(workActivity);
        assignment.setAssignmentDate(dto.getAssignmentDate());
        assignment.setAssignedEmployee(employee);
        
        // Set status - all assignments start as ASSIGNED
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.ASSIGNED);
        assignment.setAssignedAt(LocalDateTime.now()); // Track assignment time
        
        // Set completion percentage if provided
        if (dto.getCompletionPercentage() != null) {
            assignment.setCompletionPercentage(Math.min(100, Math.max(0, dto.getCompletionPercentage())));
        } else {
            assignment.setCompletionPercentage(0);
        }
        
        WorkAssignment savedAssignment = workAssignmentRepository.save(assignment);
        log.info("Created work assignment with id: {} for employee: {}", savedAssignment.getId(), 
                employee != null ? employee.getName() : "unassigned");
        
        // Audit log for creation
        auditLogService.logAudit(
            AuditLog.OperationType.CREATE,
            "WorkAssignment",
            savedAssignment.getId(),
            savedAssignment.getActivityName() + " - " + (employee != null ? employee.getName() : "Unassigned")
        );
        
        return convertToDTO(savedAssignment);
    }

    @Transactional
    public WorkAssignmentDTO updateAssignment(String id, WorkAssignmentDTO dto) {
        log.debug("Updating work assignment with id: {}", id);
        WorkAssignment assignment = workAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + id));
        
        log.debug("Current assignment - Activity: {}, WorkActivityId: {}, EvaluationCount: {}, PaymentStatus: {}", 
                assignment.getActivityName(), 
                assignment.getWorkActivity() != null ? assignment.getWorkActivity().getId() : null,
                assignment.getEvaluationCount(),
                assignment.getPaymentStatus());
        
        log.debug("Update DTO - WorkActivityId: {}", dto.getWorkActivityId());
        
        // Check if assignment can be edited
        if (!assignment.isEditable()) {
            String reason = "";
            if (assignment.getEvaluationCount() != null && assignment.getEvaluationCount() > 0) {
                reason = String.format("This assignment has already been evaluated %d time(s) and cannot be edited. " +
                        "Evaluated assignments are locked to maintain data integrity.", 
                        assignment.getEvaluationCount());
            } else if (assignment.getPaymentStatus() != null) {
                reason = String.format("This assignment is in payment status '%s' and cannot be edited.", 
                        assignment.getPaymentStatus());
            }
            log.warn("Cannot edit assignment {}: {}", id, reason);
            throw new IllegalStateException("Cannot edit assignment: " + reason);
        }
        
        // Capture old state for audit
        WorkAssignmentDTO oldState = convertToDTO(assignment);
        
        updateAssignmentFields(assignment, dto);
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        log.info("Updated assignment {} - New Activity: {}, WorkActivityId: {}", 
                id, 
                updatedAssignment.getActivityName(),
                updatedAssignment.getWorkActivity() != null ? updatedAssignment.getWorkActivity().getId() : null);
        
        // Audit log for update with old and new values
        WorkAssignmentDTO newState = convertToDTO(updatedAssignment);
        auditLogService.logAuditWithChanges(
            AuditLog.OperationType.EDIT,
            "WorkAssignment",
            updatedAssignment.getId(),
            updatedAssignment.getActivityName(),
            oldState,
            newState
        );
        
        return newState;
    }

    @Transactional
    public WorkAssignmentDTO assignToEmployee(String assignmentId, String employeeId) {
        log.info("Assigning work assignment {} to employee {}", assignmentId, employeeId);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        // Check if assignment can be edited (re-assigned)
        if (!assignment.isEditable()) {
            String reason = "";
            if (assignment.getEvaluationCount() != null && assignment.getEvaluationCount() > 0) {
                reason = String.format("This assignment has already been evaluated %d time(s) and cannot be re-assigned. " +
                        "Evaluated assignments are locked to maintain data integrity.", 
                        assignment.getEvaluationCount());
            } else if (assignment.getPaymentStatus() != null) {
                reason = String.format("This assignment is in payment status '%s' and cannot be re-assigned.", 
                        assignment.getPaymentStatus());
            }
            throw new IllegalStateException("Cannot re-assign assignment: " + reason);
        }
        
        // Capture old state for audit
        WorkAssignmentDTO oldState = convertToDTO(assignment);
        
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        
        assignment.setAssignedEmployee(employee);
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.ASSIGNED);
        assignment.setAssignedAt(LocalDateTime.now()); // Track assignment time
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        log.info("Assignment {} assigned to employee {} at {}", assignmentId, employeeId, assignment.getAssignedAt());
        
        // Audit log for reassignment with old and new values
        WorkAssignmentDTO newState = convertToDTO(updatedAssignment);
        auditLogService.logAuditWithChanges(
            AuditLog.OperationType.EDIT,
            "WorkAssignment",
            updatedAssignment.getId(),
            updatedAssignment.getActivityName() + " - Assigned to " + employee.getName(),
            oldState,
            newState
        );
        
        return newState;
    }

    @Transactional
    public WorkAssignmentDTO markAsCompleted(String assignmentId, String completionNotes, 
                                             Double actualHours, Integer completionPercentage) {
        log.info("Marking work assignment {} as completed", assignmentId);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.COMPLETED);
        assignment.setCompletedDate(LocalDate.now());
        assignment.setCompletionNotes(completionNotes);
        assignment.setActualDurationHours(actualHours);
        
        // Set completion percentage - default to 100% if fully completed
        if (completionPercentage != null) {
            assignment.setCompletionPercentage(Math.min(100, Math.max(0, completionPercentage)));
        } else {
            assignment.setCompletionPercentage(100); // Default to fully completed
        }
        
        // Track evaluation time and count for audit
        LocalDateTime now = LocalDateTime.now();
        Integer currentCount = assignment.getEvaluationCount();
        if (currentCount == null || currentCount == 0) {
            assignment.setFirstEvaluatedAt(now); // Track first evaluation time
        }
        assignment.setLastEvaluatedAt(now);
        assignment.setEvaluationCount(currentCount != null ? currentCount + 1 : 1);
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        log.info("Assignment {} marked as completed (Evaluation #{}) at {}", 
                assignmentId, assignment.getEvaluationCount(), assignment.getLastEvaluatedAt());
        
        // Audit log for evaluation
        auditLogService.logAudit(
            AuditLog.OperationType.EDIT,
            "WorkAssignment",
            updatedAssignment.getId(),
            updatedAssignment.getActivityName() + " - Evaluation #" + updatedAssignment.getEvaluationCount()
        );
        
        return convertToDTO(updatedAssignment);
    }

    @Transactional
    public WorkAssignmentDTO updateCompletionPercentage(String assignmentId, Double actualValue) {
        log.info("Updating completion for assignment {} with actual value: {}", assignmentId, actualValue);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        // Capture old state for audit
        WorkAssignmentDTO oldState = convertToDTO(assignment);
        
        // Get the active completion criteria for this work activity
        String workActivityId = assignment.getWorkActivity().getId();
        WorkActivityCompletionCriteriaDTO activeCriteria = completionCriteriaService.getActiveCriteriaByWorkActivityId(workActivityId);
        
        if (activeCriteria == null) {
            throw new DataIntegrityException(
                "Cannot evaluate assignment: No active completion criteria found for activity " + assignment.getActivityName()
            );
        }
        
        // Calculate completion percentage: (actualValue / criteriaValue) * 100
        double criteriaValue = activeCriteria.getValue().doubleValue();
        double calculatedPercentage = (actualValue / criteriaValue) * 100.0;
        int validPercentage = (int) Math.round(Math.min(100, Math.max(0, calculatedPercentage)));
        
        assignment.setActualValue(actualValue);
        assignment.setCompletionPercentage(validPercentage);
        
        // Track evaluation time and count for audit
        LocalDateTime now = LocalDateTime.now();
        Integer currentCount = assignment.getEvaluationCount();
        if (currentCount == null || currentCount == 0) {
            assignment.setFirstEvaluatedAt(now); // Track first evaluation time
        }
        assignment.setLastEvaluatedAt(now);
        assignment.setEvaluationCount(currentCount != null ? currentCount + 1 : 1);
        
        // Once an assignment is evaluated, mark it as COMPLETED regardless of percentage
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.COMPLETED);
        if (assignment.getCompletedDate() == null) {
            assignment.setCompletedDate(LocalDate.now());
        }
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        log.info("Assignment {} evaluated: actual value={}, calculated percentage={}% (Evaluation #{}) at {}", 
                assignmentId, actualValue, validPercentage, assignment.getEvaluationCount(), assignment.getLastEvaluatedAt());
        
        // Audit log for evaluation with old and new values
        WorkAssignmentDTO newState = convertToDTO(updatedAssignment);
        auditLogService.logAuditWithChanges(
            AuditLog.OperationType.EDIT,
            "WorkAssignment",
            updatedAssignment.getId(),
            updatedAssignment.getActivityName() + " - " + validPercentage + "% complete (Evaluation #" + updatedAssignment.getEvaluationCount() + ")",
            oldState,
            newState
        );
        
        return newState;
    }

    @Transactional
    public void deleteAssignment(String id) {
        log.info("Soft deleting work assignment with id: {}", id);
        WorkAssignment assignment = workAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + id));
        
        // Soft delete - set deleted flag instead of removing from database
        assignment.setDeleted(true);
        workAssignmentRepository.save(assignment);
        log.info("Assignment {} marked as deleted for audit purposes", id);
        
        // Audit log for deletion
        auditLogService.logAudit(
            AuditLog.OperationType.DELETE,
            "WorkAssignment",
            assignment.getId(),
            assignment.getActivityName()
        );
    }

    private WorkAssignmentDTO convertToDTO(WorkAssignment assignment) {
        WorkAssignmentDTO dto = new WorkAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setWorkActivityId(assignment.getWorkActivity() != null ? assignment.getWorkActivity().getId() : null);
        dto.setAssignedEmployeeId(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getId() : null);
        dto.setAssignedEmployeeName(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getName() : null);
        dto.setAssignmentDate(assignment.getAssignmentDate());
        dto.setActivityName(assignment.getActivityName());
        dto.setActivityDescription(assignment.getActivityDescription());
        dto.setAssignmentStatus(assignment.getAssignmentStatus());
        dto.setActualDurationHours(assignment.getActualDurationHours());
        dto.setCompletionPercentage(assignment.getCompletionPercentage());
        dto.setActualValue(assignment.getActualValue());
        dto.setCompletionNotes(assignment.getCompletionNotes());
        dto.setCompletedDate(assignment.getCompletedDate());
        // Audit fields
        dto.setAssignedAt(assignment.getAssignedAt());
        dto.setFirstEvaluatedAt(assignment.getFirstEvaluatedAt());
        dto.setLastEvaluatedAt(assignment.getLastEvaluatedAt());
        dto.setEvaluationCount(assignment.getEvaluationCount());
        // Payment tracking
        dto.setPaymentStatus(assignment.getPaymentStatus());
        dto.setIncludedInPaymentId(assignment.getIncludedInPaymentId());
        dto.setPaidInPaymentId(assignment.getPaidInPaymentId());
        dto.setPaymentLockedAt(assignment.getPaymentLockedAt());
        
        // Fetch payment reference numbers if payment IDs are present
        if (assignment.getIncludedInPaymentId() != null) {
            paymentRepository.findById(assignment.getIncludedInPaymentId())
                .ifPresent(payment -> dto.setIncludedInPaymentReferenceNumber(payment.getReferenceNumber()));
        }
        if (assignment.getPaidInPaymentId() != null) {
            paymentRepository.findById(assignment.getPaidInPaymentId())
                .ifPresent(payment -> dto.setPaidInPaymentReferenceNumber(payment.getReferenceNumber()));
        }
        
        dto.setIsEditable(assignment.isEditable());
        dto.setIsReEvaluatable(assignment.isReEvaluatable());
        return dto;
    }

    private void updateAssignmentFields(WorkAssignment assignment, WorkAssignmentDTO dto) {
        // Update work activity if provided
        if (dto.getWorkActivityId() != null && !dto.getWorkActivityId().equals(assignment.getWorkActivity().getId())) {
            log.info("Updating work activity from {} to {}", 
                    assignment.getWorkActivity().getId(), 
                    dto.getWorkActivityId());
            WorkActivity newActivity = workActivityRepository.findById(dto.getWorkActivityId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + dto.getWorkActivityId()));
            assignment.setWorkActivity(newActivity);
            // Update the copied activity details
            assignment.setActivityName(newActivity.getName());
            assignment.setActivityDescription(newActivity.getDescription());
            log.info("Updated to activity: {} - {}", newActivity.getName(), newActivity.getDescription());
        }
        
        if (dto.getAssignmentDate() != null) {
            assignment.setAssignmentDate(dto.getAssignmentDate());
        }
        if (dto.getAssignmentStatus() != null) {
            assignment.setAssignmentStatus(dto.getAssignmentStatus());
        }
        if (dto.getActualDurationHours() != null) {
            assignment.setActualDurationHours(dto.getActualDurationHours());
        }
        if (dto.getCompletionPercentage() != null) {
            assignment.setCompletionPercentage(Math.min(100, Math.max(0, dto.getCompletionPercentage())));
        }
        if (dto.getCompletionNotes() != null) {
            assignment.setCompletionNotes(dto.getCompletionNotes());
        }
        if (dto.getCompletedDate() != null) {
            assignment.setCompletedDate(dto.getCompletedDate());
        }
    }
    
    /**
     * Get assignment history with all audit logs
     */
    @Transactional(readOnly = true)
    public AssignmentHistoryDTO getAssignmentHistory(String assignmentId) {
        log.debug("Fetching history for assignment: {}", assignmentId);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        AssignmentHistoryDTO history = new AssignmentHistoryDTO();
        history.setAssignmentId(assignment.getId());
        history.setAssignmentDate(assignment.getAssignmentDate().toString());
        history.setActivityName(assignment.getActivityName());
        history.setEmployeeName(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getName() : "Unassigned");
        
        // Lifecycle events
        history.setAssignedAt(assignment.getAssignedAt());
        history.setFirstEvaluatedAt(assignment.getFirstEvaluatedAt());
        history.setLastEvaluatedAt(assignment.getLastEvaluatedAt());
        history.setEvaluationCount(assignment.getEvaluationCount());
        history.setPaymentLockedAt(assignment.getPaymentLockedAt());
        
        // Current state
        history.setAssignmentStatus(assignment.getAssignmentStatus() != null ? assignment.getAssignmentStatus().toString() : null);
        history.setPaymentStatus(assignment.getPaymentStatus() != null ? assignment.getPaymentStatus().toString() : null);
        history.setCompletionPercentage(assignment.getCompletionPercentage());
        history.setIncludedInPaymentId(assignment.getIncludedInPaymentId());
        history.setPaidInPaymentId(assignment.getPaidInPaymentId());
        
        // Get payment references
        if (assignment.getIncludedInPaymentId() != null) {
            paymentRepository.findById(assignment.getIncludedInPaymentId())
                .ifPresent(payment -> history.setIncludedInPaymentReferenceNumber(payment.getReferenceNumber()));
        }
        if (assignment.getPaidInPaymentId() != null) {
            paymentRepository.findById(assignment.getPaidInPaymentId())
                .ifPresent(payment -> history.setPaidInPaymentReferenceNumber(payment.getReferenceNumber()));
        }
        
        // Get all audit logs for this assignment (filtered by entity type to avoid duplicates)
        List<AuditLog> auditLogs = auditLogRepository.findByEntityIdAndEntityTypeOrderByTimestampDesc(
            assignmentId, 
            "WorkAssignment"
        );
        List<AssignmentHistoryDTO.AuditLogEntry> logEntries = auditLogs.stream()
                .map(this::convertAuditLogToEntry)
                .collect(Collectors.toList());
        history.setAuditLogs(logEntries);
        
        log.debug("Found {} audit logs for assignment {}", logEntries.size(), assignmentId);
        return history;
    }
    
    private AssignmentHistoryDTO.AuditLogEntry convertAuditLogToEntry(AuditLog log) {
        AssignmentHistoryDTO.AuditLogEntry entry = new AssignmentHistoryDTO.AuditLogEntry();
        entry.setTimestamp(log.getTimestamp());
        entry.setOperation(log.getOperation() != null ? log.getOperation().toString() : "UNKNOWN");
        entry.setUsername(log.getUsername());
        entry.setUserFullName(log.getUserFullName());
        entry.setIpAddress(log.getIpAddress());
        entry.setStatus(log.getStatus() != null ? log.getStatus().toString() : null);
        entry.setOldValue(log.getOldValue());
        entry.setNewValue(log.getNewValue());
        
        // Create human-readable description based on operation
        String description = createDescriptionFromLog(log);
        entry.setDescription(description);
        
        return entry;
    }
    
    private String createDescriptionFromLog(AuditLog log) {
        String operation = log.getOperation() != null ? log.getOperation().toString() : "UNKNOWN";
        String entityName = log.getEntityName() != null ? log.getEntityName() : "";
        String userName = log.getUserFullName() != null ? log.getUserFullName() : log.getUsername();
        
        // Use entity name to extract meaningful information
        switch (operation) {
            case "CREATE":
                // entityName format: "Activity Name - Employee Name" or "Activity Name - Unassigned"
                if (entityName.contains(" - ")) {
                    String[] parts = entityName.split(" - ", 2);
                    String activityName = parts[0];
                    String employeeName = parts[1];
                    return userName + " created the assignment for " + activityName + 
                           (!"Unassigned".equals(employeeName) ? " (assigned to " + employeeName + ")" : "");
                }
                return userName + " created the assignment";
                
            case "EDIT":
                // Check if this is an evaluation based on entityName containing percentage
                if (entityName.contains("% complete") || entityName.contains("Evaluation #")) {
                    // entityName format: "Activity Name - X% complete (Evaluation #N)"
                    if (entityName.contains("% complete")) {
                        String[] parts = entityName.split(" - ");
                        if (parts.length >= 2) {
                            String details = parts[1]; // "75% complete (Evaluation #2)"
                            
                            // Extract percentage
                            String percentage = details.substring(0, details.indexOf("%") + 1);
                            
                            // Check if we have actual value information in oldValue/newValue
                            String additionalInfo = "";
                            if (log.getNewValue() != null && log.getNewValue().contains("actualValue")) {
                                try {
                                    // Extract actualValue from JSON
                                    String newValue = log.getNewValue();
                                    int actualValueIndex = newValue.indexOf("\"actualValue\":");
                                    if (actualValueIndex != -1) {
                                        int start = newValue.indexOf(":", actualValueIndex) + 1;
                                        int end = newValue.indexOf(",", start);
                                        if (end == -1) end = newValue.indexOf("}", start);
                                        String value = newValue.substring(start, end).trim();
                                        additionalInfo = " with " + value + " KGs";
                                    }
                                } catch (Exception e) {
                                    // Ignore parsing errors
                                }
                            }
                            
                            return userName + " evaluated the assignment: " + percentage + " complete" + additionalInfo;
                        }
                    }
                    return userName + " evaluated the assignment";
                }
                
                // For regular updates, try to detect what changed
                if (log.getOldValue() != null && log.getNewValue() != null) {
                    try {
                        // Check if activity changed
                        if (log.getOldValue().contains("\"activityName\"") && log.getNewValue().contains("\"activityName\"")) {
                            String oldActivity = extractJsonValue(log.getOldValue(), "activityName");
                            String newActivity = extractJsonValue(log.getNewValue(), "activityName");
                            if (oldActivity != null && newActivity != null && !oldActivity.equals(newActivity)) {
                                return userName + " changed activity from " + oldActivity + " to " + newActivity;
                            }
                        }
                        
                        // Check if employee changed
                        if (log.getOldValue().contains("\"assignedEmployee\"") && log.getNewValue().contains("\"assignedEmployee\"")) {
                            String oldEmployee = extractJsonValue(log.getOldValue(), "name", "assignedEmployee");
                            String newEmployee = extractJsonValue(log.getNewValue(), "name", "assignedEmployee");
                            if (oldEmployee != null && newEmployee != null && !oldEmployee.equals(newEmployee)) {
                                return userName + " reassigned from " + oldEmployee + " to " + newEmployee;
                            }
                        }
                        
                        // Check if payment status changed
                        if (log.getOldValue().contains("\"paymentStatus\"") && log.getNewValue().contains("\"paymentStatus\"")) {
                            String oldStatus = extractJsonValue(log.getOldValue(), "paymentStatus");
                            String newStatus = extractJsonValue(log.getNewValue(), "paymentStatus");
                            if ((oldStatus == null || oldStatus.equals("null")) && newStatus != null && !newStatus.equals("null")) {
                                return userName + " added assignment to payment";
                            } else if (oldStatus != null && !oldStatus.equals("null") && (newStatus == null || newStatus.equals("null"))) {
                                return userName + " removed assignment from payment";
                            }
                        }
                    } catch (Exception e) {
                        // If parsing fails, fall through to generic message
                    }
                }
                
                return userName + " updated the assignment";
                
            case "DELETE":
                return userName + " deleted the assignment" + (entityName.isEmpty() ? "" : " (" + entityName + ")");
                
            case "EVALUATE":
                return userName + " evaluated the assignment";
                
            default:
                return userName + " performed " + operation.toLowerCase() + " operation";
        }
    }
    
    /**
     * Extract a JSON value from a JSON string
     */
    private String extractJsonValue(String json, String key) {
        return extractJsonValue(json, key, null);
    }
    
    /**
     * Extract a JSON value from a JSON string, optionally looking within a nested object
     */
    private String extractJsonValue(String json, String key, String parentKey) {
        try {
            String searchJson = json;
            
            // If we have a parent key, first extract that section
            if (parentKey != null) {
                int parentStart = json.indexOf("\"" + parentKey + "\":");
                if (parentStart == -1) return null;
                
                int braceStart = json.indexOf("{", parentStart);
                if (braceStart == -1) return null;
                
                int braceCount = 1;
                int braceEnd = braceStart + 1;
                while (braceCount > 0 && braceEnd < json.length()) {
                    char c = json.charAt(braceEnd);
                    if (c == '{') braceCount++;
                    else if (c == '}') braceCount--;
                    braceEnd++;
                }
                searchJson = json.substring(braceStart, braceEnd);
            }
            
            // Now search for the key in the relevant section
            String keyPattern = "\"" + key + "\":";
            int keyIndex = searchJson.indexOf(keyPattern);
            if (keyIndex == -1) return null;
            
            int valueStart = keyIndex + keyPattern.length();
            char firstChar = searchJson.charAt(valueStart);
            
            // Skip whitespace
            while (Character.isWhitespace(firstChar)) {
                valueStart++;
                firstChar = searchJson.charAt(valueStart);
            }
            
            // Handle string values
            if (firstChar == '"') {
                valueStart++; // Skip opening quote
                int valueEnd = searchJson.indexOf("\"", valueStart);
                return searchJson.substring(valueStart, valueEnd);
            }
            
            // Handle other values (numbers, booleans, null)
            int valueEnd = valueStart;
            while (valueEnd < searchJson.length()) {
                char c = searchJson.charAt(valueEnd);
                if (c == ',' || c == '}' || c == ']') break;
                valueEnd++;
            }
            return searchJson.substring(valueStart, valueEnd).trim();
            
        } catch (Exception e) {
            return null;
        }
    }
}

