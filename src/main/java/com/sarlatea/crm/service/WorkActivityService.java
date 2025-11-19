package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.WorkActivityCompletionCriteriaDTO;
import com.sarlatea.crm.dto.WorkActivityDTO;
import com.sarlatea.crm.exception.DataIntegrityException;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkActivityCompletionCriteria;
import com.sarlatea.crm.repository.WorkActivityCompletionCriteriaRepository;
import com.sarlatea.crm.repository.WorkActivityRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for WorkActivity operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkActivityService {

    private final WorkActivityRepository workActivityRepository;
    private final WorkAssignmentRepository workAssignmentRepository;
    private final WorkActivityCompletionCriteriaRepository completionCriteriaRepository;

    @Transactional(readOnly = true)
    public List<WorkActivityDTO> getAllWorkActivities() {
        log.debug("Fetching all non-deleted work activities");
        return workActivityRepository.findAllActive().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkActivityDTO getWorkActivityById(String id) {
        log.debug("Fetching non-deleted work activity with id: {}", id);
        WorkActivity workActivity = workActivityRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + id));
        return convertToDTO(workActivity);
    }

    @Transactional
    public WorkActivityDTO createWorkActivity(WorkActivityDTO workActivityDTO) {
        log.debug("Creating new work activity: {}", workActivityDTO.getName());
        WorkActivity workActivity = convertToEntity(workActivityDTO);
        WorkActivity savedWorkActivity = workActivityRepository.save(workActivity);
        return convertToDTO(savedWorkActivity);
    }

    @Transactional
    public WorkActivityDTO updateWorkActivity(String id, WorkActivityDTO workActivityDTO) {
        log.debug("Updating work activity with id: {}", id);
        WorkActivity workActivity = workActivityRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + id));
        
        updateWorkActivityFields(workActivity, workActivityDTO);
        WorkActivity updatedWorkActivity = workActivityRepository.save(workActivity);
        return convertToDTO(updatedWorkActivity);
    }

    @Transactional
    public void deleteWorkActivity(String id) {
        log.info("Soft deleting work activity with id: {}", id);
        
        // Check if activity exists
        WorkActivity workActivity = workActivityRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + id));
        
        // Soft delete - set deleted flag instead of removing from database
        workActivity.setDeleted(true);
        
        // Also soft delete all completion criteria for this activity
        List<WorkActivityCompletionCriteria> criteria = completionCriteriaRepository.findByWorkActivityIdAndDeletedFalse(workActivity.getId());
        criteria.forEach(c -> c.setDeleted(true));
        completionCriteriaRepository.saveAll(criteria);
        
        workActivityRepository.save(workActivity);
        log.info("Work activity {} and its {} completion criteria marked as deleted for audit purposes", 
                workActivity.getName(), criteria.size());
    }

    @Transactional(readOnly = true)
    public List<WorkActivityDTO> searchWorkActivities(String searchTerm) {
        log.debug("Searching work activities with term: {}", searchTerm);
        return workActivityRepository.searchWorkActivities(searchTerm).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkActivityDTO> getWorkActivitiesByStatus(WorkActivity.Status status) {
        log.debug("Fetching work activities by calculated status: {}", status);
        // Since status is now calculated, filter after fetching
        return workActivityRepository.findAllActive().stream()
                .filter(wa -> wa.getStatus() == status)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    private WorkActivityDTO convertToDTO(WorkActivity workActivity) {
        WorkActivityDTO dto = new WorkActivityDTO();
        dto.setId(workActivity.getId());
        dto.setName(workActivity.getName());
        dto.setDescription(workActivity.getDescription());
        dto.setStatus(workActivity.getStatus()); // Status is now calculated
        dto.setNotes(workActivity.getNotes());
        
        // Convert non-deleted completion criteria only
        List<WorkActivityCompletionCriteriaDTO> criteriaList = workActivity.getCompletionCriteria().stream()
                .filter(c -> !c.getDeleted()) // Filter out deleted criteria
                .map(this::convertCriteriaToDTO)
                .collect(Collectors.toList());
        dto.setCompletionCriteria(criteriaList);
        
        return dto;
    }

    private WorkActivity convertToEntity(WorkActivityDTO dto) {
        WorkActivity workActivity = new WorkActivity();
        workActivity.setName(dto.getName());
        workActivity.setDescription(dto.getDescription());
        // Status is removed - it's now calculated based on completion criteria
        workActivity.setNotes(dto.getNotes());
        return workActivity;
    }

    private void updateWorkActivityFields(WorkActivity workActivity, WorkActivityDTO dto) {
        workActivity.setName(dto.getName());
        workActivity.setDescription(dto.getDescription());
        // Status is removed - it's now calculated based on completion criteria
        workActivity.setNotes(dto.getNotes());
    }

    private WorkActivityCompletionCriteriaDTO convertCriteriaToDTO(WorkActivityCompletionCriteria criteria) {
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

    public WorkActivityCompletionCriteria convertCriteriaDTOToEntity(WorkActivityCompletionCriteriaDTO dto, WorkActivity workActivity) {
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
}

