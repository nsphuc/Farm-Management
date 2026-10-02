package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.Stocktake;
import com.farmsaas.modules.inventory.entity.enums.StocktakeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StocktakeRepository extends JpaRepository<Stocktake, Long> {

    Optional<Stocktake> findByIdAndTenantId(Long id, Long tenantId);

    Optional<Stocktake> findByTenantIdAndStocktakeCode(Long tenantId, String stocktakeCode);

    boolean existsByTenantIdAndStocktakeCode(Long tenantId, String stocktakeCode);

    @Query("SELECT s FROM Stocktake s WHERE s.tenantId = :tenantId " +
           "AND (:farmId IS NULL OR s.farmId = :farmId) " +
           "AND (:warehouseId IS NULL OR s.warehouseId = :warehouseId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "ORDER BY s.stocktakeDate DESC")
    Page<Stocktake> searchStocktakes(
            @Param("tenantId") Long tenantId,
            @Param("farmId") Long farmId,
            @Param("warehouseId") Long warehouseId,
            @Param("status") StocktakeStatus status,
            Pageable pageable
    );
}
