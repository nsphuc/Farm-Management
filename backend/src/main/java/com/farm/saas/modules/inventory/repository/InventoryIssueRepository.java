package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.InventoryIssue;
import com.farm.saas.modules.inventory.entity.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository quản lý chứng từ Xuất kho (bảng warehouse_issues).
 * Đảm bảo Tenant Isolation và The Farm Barrier Guard.
 */
@Repository
public interface InventoryIssueRepository extends JpaRepository<InventoryIssue, Long> {

    // Tìm chi tiết phiếu xuất theo ID, TenantId và FarmId
    Optional<InventoryIssue> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    // Tìm chi tiết phiếu xuất theo ID và TenantId
    Optional<InventoryIssue> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra trùng mã phiếu xuất trong cùng Farm và Tenant
    boolean existsByTenantIdAndFarmIdAndIssueCode(Long tenantId, Long farmId, String issueCode);

    // Phân trang danh sách phiếu xuất theo Farm
    Page<InventoryIssue> findAllByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    // Phân trang danh sách phiếu xuất theo Kho bãi
    Page<InventoryIssue> findAllByTenantIdAndFarmIdAndWarehouseId(Long tenantId, Long farmId, Long warehouseId, Pageable pageable);

    // Phân trang danh sách phiếu xuất theo Farm và Trạng thái
    Page<InventoryIssue> findAllByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, IssueStatus status, Pageable pageable);

    // Phân trang danh sách phiếu xuất cho toàn bộ Tenant (Admin)
    Page<InventoryIssue> findAllByTenantId(Long tenantId, Pageable pageable);
}
