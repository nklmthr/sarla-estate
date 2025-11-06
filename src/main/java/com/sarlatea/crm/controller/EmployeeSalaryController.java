package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.EmployeeSalaryDTO;
import com.sarlatea.crm.service.EmployeeSalaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for EmployeeSalary operations
 */
@RestController
@RequestMapping("/api/employee-salaries")
@RequiredArgsConstructor
@Slf4j
public class EmployeeSalaryController {

    private final EmployeeSalaryService salaryService;

    @GetMapping("/employee/{employeeId}/current")
    public ResponseEntity<EmployeeSalaryDTO> getCurrentSalary(@PathVariable String employeeId) {
        log.info("GET request to fetch current salary for employee: {}", employeeId);
        EmployeeSalaryDTO salary = salaryService.getCurrentSalary(employeeId);
        return ResponseEntity.ok(salary);
    }

    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<List<EmployeeSalaryDTO>> getSalaryHistory(@PathVariable String employeeId) {
        log.info("GET request to fetch salary history for employee: {}", employeeId);
        List<EmployeeSalaryDTO> history = salaryService.getSalaryHistory(employeeId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/employee/{employeeId}/on-date")
    public ResponseEntity<EmployeeSalaryDTO> getSalaryOnDate(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("GET request to fetch salary for employee {} on date: {}", employeeId, date);
        EmployeeSalaryDTO salary = salaryService.getSalaryOnDate(employeeId, date);
        return ResponseEntity.ok(salary);
    }

    @GetMapping("/active")
    public ResponseEntity<List<EmployeeSalaryDTO>> getAllActiveSalaries() {
        log.info("GET request to fetch all active salaries");
        List<EmployeeSalaryDTO> salaries = salaryService.getAllActiveSalaries();
        return ResponseEntity.ok(salaries);
    }

    @PostMapping("/employee/{employeeId}/initial")
    public ResponseEntity<EmployeeSalaryDTO> createInitialSalary(
            @PathVariable String employeeId,
            @RequestBody EmployeeSalaryDTO salaryDTO) {
        salaryDTO.setEmployeeId(employeeId);
        log.info("POST request to create initial salary for employee: {}", employeeId);
        EmployeeSalaryDTO createdSalary = salaryService.createInitialSalary(salaryDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSalary);
    }

    @PostMapping("/employee/{employeeId}/update")
    public ResponseEntity<EmployeeSalaryDTO> updateSalary(
            @PathVariable String employeeId,
            @RequestBody EmployeeSalaryDTO salaryDTO) {
        salaryDTO.setEmployeeId(employeeId);
        log.info("POST request to update salary for employee: {}", employeeId);
        EmployeeSalaryDTO updatedSalary = salaryService.updateSalary(employeeId, salaryDTO);
        return ResponseEntity.ok(updatedSalary);
    }

    @DeleteMapping("/{salaryId}")
    public ResponseEntity<Void> deleteSalaryRecord(@PathVariable String salaryId) {
        log.info("DELETE request to delete salary record: {}", salaryId);
        salaryService.deleteSalaryRecord(salaryId);
        return ResponseEntity.noContent().build();
    }
}

