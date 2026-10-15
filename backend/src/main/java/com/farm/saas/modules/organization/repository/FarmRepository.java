package com.farm.saas.modules.organization.repository;

import com.farm.saas.modules.organization.entity.Farm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu bảng farms.
 * Tuân thủ nguyên tắc Tenant Isolation: BẤT KỲ truy vấn nào vào cơ sở dữ liệu đều bắt buộc phải có điều kiện tenantId = ?.
 */
@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {

    // Truy vấn chi tiết Farm theo ID kết hợp Tenant Isolation
    Optional<Farm> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra sự tồn tại của Farm theo ID và Tenant Isolation
    boolean existsByIdAndTenantId(Long id, Long tenantId);

    // Phân trang danh sách trang trại của một Tenant
    Page<Farm> findAllByTenantId(Long tenantId, Pageable pageable);

    // Lấy toàn bộ danh sách trang trại của Tenant (cho select box / dropdown)
    List<Farm> findAllByTenantId(Long tenantId);

    // Kiểm tra tính duy nhất của mã code trong cùng một Tenant
    boolean existsByTenantIdAndCode(Long tenantId, String code);

    // Kiểm tra trùng mã code khi cập nhật trang trại khác
    boolean existsByTenantIdAndCodeAndIdNot(Long tenantId, String code, Long id);
}
