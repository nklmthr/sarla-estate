package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for UnitOfMeasure entity
 */
@Repository
public interface UnitOfMeasureRepository extends JpaRepository<UnitOfMeasure, String> {

    Optional<UnitOfMeasure> findByCodeAndDeletedFalse(String code);

    List<UnitOfMeasure> findByDeletedFalseOrderByDisplayOrderAsc();

    @Query("SELECT u FROM UnitOfMeasure u WHERE u.deleted = false AND u.isActive = true ORDER BY u.displayOrder ASC")
    List<UnitOfMeasure> findActiveUnits();

    boolean existsByCodeAndDeletedFalse(String code);
}

