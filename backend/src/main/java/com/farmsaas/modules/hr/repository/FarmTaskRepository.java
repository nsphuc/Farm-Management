package com.farmsaas.modules.hr.repository;

import com.farmsaas.modules.hr.entity.FarmTask;
import com.farmsaas.modules.hr.entity.enums.TaskPriority;
import com.farmsaas.modules.hr.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FarmTaskRepository extends JpaRepository<FarmTask, Long> {

    Optional<FarmTask> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    boolean existsByTenantIdAndFarmIdAndTaskCode(Long tenantId, Long farmId, String taskCode);

    List<FarmTask> findByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, TaskStatus status);

    List<FarmTask> findByTenantIdAndFarmIdAndAssignedTo(Long tenantId, Long farmId, Long assignedTo);

    @Query("SELECT t FROM FarmTask t " +
           "LEFT JOIN FETCH t.assignee " +
           "LEFT JOIN FETCH t.supervisor " +
           "WHERE t.tenantId = :tenantId AND t.farmId = :farmId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:priority IS NULL OR t.priority = :priority) " +
           "AND (:assignedTo IS NULL OR t.assignedTo = :assignedTo) " +
           "AND (:seasonId IS NULL OR t.seasonId = :seasonId) " +
           "AND (:zoneId IS NULL OR t.zoneId = :zoneId) " +
           "AND (:herdId IS NULL OR t.herdId = :herdId) " +
           "AND (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(t.taskCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY t.dueDate ASC NULLS LAST, t.priority DESC")
    Page<FarmTask> searchTasks(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("keyword") String keyword,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("assignedTo") Long assignedTo,
            @Param("seasonId") Long seasonId,
            @Param("zoneId") Long zoneId,
            @Param("herdId") Long herdId,
            Pageable pageable
    );

    @Query("SELECT t FROM FarmTask t " +
           "LEFT JOIN FETCH t.assignee " +
           "LEFT JOIN FETCH t.supervisor " +
           "WHERE t.tenantId = :tenantId AND t.farmId = :farmId " +
           "AND (:assignedTo IS NULL OR t.assignedTo = :assignedTo) " +
           "ORDER BY t.dueDate ASC NULLS LAST")
    List<FarmTask> findAllKanbanTasks(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("assignedTo") Long assignedTo
    );
}
