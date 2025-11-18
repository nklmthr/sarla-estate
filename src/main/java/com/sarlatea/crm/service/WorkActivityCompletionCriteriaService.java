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
    private final WorkActivityService workActivityService;

    @Transactional(readOnly = true)
    public List<WorkActivityCompletionCriteriaDTO> getCriteriaByWorkActivityId(String workActivityId) {
        log.debug("Fetching completion criteria for work activity: {}", workActivityId);
        return criteriaRepository.findByWorkActivityId(workActivityId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkActivityCompletionCriteriaDTO getActiveCriteriaByWorkActivityId(String workActivityId) {
        log.debug("Fetching active completion criteria for work activity: {}", workActivityId);
        return criteriaRepository.findActiveByWorkActivityId(workActivityId)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public WorkActivityCompletionCriteriaDTO createCriteria(String workActivityId, WorkActivityCompletionCriteriaDTO criteriaDTO) {
        log.debug("Creating completion criteria for work activity: {}", workActivityId);
        
        WorkActivity workActivity = workActivityRepository.findById(workActivityId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + workActivityId));

        // If creating an active criteria, deactivate all existing active criteria
        if (criteriaDTO.getIsActive() != null && criteriaDTO.getIsActive()) {
            deactivateExistingActiveCriteria(workActivityId);
        }

        WorkActivityCompletionCriteria criteria = convertToEntity(criteriaDTO, workActivity);
        WorkActivityCompletionCriteria savedCriteria = criteriaRepository.save(criteria);
        
        log.info("Created completion criteria with id: {} for work activity: {}", savedCriteria.getId(), workActivityId);
        return convertToDTO(savedCriteria);
    }

    @Transactional
    public WorkActivityCompletionCriteriaDTO updateCriteria(String id, WorkActivityCompletionCriteriaDTO criteriaDTO) {
        log.debug("Updating completion criteria with id: {}", id);
        
        WorkActivityCompletionCriteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Completion criteria not found with id: " + id));

        // If activating this criteria, deactivate all other active criteria for the same work activity
        if (criteriaDTO.getIsActive() != null && criteriaDTO.getIsActive() && !criteria.getIsActive()) {
            deactivateExistingActiveCriteria(criteria.getWorkActivity().getId());
        }

        updateCriteriaFields(criteria, criteriaDTO);
        WorkActivityCompletionCriteria updatedCriteria = criteriaRepository.save(criteria);
        
        log.info("Updated completion criteria with id: {}", id);
        return convertToDTO(updatedCriteria);
    }

    @Transactional
    public void deleteCriteria(String id) {
        log.debug("Deleting completion criteria with id: {}", id);
        
        WorkActivityCompletionCriteria criteria = criteriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Completion criteria not found with id: " + id));

        criteriaRepository.deleteById(id);
        log.info("Deleted completion criteria with id: {}", id);
    }

    @Transactional
    public void deactivateExistingActiveCriteria(String workActivityId) {
        log.debug("Deactivating existing active criteria for work activity: {}", workActivityId);
        
        criteriaRepository.findActiveByWorkActivityId(workActivityId).ifPresent(activeCriteria -> {
            activeCriteria.setIsActive(false);
            activeCriteria.setEndDate(LocalDate.now());
            criteriaRepository.save(activeCriteria);
            log.info("Deactivated criteria with id: {}", activeCriteria.getId());
        });
    }

    private WorkActivityCompletionCriteriaDTO convertToDTO(WorkActivityCompletionCriteria criteria) {
        WorkActivityCompletionCriteriaDTO dto = new WorkActivityCompletionCriteriaDTO();
        dto.setId(criteria.getId());
        dto.setWorkActivityId(criteria.getWorkActivity().getId());
        dto.setUnit(criteria.getUnit());
        dto.setValue(criteria.getValue());
        dto.setStartDate(criteria.getStartDate());
        dto.setEndDate(criteria.getEndDate());
        dto.setIsActive(criteria.getIsActive());
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
        criteria.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        criteria.setNotes(dto.getNotes());
        return criteria;
    }

    private void updateCriteriaFields(WorkActivityCompletionCriteria criteria, WorkActivityCompletionCriteriaDTO dto) {
        criteria.setUnit(dto.getUnit());
        criteria.setValue(dto.getValue());
        criteria.setStartDate(dto.getStartDate());
        criteria.setEndDate(dto.getEndDate());
        criteria.setIsActive(dto.getIsActive());
        criteria.setNotes(dto.getNotes());
    }
}

