package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.OperationScheduleDTO;
import com.sarlatea.crm.exception.ResourceNotFoundException;
import com.sarlatea.crm.model.OperationSchedule;
import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkAssignment;
import com.sarlatea.crm.repository.OperationScheduleRepository;
import com.sarlatea.crm.repository.WorkActivityRepository;
import com.sarlatea.crm.repository.WorkAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for OperationSchedule operations and work assignment generation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperationScheduleService {

    private final OperationScheduleRepository operationScheduleRepository;
    private final WorkActivityRepository workActivityRepository;
    private final WorkAssignmentRepository workAssignmentRepository;

    @Transactional(readOnly = true)
    public List<OperationScheduleDTO> getAllSchedules() {
        log.debug("Fetching all operation schedules");
        return operationScheduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OperationScheduleDTO getScheduleById(String id) {
        log.debug("Fetching operation schedule with id: {}", id);
        OperationSchedule schedule = operationScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OperationSchedule not found with id: " + id));
        return convertToDTO(schedule);
    }

    @Transactional
    public OperationScheduleDTO createSchedule(OperationScheduleDTO dto) {
        log.debug("Creating new operation schedule: {}", dto.getPeriodName());
        OperationSchedule schedule = convertToEntity(dto);
        schedule.setStatus(OperationSchedule.ScheduleStatus.DRAFT);
        OperationSchedule savedSchedule = operationScheduleRepository.save(schedule);
        return convertToDTO(savedSchedule);
    }

    @Transactional
    public OperationScheduleDTO updateSchedule(String id, OperationScheduleDTO dto) {
        log.debug("Updating operation schedule with id: {}", id);
        OperationSchedule schedule = operationScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OperationSchedule not found with id: " + id));
        
        updateScheduleFields(schedule, dto);
        OperationSchedule updatedSchedule = operationScheduleRepository.save(schedule);
        return convertToDTO(updatedSchedule);
    }

    @Transactional
    public void deleteSchedule(String id) {
        log.debug("Deleting operation schedule with id: {}", id);
        if (!operationScheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("OperationSchedule not found with id: " + id);
        }
        operationScheduleRepository.deleteById(id);
    }

    @Transactional
    public OperationScheduleDTO generateAssignments(String scheduleId) {
        log.info("Generating work assignments for schedule: {}", scheduleId);
        
        OperationSchedule schedule = operationScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("OperationSchedule not found with id: " + scheduleId));

        // Get activities based on filters
        List<WorkActivity> activities = getFilteredActivities(schedule);
        
        if (activities.isEmpty()) {
            log.warn("No activities found matching the filters for schedule: {}", scheduleId);
            return convertToDTO(schedule);
        }

        // Generate assignments for each day in the schedule period
        List<WorkAssignment> assignments = new ArrayList<>();
        LocalDate currentDate = schedule.getStartDate();
        
        while (!currentDate.isAfter(schedule.getEndDate())) {
            for (WorkActivity activity : activities) {
                if (shouldGenerateForDate(activity, currentDate, schedule.getStartDate())) {
                    WorkAssignment assignment = createAssignment(schedule, activity, currentDate);
                    assignments.add(assignment);
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        // Save all assignments
        workAssignmentRepository.saveAll(assignments);
        schedule.setStatus(OperationSchedule.ScheduleStatus.GENERATED);
        operationScheduleRepository.save(schedule);
        
        log.info("Generated {} work assignments for schedule: {}", assignments.size(), scheduleId);
        
        // Reload schedule with updated assignments count
        schedule = operationScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("OperationSchedule not found with id: " + scheduleId));
        
        return convertToDTO(schedule);
    }

    private List<WorkActivity> getFilteredActivities(OperationSchedule schedule) {
        if (Boolean.TRUE.equals(schedule.getIncludeAllSchedulable())) {
            return workActivityRepository.findSchedulableActivities();
        }

        // Build query based on filters
        if (schedule.getFilterFrequency() != null && schedule.getFilterWorkShift() != null) {
            return workActivityRepository.findActiveByFrequencyAndWorkShift(
                schedule.getFilterFrequency(), 
                schedule.getFilterWorkShift()
            );
        } else if (schedule.getFilterFrequency() != null) {
            return workActivityRepository.findByFrequency(schedule.getFilterFrequency());
        } else if (schedule.getFilterWorkShift() != null) {
            return workActivityRepository.findByWorkShift(schedule.getFilterWorkShift());
        }

        return workActivityRepository.findSchedulableActivities();
    }

    private boolean shouldGenerateForDate(WorkActivity activity, LocalDate date, LocalDate scheduleStart) {
        if (activity.getFrequency() == null) {
            return false;
        }

        long daysSinceStart = ChronoUnit.DAYS.between(scheduleStart, date);
        
        return switch (activity.getFrequency()) {
            case DAILY, MULTIPLE_DAILY -> true;
            case WEEKLY -> daysSinceStart % 7 == 0;
            case BIWEEKLY -> daysSinceStart % 14 == 0;
            case MONTHLY -> date.getDayOfMonth() == scheduleStart.getDayOfMonth();
            case QUARTERLY -> {
                // Generate on the first day of every 3rd month from start
                yield date.getDayOfMonth() == scheduleStart.getDayOfMonth() && 
                      (date.getMonthValue() - scheduleStart.getMonthValue()) % 3 == 0;
            }
            case AS_NEEDED -> date.equals(scheduleStart); // Only on start date
        };
    }

    private WorkAssignment createAssignment(OperationSchedule schedule, WorkActivity activity, LocalDate date) {
        WorkAssignment assignment = new WorkAssignment();
        assignment.setOperationSchedule(schedule);
        assignment.setAssignmentDate(date);
        assignment.copyFromWorkActivity(activity);
        return assignment;
    }

    private OperationScheduleDTO convertToDTO(OperationSchedule schedule) {
        OperationScheduleDTO dto = new OperationScheduleDTO();
        dto.setId(schedule.getId());
        dto.setPeriodName(schedule.getPeriodName());
        dto.setStartDate(schedule.getStartDate());
        dto.setEndDate(schedule.getEndDate());
        dto.setDescription(schedule.getDescription());
        dto.setPeriodType(schedule.getPeriodType());
        dto.setStatus(schedule.getStatus());
        dto.setFilterFrequency(schedule.getFilterFrequency());
        dto.setFilterWorkShift(schedule.getFilterWorkShift());
        dto.setFilterSeason(schedule.getFilterSeason());
        dto.setFilterActivityStatus(schedule.getFilterActivityStatus());
        dto.setIncludeAllSchedulable(schedule.getIncludeAllSchedulable());
        dto.setTotalAssignmentsCount(schedule.getWorkAssignments() != null ? schedule.getWorkAssignments().size() : 0);
        return dto;
    }

    private OperationSchedule convertToEntity(OperationScheduleDTO dto) {
        OperationSchedule schedule = new OperationSchedule();
        schedule.setPeriodName(dto.getPeriodName());
        schedule.setStartDate(dto.getStartDate());
        schedule.setEndDate(dto.getEndDate());
        schedule.setDescription(dto.getDescription());
        schedule.setPeriodType(dto.getPeriodType() != null ? dto.getPeriodType() : OperationSchedule.PeriodType.CUSTOM);
        schedule.setStatus(dto.getStatus() != null ? dto.getStatus() : OperationSchedule.ScheduleStatus.DRAFT);
        schedule.setFilterFrequency(dto.getFilterFrequency());
        schedule.setFilterWorkShift(dto.getFilterWorkShift());
        schedule.setFilterSeason(dto.getFilterSeason());
        schedule.setFilterActivityStatus(dto.getFilterActivityStatus());
        schedule.setIncludeAllSchedulable(dto.getIncludeAllSchedulable());
        return schedule;
    }

    private void updateScheduleFields(OperationSchedule schedule, OperationScheduleDTO dto) {
        schedule.setPeriodName(dto.getPeriodName());
        schedule.setStartDate(dto.getStartDate());
        schedule.setEndDate(dto.getEndDate());
        schedule.setDescription(dto.getDescription());
        schedule.setPeriodType(dto.getPeriodType());
        schedule.setStatus(dto.getStatus());
        schedule.setFilterFrequency(dto.getFilterFrequency());
        schedule.setFilterWorkShift(dto.getFilterWorkShift());
        schedule.setFilterSeason(dto.getFilterSeason());
        schedule.setFilterActivityStatus(dto.getFilterActivityStatus());
        schedule.setIncludeAllSchedulable(dto.getIncludeAllSchedulable());
    }
}

