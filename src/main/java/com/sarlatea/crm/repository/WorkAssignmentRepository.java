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

    // Find only non-deleted assignments
    List<WorkAssignment> findByDeletedFalse();

    List<WorkAssignment> findByAssignedEmployeeIdAndDeletedFalse(String employeeId);

    List<WorkAssignment> findByAssignmentStatusAndDeletedFalse(WorkAssignment.AssignmentStatus status);

    List<WorkAssignment> findByAssignmentDateAndDeletedFalse(LocalDate date);

    @Query("SELECT wa FROM WorkAssignment wa " +
           "LEFT JOIN wa.assignedEmployee e " +
           "WHERE wa.assignmentDate BETWEEN :startDate AND :endDate " +
           "AND wa.deleted = false " +
           "ORDER BY e.name ASC")
    List<WorkAssignment> findByAssignmentDateBetweenAndDeletedFalse(@Param("startDate") LocalDate startDate, 
                                                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT wa FROM WorkAssignment wa WHERE wa.assignedEmployee.id = :employeeId " +
           "AND wa.assignmentDate BETWEEN :startDate AND :endDate " +
           "AND wa.deleted = false")
    List<WorkAssignment> findEmployeeAssignmentsInDateRange(@Param("employeeId") String employeeId,
                                                              @Param("startDate") LocalDate startDate,
                                                              @Param("endDate") LocalDate endDate);

    @Query("SELECT wa FROM WorkAssignment wa WHERE wa.assignmentStatus = :status " +
           "AND wa.assignmentDate = :date " +
           "AND wa.deleted = false")
    List<WorkAssignment> findByStatusAndDate(@Param("status") WorkAssignment.AssignmentStatus status,
                                               @Param("date") LocalDate date);
    
    /**
     * Find assignments in date range for specific employees (database-level filtering)
     * Uses IN clause for efficient filtering by multiple employee IDs
     */
    @Query("SELECT wa FROM WorkAssignment wa " +
           "WHERE wa.assignedEmployee.id IN :employeeIds " +
           "AND wa.assignmentDate BETWEEN :startDate AND :endDate " +
           "AND wa.deleted = false " +
           "ORDER BY wa.assignedEmployee.name ASC, wa.assignmentDate ASC")
    List<WorkAssignment> findByEmployeeIdsAndDateRange(@Param("employeeIds") List<String> employeeIds,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);
    
    // Count non-deleted assignments for a specific work activity
    long countByWorkActivityAndDeletedFalse(WorkActivity workActivity);
    
    /**
     * Find all assignments (including deleted) in date range for audit report
     * Shows when assignments were created and evaluated
     */
    @Query("SELECT wa FROM WorkAssignment wa " +
           "LEFT JOIN FETCH wa.assignedEmployee e " +
           "WHERE wa.assignmentDate BETWEEN :startDate AND :endDate " +
           "ORDER BY wa.assignedAt DESC, e.name ASC")
    List<WorkAssignment> findAllByAssignmentDateBetweenIncludingDeleted(@Param("startDate") LocalDate startDate, 
                                                                         @Param("endDate") LocalDate endDate);
    
    /**
     * Find only EVALUATED assignments (including deleted) in date range for evaluation report
     * Filters at database level for assignments where firstEvaluatedAt IS NOT NULL
     */
    @Query("SELECT wa FROM WorkAssignment wa " +
           "LEFT JOIN FETCH wa.assignedEmployee e " +
           "WHERE wa.assignmentDate BETWEEN :startDate AND :endDate " +
           "AND wa.firstEvaluatedAt IS NOT NULL " +
           "ORDER BY wa.firstEvaluatedAt DESC, e.name ASC")
    List<WorkAssignment> findEvaluatedAssignmentsByDateRange(@Param("startDate") LocalDate startDate, 
                                                              @Param("endDate") LocalDate endDate);
}

