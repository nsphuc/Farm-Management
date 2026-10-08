package com.farmsaas.modules.finance.repository;

import com.farmsaas.modules.finance.entity.CostCategory;
import com.farmsaas.modules.finance.entity.enums.CostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CostCategoryRepository extends JpaRepository<CostCategory, Long> {

    List<CostCategory> findByTenantId(Long tenantId);

    List<CostCategory> findByTenantIdAndCostType(Long tenantId, CostType costType);

    Optional<CostCategory> findByIdAndTenantId(Long id, Long tenantId);

    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
