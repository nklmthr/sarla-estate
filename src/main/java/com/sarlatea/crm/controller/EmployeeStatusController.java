package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.EmployeeStatusDTO;
import com.sarlatea.crm.service.EmployeeStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

/**
 * REST controller for EmployeeStatus master data management
 */
@RestController
@RequestMapping("/api/employee-statuses")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH},
             allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class EmployeeStatusController {

    private final EmployeeStatusService employeeStatusService;

    @GetMapping
    public ResponseEntity<List<EmployeeStatusDTO>> getAllEmployeeStatuses() {
        log.info("GET request to fetch all employee statuses");
        List<EmployeeStatusDTO> employeeStatuses = employeeStatusService.getAllEmployeeStatuses();
        return ResponseEntity.ok(employeeStatuses);
    }

    @GetMapping("/active")
    public ResponseEntity<List<EmployeeStatusDTO>> getActiveEmployeeStatuses() {
        log.info("GET request to fetch active employee statuses");
        List<EmployeeStatusDTO> employeeStatuses = employeeStatusService.getActiveEmployeeStatuses();
        return ResponseEntity.ok(employeeStatuses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeStatusDTO> getEmployeeStatusById(@PathVariable String id) {
        log.info("GET request to fetch employee status with id: {}", id);
        EmployeeStatusDTO employeeStatus = employeeStatusService.getEmployeeStatusById(id);
        return ResponseEntity.ok(employeeStatus);
    }

    @PostMapping
    public ResponseEntity<EmployeeStatusDTO> createEmployeeStatus(@RequestBody EmployeeStatusDTO employeeStatusDTO) {
        log.info("POST request to create employee status: {}", employeeStatusDTO.getName());
        EmployeeStatusDTO created = employeeStatusService.createEmployeeStatus(employeeStatusDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeStatusDTO> updateEmployeeStatus(
            @PathVariable String id,
            @RequestBody EmployeeStatusDTO employeeStatusDTO) {
        log.info("PUT request to update employee status with id: {}", id);
        EmployeeStatusDTO updated = employeeStatusService.updateEmployeeStatus(id, employeeStatusDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployeeStatus(@PathVariable String id) {
        log.info("DELETE request to delete employee status with id: {}", id);
        employeeStatusService.deleteEmployeeStatus(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<EmployeeStatusDTO> toggleActiveStatus(@PathVariable String id) {
        log.info("PATCH request to toggle active status for employee status with id: {}", id);
        EmployeeStatusDTO updated = employeeStatusService.toggleActiveStatus(id);
        return ResponseEntity.ok(updated);
    }
}

