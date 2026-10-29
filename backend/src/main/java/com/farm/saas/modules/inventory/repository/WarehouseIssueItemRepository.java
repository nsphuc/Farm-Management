package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.WarehouseIssueItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseIssueItemRepository extends JpaRepository<WarehouseIssueItem, Long>, JpaSpecificationExecutor<WarehouseIssueItem> {
    java.util.List<WarehouseIssueItem> findByIssueId(Long issueId);
    boolean existsByMaterialId(Long materialId);
}
