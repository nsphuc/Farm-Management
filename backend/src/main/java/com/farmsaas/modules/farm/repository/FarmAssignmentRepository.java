package com.farmsaas.modules.farm.repository;

import com.farmsaas.modules.farm.entity.FarmAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmAssignmentRepository extends JpaRepository<FarmAssignment, Long> {

    List<FarmAssignment> findByFarmIdAndTenantId(Long farmId, Long tenantId);

    List<FarmAssignment> findByUserIdAndTenantIdAndIsActiveTrue(Long userId, Long tenantId);

    Optional<FarmAssignment> findByIdAndFarmIdAndTenantId(Long id, Long farmId, Long tenantId);

    boolean existsByFarmIdAndUserIdAndIsActiveTrue(Long farmId, Long userId);

    @Query("SELECT fa.farmId FROM FarmAssignment fa WHERE fa.userId = :userId AND fa.tenantId = :tenantId AND fa.isActive = true")
    List<Long> findFarmIdsByUserIdAndTenantId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);
}
