package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.WorkActivity;
import com.sarlatea.crm.model.WorkAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for WorkAssignment entity
 */
@Repository
public interface WorkAssignmentRepository extends JpaRepository<WorkAssignment, String> {

    List<WorkAssignment> findByAssignedEmployeeId(String employeeId);

    List<WorkAssignment> findByAssignmentStatus(WorkAssignment.AssignmentStatus status);

    List<WorkAssignment> findByAssignmentDate(LocalDate date);

    List<WorkAssignment> findByAssignmentDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT wa FROM WorkAssignment wa WHERE wa.assignedEmployee.id = :employeeId " +
           "AND wa.assignmentDate BETWEEN :startDate AND :endDate")
    List<WorkAssignment> findEmployeeAssignmentsInDateRange(@Param("employeeId") String employeeId,
                                                              @Param("startDate") LocalDate startDate,
                                                              @Param("endDate") LocalDate endDate);

    @Query("SELECT wa FROM WorkAssignment wa WHERE wa.assignmentStatus = :status " +
           "AND wa.assignmentDate = :date")
    List<WorkAssignment> findByStatusAndDate(@Param("status") WorkAssignment.AssignmentStatus status,
                                               @Param("date") LocalDate date);

    @Query("SELECT wa FROM WorkAssignment wa WHERE wa.assignmentStatus = 'UNASSIGNED' " +
           "AND wa.assignmentDate >= :startDate")
    List<WorkAssignment> findUnassignedFromDate(@Param("startDate") LocalDate startDate);
    
    // Count assignments for a specific work activity
    long countByWorkActivity(WorkActivity workActivity);
}

