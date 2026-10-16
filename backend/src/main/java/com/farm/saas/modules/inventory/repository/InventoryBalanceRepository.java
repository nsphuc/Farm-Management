package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.InventoryBalance;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý tồn kho thực tế (bảng warehouse_inventory).
 * Hỗ trợ truy vấn khóa ghi (Pessimistic Write Lock) ngăn chặn triệt để Race Condition khi xuất/nhập đồng thời.
 */
@Repository
public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {

    // Khóa bi quan (Pessimistic Write Lock) theo Kho, Vật tư và Số lô để cộng/trừ tồn kho an toàn tuyệt đối
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM InventoryBalance b WHERE b.warehouseId = :warehouseId AND b.materialId = :materialId AND b.batchNumber = :batchNumber")
    Optional<InventoryBalance> findWithLockByWarehouseIdAndMaterialIdAndBatchNumber(
            @Param("warehouseId") Long warehouseId,
            @Param("materialId") Long materialId,
            @Param("batchNumber") String batchNumber
    );

    // Tìm tồn kho thông thường không khóa
    Optional<InventoryBalance> findByWarehouseIdAndMaterialIdAndBatchNumber(
            Long warehouseId, Long materialId, String batchNumber);

    // Danh sách các lô hàng còn tồn theo Kho và Vật tư (hỗ trợ FIFO/FEFO)
    List<InventoryBalance> findAllByWarehouseIdAndMaterialIdOrderByInwardDateAsc(
            Long warehouseId, Long materialId);

    List<InventoryBalance> findAllByWarehouseIdAndMaterialIdOrderByExpiryDateAsc(
            Long warehouseId, Long materialId);

    // Phân trang danh sách tồn kho theo Farm và Tenant
    Page<InventoryBalance> findAllByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    // Phân trang danh sách tồn kho theo Kho bãi cụ thể
    Page<InventoryBalance> findAllByTenantIdAndFarmIdAndWarehouseId(
            Long tenantId, Long farmId, Long warehouseId, Pageable pageable);

    // Phân trang danh sách tồn kho theo Tenant
    Page<InventoryBalance> findAllByTenantId(Long tenantId, Pageable pageable);

    // Tìm chi tiết tồn kho theo id và tenantId
    Optional<InventoryBalance> findByIdAndTenantId(Long id, Long tenantId);
}
