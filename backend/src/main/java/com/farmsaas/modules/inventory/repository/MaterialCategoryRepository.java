package com.farmsaas.modules.inventory.repository;

import com.farmsaas.modules.inventory.entity.MaterialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialCategoryRepository extends JpaRepository<MaterialCategory, Long> {

    List<MaterialCategory> findByTenantId(Long tenantId);

    Optional<MaterialCategory> findByIdAndTenantId(Long id, Long tenantId);

    Optional<MaterialCategory> findByTenantIdAndCode(Long tenantId, String code);

    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
