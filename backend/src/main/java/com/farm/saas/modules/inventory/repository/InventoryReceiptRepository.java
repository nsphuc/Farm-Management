package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.InventoryReceipt;
import com.farm.saas.modules.inventory.entity.ReceiptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository quản lý chứng từ Nhập kho (bảng warehouse_receipts).
 * Đảm bảo Tenant Isolation và The Farm Barrier Guard.
 */
@Repository
public interface InventoryReceiptRepository extends JpaRepository<InventoryReceipt, Long> {

    // Tìm chi tiết phiếu nhập theo ID, TenantId và FarmId
    Optional<InventoryReceipt> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    // Tìm chi tiết phiếu nhập theo ID và TenantId
    Optional<InventoryReceipt> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra trùng mã phiếu nhập trong cùng Farm và Tenant
    boolean existsByTenantIdAndFarmIdAndReceiptCode(Long tenantId, Long farmId, String receiptCode);

    // Phân trang danh sách phiếu nhập theo Farm
    Page<InventoryReceipt> findAllByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    // Phân trang danh sách phiếu nhập theo Kho bãi
    Page<InventoryReceipt> findAllByTenantIdAndFarmIdAndWarehouseId(Long tenantId, Long farmId, Long warehouseId, Pageable pageable);

    // Phân trang danh sách phiếu nhập theo Farm và Trạng thái
    Page<InventoryReceipt> findAllByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, ReceiptStatus status, Pageable pageable);

    // Phân trang danh sách phiếu nhập cho toàn bộ Tenant (Admin)
    Page<InventoryReceipt> findAllByTenantId(Long tenantId, Pageable pageable);
}
