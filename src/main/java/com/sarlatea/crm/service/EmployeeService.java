package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.EmployeeDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.Employee;
import com.sarlatea.crm.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for Employee operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllEmployees() {
        log.debug("Fetching all employees");
        return employeeRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(String id) {
        log.debug("Fetching employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return convertToDTO(employee);
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO employeeDTO) {
        log.debug("Creating new employee: {}", employeeDTO.getName());
        Employee employee = convertToEntity(employeeDTO);
        Employee savedEmployee = employeeRepository.save(employee);
        return convertToDTO(savedEmployee);
    }

    @Transactional
    public EmployeeDTO updateEmployee(String id, EmployeeDTO employeeDTO) {
        log.debug("Updating employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        
        updateEmployeeFields(employee, employeeDTO);
        Employee updatedEmployee = employeeRepository.save(employee);
        return convertToDTO(updatedEmployee);
    }

    @Transactional
    public void deleteEmployee(String id) {
        log.debug("Deleting employee with id: {}", id);
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDTO> searchEmployees(String searchTerm) {
        log.debug("Searching employees with term: {}", searchTerm);
        return employeeRepository.searchEmployees(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] getEmployeePhoto(String id) {
        log.debug("Fetching photo for employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        return employee.getIdCardPhoto();
    }

    @Transactional
    public void updateEmployeePhoto(String id, byte[] photo) {
        log.debug("Updating photo for employee with id: {}", id);
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
        employee.setIdCardPhoto(photo);
        employeeRepository.save(employee);
    }

    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setName(employee.getName());
        dto.setPhone(employee.getPhone());
        dto.setPfAccountId(employee.getPfAccountId());
        dto.setIdCardType(employee.getIdCardType());
        dto.setIdCardValue(employee.getIdCardValue());
        // Note: idCardPhoto (byte[]) not included in DTO for typical list/get operations
        return dto;
    }

    private Employee convertToEntity(EmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setName(dto.getName());
        employee.setPhone(dto.getPhone());
        employee.setPfAccountId(dto.getPfAccountId());
        employee.setIdCardType(dto.getIdCardType());
        employee.setIdCardValue(dto.getIdCardValue());
        return employee;
    }

    private void updateEmployeeFields(Employee employee, EmployeeDTO dto) {
        employee.setName(dto.getName());
        employee.setPhone(dto.getPhone());
        employee.setPfAccountId(dto.getPfAccountId());
        employee.setIdCardType(dto.getIdCardType());
        employee.setIdCardValue(dto.getIdCardValue());
    }
}

