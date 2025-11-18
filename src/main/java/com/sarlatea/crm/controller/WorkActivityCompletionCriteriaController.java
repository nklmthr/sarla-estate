package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.WorkActivityCompletionCriteriaDTO;
import com.sarlatea.crm.service.WorkActivityCompletionCriteriaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-activities/{workActivityId}/completion-criteria")
@RequiredArgsConstructor
@Slf4j
public class WorkActivityCompletionCriteriaController {

    private final WorkActivityCompletionCriteriaService criteriaService;

    @GetMapping
    public ResponseEntity<List<WorkActivityCompletionCriteriaDTO>> getCriteriaByWorkActivity(
            @PathVariable String workActivityId) {
        log.info("GET request to retrieve completion criteria for work activity: {}", workActivityId);
        List<WorkActivityCompletionCriteriaDTO> criteria = criteriaService.getCriteriaByWorkActivityId(workActivityId);
        return ResponseEntity.ok(criteria);
    }

    @GetMapping("/active")
    public ResponseEntity<WorkActivityCompletionCriteriaDTO> getActiveCriteria(
            @PathVariable String workActivityId) {
        log.info("GET request to retrieve active completion criteria for work activity: {}", workActivityId);
        WorkActivityCompletionCriteriaDTO criteria = criteriaService.getActiveCriteriaByWorkActivityId(workActivityId);
        if (criteria == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(criteria);
    }

    @PostMapping
    public ResponseEntity<WorkActivityCompletionCriteriaDTO> createCriteria(
            @PathVariable String workActivityId,
            @RequestBody WorkActivityCompletionCriteriaDTO criteriaDTO) {
        log.info("POST request to create completion criteria for work activity: {}", workActivityId);
        WorkActivityCompletionCriteriaDTO created = criteriaService.createCriteria(workActivityId, criteriaDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{criteriaId}")
    public ResponseEntity<WorkActivityCompletionCriteriaDTO> updateCriteria(
            @PathVariable String workActivityId,
            @PathVariable String criteriaId,
            @RequestBody WorkActivityCompletionCriteriaDTO criteriaDTO) {
        log.info("PUT request to update completion criteria: {} for work activity: {}", criteriaId, workActivityId);
        WorkActivityCompletionCriteriaDTO updated = criteriaService.updateCriteria(criteriaId, criteriaDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{criteriaId}")
    public ResponseEntity<Void> deleteCriteria(
            @PathVariable String workActivityId,
            @PathVariable String criteriaId) {
        log.info("DELETE request for completion criteria: {} of work activity: {}", criteriaId, workActivityId);
        criteriaService.deleteCriteria(criteriaId);
        return ResponseEntity.noContent().build();
    }
}

