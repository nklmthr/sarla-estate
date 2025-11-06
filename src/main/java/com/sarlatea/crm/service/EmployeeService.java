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

    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setName(employee.getName());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setAddress(employee.getAddress());
        dto.setCity(employee.getCity());
        dto.setState(employee.getState());
        dto.setCountry(employee.getCountry());
        dto.setPostalCode(employee.getPostalCode());
        dto.setDepartment(employee.getDepartment());
        dto.setEmployeeType(employee.getEmployeeType());
        dto.setStatus(employee.getStatus());
        dto.setNotes(employee.getNotes());
        return dto;
    }

    private Employee convertToEntity(EmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setName(dto.getName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setAddress(dto.getAddress());
        employee.setCity(dto.getCity());
        employee.setState(dto.getState());
        employee.setCountry(dto.getCountry());
        employee.setPostalCode(dto.getPostalCode());
        employee.setDepartment(dto.getDepartment());
        employee.setEmployeeType(dto.getEmployeeType());
        employee.setStatus(dto.getStatus() != null ? dto.getStatus() : Employee.EmployeeStatus.ACTIVE);
        employee.setNotes(dto.getNotes());
        return employee;
    }

    private void updateEmployeeFields(Employee employee, EmployeeDTO dto) {
        employee.setName(dto.getName());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setAddress(dto.getAddress());
        employee.setCity(dto.getCity());
        employee.setState(dto.getState());
        employee.setCountry(dto.getCountry());
        employee.setPostalCode(dto.getPostalCode());
        employee.setDepartment(dto.getDepartment());
        employee.setEmployeeType(dto.getEmployeeType());
        employee.setStatus(dto.getStatus());
        employee.setNotes(dto.getNotes());
    }
}

