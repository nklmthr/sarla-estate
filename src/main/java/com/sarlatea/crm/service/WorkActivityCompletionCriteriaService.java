package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.WorkActivityCompletionCriteriaDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkActivityCompletionCriteria;
import com.sarlatea.crm.repository.WorkActivityCompletionCriteriaRepository;
import com.sarlatea.crm.repository.WorkActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkActivityCompletionCriteriaService {

    private final WorkActivityCompletionCriteriaRepository criteriaRepository;
    private final WorkActivityRepository workActivityRepository;

    @Transactional(readOnly = true)
    public List<WorkActivityCompletionCriteriaDTO> getCriteriaByWorkActivityId(String workActivityId) {
        log.debug("Fetching non-deleted completion criteria for work activity: {}", workActivityId);
        return criteriaRepository.findByWorkActivityIdAndDeletedFalse(workActivityId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkActivityCompletionCriteriaDTO getActiveCriteriaByWorkActivityId(String workActivityId) {
        log.debug("Fetching active non-deleted completion criteria for work activity: {}", workActivityId);
        return criteriaRepository.findActiveByWorkActivityId(workActivityId)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public WorkActivityCompletionCriteriaDTO createCriteria(String workActivityId, WorkActivityCompletionCriteriaDTO criteriaDTO) {
        log.debug("Creating completion criteria for work activity: {}", workActivityId);
        
        WorkActivity workActivity = workActivityRepository.findByIdAndDeletedFalse(workActivityId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + workActivityId));

        // Validate no overlapping date ranges
        validateNoOverlappingRanges(workActivityId, criteriaDTO.getStartDate(), criteriaDTO.getEndDate(), null);

        WorkActivityCompletionCriteria criteria = convertToEntity(criteriaDTO, workActivity);
        WorkActivityCompletionCriteria savedCriteria = criteriaRepository.save(criteria);
        
        log.info("Created completion criteria with id: {} for work activity: {}", savedCriteria.getId(), workActivityId);
        return convertToDTO(savedCriteria);
    }

    @Transactional
    public WorkActivityCompletionCriteriaDTO updateCriteria(String id, WorkActivityCompletionCriteriaDTO criteriaDTO) {
        log.debug("Updating completion criteria with id: {}", id);
        
        WorkActivityCompletionCriteria criteria = criteriaRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Completion criteria not found with id: " + id));

        // Validate no overlapping date ranges (excluding current criteria)
        validateNoOverlappingRanges(criteria.getWorkActivity().getId(), 
                                   criteriaDTO.getStartDate(), 
                                   criteriaDTO.getEndDate(), 
                                   id);

        updateCriteriaFields(criteria, criteriaDTO);
        WorkActivityCompletionCriteria updatedCriteria = criteriaRepository.save(criteria);
        
        log.info("Updated completion criteria with id: {}", id);
        return convertToDTO(updatedCriteria);
    }

    @Transactional
    public void deleteCriteria(String id) {
        log.info("Soft deleting completion criteria with id: {}", id);
        
        // Verify criteria exists before soft deleting
        WorkActivityCompletionCriteria criteria = criteriaRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Completion criteria not found with id: " + id));

        // Soft delete - set deleted flag instead of removing from database
        criteria.setDeleted(true);
        criteriaRepository.save(criteria);
        log.info("Completion criteria {} marked as deleted for audit purposes", id);
    }

    /**
     * Validates that the given date range does not overlap with existing criteria
     * for the same work activity
     * @throws DataIntegrityException if overlapping ranges are found
     */
    private void validateNoOverlappingRanges(String workActivityId, LocalDate startDate, 
                                            LocalDate endDate, String criteriaId) {
        List<WorkActivityCompletionCriteria> overlapping = criteriaRepository.findOverlappingCriteria(
            workActivityId, startDate, endDate, criteriaId
        );
        
        if (!overlapping.isEmpty()) {
            String message = String.format(
                "Date range overlaps with existing criteria. Start: %s, End: %s conflicts with %d existing criteria.",
                startDate, endDate, overlapping.size()
            );
            log.warn(message);
            throw new DataIntegrityException(message);
        }
    }

    private WorkActivityCompletionCriteriaDTO convertToDTO(WorkActivityCompletionCriteria criteria) {
        WorkActivityCompletionCriteriaDTO dto = new WorkActivityCompletionCriteriaDTO();
        dto.setId(criteria.getId());
        dto.setWorkActivityId(criteria.getWorkActivity().getId());
        dto.setUnit(criteria.getUnit());
        dto.setValue(criteria.getValue());
        dto.setStartDate(criteria.getStartDate());
        dto.setEndDate(criteria.getEndDate());
        // Always calculate isActive based on current date, not the stored value
        dto.setIsActive(criteria.calculateIsActive());
        dto.setNotes(criteria.getNotes());
        return dto;
    }

    private WorkActivityCompletionCriteria convertToEntity(WorkActivityCompletionCriteriaDTO dto, WorkActivity workActivity) {
        WorkActivityCompletionCriteria criteria = new WorkActivityCompletionCriteria();
        criteria.setWorkActivity(workActivity);
        criteria.setUnit(dto.getUnit());
        criteria.setValue(dto.getValue());
        criteria.setStartDate(dto.getStartDate());
        criteria.setEndDate(dto.getEndDate());
        // isActive is calculated automatically in @PrePersist
        criteria.setNotes(dto.getNotes());
        return criteria;
    }

    private void updateCriteriaFields(WorkActivityCompletionCriteria criteria, WorkActivityCompletionCriteriaDTO dto) {
        criteria.setUnit(dto.getUnit());
        criteria.setValue(dto.getValue());
        criteria.setStartDate(dto.getStartDate());
        criteria.setEndDate(dto.getEndDate());
        // isActive is calculated automatically in @PreUpdate
        criteria.setNotes(dto.getNotes());
    }
}

