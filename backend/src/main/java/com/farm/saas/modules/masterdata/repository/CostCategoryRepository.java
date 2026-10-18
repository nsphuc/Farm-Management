package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.CostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CostCategoryRepository extends JpaRepository<CostCategory, Long>, JpaSpecificationExecutor<CostCategory> {
    java.util.List<CostCategory> findByTenantId(Long tenantId);
    java.util.Optional<CostCategory> findByTenantIdAndCode(Long tenantId, String code);
    java.util.Optional<CostCategory> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
