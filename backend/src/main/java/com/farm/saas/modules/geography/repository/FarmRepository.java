package com.farm.saas.modules.geography.repository;

import com.farm.saas.modules.geography.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long>, JpaSpecificationExecutor<Farm> {
    java.util.Optional<Farm> findByTenantIdAndCode(Long tenantId, String code);
    java.util.Optional<Farm> findByTenantIdAndId(Long tenantId, Long id);
    java.util.List<Farm> findByTenantId(Long tenantId);
    java.util.List<Farm> findByTenantIdAndIdIn(Long tenantId, java.util.Collection<Long> ids);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
    long countByTenantIdAndStatusNot(Long tenantId, String status);
}
