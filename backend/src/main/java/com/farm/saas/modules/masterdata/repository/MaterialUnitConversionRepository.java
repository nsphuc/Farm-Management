package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.MaterialUnitConversion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialUnitConversionRepository extends JpaRepository<MaterialUnitConversion, Long>, JpaSpecificationExecutor<MaterialUnitConversion> {
    java.util.List<MaterialUnitConversion> findByMaterialId(Long materialId);
    java.util.Optional<MaterialUnitConversion> findByTenantIdAndUnitBarcode(Long tenantId, String unitBarcode);
    java.util.Optional<MaterialUnitConversion> findByMaterialIdAndUnitName(Long materialId, String unitName);
}
