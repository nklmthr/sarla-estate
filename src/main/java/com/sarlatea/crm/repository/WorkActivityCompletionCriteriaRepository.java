package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.WorkActivityCompletionCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkActivityCompletionCriteriaRepository extends JpaRepository<WorkActivityCompletionCriteria, String> {
    
    /**
     * Find all completion criteria for a specific work activity (non-deleted only)
     */
    List<WorkActivityCompletionCriteria> findByWorkActivityIdAndDeletedFalse(String workActivityId);
    
    /**
     * Find active completion criterion for a specific work activity (non-deleted only)
     * Active means today's date falls within the date range
     */
    @Query("SELECT c FROM WorkActivityCompletionCriteria c " +
           "WHERE c.workActivity.id = :workActivityId " +
           "AND c.deleted = false " +
           "AND c.startDate <= CURRENT_DATE " +
           "AND (c.endDate IS NULL OR c.endDate >= CURRENT_DATE)")
    Optional<WorkActivityCompletionCriteria> findActiveByWorkActivityId(@Param("workActivityId") String workActivityId);
    
    /**
     * Find all active completion criteria (non-deleted only)
     */
    List<WorkActivityCompletionCriteria> findByIsActiveAndDeletedFalse(Boolean isActive);
    
    /**
     * Find overlapping criteria for a given work activity and date range (non-deleted only)
     * Overlapping occurs when:
     * 1. New range starts before existing ends (or existing has no end)
     * 2. New range ends after existing starts (or new has no end)
     * Excludes the current criteria if updating (by id)
     */
    @Query("SELECT c FROM WorkActivityCompletionCriteria c WHERE c.workActivity.id = :workActivityId " +
           "AND c.deleted = false " +
           "AND (:criteriaId IS NULL OR c.id != :criteriaId) " +
           "AND (" +
           "  (:endDate IS NULL OR c.startDate <= :endDate) " +
           "  AND (c.endDate IS NULL OR :startDate <= c.endDate)" +
           ")")
    List<WorkActivityCompletionCriteria> findOverlappingCriteria(
        @Param("workActivityId") String workActivityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("criteriaId") String criteriaId
    );

    Optional<WorkActivityCompletionCriteria> findByIdAndDeletedFalse(String id);
}

