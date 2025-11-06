package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.WorkActivityDTO;
import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.service.WorkActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for WorkActivity operations
 */
@RestController
@RequestMapping("/api/work-activities")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true")
public class WorkActivityController {

    private final WorkActivityService workActivityService;

    // Explicit OPTIONS handler for CORS preflight
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleOptions() {
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<WorkActivityDTO>> getAllWorkActivities() {
        log.info("GET request to fetch all work activities");
        List<WorkActivityDTO> workActivities = workActivityService.getAllWorkActivities();
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkActivityDTO> getWorkActivityById(@PathVariable String id) {
        log.info("GET request to fetch work activity with id: {}", id);
        WorkActivityDTO workActivity = workActivityService.getWorkActivityById(id);
        return ResponseEntity.ok(workActivity);
    }

    @PostMapping
    public ResponseEntity<WorkActivityDTO> createWorkActivity(@RequestBody WorkActivityDTO workActivityDTO) {
        log.info("POST request to create new work activity: {}", workActivityDTO.getName());
        WorkActivityDTO createdWorkActivity = workActivityService.createWorkActivity(workActivityDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdWorkActivity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkActivityDTO> updateWorkActivity(
            @PathVariable String id,
            @RequestBody WorkActivityDTO workActivityDTO) {
        log.info("PUT request to update work activity with id: {}", id);
        WorkActivityDTO updatedWorkActivity = workActivityService.updateWorkActivity(id, workActivityDTO);
        return ResponseEntity.ok(updatedWorkActivity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkActivity(@PathVariable String id) {
        log.info("DELETE request to delete work activity with id: {}", id);
        workActivityService.deleteWorkActivity(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<WorkActivityDTO>> searchWorkActivities(@RequestParam String term) {
        log.info("GET request to search work activities with term: {}", term);
        List<WorkActivityDTO> workActivities = workActivityService.searchWorkActivities(term);
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<WorkActivityDTO>> getWorkActivitiesByStatus(
            @PathVariable WorkActivity.Status status) {
        log.info("GET request to fetch work activities by status: {}", status);
        List<WorkActivityDTO> workActivities = workActivityService.getWorkActivitiesByStatus(status);
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/by-season/{season}")
    public ResponseEntity<List<WorkActivityDTO>> getWorkActivitiesBySeason(
            @PathVariable WorkActivity.Season season) {
        log.info("GET request to fetch work activities by season: {}", season);
        List<WorkActivityDTO> workActivities = workActivityService.getWorkActivitiesBySeason(season);
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/by-work-shift/{workShift}")
    public ResponseEntity<List<WorkActivityDTO>> getWorkActivitiesByWorkShift(
            @PathVariable WorkActivity.WorkShift workShift) {
        log.info("GET request to fetch work activities by work shift: {}", workShift);
        List<WorkActivityDTO> workActivities = workActivityService.getWorkActivitiesByWorkShift(workShift);
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/by-frequency/{frequency}")
    public ResponseEntity<List<WorkActivityDTO>> getWorkActivitiesByFrequency(
            @PathVariable WorkActivity.Frequency frequency) {
        log.info("GET request to fetch work activities by frequency: {}", frequency);
        List<WorkActivityDTO> workActivities = workActivityService.getWorkActivitiesByFrequency(frequency);
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/schedulable")
    public ResponseEntity<List<WorkActivityDTO>> getSchedulableActivities() {
        log.info("GET request to fetch schedulable work activities");
        List<WorkActivityDTO> workActivities = workActivityService.getSchedulableActivities();
        return ResponseEntity.ok(workActivities);
    }

    @GetMapping("/by-frequency-and-shift")
    public ResponseEntity<List<WorkActivityDTO>> getActiveByFrequencyAndWorkShift(
            @RequestParam WorkActivity.Frequency frequency,
            @RequestParam WorkActivity.WorkShift workShift) {
        log.info("GET request to fetch active work activities by frequency: {} and work shift: {}", frequency, workShift);
        List<WorkActivityDTO> workActivities = workActivityService.getActiveByFrequencyAndWorkShift(frequency, workShift);
        return ResponseEntity.ok(workActivities);
    }
}

