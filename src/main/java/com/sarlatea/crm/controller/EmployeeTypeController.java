package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.EmployeeTypeDTO;
import com.sarlatea.crm.service.EmployeeTypeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

/**
 * REST controller for EmployeeType master data management
 */
@RestController
@RequestMapping("/api/employee-types")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH},
             allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class EmployeeTypeController {

    private final EmployeeTypeService employeeTypeService;

    @GetMapping
    public ResponseEntity<List<EmployeeTypeDTO>> getAllEmployeeTypes() {
        log.info("GET request to fetch all employee types");
        List<EmployeeTypeDTO> employeeTypes = employeeTypeService.getAllEmployeeTypes();
        return ResponseEntity.ok(employeeTypes);
    }

    @GetMapping("/active")
    public ResponseEntity<List<EmployeeTypeDTO>> getActiveEmployeeTypes() {
        log.info("GET request to fetch active employee types");
        List<EmployeeTypeDTO> employeeTypes = employeeTypeService.getActiveEmployeeTypes();
        return ResponseEntity.ok(employeeTypes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeTypeDTO> getEmployeeTypeById(@PathVariable String id) {
        log.info("GET request to fetch employee type with id: {}", id);
        EmployeeTypeDTO employeeType = employeeTypeService.getEmployeeTypeById(id);
        return ResponseEntity.ok(employeeType);
    }

    @PostMapping
    public ResponseEntity<EmployeeTypeDTO> createEmployeeType(@RequestBody EmployeeTypeDTO employeeTypeDTO) {
        log.info("POST request to create employee type: {}", employeeTypeDTO.getName());
        EmployeeTypeDTO created = employeeTypeService.createEmployeeType(employeeTypeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeTypeDTO> updateEmployeeType(
            @PathVariable String id,
            @RequestBody EmployeeTypeDTO employeeTypeDTO) {
        log.info("PUT request to update employee type with id: {}", id);
        EmployeeTypeDTO updated = employeeTypeService.updateEmployeeType(id, employeeTypeDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployeeType(@PathVariable String id) {
        log.info("DELETE request to delete employee type with id: {}", id);
        employeeTypeService.deleteEmployeeType(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<EmployeeTypeDTO> toggleActiveStatus(@PathVariable String id) {
        log.info("PATCH request to toggle active status for employee type with id: {}", id);
        EmployeeTypeDTO updated = employeeTypeService.toggleActiveStatus(id);
        return ResponseEntity.ok(updated);
    }
}

