package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.WorkAssignmentDTO;
import com.sarlatea.crm.service.WorkAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST controller for WorkAssignment operations
 */
@RestController
@RequestMapping("/api/work-assignments")
@RequiredArgsConstructor
@Slf4j
public class WorkAssignmentController {

    private final WorkAssignmentService workAssignmentService;

    @GetMapping
    @PreAuthorize("hasPermission('ASSIGNMENT', 'VIEW')")
    public ResponseEntity<List<WorkAssignmentDTO>> getAllAssignments() {
        log.info("GET request to fetch all work assignments");
        List<WorkAssignmentDTO> assignments = workAssignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'VIEW')")
    public ResponseEntity<WorkAssignmentDTO> getAssignmentById(@PathVariable String id) {
        log.info("GET request to fetch work assignment with id: {}", id);
        WorkAssignmentDTO assignment = workAssignmentService.getAssignmentById(id);
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/by-employee/{employeeId}")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'VIEW')")
    public ResponseEntity<List<WorkAssignmentDTO>> getAssignmentsByEmployee(@PathVariable String employeeId) {
        log.info("GET request to fetch assignments for employee: {}", employeeId);
        List<WorkAssignmentDTO> assignments = workAssignmentService.getAssignmentsByEmployee(employeeId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/by-date-range")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'VIEW')")
    public ResponseEntity<List<WorkAssignmentDTO>> getAssignmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> employeeIds) {
        log.info("GET request to fetch assignments from {} to {} for {} employees", 
                startDate, endDate, employeeIds != null ? employeeIds.size() : "all");
        List<WorkAssignmentDTO> assignments = workAssignmentService.getAssignmentsByDateRangeAndEmployees(
                startDate, endDate, employeeIds);
        return ResponseEntity.ok(assignments);
    }

    @PostMapping
    @PreAuthorize("hasPermission('ASSIGNMENT', 'CREATE')")
    public ResponseEntity<WorkAssignmentDTO> createAssignment(@RequestBody WorkAssignmentDTO assignmentDTO) {
        log.info("POST request to create new work assignment for activity: {}", assignmentDTO.getWorkActivityId());
        WorkAssignmentDTO createdAssignment = workAssignmentService.createAssignment(assignmentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAssignment);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'EDIT')")
    public ResponseEntity<WorkAssignmentDTO> updateAssignment(
            @PathVariable String id,
            @RequestBody WorkAssignmentDTO assignmentDTO) {
        log.info("PUT request to update work assignment with id: {}", id);
        WorkAssignmentDTO updatedAssignment = workAssignmentService.updateAssignment(id, assignmentDTO);
        return ResponseEntity.ok(updatedAssignment);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'EDIT')")
    public ResponseEntity<WorkAssignmentDTO> assignToEmployee(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");
        log.info("POST request to assign work assignment {} to employee {}", id, employeeId);
        WorkAssignmentDTO assignment = workAssignmentService.assignToEmployee(id, employeeId);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'EVALUATE')")
    public ResponseEntity<WorkAssignmentDTO> markAsCompleted(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String notes = (String) request.get("completionNotes");
        Double actualHours = request.get("actualDurationHours") != null ? 
            ((Number) request.get("actualDurationHours")).doubleValue() : null;
        Integer completionPercentage = request.get("completionPercentage") != null ?
            ((Number) request.get("completionPercentage")).intValue() : null;
        
        log.info("POST request to mark work assignment {} as completed", id);
        WorkAssignmentDTO assignment = workAssignmentService.markAsCompleted(id, notes, actualHours, completionPercentage);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{id}/update-completion")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'EVALUATE')")
    public ResponseEntity<WorkAssignmentDTO> updateCompletionPercentage(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        Double actualValue = request.get("actualValue") != null ?
            ((Number) request.get("actualValue")).doubleValue() : null;
        
        if (actualValue == null) {
            throw new IllegalArgumentException("actualValue is required");
        }
        
        log.info("POST request to update completion for assignment {} with actual value: {}", id, actualValue);
        WorkAssignmentDTO assignment = workAssignmentService.updateCompletionPercentage(id, actualValue);
        return ResponseEntity.ok(assignment);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('ASSIGNMENT', 'DELETE')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String id) {
        log.info("DELETE request to delete work assignment with id: {}", id);
        workAssignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}

