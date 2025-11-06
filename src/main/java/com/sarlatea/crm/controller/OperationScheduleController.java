package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.OperationScheduleDTO;
import com.sarlatea.crm.service.OperationScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for OperationSchedule operations
 */
@RestController
@RequestMapping("/api/operation-schedules")
@RequiredArgsConstructor
@Slf4j
public class OperationScheduleController {

    private final OperationScheduleService operationScheduleService;

    @GetMapping
    public ResponseEntity<List<OperationScheduleDTO>> getAllSchedules() {
        log.info("GET request to fetch all operation schedules");
        List<OperationScheduleDTO> schedules = operationScheduleService.getAllSchedules();
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OperationScheduleDTO> getScheduleById(@PathVariable String id) {
        log.info("GET request to fetch operation schedule with id: {}", id);
        OperationScheduleDTO schedule = operationScheduleService.getScheduleById(id);
        return ResponseEntity.ok(schedule);
    }

    @PostMapping
    public ResponseEntity<OperationScheduleDTO> createSchedule(@RequestBody OperationScheduleDTO scheduleDTO) {
        log.info("POST request to create new operation schedule: {}", scheduleDTO.getPeriodName());
        OperationScheduleDTO createdSchedule = operationScheduleService.createSchedule(scheduleDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSchedule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationScheduleDTO> updateSchedule(
            @PathVariable String id,
            @RequestBody OperationScheduleDTO scheduleDTO) {
        log.info("PUT request to update operation schedule with id: {}", id);
        OperationScheduleDTO updatedSchedule = operationScheduleService.updateSchedule(id, scheduleDTO);
        return ResponseEntity.ok(updatedSchedule);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable String id) {
        log.info("DELETE request to delete operation schedule with id: {}", id);
        operationScheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/generate-assignments")
    public ResponseEntity<OperationScheduleDTO> generateAssignments(@PathVariable String id) {
        log.info("POST request to generate work assignments for schedule: {}", id);
        OperationScheduleDTO schedule = operationScheduleService.generateAssignments(id);
        return ResponseEntity.ok(schedule);
    }
}

