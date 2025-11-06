package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.OperationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for OperationSchedule entity
 */
@Repository
public interface OperationScheduleRepository extends JpaRepository<OperationSchedule, String> {

    List<OperationSchedule> findByStatus(OperationSchedule.ScheduleStatus status);

    List<OperationSchedule> findByPeriodType(OperationSchedule.PeriodType periodType);

    @Query("SELECT os FROM OperationSchedule os WHERE os.startDate <= :date AND os.endDate >= :date")
    List<OperationSchedule> findActiveSchedulesForDate(@Param("date") LocalDate date);

    @Query("SELECT os FROM OperationSchedule os WHERE os.endDate >= :startDate AND os.startDate <= :endDate")
    List<OperationSchedule> findSchedulesInDateRange(@Param("startDate") LocalDate startDate, 
                                                       @Param("endDate") LocalDate endDate);

    @Query("SELECT os FROM OperationSchedule os WHERE LOWER(os.periodName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(os.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<OperationSchedule> searchSchedules(@Param("searchTerm") String searchTerm);

    List<OperationSchedule> findByOrderByStartDateDesc();
}

