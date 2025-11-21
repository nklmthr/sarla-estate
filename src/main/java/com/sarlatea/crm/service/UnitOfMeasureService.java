package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.UnitOfMeasureDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.UnitOfMeasure;
import com.sarlatea.crm.repository.UnitOfMeasureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for UnitOfMeasure operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UnitOfMeasureService {

    private final UnitOfMeasureRepository unitOfMeasureRepository;

    @Transactional(readOnly = true)
    public List<UnitOfMeasureDTO> getAllUnits() {
        log.debug("Fetching all non-deleted units");
        return unitOfMeasureRepository.findByDeletedFalseOrderByDisplayOrderAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UnitOfMeasureDTO> getActiveUnits() {
        log.debug("Fetching active units");
        return unitOfMeasureRepository.findActiveUnits().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UnitOfMeasureDTO getUnitById(String id) {
        log.debug("Fetching unit with id: {}", id);
        UnitOfMeasure unit = unitOfMeasureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit of Measure not found with id: " + id));
        return convertToDTO(unit);
    }

    @Transactional
    public UnitOfMeasureDTO createUnit(UnitOfMeasureDTO unitDTO) {
        log.debug("Creating new unit: {}", unitDTO.getName());
        
        // Check if code already exists
        if (unitOfMeasureRepository.existsByCodeAndDeletedFalse(unitDTO.getCode())) {
            throw new DataIntegrityException("Unit code already exists: " + unitDTO.getCode());
        }

        UnitOfMeasure unit = convertToEntity(unitDTO);
        unit.setDeleted(false); // Explicitly set for new units
        UnitOfMeasure savedUnit = unitOfMeasureRepository.save(unit);
        
        log.info("Created unit: {} with code: {}", savedUnit.getName(), savedUnit.getCode());
        return convertToDTO(savedUnit);
    }

    @Transactional
    public UnitOfMeasureDTO updateUnit(String id, UnitOfMeasureDTO unitDTO) {
        log.debug("Updating unit with id: {}", id);
        
        UnitOfMeasure unit = unitOfMeasureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit of Measure not found with id: " + id));

        // Check if code is being changed and if it already exists
        if (!unit.getCode().equals(unitDTO.getCode()) && 
            unitOfMeasureRepository.existsByCodeAndDeletedFalse(unitDTO.getCode())) {
            throw new DataIntegrityException("Unit code already exists: " + unitDTO.getCode());
        }

        updateUnitFields(unit, unitDTO);
        UnitOfMeasure updatedUnit = unitOfMeasureRepository.save(unit);
        
        log.info("Updated unit: {}", updatedUnit.getName());
        return convertToDTO(updatedUnit);
    }

    @Transactional
    public void deleteUnit(String id) {
        log.info("Soft deleting unit with id: {}", id);
        
        UnitOfMeasure unit = unitOfMeasureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit of Measure not found with id: " + id));

        // Soft delete - set deleted flag and modify code to free up constraint
        unit.setDeleted(true);
        String originalCode = unit.getCode();
        unit.setCode(originalCode + "_DELETED_" + System.currentTimeMillis());
        
        unitOfMeasureRepository.save(unit);
        log.info("Unit '{}' marked as deleted", originalCode);
    }

    private UnitOfMeasureDTO convertToDTO(UnitOfMeasure unit) {
        UnitOfMeasureDTO dto = new UnitOfMeasureDTO();
        dto.setId(unit.getId());
        dto.setCode(unit.getCode());
        dto.setName(unit.getName());
        dto.setDescription(unit.getDescription());
        dto.setIsActive(unit.getIsActive());
        dto.setDisplayOrder(unit.getDisplayOrder());
        return dto;
    }

    private UnitOfMeasure convertToEntity(UnitOfMeasureDTO dto) {
        UnitOfMeasure unit = new UnitOfMeasure();
        unit.setCode(dto.getCode());
        unit.setName(dto.getName());
        unit.setDescription(dto.getDescription());
        unit.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        unit.setDisplayOrder(dto.getDisplayOrder());
        return unit;
    }

    private void updateUnitFields(UnitOfMeasure unit, UnitOfMeasureDTO dto) {
        unit.setCode(dto.getCode());
        unit.setName(dto.getName());
        unit.setDescription(dto.getDescription());
        unit.setIsActive(dto.getIsActive());
        unit.setDisplayOrder(dto.getDisplayOrder());
    }
}

