package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.EmployeeSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for EmployeeSalary entity
 */
@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, String> {

    /**
     * Find current active salary for an employee (no end date)
     */
    @Query("SELECT es FROM EmployeeSalary es WHERE es.employee.id = :employeeId " +
           "AND es.endDate IS NULL AND es.isActive = true")
    Optional<EmployeeSalary> findCurrentSalaryByEmployeeId(@Param("employeeId") String employeeId);

    /**
     * Find complete salary history for an employee, ordered by start date descending
     */
    @Query("SELECT es FROM EmployeeSalary es WHERE es.employee.id = :employeeId " +
           "ORDER BY es.startDate DESC")
    List<EmployeeSalary> findSalaryHistoryByEmployeeId(@Param("employeeId") String employeeId);

    /**
     * Find salary record that was active on a specific date
     */
    @Query("SELECT es FROM EmployeeSalary es WHERE es.employee.id = :employeeId " +
           "AND es.startDate <= :date " +
           "AND (es.endDate IS NULL OR es.endDate >= :date)")
    Optional<EmployeeSalary> findSalaryForEmployeeOnDate(@Param("employeeId") String employeeId, 
                                                          @Param("date") LocalDate date);

    /**
     * Find all active salaries (for all employees)
     */
    @Query("SELECT es FROM EmployeeSalary es WHERE es.endDate IS NULL AND es.isActive = true")
    List<EmployeeSalary> findAllActiveSalaries();

    /**
     * Find all salary changes in a date range
     */
    @Query("SELECT es FROM EmployeeSalary es WHERE es.startDate BETWEEN :startDate AND :endDate " +
           "ORDER BY es.startDate DESC")
    List<EmployeeSalary> findSalaryChangesInDateRange(@Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate);

    /**
     * Check if employee has an active salary
     */
    @Query("SELECT CASE WHEN COUNT(es) > 0 THEN true ELSE false END FROM EmployeeSalary es " +
           "WHERE es.employee.id = :employeeId AND es.endDate IS NULL AND es.isActive = true")
    boolean hasActiveSalary(@Param("employeeId") String employeeId);
}

