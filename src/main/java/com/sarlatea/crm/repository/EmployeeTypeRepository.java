package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.EmployeeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for EmployeeType master data
 */
@Repository
public interface EmployeeTypeRepository extends JpaRepository<EmployeeType, String> {

    /**
     * Find all active employee types ordered by display order
     */
    List<EmployeeType> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find employee type by code
     */
    Optional<EmployeeType> findByCode(String code);

    /**
     * Find all employee types ordered by display order
     */
    List<EmployeeType> findAllByOrderByDisplayOrderAsc();

    /**
     * Check if code already exists
     */
    boolean existsByCode(String code);
}

