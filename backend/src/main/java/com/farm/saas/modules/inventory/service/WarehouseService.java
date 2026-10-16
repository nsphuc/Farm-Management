package com.farm.saas.modules.inventory.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.inventory.dto.request.WarehouseCreateRequest;
import com.farm.saas.modules.inventory.dto.request.WarehouseUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.WarehouseResponse;
import com.farm.saas.modules.inventory.entity.Warehouse;
import com.farm.saas.modules.inventory.entity.WarehouseStatus;
import com.farm.saas.modules.inventory.entity.WarehouseType;
import com.farm.saas.modules.inventory.mapper.WarehouseMapper;
import com.farm.saas.modules.inventory.repository.WarehouseRepository;
import com.farm.saas.modules.organization.repository.FarmRepository;
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
 * Service xử lý nghiệp vụ quản lý Kho bãi (Warehouses).
 * Đảm bảo Tenant Isolation và The Farm Barrier Guard: Kho bãi gắn liền với Farm và Tenant cụ thể.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseService {

    private static final Logger log = LoggerFactory.getLogger(WarehouseService.class);

    private final WarehouseRepository warehouseRepository;
    private final FarmRepository farmRepository;

    /**
     * Lấy danh sách kho bãi của một trang trại có phân trang.
     * Áp dụng The Farm Barrier Guard để chặn truy cập chéo trang trại.
     */
    public Page<WarehouseResponse> getWarehousesByFarm(
            Long farmId, WarehouseType warehouseType, WarehouseStatus status, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        log.debug("Lấy danh sách kho cho FarmId: {}, TenantId: {}", farmId, tenantId);

        Page<Warehouse> page;
        if (warehouseType != null && status != null) {
            page = warehouseRepository.findAllByTenantIdAndFarmIdAndWarehouseTypeAndStatus(
                    tenantId, farmId, warehouseType, status, pageable);
        } else {
            page = warehouseRepository.findAllByTenantIdAndFarmId(tenantId, farmId, pageable);
        }

        return page.map(WarehouseMapper::toResponse);
    }

    /**
     * Lấy danh sách tất cả các kho thuộc toàn bộ Tenant (nếu user có quyền xem toàn diện).
     */
    public Page<WarehouseResponse> getAllWarehousesInTenant(Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy toàn bộ kho trong TenantId: {}", tenantId);
        return warehouseRepository.findAllByTenantId(tenantId, pageable)
                .map(WarehouseMapper::toResponse);
    }

    /**
     * Lấy toàn bộ danh sách kho của trang trại (cho select box).
     */
    public List<WarehouseResponse> getDropdownWarehousesByFarm(Long farmId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        return warehouseRepository.findAllByTenantIdAndFarmId(tenantId, farmId)
                .stream()
                .map(WarehouseMapper::toResponse)
                .toList();
    }

    /**
     * Lấy chi tiết kho theo ID và FarmId.
     */
    public WarehouseResponse getWarehouseById(Long farmId, Long warehouseId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        Warehouse warehouse = warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(warehouseId)));

        return WarehouseMapper.toResponse(warehouse);
    }

    /**
     * Lấy chi tiết kho theo ID trực tiếp (kèm kiểm tra quyền truy cập Farm).
     */
    public WarehouseResponse getWarehouseByIdDirect(Long warehouseId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();

        Warehouse warehouse = warehouseRepository.findByIdAndTenantId(warehouseId, tenantId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(warehouseId)));

        // Áp dụng The Farm Barrier Guard với farmId của kho
        SecurityUtils.validateFarmAccess(warehouse.getFarmId());

        return WarehouseMapper.toResponse(warehouse);
    }

    /**
     * Tạo mới kho bãi trong trang trại.
     * Validate mã kho duy nhất trong trang trại.
     */
    @Transactional
    public WarehouseResponse createWarehouse(Long farmId, WarehouseCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        String normalizedCode = request.getCode().trim().toUpperCase();
        log.info("Tạo mới kho: Code={}, FarmId={}, TenantId={}", normalizedCode, farmId, tenantId);

        // Kiểm tra tính duy nhất của mã kho trong cùng Farm
        if (warehouseRepository.existsByFarmIdAndCode(farmId, normalizedCode)) {
            throw AppException.conflict("Mã kho '" + normalizedCode + "' đã tồn tại trong trang trại!");
        }

        Warehouse warehouse = WarehouseMapper.toEntity(request, tenantId, farmId, currentUserId);
        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Tạo kho bãi thành công: ID={}, Name={}, FarmId={}", saved.getId(), saved.getName(), farmId);

        return WarehouseMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin kho bãi.
     * Không cho phép đổi mã code hoặc farmId.
     */
    @Transactional
    public WarehouseResponse updateWarehouse(Long farmId, Long warehouseId, WarehouseUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        Warehouse warehouse = warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(warehouseId)));

        WarehouseMapper.updateEntity(warehouse, request, currentUserId);
        Warehouse updated = warehouseRepository.save(warehouse);
        log.info("Cập nhật thành công kho bãi ID: {}", warehouseId);

        return WarehouseMapper.toResponse(updated);
    }

    /**
     * Vô hiệu hóa kho bãi (Soft-delete: status=INACTIVE).
     * Tuyệt đối không xóa vật lý nếu kho đã phát sinh thẻ kho, tồn kho hay chứng từ.
     */
    @Transactional
    public void deactivateWarehouse(Long farmId, Long warehouseId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        Warehouse warehouse = warehouseRepository.findByIdAndTenantIdAndFarmId(warehouseId, tenantId, farmId)
                .orElseThrow(() -> AppException.notFound("Kho bãi", String.valueOf(warehouseId)));

        warehouse.setStatus(WarehouseStatus.INACTIVE);
        warehouse.setUpdatedBy(currentUserId);
        warehouseRepository.save(warehouse);
        log.info("Đã vô hiệu hóa kho bãi ID: {} trong trang trại ID: {}", warehouseId, farmId);
    }

    private void validateFarmBelongsToTenant(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw AppException.forbidden("Trang trại (ID: " + farmId + ") không thuộc về tổ chức (Tenant ID: " + tenantId + ")!");
        }
    }
}
