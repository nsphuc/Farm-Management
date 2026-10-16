package com.farm.saas.modules.inventory.repository;

import com.farm.saas.modules.inventory.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý bảng materials.
 * Áp dụng Tenant Isolation: Mọi truy vấn đều lồng tenantId.
 */
@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    // Lấy chi tiết vật tư theo ID và TenantId
    Optional<Material> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra vật tư tồn tại trong Tenant
    boolean existsByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra trùng mã SKU trong Tenant
    boolean existsByTenantIdAndSkuCode(Long tenantId, String skuCode);

    // Kiểm tra trùng mã SKU khi cập nhật vật tư khác
    boolean existsByTenantIdAndSkuCodeAndIdNot(Long tenantId, String skuCode, Long id);

    // Kiểm tra có vật tư nào đang thuộc nhóm categoryId hay không (Dùng để chặn xóa Category)
    boolean existsByTenantIdAndCategoryId(Long tenantId, Long categoryId);

    // Phân trang danh sách vật tư theo Tenant
    Page<Material> findAllByTenantId(Long tenantId, Pageable pageable);

    // Phân trang danh sách vật tư theo Nhóm và Tenant
    Page<Material> findAllByTenantIdAndCategoryId(Long tenantId, Long categoryId, Pageable pageable);

    // Lấy toàn bộ danh sách vật tư của Tenant (cho select box khi lập phiếu nhập/xuất kho)
    List<Material> findAllByTenantId(Long tenantId);

    // Lấy danh sách vật tư theo nhóm của Tenant
    List<Material> findAllByTenantIdAndCategoryId(Long tenantId, Long categoryId);
}
