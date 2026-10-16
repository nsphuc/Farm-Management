package com.farm.saas.modules.organization.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.organization.dto.request.OperationalCycleCreateRequest;
import com.farm.saas.modules.organization.dto.request.OperationalCycleUpdateRequest;
import com.farm.saas.modules.organization.dto.response.OperationalCycleResponse;
import com.farm.saas.modules.organization.entity.OperationalCycle;
import com.farm.saas.modules.organization.entity.OperationalCycleStatus;
import com.farm.saas.modules.organization.mapper.OperationalCycleMapper;
import com.farm.saas.modules.organization.repository.FarmRepository;
import com.farm.saas.modules.organization.repository.OperationalCycleRepository;
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
 * Service xử lý nghiệp vụ Chu kỳ vận hành / Năm tài chính canh tác (Operational Cycles).
 * Áp dụng The Farm Barrier Guard: Luôn kiểm tra tính toàn vẹn của cặp (tenantId, farmId).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationalCycleService {

    private static final Logger log = LoggerFactory.getLogger(OperationalCycleService.class);

    private final OperationalCycleRepository cycleRepository;
    private final FarmRepository farmRepository;

    /**
     * Lấy danh sách chu kỳ của một trang trại có phân trang.
     * Áp dụng The Farm Barrier Guard: Kiểm tra người dùng có quyền trên farmId này.
     */
    public Page<OperationalCycleResponse> getCyclesByFarm(Long farmId, OperationalCycleStatus status, Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        // Áp dụng The Farm Barrier Guard để chặn truy cập chéo trang trại
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        log.debug("Lấy danh sách chu kỳ cho FarmId: {}, TenantId: {}, Status: {}", farmId, tenantId, status);

        Page<OperationalCycle> page;
        if (status != null) {
            page = cycleRepository.findAllByTenantIdAndFarmIdAndStatus(tenantId, farmId, status, pageable);
        } else {
            page = cycleRepository.findAllByTenantIdAndFarmId(tenantId, farmId, pageable);
        }

        return page.map(OperationalCycleMapper::toResponse);
    }

    /**
     * Lấy toàn bộ danh sách chu kỳ của Farm (cho select box).
     */
    public List<OperationalCycleResponse> getAllCyclesByFarm(Long farmId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        // Áp dụng The Farm Barrier Guard để chặn truy cập chéo trang trại
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        return cycleRepository.findAllByTenantIdAndFarmId(tenantId, farmId)
                .stream()
                .map(OperationalCycleMapper::toResponse)
                .toList();
    }

    /**
     * Lấy chi tiết một chu kỳ vận hành.
     */
    public OperationalCycleResponse getCycleById(Long farmId, Long cycleId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        OperationalCycle cycle = cycleRepository.findByIdAndTenantIdAndFarmId(cycleId, tenantId, farmId)
                .orElseThrow(() -> AppException.notFound("Chu kỳ vận hành", String.valueOf(cycleId)));

        return OperationalCycleMapper.toResponse(cycle);
    }

    /**
     * Tạo mới Chu kỳ vận hành cho Trang trại.
     * Validate ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu.
     */
    @Transactional
    public OperationalCycleResponse createCycle(Long farmId, OperationalCycleCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        // Validate ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        String normalizedName = request.getName().trim();
        // Kiểm tra tính duy nhất của tên chu kỳ trong cùng một Farm và Năm tài chính
        if (cycleRepository.existsByFarmIdAndFiscalYearAndName(farmId, request.getFiscalYear(), normalizedName)) {
            throw AppException.conflict("Chu kỳ '" + normalizedName + "' đã tồn tại trong năm tài chính " + request.getFiscalYear() + " của trang trại!");
        }

        OperationalCycle cycle = OperationalCycleMapper.toEntity(request, tenantId, farmId, currentUserId);
        OperationalCycle saved = cycleRepository.save(cycle);
        log.info("Tạo chu kỳ vận hành thành công: ID={}, Name={}, FarmId={}", saved.getId(), saved.getName(), farmId);

        return OperationalCycleMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin Chu kỳ vận hành.
     * Quy tắc kiến trúc: Không cho phép sửa đổi chu kỳ đã đóng (CLOSED).
     */
    @Transactional
    public OperationalCycleResponse updateCycle(Long farmId, Long cycleId, OperationalCycleUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Validate ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu trước tiên
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        OperationalCycle cycle = cycleRepository.findByIdAndTenantIdAndFarmId(cycleId, tenantId, farmId)
                .orElseThrow(() -> AppException.notFound("Chu kỳ vận hành", String.valueOf(cycleId)));

        // Quy tắc bất biến: Không cho phép sửa chu kỳ đã đóng nếu không có quy trình mở lại
        if (cycle.getStatus() == OperationalCycleStatus.CLOSED) {
            throw AppException.badRequest("CYCLE_ALREADY_CLOSED", "Chu kỳ vận hành này đã đóng (CLOSED), không thể chỉnh sửa dữ liệu!");
        }

        String normalizedName = request.getName().trim();
        if (cycleRepository.existsByFarmIdAndFiscalYearAndNameAndIdNot(farmId, request.getFiscalYear(), normalizedName, cycleId)) {
            throw AppException.conflict("Tên chu kỳ '" + normalizedName + "' bị trùng lặp trong năm tài chính " + request.getFiscalYear() + "!");
        }

        OperationalCycleMapper.updateEntity(cycle, request, currentUserId);
        OperationalCycle updated = cycleRepository.save(cycle);
        log.info("Cập nhật thành công chu kỳ vận hành ID: {}", cycleId);

        return OperationalCycleMapper.toResponse(updated);
    }

    /**
     * Đóng chu kỳ vận hành (Khóa sổ / Chốt năm tài chính).
     */
    @Transactional
    public OperationalCycleResponse closeCycle(Long farmId, Long cycleId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        // Áp dụng The Farm Barrier Guard
        SecurityUtils.validateFarmAccess(farmId);
        validateFarmBelongsToTenant(tenantId, farmId);

        OperationalCycle cycle = cycleRepository.findByIdAndTenantIdAndFarmId(cycleId, tenantId, farmId)
                .orElseThrow(() -> AppException.notFound("Chu kỳ vận hành", String.valueOf(cycleId)));

        cycle.setStatus(OperationalCycleStatus.CLOSED);
        cycle.setUpdatedBy(currentUserId);
        OperationalCycle saved = cycleRepository.save(cycle);
        log.info("Đã đóng chu kỳ vận hành ID: {} cho trang trại ID: {}", cycleId, farmId);

        return OperationalCycleMapper.toResponse(saved);
    }

    // ==========================================
    // CÁC PHƯƠNG THỨC TRUY XUẤT TRỰC TIẾP (DIRECT ENDPOINTS)
    // ==========================================

    public Page<OperationalCycleResponse> getCyclesByTenant(Long farmId, OperationalCycleStatus status, Pageable pageable) {
        if (farmId != null) {
            return getCyclesByFarm(farmId, status, pageable);
        }
        Long tenantId = SecurityUtils.getRequiredTenantId();
        return cycleRepository.findAllByTenantId(tenantId, pageable)
                .map(OperationalCycleMapper::toResponse);
    }

    public OperationalCycleResponse getCycleByIdDirect(Long cycleId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        OperationalCycle cycle = cycleRepository.findByIdAndTenantId(cycleId, tenantId)
                .orElseThrow(() -> AppException.notFound("Chu kỳ vận hành", String.valueOf(cycleId)));
        SecurityUtils.validateFarmAccess(cycle.getFarmId());
        return OperationalCycleMapper.toResponse(cycle);
    }

    @Transactional
    public OperationalCycleResponse createCycleDirect(OperationalCycleCreateRequest request) {
        // Validate ngày kết thúc chu kỳ trước tiên
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        Long farmId = request.getFarmId();
        if (farmId == null) {
            List<Long> userFarms = SecurityUtils.getCurrentFarmIds();
            if (userFarms.size() == 1) {
                farmId = userFarms.get(0);
            } else {
                throw AppException.badRequest("FARM_REQUIRED", "Vui lòng chọn trang trại áp dụng chu kỳ vận hành (farmId)!");
            }
        }
        return createCycle(farmId, request);
    }

    @Transactional
    public OperationalCycleResponse updateCycleDirect(Long cycleId, OperationalCycleUpdateRequest request) {
        // Validate ngày kết thúc chu kỳ trước tiên
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw AppException.badRequest("INVALID_DATE_RANGE", "Ngày kết thúc chu kỳ phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        Long tenantId = SecurityUtils.getRequiredTenantId();
        OperationalCycle cycle = cycleRepository.findByIdAndTenantId(cycleId, tenantId)
                .orElseThrow(() -> AppException.notFound("Chu kỳ vận hành", String.valueOf(cycleId)));

        return updateCycle(cycle.getFarmId(), cycleId, request);
    }

    @Transactional
    public OperationalCycleResponse closeCycleDirect(Long cycleId) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        OperationalCycle cycle = cycleRepository.findByIdAndTenantId(cycleId, tenantId)
                .orElseThrow(() -> AppException.notFound("Chu kỳ vận hành", String.valueOf(cycleId)));
        return closeCycle(cycle.getFarmId(), cycleId);
    }

    private void validateFarmBelongsToTenant(Long tenantId, Long farmId) {
        if (!farmRepository.existsByIdAndTenantId(farmId, tenantId)) {
            throw AppException.forbidden("Trang trại (ID: " + farmId + ") không thuộc về tổ chức (Tenant ID: " + tenantId + ")!");
        }
    }
}
