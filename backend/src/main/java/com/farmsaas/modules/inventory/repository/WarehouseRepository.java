package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findByTenantIdAndFarmId(Long tenantId, Long farmId);

    Optional<Warehouse> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Warehouse> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    Optional<Warehouse> findByTenantIdAndFarmIdAndCode(Long tenantId, Long farmId, String code);

    boolean existsByTenantIdAndFarmIdAndCode(Long tenantId, Long farmId, String code);

    long countByTenantIdAndFarmId(Long tenantId, Long farmId);

    @Query("SELECT w FROM Warehouse w WHERE w.tenantId = :tenantId AND (:farmId IS NULL OR w.farmId = :farmId) AND (:status IS NULL OR w.status = :status)")
    List<Warehouse> searchWarehouses(@Param("tenantId") Long tenantId, @Param("farmId") Long farmId, @Param("status") String status);
}
