package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.Stocktake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StocktakeRepository extends JpaRepository<Stocktake, Long>, JpaSpecificationExecutor<Stocktake> {
    java.util.Optional<Stocktake> findByFarmIdAndId(Long farmId, Long id);
    boolean existsByTenantIdAndFarmIdAndStocktakeCode(Long tenantId, Long farmId, String stocktakeCode);

    org.springframework.data.domain.Page<Stocktake> findByTenantIdAndFarmIdOrderByCreatedAtDesc(
            Long tenantId, Long farmId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Stocktake> findByTenantIdOrderByCreatedAtDesc(
            Long tenantId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Stocktake> findByTenantIdAndFarmIdInOrderByCreatedAtDesc(
            Long tenantId, java.util.Collection<Long> farmIds, org.springframework.data.domain.Pageable pageable);
}
