package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.ReferenceDocType;
import com.farm.saas.modules.inventory.entity.TransactionDirection;
import com.farm.saas.modules.inventory.entity.WarehouseInventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý Sổ cái biến động kho (bảng warehouse_inventory_transactions).
 */
@Repository
public interface WarehouseInventoryTransactionRepository extends JpaRepository<WarehouseInventoryTransaction, Long> {

    // Kiểm tra Idempotency trước khi ghi sổ cái
    boolean existsByReferenceDocTypeAndReferenceItemIdAndDirection(
            ReferenceDocType referenceDocType, Long referenceItemId, TransactionDirection direction);

    // Phân trang lịch sử biến động theo Farm
    Page<WarehouseInventoryTransaction> findAllByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    // Phân trang lịch sử biến động theo Kho bãi
    Page<WarehouseInventoryTransaction> findAllByTenantIdAndFarmIdAndWarehouseId(
            Long tenantId, Long farmId, Long warehouseId, Pageable pageable);

    // Phân trang lịch sử biến động theo Kho bãi và Vật tư
    Page<WarehouseInventoryTransaction> findAllByTenantIdAndFarmIdAndWarehouseIdAndMaterialId(
            Long tenantId, Long farmId, Long warehouseId, Long materialId, Pageable pageable);

    // Lấy toàn bộ biến động theo chứng từ tham chiếu
    List<WarehouseInventoryTransaction> findAllByReferenceDocTypeAndReferenceDocId(
            ReferenceDocType referenceDocType, Long referenceDocId);
}
