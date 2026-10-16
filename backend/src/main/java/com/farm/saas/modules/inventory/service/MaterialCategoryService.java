package com.farm.saas.modules.inventory.service;

import com.farm.saas.common.exception.AppException;
import com.farm.saas.modules.inventory.dto.request.MaterialCategoryCreateRequest;
import com.farm.saas.modules.inventory.dto.request.MaterialCategoryUpdateRequest;
import com.farm.saas.modules.inventory.dto.response.MaterialCategoryResponse;
import com.farm.saas.modules.inventory.entity.MaterialCategory;
import com.farm.saas.modules.inventory.mapper.MaterialCategoryMapper;
import com.farm.saas.modules.inventory.repository.MaterialCategoryRepository;
import com.farm.saas.modules.inventory.repository.MaterialRepository;
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
 * Service xử lý nghiệp vụ quản lý Nhóm vật tư (Material Categories).
 * Áp dụng Tenant Isolation: Nhóm vật tư thuộc phạm vi Tenant.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialCategoryService {

    private static final Logger log = LoggerFactory.getLogger(MaterialCategoryService.class);

    private final MaterialCategoryRepository categoryRepository;
    private final MaterialRepository materialRepository;

    /**
     * Lấy danh sách nhóm vật tư có phân trang theo Tenant.
     */
    public Page<MaterialCategoryResponse> getCategories(Pageable pageable) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy danh sách nhóm vật tư cho TenantId: {}", tenantId);
        return categoryRepository.findAllByTenantId(tenantId, pageable)
                .map(MaterialCategoryMapper::toResponse);
    }

    /**
     * Lấy toàn bộ danh sách nhóm vật tư của Tenant (cho select box).
     */
    public List<MaterialCategoryResponse> getAllCategories() {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Lấy dropdown nhóm vật tư cho TenantId: {}", tenantId);
        return categoryRepository.findAllByTenantId(tenantId)
                .stream()
                .map(MaterialCategoryMapper::toResponse)
                .toList();
    }

    /**
     * Lấy chi tiết một nhóm vật tư theo ID.
     */
    public MaterialCategoryResponse getCategoryById(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.debug("Xem chi tiết nhóm vật tư ID: {} cho TenantId: {}", id, tenantId);

        MaterialCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Nhóm vật tư", String.valueOf(id)));

        return MaterialCategoryMapper.toResponse(category);
    }

    /**
     * Tạo mới nhóm vật tư.
     */
    @Transactional
    public MaterialCategoryResponse createCategory(MaterialCategoryCreateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        String normalizedCode = request.getCode().trim().toUpperCase();
        log.info("Tạo mới nhóm vật tư: Code={}, TenantId={}", normalizedCode, tenantId);

        // Kiểm tra tính duy nhất của mã code trong cùng Tenant
        if (categoryRepository.existsByTenantIdAndCode(tenantId, normalizedCode)) {
            throw AppException.conflict("Mã nhóm vật tư '" + normalizedCode + "' đã tồn tại trong tổ chức!");
        }

        MaterialCategory category = MaterialCategoryMapper.toEntity(request, tenantId, currentUserId);
        MaterialCategory saved = categoryRepository.save(category);
        log.info("Đã tạo nhóm vật tư thành công với ID: {}", saved.getId());

        return MaterialCategoryMapper.toResponse(saved);
    }

    /**
     * Cập nhật thông tin nhóm vật tư.
     */
    @Transactional
    public MaterialCategoryResponse updateCategory(Long id, MaterialCategoryUpdateRequest request) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId().orElse(null);

        log.info("Cập nhật nhóm vật tư ID: {}, TenantId: {}", id, tenantId);

        MaterialCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Nhóm vật tư", String.valueOf(id)));

        MaterialCategoryMapper.updateEntity(category, request, currentUserId);
        MaterialCategory updated = categoryRepository.save(category);
        log.info("Cập nhật thành công nhóm vật tư ID: {}", id);

        return MaterialCategoryMapper.toResponse(updated);
    }

    /**
     * Xóa nhóm vật tư.
     * Chặn xóa nếu còn tồn tại các mặt hàng vật tư trực thuộc nhóm này.
     */
    @Transactional
    public void deleteCategory(Long id) {
        Long tenantId = SecurityUtils.getRequiredTenantId();
        log.info("Xóa nhóm vật tư ID: {}, TenantId: {}", id, tenantId);

        MaterialCategory category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> AppException.notFound("Nhóm vật tư", String.valueOf(id)));

        // Kiểm tra ràng buộc: Chặn xóa nhóm nếu còn mặt hàng vật tư con
        if (materialRepository.existsByTenantIdAndCategoryId(tenantId, id)) {
            throw AppException.conflict("Không thể xóa nhóm vật tư này vì đang có các mặt hàng vật tư trực thuộc!");
        }

        categoryRepository.delete(category);
        log.info("Đã xóa nhóm vật tư ID: {}", id);
    }
}
