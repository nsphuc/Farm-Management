package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.Warehouse;
import com.farm.saas.modules.inventory.entity.WarehouseStatus;
import com.farm.saas.modules.inventory.entity.WarehouseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu bảng warehouses.
 * Đảm bảo Tenant Isolation và The Farm Barrier Guard: Mọi truy vấn đều lồng tenantId và farmId.
 */
@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    // Lấy chi tiết kho theo ID kết hợp TenantId và FarmId
    Optional<Warehouse> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    // Lấy chi tiết kho theo ID và TenantId
    Optional<Warehouse> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra trùng mã kho trong cùng một Farm
    boolean existsByFarmIdAndCode(Long farmId, String code);

    // Kiểm tra trùng mã kho khi cập nhật
    boolean existsByFarmIdAndCodeAndIdNot(Long farmId, String code, Long id);

    // Phân trang danh sách kho theo Farm và Tenant
    Page<Warehouse> findAllByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    // Phân trang danh sách kho theo Tenant (Toàn bộ các trang trại thuộc Tenant)
    Page<Warehouse> findAllByTenantId(Long tenantId, Pageable pageable);

    // Phân trang danh sách kho theo Farm, Loại kho và Trạng thái
    Page<Warehouse> findAllByTenantIdAndFarmIdAndWarehouseTypeAndStatus(
            Long tenantId, Long farmId, WarehouseType warehouseType, WarehouseStatus status, Pageable pageable);

    // Lấy toàn bộ danh sách kho theo Farm và Tenant (cho Dropdown)
    List<Warehouse> findAllByTenantIdAndFarmId(Long tenantId, Long farmId);

    // Lấy danh sách kho đang hoạt động của Farm
    List<Warehouse> findAllByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, WarehouseStatus status);

    // Lấy toàn bộ kho của Tenant
    List<Warehouse> findAllByTenantId(Long tenantId);
}
