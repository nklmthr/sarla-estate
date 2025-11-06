package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.WorkAssignmentDTO;
import com.sarlatea.crm.service.WorkAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<WorkAssignmentDTO>> getAllAssignments() {
        log.info("GET request to fetch all work assignments");
        List<WorkAssignmentDTO> assignments = workAssignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkAssignmentDTO> getAssignmentById(@PathVariable String id) {
        log.info("GET request to fetch work assignment with id: {}", id);
        WorkAssignmentDTO assignment = workAssignmentService.getAssignmentById(id);
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/by-schedule/{scheduleId}")
    public ResponseEntity<List<WorkAssignmentDTO>> getAssignmentsBySchedule(@PathVariable String scheduleId) {
        log.info("GET request to fetch assignments for schedule: {}", scheduleId);
        List<WorkAssignmentDTO> assignments = workAssignmentService.getAssignmentsBySchedule(scheduleId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/by-employee/{employeeId}")
    public ResponseEntity<List<WorkAssignmentDTO>> getAssignmentsByEmployee(@PathVariable String employeeId) {
        log.info("GET request to fetch assignments for employee: {}", employeeId);
        List<WorkAssignmentDTO> assignments = workAssignmentService.getAssignmentsByEmployee(employeeId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/unassigned")
    public ResponseEntity<List<WorkAssignmentDTO>> getUnassignedFromDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        log.info("GET request to fetch unassigned assignments from date: {}", startDate);
        List<WorkAssignmentDTO> assignments = workAssignmentService.getUnassignedFromDate(startDate);
        return ResponseEntity.ok(assignments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkAssignmentDTO> updateAssignment(
            @PathVariable String id,
            @RequestBody WorkAssignmentDTO assignmentDTO) {
        log.info("PUT request to update work assignment with id: {}", id);
        WorkAssignmentDTO updatedAssignment = workAssignmentService.updateAssignment(id, assignmentDTO);
        return ResponseEntity.ok(updatedAssignment);
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<WorkAssignmentDTO> assignToEmployee(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String employeeId = request.get("employeeId");
        log.info("POST request to assign work assignment {} to employee {}", id, employeeId);
        WorkAssignmentDTO assignment = workAssignmentService.assignToEmployee(id, employeeId);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{id}/unassign")
    public ResponseEntity<WorkAssignmentDTO> unassignFromEmployee(@PathVariable String id) {
        log.info("POST request to unassign work assignment {}", id);
        WorkAssignmentDTO assignment = workAssignmentService.unassignFromEmployee(id);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{id}/complete")
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
    public ResponseEntity<WorkAssignmentDTO> updateCompletionPercentage(
            @PathVariable String id,
            @RequestBody Map<String, Integer> request) {
        Integer completionPercentage = request.get("completionPercentage");
        
        if (completionPercentage == null) {
            throw new IllegalArgumentException("completionPercentage is required");
        }
        
        log.info("POST request to update completion percentage for assignment {} to {}%", id, completionPercentage);
        WorkAssignmentDTO assignment = workAssignmentService.updateCompletionPercentage(id, completionPercentage);
        return ResponseEntity.ok(assignment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String id) {
        log.info("DELETE request to delete work assignment with id: {}", id);
        workAssignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}

