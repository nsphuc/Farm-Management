package com.farmsaas.modules.crop.repository;

import com.farmsaas.modules.crop.entity.CropType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropTypeRepository extends JpaRepository<CropType, Long> {

    List<CropType> findByTenantId(Long tenantId);

    Optional<CropType> findByIdAndTenantId(Long id, Long tenantId);

    Optional<CropType> findByTenantIdAndVarietyCode(Long tenantId, String varietyCode);

    boolean existsByTenantIdAndVarietyCode(Long tenantId, String varietyCode);
}
