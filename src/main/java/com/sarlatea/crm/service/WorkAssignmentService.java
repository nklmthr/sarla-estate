package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.WorkAssignmentDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.WorkAssignment;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    @Transactional(readOnly = true)
    public List<WorkAssignmentDTO> getAllAssignments() {
        log.debug("Fetching all work assignments");
        return workAssignmentRepository.findAll().stream()
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
        log.debug("Fetching work assignments for employee: {}", employeeId);
        return workAssignmentRepository.findByAssignedEmployeeId(employeeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkAssignmentDTO> getUnassignedFromDate(LocalDate startDate) {
        log.debug("Fetching unassigned work assignments from date: {}", startDate);
        return workAssignmentRepository.findUnassignedFromDate(startDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkAssignmentDTO updateAssignment(String id, WorkAssignmentDTO dto) {
        log.debug("Updating work assignment with id: {}", id);
        WorkAssignment assignment = workAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + id));
        
        updateAssignmentFields(assignment, dto);
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        return convertToDTO(updatedAssignment);
    }

    @Transactional
    public WorkAssignmentDTO assignToEmployee(String assignmentId, String employeeId) {
        log.info("Assigning work assignment {} to employee {}", assignmentId, employeeId);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        
        assignment.setAssignedEmployee(employee);
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.ASSIGNED);
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        return convertToDTO(updatedAssignment);
    }

    @Transactional
    public WorkAssignmentDTO unassignFromEmployee(String assignmentId) {
        log.info("Unassigning work assignment {}", assignmentId);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        assignment.setAssignedEmployee(null);
        assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.UNASSIGNED);
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
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
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        return convertToDTO(updatedAssignment);
    }

    @Transactional
    public WorkAssignmentDTO updateCompletionPercentage(String assignmentId, Integer completionPercentage) {
        log.info("Updating completion percentage for assignment {} to {}%", assignmentId, completionPercentage);
        
        WorkAssignment assignment = workAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkAssignment not found with id: " + assignmentId));
        
        // Validate percentage is between 0 and 100
        int validPercentage = Math.min(100, Math.max(0, completionPercentage));
        assignment.setCompletionPercentage(validPercentage);
        
        // Update status based on percentage
        if (validPercentage == 0 && assignment.getAssignmentStatus() == WorkAssignment.AssignmentStatus.ASSIGNED) {
            // Keep as ASSIGNED
        } else if (validPercentage > 0 && validPercentage < 100) {
            assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.IN_PROGRESS);
        } else if (validPercentage == 100) {
            assignment.setAssignmentStatus(WorkAssignment.AssignmentStatus.COMPLETED);
            if (assignment.getCompletedDate() == null) {
                assignment.setCompletedDate(LocalDate.now());
            }
        }
        
        WorkAssignment updatedAssignment = workAssignmentRepository.save(assignment);
        return convertToDTO(updatedAssignment);
    }

    @Transactional
    public void deleteAssignment(String id) {
        log.debug("Deleting work assignment with id: {}", id);
        if (!workAssignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("WorkAssignment not found with id: " + id);
        }
        workAssignmentRepository.deleteById(id);
    }

    private WorkAssignmentDTO convertToDTO(WorkAssignment assignment) {
        WorkAssignmentDTO dto = new WorkAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setWorkActivityId(assignment.getWorkActivity() != null ? assignment.getWorkActivity().getId() : null);
        dto.setAssignedEmployeeId(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getId() : null);
        dto.setAssignedEmployeeName(assignment.getAssignedEmployee() != null ? assignment.getAssignedEmployee().getName() : null);
        dto.setAssignmentDate(assignment.getAssignmentDate());
        dto.setWorkShift(assignment.getWorkShift());
        dto.setActivityName(assignment.getActivityName());
        dto.setActivityDescription(assignment.getActivityDescription());
        dto.setEstimatedDurationHours(assignment.getEstimatedDurationHours());
        dto.setLocation(assignment.getLocation());
        dto.setResourcesRequired(assignment.getResourcesRequired());
        dto.setSafetyInstructions(assignment.getSafetyInstructions());
        dto.setAssignmentStatus(assignment.getAssignmentStatus());
        dto.setPriority(assignment.getPriority());
        dto.setActualDurationHours(assignment.getActualDurationHours());
        dto.setCompletionPercentage(assignment.getCompletionPercentage());
        dto.setCompletionNotes(assignment.getCompletionNotes());
        dto.setCompletedDate(assignment.getCompletedDate());
        return dto;
    }

    private void updateAssignmentFields(WorkAssignment assignment, WorkAssignmentDTO dto) {
        if (dto.getAssignmentDate() != null) {
            assignment.setAssignmentDate(dto.getAssignmentDate());
        }
        if (dto.getWorkShift() != null) {
            assignment.setWorkShift(dto.getWorkShift());
        }
        if (dto.getAssignmentStatus() != null) {
            assignment.setAssignmentStatus(dto.getAssignmentStatus());
        }
        if (dto.getPriority() != null) {
            assignment.setPriority(dto.getPriority());
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

