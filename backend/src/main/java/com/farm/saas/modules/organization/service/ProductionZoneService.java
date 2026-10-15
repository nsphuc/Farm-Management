package com.farm.saas.modules.organization.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.organization.dto.request.ProductionZoneCreateRequest;
import com.farm.saas.modules.organization.dto.request.ProductionZoneUpdateRequest;
import com.farm.saas.modules.organization.dto.response.ProductionZoneResponse;
import com.farm.saas.modules.organization.entity.Farm;
import com.farm.saas.modules.organization.entity.ProductionZone;
import com.farm.saas.modules.organization.mapper.ProductionZoneMapper;
import com.farm.saas.modules.organization.repository.FarmRepository;
import com.farm.saas.modules.organization.repository.ProductionZoneRepository;
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
 * Service xử lý nghiệp vụ Phân khu sản xuất (Production Zones).
 * Triển khai nghiêm ngặt The Farm Barrier Guard: Kiểm tra tính hợp lệ đa cấp (Zone -> Farm -> Tenant).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductionZoneService {

    private static final Logger log = LoggerFactory.getLogger(ProductionZoneService.class);

    private final ProductionZoneRepository productionZoneRepository;
    private final FarmRepository farmRepository;

    /**
     * Lấy danh sách toàn bộ phân khu thuộc một trang trại cụ thể trong Tenant.
     */
    public List<ProductionZoneResponse> getZonesByFarmId(Long farmId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy danh sách phân khu cho FarmId: {}, TenantId: {}", farmId, tenantId);

        // Áp dụng The Farm Barrier Guard: Đảm bảo Farm tồn tại và thuộc Tenant của Principal
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw AppException.notFound("Trang trại", String.valueOf(farmId));
        }

        return productionZoneRepository.findByFarmIdAndTenantId(farmId, tenantId)
                .stream()
                .map(ProductionZoneMapper::toResponse)
                .toList();
    }

    /**
     * Phân trang danh sách phân khu thuộc một trang trại.
     */
    public Page<ProductionZoneResponse> getZonesByFarmId(Long farmId, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Phân trang danh sách phân khu cho FarmId: {}, TenantId: {}", farmId, tenantId);

        // Áp dụng The Farm Barrier Guard
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw AppException.notFound("Trang trại", String.valueOf(farmId));
        }

        return productionZoneRepository.findByFarmIdAndTenantId(farmId, tenantId, pageable)
                .map(ProductionZoneMapper::toResponse);
    }

    /**
     * Lấy chi tiết một phân khu.
     * Xác thực cả farmId và tenantId để chặn truy cập chéo trang trại / chéo tenant.
     */
    public ProductionZoneResponse getZoneById(Long farmId, Long zoneId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Truy vấn chi tiết phân khu ID: {} thuộc FarmId: {}, TenantId: {}", zoneId, farmId, tenantId);

        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Phân khu sản xuất", String.valueOf(zoneId)));

        return ProductionZoneMapper.toResponse(zone);
    }

    /**
     * Tạo mới phân khu sản xuất.
     * - The Farm Barrier Guard: Phải gọi farmRepository.findByIdAndTenantId(...) để đảm bảo farmId thực sự thuộc Tenant.
     * - Kiểm tra mã code duy nhất trong phạm vi trang trại.
     * - Gán mặc định status = 'ACTIVE'.
     */
    @Transactional
    public ProductionZoneResponse createZone(Long farmId, ProductionZoneCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        String normalizedCode = request.getCode().trim();
        log.info("Bắt đầu tạo phân khu mới: Mã={}, FarmId={}, TenantId={}", normalizedCode, farmId, tenantId);

        // The Farm Barrier Guard: Xác minh Farm tồn tại và thuộc Tenant hiện tại
        Farm farm = farmRepository.findByIdAndTenantId(farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Trang trại", String.valueOf(farmId)));

        // Kiểm tra trùng mã code trong Farm
        if (productionZoneRepository.existsByFarmIdAndCode(farmId, normalizedCode)) {
            throw AppException.conflict("Mã phân khu '" + normalizedCode + "' đã tồn tại trong trang trại!");
        }

        ProductionZone zone = ProductionZoneMapper.toEntity(request, farm.getId(), tenantId, currentUserId);
        ProductionZone saved = productionZoneRepository.save(zone);
        log.info("Tạo phân khu thành công với ID: {}", saved.getId());

        return ProductionZoneMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin phân khu sản xuất.
     */
    @Transactional
    public ProductionZoneResponse updateZone(Long farmId, Long zoneId, ProductionZoneUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Cập nhật phân khu ID: {} thuộc FarmId: {}, TenantId: {}", zoneId, farmId, tenantId);
        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Phân khu sản xuất", String.valueOf(zoneId)));

        zone.setName(request.getName().trim());
        zone.setZoneType(request.getZoneType().trim().toUpperCase());
        zone.setAreaM2(request.getAreaM2());
        zone.setSoilType(request.getSoilType() != null ? request.getSoilType().trim() : null);
        zone.setWaterSource(request.getWaterSource() != null ? request.getWaterSource().trim() : null);
        zone.setUpdatedBy(currentUserId);

        ProductionZone updated = productionZoneRepository.save(zone);
        return ProductionZoneMapper.toResponse(updated);
    }

    /**
     * Xóa phân khu (Soft-delete).
     * Không dùng repository.delete() để tránh mất dữ liệu lịch sử nhật ký/vụ mùa.
     * Cập nhật trạng thái sang 'MAINTENANCE' theo CHECK constraint của bảng production_zones.
     */
    @Transactional
    public void deleteZone(Long farmId, Long zoneId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.warn("Thực hiện đưa phân khu ID: {} sang trạng thái bảo trì (soft-delete)", zoneId);
        ProductionZone zone = productionZoneRepository.findByIdAndFarmIdAndTenantId(zoneId, farmId, tenantId)
                .orElseThrow(() -> AppException.notFound("Phân khu sản xuất", String.valueOf(zoneId)));

        // Áp dụng quy tắc không xóa vật lý: Chuyển trạng thái sang MAINTENANCE
        zone.setStatus("MAINTENANCE");
        zone.setUpdatedBy(currentUserId);
        productionZoneRepository.save(zone);
    }
}
