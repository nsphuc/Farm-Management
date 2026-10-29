package com.farm.saas.modules.masterdata.repository;

import com.farm.saas.modules.masterdata.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long>, JpaSpecificationExecutor<Material> {
    java.util.Optional<Material> findByTenantIdAndSkuCode(Long tenantId, String skuCode);
    java.util.Optional<Material> findByTenantIdAndBarcode(Long tenantId, String barcode);
    java.util.Optional<Material> findByTenantIdAndId(Long tenantId, Long id);
    boolean existsByTenantIdAndSkuCode(Long tenantId, String skuCode);
    boolean existsByTenantIdAndBarcode(Long tenantId, String barcode);
    java.util.List<Material> findByTenantId(Long tenantId);
    java.util.List<Material> findByTenantIdAndCategoryId(Long tenantId, Long categoryId);
    boolean existsByCategoryId(Long categoryId);
    boolean existsByTenantIdAndCategoryId(Long tenantId, Long categoryId);
}
