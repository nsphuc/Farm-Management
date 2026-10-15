package com.farm.saas.modules.organization.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.organization.dto.request.ZoneLocationCreateRequest;
import com.farm.saas.modules.organization.dto.request.ZoneLocationUpdateRequest;
import com.farm.saas.modules.organization.dto.response.ZoneLocationResponse;
import com.farm.saas.modules.organization.entity.ProductionZone;
import com.farm.saas.modules.organization.entity.ZoneLocation;
import com.farm.saas.modules.organization.mapper.ZoneLocationMapper;
import com.farm.saas.modules.organization.repository.ProductionZoneRepository;
import com.farm.saas.modules.organization.repository.ZoneLocationRepository;
import com.farm.saas.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý nghiệp vụ Vị trí chi tiết trong phân khu (Zone Locations: Luống, Ô đất, Dãy chuồng).
 * Xác thực liên kết đa cấp nghiêm ngặt (Location -> Zone -> Farm -> Tenant).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZoneLocationService {

    private static final Logger log = LoggerFactory.getLogger(ZoneLocationService.class);

    private final ZoneLocationRepository zoneLocationRepository;
    private final ProductionZoneRepository productionZoneRepository;

    /**
     * Lấy toàn bộ danh sách vị trí chi tiết thuộc một phân khu cụ thể.
     */
    public List<ZoneLocationResponse> getLocationsByZone(Long farmId, Long zoneId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy danh sách vị trí cho ZoneId: {}, FarmId: {}, TenantId: {}", zoneId, farmId, tenantId);

        // Xác thực phân khu cha tồn tại và thuộc đúng Farm và Tenant
        if (!productionZoneRepository.existsByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)) {
            throw AppException.notFound("Phân khu sản xuất", String.valueOf(zoneId));
        }

        return zoneLocationRepository.findByZoneIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .stream()
                .map(ZoneLocationMapper::toResponse)
                .toList();
    }

    /**
     * Phân trang danh sách vị trí thuộc một phân khu.
     */
    public Page<ZoneLocationResponse> getLocationsByZone(Long farmId, Long zoneId, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Phân trang danh sách vị trí cho ZoneId: {}, FarmId: {}, TenantId: {}", zoneId, farmId, tenantId);

        if (!productionZoneRepository.existsByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)) {
            throw AppException.notFound("Phân khu sản xuất", String.valueOf(zoneId));
        }

        return zoneLocationRepository.findByZoneIdAndFarmIdAndTenantId(zoneId, farmId, tenantId, pageable)
                .map(ZoneLocationMapper::toResponse);
    }

    /**
     * Lấy chi tiết một vị trí cụ thể với đầy đủ liên kết 3 cấp cha.
     */
    public ZoneLocationResponse getLocationById(Long farmId, Long zoneId, Long locationId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Truy vấn chi tiết vị trí ID: {} thuộc ZoneId: {}, FarmId: {}, TenantId: {}", locationId, zoneId, farmId, tenantId);

        ZoneLocation location = zoneLocationRepository.findByIdAndZoneIdAndFarmIdAndTenantId(locationId, zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Vị trí chi tiết", String.valueOf(locationId)));

        return ZoneLocationMapper.toResponse(location);
    }

    /**
     * Tạo mới vị trí chi tiết trong phân khu.
     * Kiểm tra Zone thuộc Farm và Farm thuộc Tenant trước khi lưu.
     */
    @Transactional
    public ZoneLocationResponse createLocation(Long farmId, Long zoneId, ZoneLocationCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        String normalizedCode = request.getCode().trim();
        log.info("Bắt đầu tạo vị trí chi tiết: Mã={}, ZoneId={}, FarmId={}, TenantId={}", normalizedCode, zoneId, farmId, tenantId);

        // Xác thực phân khu cha thuộc đúng Farm và Tenant
        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Phân khu sản xuất", String.valueOf(zoneId)));

        // Kiểm tra trùng mã code trong phân khu
        if (zoneLocationRepository.existsByZoneIdAndCode(zoneId, normalizedCode)) {
            throw AppException.conflict("Mã vị trí '" + normalizedCode + "' đã tồn tại trong phân khu!");
        }

        ZoneLocation location = ZoneLocationMapper.toEntity(request, farmId, zone.getId(), tenantId, currentUserId);
        ZoneLocation saved = zoneLocationRepository.save(location);
        log.info("Tạo vị trí thành công với ID: {}", saved.getId());

        return ZoneLocationMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin vị trí chi tiết.
     */
    @Transactional
    public ZoneLocationResponse updateLocation(Long farmId, Long zoneId, Long locationId, ZoneLocationUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Cập nhật vị trí ID: {} thuộc ZoneId: {}, FarmId: {}, TenantId: {}", locationId, zoneId, farmId, tenantId);
        ZoneLocation location = zoneLocationRepository.findByIdAndZoneIdAndFarmIdAndTenantId(locationId, zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Vị trí chi tiết", String.valueOf(locationId)));

        location.setName(request.getName().trim());
        location.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        location.setUpdatedBy(currentUserId);

        ZoneLocation updated = zoneLocationRepository.save(location);
        return ZoneLocationMapper.toResponse(updated);
    }

    /**
     * Xóa vị trí chi tiết (Soft-delete).
     * Không dùng repository.delete() để tránh mất dữ liệu liên kết luống/ô đất.
     * Cập nhật trạng thái sang 'MAINTENANCE' theo CHECK constraint của bảng zone_locations.
     */
    @Transactional
    public void deleteLocation(Long farmId, Long zoneId, Long locationId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.warn("Thực hiện chuyển vị trí ID: {} sang bảo trì (soft-delete)", locationId);
        ZoneLocation location = zoneLocationRepository.findByIdAndZoneIdAndFarmIdAndTenantId(locationId, zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Vị trí chi tiết", String.valueOf(locationId)));

        // Áp dụng quy tắc không xóa vật lý: Cập nhật status sang MAINTENANCE
        location.setStatus("MAINTENANCE");
        location.setUpdatedBy(currentUserId);
        zoneLocationRepository.save(location);
    }
}
