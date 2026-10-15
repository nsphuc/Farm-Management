package com.farm.saas.modules.organization.repository;

import com.farm.saas.modules.organization.entity.ZoneLocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu bảng zone_locations.
 * Đảm bảo tính toàn vẹn 3 cấp: tenantId -> farmId -> zoneId.
 */
@Repository
public interface ZoneLocationRepository extends JpaRepository<ZoneLocation, Long> {

    // Lấy chi tiết vị trí xác thực đầy đủ cả 3 cấp cha: tenantId -> farmId -> zoneId
    Optional<ZoneLocation> findByIdAndZoneIdAndFarmIdAndTenantId(Long id, Long zoneId, Long farmId, Long tenantId);

    // Kiểm tra sự tồn tại của vị trí thuộc đúng 3 cấp cha
    boolean existsByIdAndZoneIdAndFarmIdAndTenantId(Long id, Long zoneId, Long farmId, Long tenantId);

    // Lấy danh sách toàn bộ vị trí thuộc một zone cụ thể
    List<ZoneLocation> findByZoneIdAndFarmIdAndTenantId(Long zoneId, Long farmId, Long tenantId);

    // Phân trang danh sách vị trí thuộc một zone
    Page<ZoneLocation> findByZoneIdAndFarmIdAndTenantId(Long zoneId, Long farmId, Long tenantId, Pageable pageable);

    // Kiểm tra trùng mã vị trí trong cùng một Phân khu (zone)
    boolean existsByZoneIdAndCode(Long zoneId, String code);

    // Kiểm tra trùng mã khi cập nhật vị trí
    boolean existsByZoneIdAndCodeAndIdNot(Long zoneId, String code, Long id);
}
