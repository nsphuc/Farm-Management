package com.farm.saas.modules.organization.repository;

import com.farm.saas.modules.organization.entity.OperationalCycle;
import com.farm.saas.modules.organization.entity.OperationalCycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu bảng operational_cycles.
 * Đảm bảo Tenant Isolation và The Farm Barrier Guard: Luôn lồng tenantId và farmId.
 */
@Repository
public interface OperationalCycleRepository extends JpaRepository<OperationalCycle, Long> {

    // Lấy chi tiết chu kỳ theo ID kết hợp TenantId và FarmId
    Optional<OperationalCycle> findByIdAndTenantIdAndFarmId(Long id, Long tenantId, Long farmId);

    // Lấy chi tiết chu kỳ theo ID kết hợp TenantId
    Optional<OperationalCycle> findByIdAndTenantId(Long id, Long tenantId);

    // Kiểm tra trùng tên chu kỳ trong cùng farm và năm tài chính
    boolean existsByFarmIdAndFiscalYearAndName(Long farmId, Integer fiscalYear, String name);

    // Kiểm tra trùng tên khi cập nhật chu kỳ khác
    boolean existsByFarmIdAndFiscalYearAndNameAndIdNot(Long farmId, Integer fiscalYear, String name, Long id);

    // Phân trang danh sách chu kỳ theo Farm và Tenant
    Page<OperationalCycle> findAllByTenantIdAndFarmId(Long tenantId, Long farmId, Pageable pageable);

    // Phân trang theo Farm, Tenant và Trạng thái
    Page<OperationalCycle> findAllByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, OperationalCycleStatus status, Pageable pageable);

    // Lấy toàn bộ danh sách chu kỳ của Farm (cho Dropdown)
    List<OperationalCycle> findAllByTenantIdAndFarmId(Long tenantId, Long farmId);

    // Lấy danh sách chu kỳ đang mở (ACTIVE) của Farm
    List<OperationalCycle> findAllByTenantIdAndFarmIdAndStatus(Long tenantId, Long farmId, OperationalCycleStatus status);

    // Phân trang toàn bộ chu kỳ trong Tenant
    Page<OperationalCycle> findAllByTenantId(Long tenantId, Pageable pageable);
}
