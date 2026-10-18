package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.CropType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CropTypeRepository extends JpaRepository<CropType, Long>, JpaSpecificationExecutor<CropType> {
    java.util.List<CropType> findByTenantId(Long tenantId);
    java.util.Optional<CropType> findByTenantIdAndVarietyCode(Long tenantId, String varietyCode);
    java.util.Optional<CropType> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndVarietyCode(Long tenantId, String varietyCode);
}
