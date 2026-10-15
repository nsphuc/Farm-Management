package com.farm.saas.modules.organization.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.organization.dto.request.FarmCreateRequest;
import com.farm.saas.modules.organization.dto.request.FarmUpdateRequest;
import com.farm.saas.modules.organization.dto.response.FarmResponse;
import com.farm.saas.modules.organization.entity.Farm;
import com.farm.saas.modules.organization.mapper.FarmMapper;
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
 * Service xử lý nghiệp vụ quản lý Trang trại (Farms).
 * Đảm bảo Tenant Isolation và tính toàn vẹn dữ liệu đa khách hàng.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmService {

    private static final Logger log = LoggerFactory.getLogger(FarmService.class);

    private final FarmRepository farmRepository;

    /**
     * Lấy danh sách trang trại có phân trang theo Tenant của người dùng hiện tại.
     * Áp dụng Tenant Isolation: Chỉ trả về trang trại thuộc đúng tenantId của Principal.
     */
    public Page<FarmResponse> getFarms(Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy danh sách trang trại có phân trang cho TenantId: {}", tenantId);
        return farmRepository.findAllByTenantId(tenantId, pageable)
                .map(FarmMapper::toResponse);
    }

    /**
     * Lấy toàn bộ danh sách trang trại của Tenant (cho dropdown/select).
     */
    public List<FarmResponse> getAllFarms() {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy toàn bộ danh sách trang trại cho TenantId: {}", tenantId);
        return farmRepository.findAllByTenantId(tenantId)
                .stream()
                .map(FarmMapper::toResponse)
                .toList();
    }

    /**
     * Lấy chi tiết một trang trại theo ID.
     * Bắt buộc kiểm tra tenantId để chống truy cập trái phép chéo khách hàng.
     */
    public FarmResponse getFarmById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Truy vấn chi tiết trang trại ID: {} cho TenantId: {}", id, tenantId);
        Farm farm = farmRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Trang trại", String.valueOf(id)));
        return FarmMapper.toResponse(farm);
    }

    /**
     * Tạo mới trang trại.
     * - TenantId được tự động lấy từ Token trong SecurityContext.
     * - Trạng thái ban đầu luôn mặc định là ACTIVE.
     * - Kiểm tra tính duy nhất của mã trang trại (code) trong cùng một Tenant.
     */
    @Transactional
    public FarmResponse createFarm(FarmCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        String normalizedCode = request.getCode().trim();
        log.info("Bắt đầu tạo trang trại mới: Mã={}, TenantId={}", normalizedCode, tenantId);

        // Kiểm tra mã trang trại duy nhất trong Tenant
        if (farmRepository.existsByTenantIdAndCode(tenantId, normalizedCode)) {
            throw AppException.conflict("Mã trang trại '" + normalizedCode + "' đã tồn tại trong tổ chức!");
        }

        Farm farm = FarmMapper.toEntity(request, tenantId, currentUserId);
        Farm saved = farmRepository.save(farm);
        log.info("Tạo trang trại thành công với ID: {}", saved.getId());

        return FarmMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin trang trại.
     * Không cho phép cập nhật tenantId, mã code để đảm bảo audit trail.
     */
    @Transactional
    public FarmResponse updateFarm(Long id, FarmUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Cập nhật thông tin trang trại ID: {} cho TenantId: {}", id, tenantId);
        Farm farm = farmRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Trang trại", String.valueOf(id)));

        farm.setName(request.getName().trim());
        farm.setFarmType(request.getFarmType().trim().toUpperCase());
        farm.setTotalAreaM2(request.getTotalAreaM2());
        farm.setLatitude(request.getLatitude());
        farm.setLongitude(request.getLongitude());
        farm.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        farm.setManagerUserId(request.getManagerUserId());
        farm.setUpdatedBy(currentUserId);

        Farm updated = farmRepository.save(farm);
        return FarmMapper.toResponse(updated);
    }

    /**
     * Xóa trang trại (Soft-delete).
     * Không dùng repository.delete() để tránh mất dữ liệu lịch sử và vi phạm foreign key ràng buộc.
     * Chỉ thực hiện cập nhật status = 'INACTIVE'.
     */
    @Transactional
    public void deleteFarm(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.warn("Thực hiện vô hiệu hóa (soft-delete) trang trại ID: {} cho TenantId: {}", id, tenantId);
        Farm farm = farmRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Trang trại", String.valueOf(id)));

        // Áp dụng quy tắc không xóa vật lý: Cập nhật status sang INACTIVE
        farm.setStatus("INACTIVE");
        farm.setUpdatedBy(currentUserId);
        farmRepository.save(farm);
    }
}
