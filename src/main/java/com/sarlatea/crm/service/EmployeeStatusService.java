package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.EmployeeStatusDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.EmployeeStatus;
import com.sarlatea.crm.repository.EmployeeStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for EmployeeStatus master data operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeStatusService {

    private final EmployeeStatusRepository employeeStatusRepository;

    @Transactional(readOnly = true)
    public List<EmployeeStatusDTO> getAllEmployeeStatuses() {
        log.debug("Fetching all employee statuses");
        return employeeStatusRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeStatusDTO> getActiveEmployeeStatuses() {
        log.debug("Fetching active employee statuses");
        return employeeStatusRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeStatusDTO getEmployeeStatusById(String id) {
        log.debug("Fetching employee status with id: {}", id);
        EmployeeStatus employeeStatus = employeeStatusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee status not found with id: " + id));
        return convertToDTO(employeeStatus);
    }

    @Transactional
    public EmployeeStatusDTO createEmployeeStatus(EmployeeStatusDTO dto) {
        log.debug("Creating new employee status: {}", dto.getName());
        
        // Check if code already exists
        if (employeeStatusRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Employee status with code '" + dto.getCode() + "' already exists");
        }
        
        EmployeeStatus employeeStatus = convertToEntity(dto);
        EmployeeStatus savedEmployeeStatus = employeeStatusRepository.save(employeeStatus);
        return convertToDTO(savedEmployeeStatus);
    }

    @Transactional
    public EmployeeStatusDTO updateEmployeeStatus(String id, EmployeeStatusDTO dto) {
        log.debug("Updating employee status with id: {}", id);
        EmployeeStatus employeeStatus = employeeStatusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee status not found with id: " + id));
        
        // Check if code is being changed and if new code already exists
        if (!employeeStatus.getCode().equals(dto.getCode()) && 
            employeeStatusRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Employee status with code '" + dto.getCode() + "' already exists");
        }
        
        updateEmployeeStatusFields(employeeStatus, dto);
        EmployeeStatus updatedEmployeeStatus = employeeStatusRepository.save(employeeStatus);
        return convertToDTO(updatedEmployeeStatus);
    }

    @Transactional
    public void deleteEmployeeStatus(String id) {
        log.debug("Deleting employee status with id: {}", id);
        if (!employeeStatusRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee status not found with id: " + id);
        }
        employeeStatusRepository.deleteById(id);
    }

    @Transactional
    public EmployeeStatusDTO toggleActiveStatus(String id) {
        log.debug("Toggling active status for employee status with id: {}", id);
        EmployeeStatus employeeStatus = employeeStatusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee status not found with id: " + id));
        
        employeeStatus.setIsActive(!employeeStatus.getIsActive());
        EmployeeStatus updatedEmployeeStatus = employeeStatusRepository.save(employeeStatus);
        return convertToDTO(updatedEmployeeStatus);
    }

    private EmployeeStatusDTO convertToDTO(EmployeeStatus employeeStatus) {
        EmployeeStatusDTO dto = new EmployeeStatusDTO();
        dto.setId(employeeStatus.getId());
        dto.setCode(employeeStatus.getCode());
        dto.setName(employeeStatus.getName());
        dto.setDescription(employeeStatus.getDescription());
        dto.setIsActive(employeeStatus.getIsActive());
        dto.setDisplayOrder(employeeStatus.getDisplayOrder());
        return dto;
    }

    private EmployeeStatus convertToEntity(EmployeeStatusDTO dto) {
        EmployeeStatus employeeStatus = new EmployeeStatus();
        employeeStatus.setCode(dto.getCode());
        employeeStatus.setName(dto.getName());
        employeeStatus.setDescription(dto.getDescription());
        employeeStatus.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        employeeStatus.setDisplayOrder(dto.getDisplayOrder());
        return employeeStatus;
    }

    private void updateEmployeeStatusFields(EmployeeStatus employeeStatus, EmployeeStatusDTO dto) {
        employeeStatus.setCode(dto.getCode());
        employeeStatus.setName(dto.getName());
        employeeStatus.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            employeeStatus.setIsActive(dto.getIsActive());
        }
        employeeStatus.setDisplayOrder(dto.getDisplayOrder());
    }
}

