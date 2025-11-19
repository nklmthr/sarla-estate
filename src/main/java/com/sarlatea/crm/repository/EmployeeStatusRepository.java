package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for EmployeeStatus master data
 */
@Repository
public interface EmployeeStatusRepository extends JpaRepository<EmployeeStatus, String> {

    /**
     * Find all active employee statuses ordered by display order
     */
    List<EmployeeStatus> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find employee status by code
     */
    Optional<EmployeeStatus> findByCode(String code);

    /**
     * Find all employee statuses ordered by display order
     */
    List<EmployeeStatus> findAllByOrderByDisplayOrderAsc();

    /**
     * Check if code already exists
     */
    boolean existsByCode(String code);
}

