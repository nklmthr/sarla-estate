package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.EmployeeDTO;
import com.sarlatea.crm.service.EmployeeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST controller for Employee operations
 */
@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees() {
        log.info("GET request to fetch all employees");
        List<EmployeeDTO> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable String id) {
        log.info("GET request to fetch employee with id: {}", id);
        EmployeeDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(@RequestBody EmployeeDTO employeeDTO) {
        log.info("POST request to create new employee: {}", employeeDTO.getName());
        EmployeeDTO createdEmployee = employeeService.createEmployee(employeeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEmployee);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EmployeeDTO> createEmployeeWithPhoto(
            @RequestPart("employee") String employeeJson,
            @RequestPart(value = "idCardPhoto", required = false) MultipartFile photo) throws IOException {
        
        EmployeeDTO employeeDTO = objectMapper.readValue(employeeJson, EmployeeDTO.class);
        log.info("POST request to create new employee with photo: {}", employeeDTO.getName());
        
        EmployeeDTO createdEmployee = employeeService.createEmployee(employeeDTO);
        
        if (photo != null && !photo.isEmpty()) {
            log.info("Uploading photo for employee: {}, size: {} bytes", createdEmployee.getId(), photo.getSize());
            employeeService.updateEmployeePhoto(createdEmployee.getId(), photo.getBytes());
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEmployee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable String id, 
            @RequestBody EmployeeDTO employeeDTO) {
        log.info("PUT request to update employee with id: {}", id);
        EmployeeDTO updatedEmployee = employeeService.updateEmployee(id, employeeDTO);
        return ResponseEntity.ok(updatedEmployee);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EmployeeDTO> updateEmployeeWithPhoto(
            @PathVariable String id,
            @RequestPart("employee") String employeeJson,
            @RequestPart(value = "idCardPhoto", required = false) MultipartFile photo) throws IOException {
        
        EmployeeDTO employeeDTO = objectMapper.readValue(employeeJson, EmployeeDTO.class);
        log.info("PUT request to update employee with id: {}", id);
        
        EmployeeDTO updatedEmployee = employeeService.updateEmployee(id, employeeDTO);
        
        if (photo != null && !photo.isEmpty()) {
            log.info("Updating photo for employee: {}, size: {} bytes", id, photo.getSize());
            employeeService.updateEmployeePhoto(id, photo.getBytes());
        }
        
        return ResponseEntity.ok(updatedEmployee);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable String id) {
        log.info("DELETE request to delete employee with id: {}", id);
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<EmployeeDTO>> searchEmployees(@RequestParam String term) {
        log.info("GET request to search employees with term: {}", term);
        List<EmployeeDTO> employees = employeeService.searchEmployees(term);
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getEmployeePhoto(@PathVariable String id) {
        log.info("GET request to fetch photo for employee with id: {}", id);
        byte[] photo = employeeService.getEmployeePhoto(id);
        
        if (photo == null || photo.length == 0) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG) // Default to JPEG, could be detected
                .body(photo);
    }
}

