package com.farmsaas.modules.livestock.repository;

import com.farmsaas.modules.livestock.entity.LivestockEvent;
import com.farmsaas.modules.livestock.entity.enums.LivestockEventType;
import com.farmsaas.modules.livestock.entity.enums.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivestockEventRepository extends JpaRepository<LivestockEvent, Long> {

    List<LivestockEvent> findByTenantIdAndFarmIdAndTargetTypeAndTargetIdOrderByEventDateDesc(
            Long tenantId, Long farmId, TargetType targetType, Long targetId
    );

    Optional<LivestockEvent> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    @Query("SELECT e FROM LivestockEvent e WHERE e.tenantId = :tenantId AND e.farmId = :farmId " +
           "AND (:targetType IS NULL OR e.targetType = :targetType) " +
           "AND (:targetId IS NULL OR e.targetId = :targetId) " +
           "AND (:eventType IS NULL OR e.eventType = :eventType) " +
           "ORDER BY e.eventDate DESC")
    Page<LivestockEvent> searchEvents(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("targetType") TargetType targetType,
            @Param("targetId") Long targetId,
            @Param("eventType") LivestockEventType eventType,
            Pageable pageable
    );
}
