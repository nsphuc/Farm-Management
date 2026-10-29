package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseIssueRepository extends JpaRepository<WarehouseIssue, Long>, JpaSpecificationExecutor<WarehouseIssue> {
    java.util.Optional<WarehouseIssue> findByFarmIdAndId(Long farmId, Long id);
    java.util.Optional<WarehouseIssue> findByTenantIdAndFarmIdAndIssueCode(Long tenantId, Long farmId, String issueCode);
    boolean existsByTenantIdAndFarmIdAndIssueCode(Long tenantId, Long farmId, String issueCode);
    boolean existsByWarehouseId(Long warehouseId);
}
