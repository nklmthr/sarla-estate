package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.EmployeeSalaryDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.model.EmployeeSalary;
import com.sarlatea.crm.repository.EmployeeRepository;
import com.sarlatea.crm.repository.EmployeeSalaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for EmployeeSalary operations with versioning support
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeSalaryService {

    private final EmployeeSalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public EmployeeSalaryDTO getCurrentSalary(String employeeId) {
        log.debug("Fetching current salary for employee: {}", employeeId);
        EmployeeSalary salary = salaryRepository.findCurrentSalaryByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "No active salary found for employee: " + employeeId));
        return convertToDTO(salary);
    }

    @Transactional(readOnly = true)
    public List<EmployeeSalaryDTO> getSalaryHistory(String employeeId) {
        log.debug("Fetching salary history for employee: {}", employeeId);
        return salaryRepository.findSalaryHistoryByEmployeeId(employeeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeSalaryDTO> getAllActiveSalaries() {
        log.debug("Fetching all active salaries");
        return salaryRepository.findAllActiveSalaries().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeSalaryDTO createInitialSalary(EmployeeSalaryDTO salaryDTO) {
        log.info("Creating initial salary for employee: {}", salaryDTO.getEmployeeId());
        
        Employee employee = employeeRepository.findById(salaryDTO.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Employee not found with id: " + salaryDTO.getEmployeeId()));

        // Check if employee already has an active salary
        if (salaryRepository.hasActiveSalary(salaryDTO.getEmployeeId())) {
            throw new IllegalStateException(
                "Employee already has an active salary. Use updateSalary to change it.");
        }

        EmployeeSalary salary = new EmployeeSalary();
        salary.setEmployee(employee);
        salary.setAmount(salaryDTO.getAmount());
        salary.setCurrency(salaryDTO.getCurrency());
        salary.setStartDate(salaryDTO.getStartDate() != null ? salaryDTO.getStartDate() : LocalDate.now());
        salary.setEndDate(null); // No end date for initial/current salary
        salary.setReasonForChange(salaryDTO.getReasonForChange());
        salary.setNotes(salaryDTO.getNotes());
        salary.setIsActive(true);

        EmployeeSalary savedSalary = salaryRepository.save(salary);
        log.info("Created initial salary record with id: {}", savedSalary.getId());
        
        return convertToDTO(savedSalary);
    }

    @Transactional
    public EmployeeSalaryDTO updateSalary(String employeeId, EmployeeSalaryDTO newSalaryDTO) {
        log.info("Updating salary for employee: {}", employeeId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Employee not found with id: " + employeeId));

        // Find current active salary
        EmployeeSalary currentSalary = salaryRepository.findCurrentSalaryByEmployeeId(employeeId)
                .orElse(null);

        LocalDate effectiveDate = newSalaryDTO.getStartDate() != null ? 
            newSalaryDTO.getStartDate() : LocalDate.now();

        // Close the current salary record if it exists
        if (currentSalary != null) {
            LocalDate endDate = effectiveDate.minusDays(1); // End date is day before new salary starts
            currentSalary.closeWithEndDate(endDate);
            salaryRepository.save(currentSalary);
            log.info("Closed previous salary record with end date: {}", endDate);
        }

        // Create new salary record
        EmployeeSalary newSalary = new EmployeeSalary();
        newSalary.setEmployee(employee);
        newSalary.setAmount(newSalaryDTO.getAmount());
        newSalary.setCurrency(newSalaryDTO.getCurrency() != null ? newSalaryDTO.getCurrency() : 
            (currentSalary != null ? currentSalary.getCurrency() : "INR"));
        newSalary.setStartDate(effectiveDate);
        newSalary.setEndDate(null); // No end date - this is now the current salary
        newSalary.setReasonForChange(newSalaryDTO.getReasonForChange());
        newSalary.setNotes(newSalaryDTO.getNotes());
        newSalary.setIsActive(true);

        EmployeeSalary savedSalary = salaryRepository.save(newSalary);
        log.info("Created new salary record with id: {} starting from: {}", 
            savedSalary.getId(), savedSalary.getStartDate());
        
        return convertToDTO(savedSalary);
    }

    @Transactional(readOnly = true)
    public EmployeeSalaryDTO getSalaryOnDate(String employeeId, LocalDate date) {
        log.debug("Fetching salary for employee {} on date: {}", employeeId, date);
        EmployeeSalary salary = salaryRepository.findSalaryForEmployeeOnDate(employeeId, date)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "No salary found for employee: " + employeeId + " on date: " + date));
        return convertToDTO(salary);
    }

    @Transactional
    public void deleteSalaryRecord(String salaryId) {
        log.warn("Deleting salary record with id: {}", salaryId);
        EmployeeSalary salary = salaryRepository.findById(salaryId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Salary record not found with id: " + salaryId));
        
        if (salary.isCurrentlyActive()) {
            throw new IllegalStateException(
                "Cannot delete active salary record. Update salary instead to maintain history.");
        }
        
        salaryRepository.deleteById(salaryId);
    }

    private EmployeeSalaryDTO convertToDTO(EmployeeSalary salary) {
        EmployeeSalaryDTO dto = new EmployeeSalaryDTO();
        dto.setId(salary.getId());
        dto.setEmployeeId(salary.getEmployee() != null ? salary.getEmployee().getId() : null);
        dto.setEmployeeName(salary.getEmployee() != null ? salary.getEmployee().getName() : null);
        dto.setAmount(salary.getAmount());
        dto.setCurrency(salary.getCurrency());
        dto.setStartDate(salary.getStartDate());
        dto.setEndDate(salary.getEndDate());
        dto.setReasonForChange(salary.getReasonForChange());
        dto.setIsActive(salary.getIsActive());
        dto.setNotes(salary.getNotes());
        return dto;
    }
}

