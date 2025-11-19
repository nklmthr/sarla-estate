package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.EmployeeTypeDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.EmployeeType;
import com.sarlatea.crm.repository.EmployeeTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for EmployeeType master data operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeTypeService {

    private final EmployeeTypeRepository employeeTypeRepository;

    @Transactional(readOnly = true)
    public List<EmployeeTypeDTO> getAllEmployeeTypes() {
        log.debug("Fetching all employee types");
        return employeeTypeRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeTypeDTO> getActiveEmployeeTypes() {
        log.debug("Fetching active employee types");
        return employeeTypeRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeTypeDTO getEmployeeTypeById(String id) {
        log.debug("Fetching employee type with id: {}", id);
        EmployeeType employeeType = employeeTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee type not found with id: " + id));
        return convertToDTO(employeeType);
    }

    @Transactional
    public EmployeeTypeDTO createEmployeeType(EmployeeTypeDTO dto) {
        log.debug("Creating new employee type: {}", dto.getName());
        
        // Check if code already exists
        if (employeeTypeRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Employee type with code '" + dto.getCode() + "' already exists");
        }
        
        EmployeeType employeeType = convertToEntity(dto);
        EmployeeType savedEmployeeType = employeeTypeRepository.save(employeeType);
        return convertToDTO(savedEmployeeType);
    }

    @Transactional
    public EmployeeTypeDTO updateEmployeeType(String id, EmployeeTypeDTO dto) {
        log.debug("Updating employee type with id: {}", id);
        EmployeeType employeeType = employeeTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee type not found with id: " + id));
        
        // Check if code is being changed and if new code already exists
        if (!employeeType.getCode().equals(dto.getCode()) && 
            employeeTypeRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Employee type with code '" + dto.getCode() + "' already exists");
        }
        
        updateEmployeeTypeFields(employeeType, dto);
        EmployeeType updatedEmployeeType = employeeTypeRepository.save(employeeType);
        return convertToDTO(updatedEmployeeType);
    }

    @Transactional
    public void deleteEmployeeType(String id) {
        log.debug("Deleting employee type with id: {}", id);
        if (!employeeTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee type not found with id: " + id);
        }
        employeeTypeRepository.deleteById(id);
    }

    @Transactional
    public EmployeeTypeDTO toggleActiveStatus(String id) {
        log.debug("Toggling active status for employee type with id: {}", id);
        EmployeeType employeeType = employeeTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee type not found with id: " + id));
        
        employeeType.setIsActive(!employeeType.getIsActive());
        EmployeeType updatedEmployeeType = employeeTypeRepository.save(employeeType);
        return convertToDTO(updatedEmployeeType);
    }

    private EmployeeTypeDTO convertToDTO(EmployeeType employeeType) {
        EmployeeTypeDTO dto = new EmployeeTypeDTO();
        dto.setId(employeeType.getId());
        dto.setCode(employeeType.getCode());
        dto.setName(employeeType.getName());
        dto.setDescription(employeeType.getDescription());
        dto.setIsActive(employeeType.getIsActive());
        dto.setDisplayOrder(employeeType.getDisplayOrder());
        return dto;
    }

    private EmployeeType convertToEntity(EmployeeTypeDTO dto) {
        EmployeeType employeeType = new EmployeeType();
        employeeType.setCode(dto.getCode());
        employeeType.setName(dto.getName());
        employeeType.setDescription(dto.getDescription());
        employeeType.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        employeeType.setDisplayOrder(dto.getDisplayOrder());
        return employeeType;
    }

    private void updateEmployeeTypeFields(EmployeeType employeeType, EmployeeTypeDTO dto) {
        employeeType.setCode(dto.getCode());
        employeeType.setName(dto.getName());
        employeeType.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            employeeType.setIsActive(dto.getIsActive());
        }
        employeeType.setDisplayOrder(dto.getDisplayOrder());
    }
}

