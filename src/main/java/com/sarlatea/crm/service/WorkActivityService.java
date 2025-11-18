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
        log.debug("Fetching all work activities");
        return workActivityRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkActivityDTO getWorkActivityById(String id) {
        log.debug("Fetching work activity with id: {}", id);
        WorkActivity workActivity = workActivityRepository.findById(id)
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
        WorkActivity workActivity = workActivityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + id));
        
        updateWorkActivityFields(workActivity, workActivityDTO);
        WorkActivity updatedWorkActivity = workActivityRepository.save(workActivity);
        return convertToDTO(updatedWorkActivity);
    }

    @Transactional
    public void deleteWorkActivity(String id) {
        log.debug("Deleting work activity with id: {}", id);
        
        // Check if activity exists
        WorkActivity workActivity = workActivityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkActivity not found with id: " + id));
        
        // Check if there are any work assignments referencing this activity
        long assignmentCount = workAssignmentRepository.countByWorkActivity(workActivity);
        if (assignmentCount > 0) {
            throw new DataIntegrityException(
                "Cannot delete work activity '" + workActivity.getName() + 
                "' because it has " + assignmentCount + " work assignment(s). " +
                "Please delete or reassign the work assignments first, or set the activity status to INACTIVE instead."
            );
        }
        
        try {
            workActivityRepository.deleteById(id);
            log.info("Successfully deleted work activity: {}", workActivity.getName());
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when deleting work activity: {}", id, e);
            throw new DataIntegrityException(
                "Cannot delete work activity due to existing references. " +
                "Consider setting the status to INACTIVE instead.", e
            );
        }
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
        log.debug("Fetching work activities by status: {}", status);
        return workActivityRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    private WorkActivityDTO convertToDTO(WorkActivity workActivity) {
        WorkActivityDTO dto = new WorkActivityDTO();
        dto.setId(workActivity.getId());
        dto.setName(workActivity.getName());
        dto.setDescription(workActivity.getDescription());
        dto.setStatus(workActivity.getStatus());
        dto.setNotes(workActivity.getNotes());
        
        // Convert completion criteria
        List<WorkActivityCompletionCriteriaDTO> criteriaList = workActivity.getCompletionCriteria().stream()
                .map(this::convertCriteriaToDTO)
                .collect(Collectors.toList());
        dto.setCompletionCriteria(criteriaList);
        
        return dto;
    }

    private WorkActivity convertToEntity(WorkActivityDTO dto) {
        WorkActivity workActivity = new WorkActivity();
        workActivity.setName(dto.getName());
        workActivity.setDescription(dto.getDescription());
        workActivity.setStatus(dto.getStatus() != null ? dto.getStatus() : WorkActivity.Status.ACTIVE);
        workActivity.setNotes(dto.getNotes());
        return workActivity;
    }

    private void updateWorkActivityFields(WorkActivity workActivity, WorkActivityDTO dto) {
        workActivity.setName(dto.getName());
        workActivity.setDescription(dto.getDescription());
        workActivity.setStatus(dto.getStatus());
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

