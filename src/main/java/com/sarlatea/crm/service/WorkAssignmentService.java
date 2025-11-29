package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.WorkActivityCompletionCriteriaDTO;
import com.sarlatea.crm.dto.WorkAssignmentDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkAssignment;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeSalaryRepository;
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
        
        updateAssignmentFields(assignment, dto);
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        log.info("Updated assignment {} - New Activity: {}, WorkActivityId: {}", 
                id, 
                updatedAssignment.getActivityName(),
                updatedAssignment.getWorkActivity() != null ? updatedAssignment.getWorkActivity().getId() : null);
        return convertToDTO(updatedAssignment);
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
        
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        
        assignment.setAssignedEmployee(employee);
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.ASSIGNED);
        assignment.setAssignedAt(LocalDateTime.now()); // Track assignment time
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        log.info("Assignment {} assigned to employee {} at {}", assignmentId, employeeId, assignment.getAssignedAt());
        return convertToDTO(updatedAssignment);
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
        return convertToDTO(updatedAssignment);
    }

    @Transactional
    public WorkAssignmentDTO updateCompletionPercentage(String assignmentId, Double actualValue) {
        log.info("Updating completion for assignment {} with actual value: {}", assignmentId, actualValue);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
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
        return convertToDTO(updatedAssignment);
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
}

