package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.MaterialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, Long>, JpaSpecificationExecutor<MaterialCategory> {
    java.util.List<MaterialCategory> findByTenantId(Long tenantId);
    java.util.Optional<MaterialCategory> findByTenantIdAndCode(Long tenantId, String code);
    java.util.Optional<MaterialCategory> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
