package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.InventoryIssueDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý chi tiết dòng hàng Xuất kho (bảng warehouse_issue_items).
 */
@Repository
public interface InventoryIssueDetailRepository extends JpaRepository<InventoryIssueDetail, Long> {

    List<InventoryIssueDetail> findAllByIssueId(Long issueId);
}
