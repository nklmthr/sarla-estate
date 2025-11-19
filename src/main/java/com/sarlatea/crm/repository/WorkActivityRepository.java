package com.sarlatea.crm.repository;

import com.sarlatea.crm.model.WorkActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for WorkActivity entity
 */
@Repository
public interface WorkActivityRepository extends JpaRepository<WorkActivity, String> {

    Optional<WorkActivity> findByNameAndDeletedFalse(String name);

    @Query("SELECT DISTINCT w FROM WorkActivity w LEFT JOIN FETCH w.completionCriteria WHERE w.deleted = false")
    List<WorkActivity> findAllActive();

    @Query("SELECT DISTINCT w FROM WorkActivity w LEFT JOIN FETCH w.completionCriteria WHERE w.deleted = false AND " +
           "(LOWER(w.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(w.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<WorkActivity> searchWorkActivities(@Param("searchTerm") String searchTerm);

    @Query("SELECT w FROM WorkActivity w LEFT JOIN FETCH w.completionCriteria WHERE w.id = :id AND w.deleted = false")
    Optional<WorkActivity> findByIdAndDeletedFalse(@Param("id") String id);
}

