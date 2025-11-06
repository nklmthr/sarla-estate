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

    Optional<WorkActivity> findByName(String name);

    List<WorkActivity> findByStatus(WorkActivity.Status status);

    List<WorkActivity> findBySeason(WorkActivity.Season season);

    List<WorkActivity> findByWorkShift(WorkActivity.WorkShift workShift);

    List<WorkActivity> findByFrequency(WorkActivity.Frequency frequency);

    List<WorkActivity> findByTypicalLocation(String typicalLocation);

    @Query("SELECT w FROM WorkActivity w WHERE LOWER(w.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(w.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(w.typicalLocation) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<WorkActivity> searchWorkActivities(@Param("searchTerm") String searchTerm);

    @Query("SELECT w FROM WorkActivity w WHERE w.season = :season AND w.status = :status")
    List<WorkActivity> findBySeasonAndStatus(@Param("season") WorkActivity.Season season,
                                               @Param("status") WorkActivity.Status status);

    @Query("SELECT w FROM WorkActivity w WHERE w.workShift = :workShift AND w.status = :status")
    List<WorkActivity> findByWorkShiftAndStatus(@Param("workShift") WorkActivity.WorkShift workShift,
                                                  @Param("status") WorkActivity.Status status);

    @Query("SELECT w FROM WorkActivity w WHERE w.frequency = :frequency AND w.workShift = :workShift AND w.status = 'ACTIVE'")
    List<WorkActivity> findActiveByFrequencyAndWorkShift(@Param("frequency") WorkActivity.Frequency frequency,
                                                           @Param("workShift") WorkActivity.WorkShift workShift);

    @Query("SELECT w FROM WorkActivity w WHERE w.status = 'ACTIVE' AND w.frequency IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'MULTIPLE_DAILY')")
    List<WorkActivity> findSchedulableActivities();
}

