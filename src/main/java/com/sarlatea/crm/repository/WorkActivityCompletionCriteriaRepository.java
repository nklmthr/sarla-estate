package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.WorkActivityCompletionCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkActivityCompletionCriteriaRepository extends JpaRepository<WorkActivityCompletionCriteria, String> {
    
    /**
     * Find all completion criteria for a specific work activity
     */
    List<WorkActivityCompletionCriteria> findByWorkActivityId(String workActivityId);
    
    /**
     * Find active completion criterion for a specific work activity
     */
    @Query("SELECT c FROM WorkActivityCompletionCriteria c WHERE c.workActivity.id = :workActivityId AND c.isActive = true")
    Optional<WorkActivityCompletionCriteria> findActiveByWorkActivityId(@Param("workActivityId") String workActivityId);
    
    /**
     * Find all active completion criteria
     */
    List<WorkActivityCompletionCriteria> findByIsActive(Boolean isActive);
}

