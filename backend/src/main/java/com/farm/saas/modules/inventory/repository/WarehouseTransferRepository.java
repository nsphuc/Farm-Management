package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseTransferRepository extends JpaRepository<WarehouseTransfer, Long>, JpaSpecificationExecutor<WarehouseTransfer> {
    java.util.Optional<WarehouseTransfer> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndTransferCode(Long tenantId, String transferCode);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM WarehouseTransfer t WHERE t.tenantId = :tenantId AND (t.fromFarmId = :farmId OR t.toFarmId = :farmId) ORDER BY t.createdAt DESC")
    org.springframework.data.domain.Page<WarehouseTransfer> findByFarmId(
            @org.springframework.data.repository.query.Param("tenantId") Long tenantId,
            @org.springframework.data.repository.query.Param("farmId") Long farmId,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<WarehouseTransfer> findByTenantIdOrderByCreatedAtDesc(
            Long tenantId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM WarehouseTransfer t WHERE t.tenantId = :tenantId AND (t.fromFarmId IN :farmIds OR t.toFarmId IN :farmIds) ORDER BY t.createdAt DESC")
    org.springframework.data.domain.Page<WarehouseTransfer> findByFarmIds(
            @org.springframework.data.repository.query.Param("tenantId") Long tenantId,
            @org.springframework.data.repository.query.Param("farmIds") java.util.Collection<Long> farmIds,
            org.springframework.data.domain.Pageable pageable);
}
