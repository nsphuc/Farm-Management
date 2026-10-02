package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.WarehouseTransfer;
import com.farmsaas.modules.inventory.entity.enums.TransferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarehouseTransferRepository extends JpaRepository<WarehouseTransfer, Long> {

    Optional<WarehouseTransfer> findByIdAndTenantId(Long id, Long tenantId);

    Optional<WarehouseTransfer> findByTenantIdAndTransferCode(Long tenantId, String transferCode);

    boolean existsByTenantIdAndTransferCode(Long tenantId, String transferCode);

    @Query("SELECT t FROM WarehouseTransfer t WHERE t.tenantId = :tenantId " +
           "AND (:fromWarehouseId IS NULL OR t.fromWarehouseId = :fromWarehouseId) " +
           "AND (:toWarehouseId IS NULL OR t.toWarehouseId = :toWarehouseId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "ORDER BY t.transferDate DESC")
    Page<WarehouseTransfer> searchTransfers(
            @Param("tenantId") Long tenantId,
            @Param("fromWarehouseId") Long fromWarehouseId,
            @Param("toWarehouseId") Long toWarehouseId,
            @Param("status") TransferStatus status,
            Pageable pageable
    );
}
